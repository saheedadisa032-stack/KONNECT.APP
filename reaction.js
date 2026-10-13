// reaction-and-other.js - FINAL CLEAN - Safari video fix + iOS notify every 4s + sticker border video
(function() {
  const chatMessages = document.getElementById('chatMessages');
  const overlay = document.getElementById('messageFocusOverlay');
  const poppedContainer = document.getElementById('poppedMessageContainer');
  const poppedClone = document.getElementById('poppedClone');
  const actionPill = document.getElementById('messageActionPill');
  const emojiBar = document.getElementById('emojiReactBar');
  const emojiPlusBtn = document.getElementById('emojiPlusBtn');
  const headerCancelBtn = document.getElementById('headerCancelBtn');
  const selectedGroup = document.getElementById('selectedPill');
  const callsWrap = document.querySelector('.calls');
  const chatInputBar = document.getElementById('chatInputBar');
  const deleteActionBar = document.getElementById('deleteActionBar');
  const selectedCount = document.getElementById('selectedCount');
  const toast = document.getElementById('toast');
  const favText = document.getElementById('favText');
  const favIcon = document.getElementById('favIcon');

  const plusBtn = document.getElementById('inputPlusBtn');
  const plusMenu = document.getElementById('plusPillMenu');
  const stickerBtn = document.getElementById('emojiStickerBtn');
  const stickerPanel = document.getElementById('stickerBorderPanel');
  const stickerGrid = document.getElementById('stickerGrid');
  const stickerPanelClose = document.getElementById('stickerPanelClose');
  const stickerAddBox = document.getElementById('stickerAddBox');
  const chatStickerSelectMode = document.getElementById('chatStickerSelectMode');
  const stickerSelectGrid = document.getElementById('stickerSelectGrid');
  const stickerSelectClose = document.getElementById('stickerSelectClose');
  const addStickerConfirmBtn = document.getElementById('addStickerConfirmBtn');
  const addStickerCancelX = document.getElementById('addStickerCancelX');

  const galleryInput = document.getElementById('galleryInput');
  const cameraInput = document.getElementById('cameraInput');
  const imagePreview = document.getElementById('imagePreviewOverlay');
  const previewImage = document.getElementById('previewImage');
  const previewVideo = document.getElementById('previewVideo');
  const previewClose = document.getElementById('previewClose');
  const previewCancelText = document.getElementById('previewCancelText');
  const captionInput = document.getElementById('captionInput');
  const previewSendBtn = document.getElementById('previewSendBtn');

  const videoFullOverlay = document.getElementById('videoFullOverlay');
  const videoFullPlayer = document.getElementById('videoFullPlayer');
  const videoFullCaption = document.getElementById('videoFullCaption');
  const videoFullClose = document.getElementById('videoFullClose');

  const createPage = document.getElementById('createStickerPage');
  const createClose = document.getElementById('createStickerClose');
  const createBack = document.getElementById('createStickerBack');
  const createCancelBtn = document.getElementById('createCancelBtn');
  const createImage = document.getElementById('createStickerImage');
  const createVideo = document.getElementById('createStickerVideo');
  const createCanvasEl = document.getElementById('createCanvas');
  const createPlaceholder = document.getElementById('createPlaceholder');
  const stickerFileInput = document.getElementById('stickerFileInput');
  const textOverlay = document.getElementById('textOverlay');
  const textOverlayWrapper = document.getElementById('textOverlayWrapper');
  const addTextBtn = document.getElementById('addTextBtn');
  const boldTextBtn = document.getElementById('boldTextBtn');
  const zoomTextBtn = document.getElementById('zoomTextBtn');
  const cropBtn = document.getElementById('cropBtn');
  const createAddBtn = document.getElementById('createAddBtn');
  const videoTrimBar = document.getElementById('videoTrimBar');
  const trimStart = document.getElementById('trimStart');
  const trimEnd = document.getElementById('trimEnd');
  const trimLabel = document.getElementById('trimLabel');

  const voiceOverlay = document.getElementById('voiceRecordingOverlay');
  const voiceTimer = document.getElementById('voiceTimer');
  const voiceCancelBtn = document.getElementById('voiceCancelBtn');
  const voiceSendBtn = document.getElementById('voiceSendBtn');
  const voiceStopBtn = document.getElementById('voiceStopBtn');
  const voiceWaveBig = document.getElementById('voiceWaveBig');

  const msgInput = document.getElementById('msgInput');
  const micBtn = document.getElementById('micSendBtn');
  const chatBackground = document.getElementById('chatBackground');

  if (!chatMessages) return;

  let currentRow = null, currentId = null, pressTimer = null;
  let selectedMessages = new Set();
  let stickers = JSON.parse(localStorage.getItem('my_stickers') || '[]');
  stickers = stickers.map(s => typeof s === 'string'? {src:s, type:'image'} : s);
  let memoryVideoStickers = [];
  let voiceInterval = null, voiceSec = 0, voiceStartTime = 0;
  let previewType = 'image', previewObjectUrl = '';
  let cropScale = 1, cropX = 0, cropY = 0, lastDist = 0, lastX = 0, lastY = 0;
  let textScale = 1;
  let originalVideoFile = null;
  let ffmpegInstance = null, ffmpegLoaded = false, ffmpegLoading = false;

  function showToast(msg="Added"){
    if(!toast) return;
    const span = toast.querySelector('span');
    if(span) span.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 2000);
    if(window.lucide) lucide.createIcons();
  }

  // ================= iOS 18 NOTIFY + AUTO PREVIEW EVERY 4S =================
  window.showIOSNotify = function({avatar='N', name='New message', message='You have a new message', time='now', onClick=null}={}){
    if(!chatBackground) return;
    const old = chatBackground.querySelector('.ios-notify');
    if(old) old.remove();
    const notify = document.createElement('div');
    notify.className = 'ios-notify';
    notify.innerHTML = `<div class="ios-notify-avatar">${avatar}</div><div class="ios-notify-content"><div class="ios-notify-name">${name}</div><div class="ios-notify-msg">${message}</div></div><div class="ios-notify-time">${time}</div>`;
    notify.addEventListener('click', ()=>{
      notify.classList.add('hide');
      setTimeout(()=> notify.remove(), 260);
      if(typeof onClick === 'function') onClick();
    });
    chatBackground.appendChild(notify);
    if(window.lucide) lucide.createIcons();
    setTimeout(()=>{
      if(notify.parentNode){
        notify.classList.add('hide');
        setTimeout(()=> { if(notify.parentNode) notify.remove(); }, 280);
      }
    }, 3200);
  };

  const previewMessages = [
    {avatar:'JD', name:'Joshua dayo', message:'Yo bro check that new code'},
    {avatar:'ola', name:'ola', message:'Omo that border clean die'},
    {avatar:'dev', name:'devsquad', message:'You don finish the sticker video?'},
  ];
  let previewIdx = 0;
  function runPreviewLoop(){
    const data = previewMessages[previewIdx % previewMessages.length];
    window.showIOSNotify({ avatar: data.avatar, name: data.name, message: data.message, time: 'now', onClick: ()=> showToast('Opened '+data.name) });
    previewIdx++;
  }
  setTimeout(()=>{ runPreviewLoop(); window._notifyPreviewInterval = setInterval(runPreviewLoop, 4000); }, 1000);
  window.stopNotifyPreview = function(){
    clearInterval(window._notifyPreviewInterval);
    const n = document.querySelector('.ios-notify'); if(n) n.remove();
  };

  function enterFocusMode(row) {
    if(row.classList.contains('no-actions')) return;
    currentRow = row; currentId = row.dataset.messageId;
    const mediaEl = row.querySelector('.sticker-bubble img,.sticker-bubble video,.image-bubble img,.video-bubble video');
    if(mediaEl && favText && favIcon){
      const src = (mediaEl.src || '').split('#')[0];
      const exists = [...stickers,...memoryVideoStickers].some(s=> (s.src||'').split('#')[0] === src);
      favText.textContent = exists? 'Remove from favorites' : 'Add to favorites';
      favIcon.setAttribute('data-lucide', exists? 'x' : 'star');
      if(window.lucide) lucide.createIcons();
    }
    const bubble = row.querySelector('.bubble'); if(!bubble) return;
    poppedClone.innerHTML = '';
    const clone = bubble.cloneNode(true); clone.classList.add('cloned-bubble');
    const badge = clone.querySelector('.msg-reaction-badge'); if(badge) badge.remove();
    clone.querySelectorAll('img,video').forEach(el=>{ el.style.pointerEvents='none'; el.style.display='block'; if(el.tagName==='VIDEO'){ el.muted=true; el.loop=true; el.autoplay=true; } });
    poppedClone.appendChild(clone);
    overlay.classList.add('active'); poppedContainer.classList.add('active','always-middle');
    if(row.querySelector('.sticker-bubble')) poppedContainer.classList.add('is-sticker'); else poppedContainer.classList.remove('is-sticker');
    chatBackground.classList.add('focus-mode');
    if(actionPill) actionPill.style.display = 'flex'; if(emojiBar) emojiBar.classList.remove('show');
    if(navigator.vibrate) navigator.vibrate(25); if(window.lucide) lucide.createIcons();
  }
  function resetFocus(){ overlay.classList.remove('active'); poppedContainer.classList.remove('active'); chatBackground.classList.remove('focus-mode'); if(actionPill) actionPill.style.display='flex'; if(emojiBar) emojiBar.classList.remove('show'); currentRow=null; }
  function enterSelectMode(){
    document.querySelectorAll('.msg-row').forEach(r=>{ if(r.classList.contains('no-actions')) return; r.classList.add('select-mode'); });
    chatBackground.classList.add('select-mode','select-mode-active'); chatMessages.style.overflowY='auto'; chatMessages.style.pointerEvents='auto';
    if(callsWrap) callsWrap.classList.add('hide-calls'); if(selectedGroup) selectedGroup.classList.add('show');
    if(selectedCount){ selectedCount.textContent='0'; selectedCount.classList.add('show'); }
    if(chatInputBar) chatInputBar.style.display='none'; if(deleteActionBar) deleteActionBar.classList.add('show');
    updateDeleteBarLogic(); overlay.classList.remove('active'); poppedContainer.classList.remove('active'); if(window.lucide) lucide.createIcons();
  }
  function exitSelectMode(){
    selectedMessages.clear(); document.querySelectorAll('.msg-row').forEach(r=> r.classList.remove('select-mode','selected'));
    chatBackground.classList.remove('select-mode','select-mode-active'); if(callsWrap) callsWrap.classList.remove('hide-calls');
    if(selectedGroup) selectedGroup.classList.remove('show'); if(selectedCount) selectedCount.classList.remove('show');
    if(chatInputBar) chatInputBar.style.display='flex'; if(deleteActionBar) deleteActionBar.classList.remove('show'); resetFocus();
  }
  window.enterSelectMode=enterSelectMode; window.exitSelectMode=exitSelectMode;
  function updateSelectedCount(){ if(selectedCount) selectedCount.textContent=`${selectedMessages.size}`; updateDeleteBarLogic(); }
  function updateDeleteBarLogic(){
    const delEvery=deleteActionBar?.querySelector('[data-delete="everyone"]'); const delMe=deleteActionBar?.querySelector('[data-delete="me"]');
    if(!delEvery||!delMe) return;
    if(selectedMessages.size===0){ delEvery.style.display='flex'; delMe.style.display='flex'; return; }
    let hasR=false,hasS=false; selectedMessages.forEach(id=>{ const r=document.querySelector(`[data-message-id="${id}"]`); if(r?.classList.contains('receiver')) hasR=true; if(r?.classList.contains('sender')) hasS=true; });
    if(hasR&&!hasS){ delEvery.style.display='none'; delMe.style.display='flex'; } else if(hasS&&!hasR){ if(selectedMessages.size>1){ delEvery.style.display='flex'; delMe.style.display='none'; } else { delEvery.style.display='flex'; delMe.style.display='flex'; } } else { delEvery.style.display='none'; delMe.style.display='flex'; }
  }

  function forcePlayStickerVideos(){
    document.querySelectorAll('.sticker-item video,.sticker-bubble video').forEach(v=>{
      if(v.paused){
        v.muted=true; v.playsInline=true; v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
        v.play().catch(()=>{});
      }
    });
  }

  // ================= SAFARI FIXED RENDER STICKER =================
  function renderStickers(){
    if(!stickerGrid ||!stickerAddBox) return;
    stickerGrid.querySelectorAll('.sticker-item').forEach(e=>e.remove());
    const seen=new Set();
    const all=[...memoryVideoStickers,...stickers];
    all.forEach(item=>{
      const src=item.src; if(!src) return;
      const type=item.type||'image';
      const clean=src.split('#')[0];
      if(seen.has(clean)) return; seen.add(clean);
      const div=document.createElement('div');
      div.className='sticker-item'+(type==='video'?' is-video':'');
      if(type==='video'){
        div.style.position='relative'; div.style.overflow='hidden'; div.style.background='#000'; div.style.borderRadius='12px';
        const video=document.createElement('video');
        video.muted=true; video.loop=true; video.autoplay=true; video.playsInline=true; video.preload='auto';
        video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline',''); video.setAttribute('muted',''); video.setAttribute('loop',''); video.setAttribute('autoplay','');
        video.style.width='100%'; video.style.height='100%'; video.style.objectFit='cover'; video.style.borderRadius='12px'; video.style.position='relative'; video.style.zIndex='2';
        video.src=src;
        if(item.poster){
          const img=document.createElement('img');
          img.src=item.poster; img.style.position='absolute'; img.style.inset='0'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.borderRadius='12px'; img.style.zIndex='1';
          div.appendChild(img);
          video.addEventListener('playing', ()=>{ img.style.display='none'; }, {once:true});
        }
        const tryPlay=()=> video.play().catch(()=>{});
        video.addEventListener('canplay', tryPlay, {once:true});
        video.addEventListener('loadeddata', tryPlay, {once:true});
        div.addEventListener('touchstart', tryPlay, {once:true});
        setTimeout(tryPlay, 120);
        div.appendChild(video);
      }else{
        const img=document.createElement('img'); img.src=src; div.appendChild(img);
      }
      div.onclick=()=> sendSticker(src,type);
      stickerGrid.insertBefore(div, stickerAddBox);
    });
    if(window.lucide) lucide.createIcons();
    setTimeout(forcePlayStickerVideos, 400);
  }

  function sendSticker(src,type='image'){
    const id='msg_'+Date.now();
    const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
    if(type==='video'){
      row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sticker-bubble"><span class="msg-meta sticker-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
      const bubble=row.querySelector('.sticker-bubble');
      const video=document.createElement('video');
      video.src=src; video.muted=true; video.loop=true; video.autoplay=true; video.playsInline=true; video.preload='auto';
      video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline',''); video.setAttribute('muted',''); video.setAttribute('loop',''); video.setAttribute('autoplay','');
      bubble.prepend(video);
      video.addEventListener('canplay', ()=> video.play().catch(()=>{}), {once:true});
      setTimeout(()=> video.play().catch(()=>{}), 150);
    }else{
      row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sticker-bubble"><img src="${src}"><span class="msg-meta sticker-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
    }
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row); if(window.lucide) lucide.createIcons();
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open');
  }

  function renderChatStickersSelect(){
    if(!stickerSelectGrid) return;
    stickerSelectGrid.innerHTML='';
    const favSrcs=new Set([...stickers,...memoryVideoStickers].map(s=> (s.src||'').split('#')[0]));
    document.querySelectorAll('.image-bubble img,.video-bubble video,.sticker-bubble img,.sticker-bubble video').forEach(el=>{
      const src=el.src||el.currentSrc; if(!src) return; const clean=src.split('#')[0]; if(favSrcs.has(clean)) return;
      const div=document.createElement('div'); div.className='sticker-item selectable selected';
      if(el.tagName==='VIDEO'){ const v=document.createElement('video'); v.src=clean; v.muted=true; v.playsInline=true; v.setAttribute('muted',''); v.setAttribute('playsinline',''); div.appendChild(v); }
      else{ const img=document.createElement('img'); img.src=clean; div.appendChild(img); }
      div.dataset.src=clean; div.dataset.type=el.tagName==='VIDEO'? 'video':'image'; div.onclick=()=> div.classList.toggle('selected'); stickerSelectGrid.appendChild(div);
    });
  }

  function bindRow(row){
    if(row.classList.contains('no-actions')) return;
    let startX=0,startY=0;
    row.addEventListener('contextmenu', e=>{ e.preventDefault(); enterFocusMode(row); return false; });
    row.addEventListener('touchstart', e=>{ if(chatBackground.classList.contains('focus-mode')) return; startX=e.touches[0].clientX; startY=e.touches[0].clientY; pressTimer=setTimeout(()=>enterFocusMode(row),480); },{passive:true});
    row.addEventListener('touchmove', e=>{ if(!pressTimer) return; if(Math.abs(e.touches[0].clientX-startX)>12||Math.abs(e.touches[0].clientY-startY)>12){ clearTimeout(pressTimer); pressTimer=null; } },{passive:true});
    row.addEventListener('touchend', ()=> clearTimeout(pressTimer));
    row.addEventListener('mousedown', e=>{ if(e.button!==0) return; pressTimer=setTimeout(()=>enterFocusMode(row),500); });
    row.addEventListener('mouseup', ()=> clearTimeout(pressTimer)); row.addEventListener('mouseleave', ()=> clearTimeout(pressTimer));
    const circle=row.querySelector('.select-circle');
    if(circle&&!circle.dataset.bound){ circle.dataset.bound="1"; circle.addEventListener('click', e=>{ e.stopPropagation(); row.classList.toggle('selected'); const id=row.dataset.messageId; if(row.classList.contains('selected')) selectedMessages.add(id); else selectedMessages.delete(id); updateSelectedCount(); }); }
    const stickerVideo=row.querySelector('.sticker-bubble video');
    if(stickerVideo &&!stickerVideo.dataset.boundSticker){
      stickerVideo.dataset.boundSticker="1"; stickerVideo.muted=true; stickerVideo.loop=true; stickerVideo.autoplay=true; stickerVideo.playsInline=true; stickerVideo.preload='auto';
      stickerVideo.setAttribute('muted',''); stickerVideo.setAttribute('loop',''); stickerVideo.setAttribute('autoplay',''); stickerVideo.setAttribute('playsinline',''); stickerVideo.setAttribute('webkit-playsinline','');
      stickerVideo.addEventListener('canplay', ()=> stickerVideo.play().catch(()=>{}), {once:true}); setTimeout(()=> stickerVideo.play().catch(()=>{}), 200);
      stickerVideo.addEventListener('click', ()=> openVideoFull(stickerVideo.src, ''));
    }
    const normalVideo=row.querySelector('.video-bubble video,.video-wrap video');
    if(normalVideo &&!normalVideo.dataset.boundNormal){
      normalVideo.dataset.boundNormal="1"; normalVideo.loop=false; normalVideo.autoplay=false;
      normalVideo.addEventListener('click', ()=> openVideoFull(normalVideo.src, row.querySelector('.img-caption-text')?.innerText||''));
      row.querySelector('.video-play-center')?.addEventListener('click', (e)=>{ e.stopPropagation(); openVideoFull(normalVideo.src, row.querySelector('.img-caption-text')?.innerText||''); });
    }
    const voiceBubble=row.querySelector('.voice-bubble');
    if(voiceBubble &&!voiceBubble.dataset.voiceBound){
      voiceBubble.dataset.voiceBound="1"; const btn=voiceBubble.querySelector('.voice-play-btn'); const audio=voiceBubble.querySelector('audio'); if(!btn||!audio) return;
      btn.innerHTML=`<i data-lucide="play" class="play-ic"></i><i data-lucide="pause" class="pause-ic" style="display:none"></i>`; if(window.lucide) lucide.createIcons();
      const showPlay=()=>{ const p=btn.querySelector('.play-ic'); const pa=btn.querySelector('.pause-ic'); if(p) p.style.display='block'; if(pa) pa.style.display='none'; voiceBubble.classList.remove('playing'); };
      const showPause=()=>{ const p=btn.querySelector('.play-ic'); const pa=btn.querySelector('.pause-ic'); if(p) p.style.display='none'; if(pa) pa.style.display='block'; voiceBubble.classList.add('playing'); };
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(audio.paused){
          document.querySelectorAll('.voice-bubble audio').forEach(a=>{ if(a!==audio){ a.pause(); a.currentTime=0; } });
          document.querySelectorAll('.voice-bubble').forEach(b=>{ b.classList.remove('playing'); const bp=b.querySelector('.play-ic'); const bpa=b.querySelector('.pause-ic'); if(bp) bp.style.display='block'; if(bpa) bpa.style.display='none'; });
          audio.play().then(showPause).catch(()=> showToast('Tap again'));
        }else{ audio.pause(); showPlay(); }
      });
      audio.addEventListener('ended', showPlay); audio.addEventListener('pause', showPlay);
    }
  }

  document.querySelectorAll('.msg-row').forEach(bindRow);
  new MutationObserver(muts=>{ muts.forEach(m=> m.addedNodes.forEach(n=>{ if(n.nodeType===1&&n.classList.contains('msg-row')) bindRow(n); })); }).observe(chatMessages,{childList:true});
  setInterval(forcePlayStickerVideos, 2500);

  function openVideoFull(src,caption){
    if(!videoFullOverlay) return;
    videoFullPlayer.src=src; videoFullCaption.textContent=caption||''; videoFullOverlay.classList.add('show');
    videoFullPlayer.loop=false; videoFullPlayer.muted=false; videoFullPlayer.play().catch(()=>{}); if(window.lucide) lucide.createIcons();
  }
  function closeVideoFull(){ videoFullOverlay.classList.remove('show'); if(videoFullPlayer){ videoFullPlayer.pause(); videoFullPlayer.src=''; } }
  videoFullClose?.addEventListener('click', (e)=>{ e.stopPropagation(); closeVideoFull(); });
  videoFullOverlay?.addEventListener('click', (e)=>{
    if(e.target===videoFullPlayer) return;
    if(e.target.closest('video') && e.target===videoFullPlayer) return;
    if(e.target.closest('.video-full-caption')) return;
    if(e.target.closest('.preview-header')) return;
    closeVideoFull();
  });

  function doReplyFromPill(){ if(!currentRow) return; const r=currentRow; resetFocus(); setTimeout(()=>{ if(window.triggerSwipeReply) window.triggerSwipeReply(r); },150); }
  if(actionPill){
    actionPill.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn||!currentId) return; const act=btn.dataset.action;
      if(act==='delete'){
        if(currentRow&&currentRow.classList.contains('receiver')){ currentRow.style.transition='opacity 0.25s'; currentRow.style.opacity='0'; setTimeout(()=> currentRow.remove(),250); resetFocus(); showToast('Deleted for me'); }
        else{ enterSelectMode(); if(currentRow){ currentRow.classList.add('selected'); selectedMessages.add(currentId); updateSelectedCount(); } }
      }else if(act==='select'){ enterSelectMode(); if(currentRow){ currentRow.classList.add('selected'); selectedMessages.add(currentId); updateSelectedCount(); } }
      else if(act==='react'){ actionPill.style.display='none'; emojiBar.classList.add('show'); }
      else if(act==='reply'){ doReplyFromPill(); }
      else if(act==='favorite'){
        const imgEl=currentRow?.querySelector('.sticker-bubble img,.sticker-bubble video,.image-bubble img,.video-bubble video');
        if(!imgEl){ showToast('No media'); resetFocus(); return; }
        const src=(imgEl.src||'').split('#')[0]; const type=imgEl.tagName==='VIDEO'? 'video':'image';
        let idx=stickers.findIndex(s=> s.src.split('#')[0]===src); let memIdx=memoryVideoStickers.findIndex(s=> s.src.split('#')[0]===src);
        if(idx>=0){ stickers.splice(idx,1); localStorage.setItem('my_stickers', JSON.stringify(stickers)); showToast('Removed from favorites'); }
        else if(memIdx>=0){ memoryVideoStickers.splice(memIdx,1); showToast('Removed from favorites'); }
        else{ if(type==='video') memoryVideoStickers.push({src:imgEl.src, type}); else{ stickers.push({src, type}); localStorage.setItem('my_stickers', JSON.stringify(stickers)); } showToast('Added to favorites'); }
        renderStickers(); resetFocus();
      }
    });
  }
  if(emojiBar){ emojiBar.addEventListener('click', e=>{ const btn=e.target.closest('[data-emoji]'); if(!btn||!currentId) return; const badge=document.getElementById(`reaction-${currentId}`); if(badge){ badge.textContent=btn.dataset.emoji; badge.classList.add('show'); } resetFocus(); }); }
  if(emojiPlusBtn){ emojiPlusBtn.addEventListener('click', ()=>{ const custom=prompt('Enter emoji:'); if(custom&&currentId){ const badge=document.getElementById(`reaction-${currentId}`); if(badge){ badge.textContent=custom.trim(); badge.classList.add('show'); } resetFocus(); } }); }

  if(plusBtn&&plusMenu){
    plusBtn.addEventListener('click', (e)=>{
      e.stopPropagation(); const isShow=plusMenu.classList.contains('show');
      if(isShow){ plusMenu.classList.add('closing'); setTimeout(()=> plusMenu.classList.remove('show','closing'),250); }
      else{ plusMenu.classList.add('show'); stickerPanel?.classList.remove('show'); chatBackground.classList.remove('sticker-open'); if(window.lucide) lucide.createIcons(); }
    });
    document.addEventListener('click', (e)=>{
      if(!plusMenu.contains(e.target)&&e.target!==plusBtn&&!e.target.closest('#inputPlusBtn')){
        if(plusMenu.classList.contains('show')){ plusMenu.classList.add('closing'); setTimeout(()=> plusMenu.classList.remove('show','closing'),250); }
      }
    });
    plusMenu.querySelectorAll('[data-action]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const act=b.dataset.action; plusMenu.classList.remove('show');
        if(act==='send-file') galleryInput?.click(); if(act==='camera') cameraInput?.click();
        if(act==='create-sticker'){ createPage?.classList.add('show'); ensureFFmpegLoaded(); if(window.lucide) lucide.createIcons(); }
      });
    });
  }

  function openPreview(src,type='image'){ if(!imagePreview) return; previewType=type; previewObjectUrl=src; if(type==='video'){ previewImage.style.display='none'; previewVideo.src=src; previewVideo.style.display='block'; } else{ previewVideo.style.display='none'; previewVideo.pause(); previewImage.src=src; previewImage.style.display='block'; } imagePreview.classList.add('show'); if(window.lucide) lucide.createIcons(); }
  function handleFile(file){ if(!file) return; const url=URL.createObjectURL(file); openPreview(url, file.type.startsWith('video/')? 'video':'image'); }
  galleryInput?.addEventListener('change', e=> handleFile(e.target.files[0])); cameraInput?.addEventListener('change', e=> handleFile(e.target.files[0]));
  function closePreview(){ imagePreview.classList.remove('show'); if(previewVideo){ previewVideo.pause(); previewVideo.src=''; } if(captionInput) captionInput.value=''; }
  previewClose?.addEventListener('click', closePreview); previewCancelText?.addEventListener('click', closePreview);
  imagePreview?.addEventListener('click', e=>{ if(e.target===imagePreview||e.target.classList.contains('preview-blur-bg')) closePreview(); });
  previewSendBtn?.addEventListener('click', ()=>{
    const caption=captionInput.value.trim(); const replyData=window.getCurrentReplyData? window.getCurrentReplyData():null; let quotedHtml=''; if(replyData){ quotedHtml=`<div class="quoted-reply">${replyData.thumb? `<img class="quoted-thumb" src="${replyData.thumb}">`:''}<div class="quoted-content"><span class="quoted-name">${replyData.name}</span><span class="quoted-text">${replyData.text}</span></div></div>`; }
    const id='msg_'+Date.now(); const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
    if(previewType==='video'){ row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble video-bubble with-caption">${quotedHtml}<div class="video-wrap"><video src="${previewObjectUrl}"></video><button class="video-play-center"><i data-lucide="play"></i></button><span class="video-duration">00:10</span><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div>${caption? `<div class="img-caption-wrap"><p class="img-caption-text">${caption}</p></div>`:''}<span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; }
    else{ if(caption){ row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble image-bubble with-caption">${quotedHtml}<div class="img-wrap"><img src="${previewObjectUrl}"><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div><div class="img-caption-wrap"><p class="img-caption-text">${caption}</p></div><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; } else{ row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble image-bubble">${quotedHtml}<div class="img-wrap"><img src="${previewObjectUrl}"><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; } }
    chatMessages.insertBefore(row, document.getElementById('typingIndicator')); bindRow(row); if(window.lucide) lucide.createIcons(); closePreview(); if(galleryInput) galleryInput.value=''; if(cameraInput) cameraInput.value=''; if(window.clearReplyData) window.clearReplyData(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
  });

  if(stickerBtn&&stickerPanel){
    stickerBtn.addEventListener('click', ()=>{
      const isShow=stickerPanel.classList.contains('show');
      if(isShow){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); }
      else{ renderStickers(); if(msgInput) msgInput.blur(); stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open'); plusMenu?.classList.remove('show'); if(window.lucide) lucide.createIcons(); setTimeout(forcePlayStickerVideos, 400); }
    });
  }
  stickerPanelClose?.addEventListener('click', ()=>{ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); });
  msgInput?.addEventListener('focus', ()=>{ if(stickerPanel?.classList.contains('show')){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); } });
  msgInput?.addEventListener('input', ()=>{
    if(msgInput.value.trim().length>0&&stickerPanel?.classList.contains('show')){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); }
    if(msgInput.value.trim().length>0) micBtn?.classList.add('sending'); else micBtn?.classList.remove('sending');
    msgInput.style.height='auto'; msgInput.style.height=msgInput.scrollHeight+'px';
  });
  stickerAddBox?.addEventListener('click', ()=>{ renderChatStickersSelect(); chatStickerSelectMode?.classList.add('show'); stickerPanel?.classList.remove('show'); chatBackground.classList.remove('sticker-open'); if(window.lucide) lucide.createIcons(); });
  if(chatStickerSelectMode){
    addStickerConfirmBtn?.addEventListener('click', ()=>{
      const selected=chatStickerSelectMode.querySelectorAll('.sticker-item.selected');
      selected.forEach(el=>{
        const src=el.dataset.src.split('#')[0]; const type=el.dataset.type||'image';
        const exists=[...stickers,...memoryVideoStickers].some(s=> (s.src||'').split('#')[0]===src);
        if(!exists){ if(type==='video') memoryVideoStickers.push({src, type}); else{ stickers.push({src, type}); localStorage.setItem('my_stickers', JSON.stringify(stickers)); } }
      });
      renderStickers(); chatStickerSelectMode.classList.remove('show'); if(msgInput) msgInput.blur(); stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open'); showToast('Sticker added'); setTimeout(forcePlayStickerVideos, 300);
    });
    stickerSelectClose?.addEventListener('click', ()=> chatStickerSelectMode.classList.remove('show'));
    addStickerCancelX?.addEventListener('click', ()=> chatStickerSelectMode.classList.remove('show'));
    chatStickerSelectMode.addEventListener('click', e=>{ if(e.target===chatStickerSelectMode) chatStickerSelectMode.classList.remove('show'); });
  }

  async function ensureFFmpegLoaded(){
    if(ffmpegLoaded) return ffmpegInstance; if(ffmpegLoading) return null; ffmpegLoading=true;
    const loader=document.getElementById('ffmpegLoader');
    try{
      if(loader){ loader.classList.add('show'); loader.style.display='flex'; }
      if(!window.FFmpeg){
        await new Promise((res,rej)=>{
          const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.min.js';
          s.onload=res; s.onerror=rej; document.head.appendChild(s);
        });
      }
      if(!window.FFmpeg) throw new Error('ffmpeg not loaded');
      const { createFFmpeg, fetchFile } = window.FFmpeg;
      window.FFmpeg.fetchFile = fetchFile;
      ffmpegInstance = createFFmpeg({ log:false, corePath:'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js' });
      await ffmpegInstance.load(); ffmpegLoaded=true; showToast('Editor ready');
    }catch(e){ console.log('ffmpeg fallback', e); ffmpegLoaded=false; }
    finally{ ffmpegLoading=false; if(loader){ loader.classList.remove('show'); loader.style.display='none'; } }
    return ffmpegInstance;
  }
  async function cutVideoWithFFmpeg(file,start,end){
    const ffmpeg=await ensureFFmpegLoaded(); if(!ffmpeg||!ffmpegLoaded){ return URL.createObjectURL(file)+`#t=${start},${end}`; }
    const input='input.mp4', output='output.mp4';
    ffmpeg.FS('writeFile', input, await window.FFmpeg.fetchFile(file));
    await ffmpeg.run('-ss', `${start}`, '-to', `${end}`, '-i', input, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-t', `${end-start}`, output);
    const data=ffmpeg.FS('readFile', output); const blob=new Blob([data.buffer], {type:'video/mp4'});
    try{ ffmpeg.FS('unlink', input); ffmpeg.FS('unlink', output); }catch{}
    return URL.createObjectURL(blob);
  }

  function closeCreatePage(){
    createPage.classList.remove('show'); if(createImage){ createImage.src=''; createImage.style.display='none'; }
    if(createVideo){ createVideo.src=''; createVideo.style.display='none'; createVideo.pause(); createVideo.ontimeupdate=null; }
    if(createPlaceholder) createPlaceholder.style.display='flex'; if(textOverlay) textOverlay.textContent='';
    if(textOverlayWrapper){ textOverlayWrapper.style.display='none'; textOverlayWrapper.style.left='50%'; textOverlayWrapper.style.top='50%'; textOverlayWrapper.style.transform='translate(-50%,-50%)'; }
    if(videoTrimBar) videoTrimBar.style.display='none'; if(stickerFileInput) stickerFileInput.value='';
    cropScale=1; cropX=0; cropY=0; originalVideoFile=null;
    if(createImage) createImage.style.transform='translate(0px,0px) scale(1)'; if(createVideo) createVideo.style.transform='translate(0px,0px) scale(1)';
  }
  let isDraggingText=false, startDragX=0, startDragY=0, startLeft=0, startTop=0;
  if(textOverlayWrapper){
    textOverlayWrapper.addEventListener('touchstart', (e)=>{
      if(e.target.classList.contains('resize-handle')) return; const t=e.touches[0]; isDraggingText=true; startDragX=t.clientX; startDragY=t.clientY;
      const rect=textOverlayWrapper.getBoundingClientRect(); const pRect=createCanvasEl.getBoundingClientRect(); startLeft=rect.left-pRect.left; startTop=rect.top-pRect.top;
    }, {passive:false});
    textOverlayWrapper.addEventListener('touchmove', (e)=>{ if(!isDraggingText) return; e.preventDefault(); const t=e.touches[0]; const dx=t.clientX-startDragX, dy=t.clientY-startDragY; textOverlayWrapper.style.left=(startLeft+dx)+'px'; textOverlayWrapper.style.top=(startTop+dy)+'px'; }, {passive:false});
    textOverlayWrapper.addEventListener('touchend', ()=> isDraggingText=false);
    textOverlayWrapper.addEventListener('mousedown', (e)=>{ isDraggingText=true; startDragX=e.clientX; startDragY=e.clientY; const rect=textOverlayWrapper.getBoundingClientRect(); const pRect=createCanvasEl.getBoundingClientRect(); startLeft=rect.left-pRect.left; startTop=rect.top-pRect.top; e.preventDefault(); });
    window.addEventListener('mousemove', (e)=>{ if(!isDraggingText) return; const dx=e.clientX-startDragX, dy=e.clientY-startDragY; textOverlayWrapper.style.left=(startLeft+dx)+'px'; textOverlayWrapper.style.top=(startTop+dy)+'px'; });
    window.addEventListener('mouseup', ()=> isDraggingText=false);
  }
  function initIphoneCrop(){
    if(!createCanvasEl) return; let isDraggingCrop=false;
    createCanvasEl.addEventListener('touchstart', (e)=>{
      if(e.target.closest('#textOverlayWrapper')) return;
      if(e.touches.length===1){ isDraggingCrop=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; } else if(e.touches.length===2){ lastDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); }
    }, {passive:true});
    createCanvasEl.addEventListener('touchmove', (e)=>{
      if(e.target.closest('#textOverlayWrapper')) return;
      if(e.touches.length===1&&isDraggingCrop){ const dx=e.touches[0].clientX-lastX, dy=e.touches[0].clientY-lastY; cropX+=dx; cropY+=dy; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; updateCropTransform(); }
      else if(e.touches.length===2){ const dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); if(lastDist>0){ cropScale*=dist/lastDist; cropScale=Math.max(1,Math.min(3,cropScale)); updateCropTransform(); } lastDist=dist; }
      if(e.touches.length>0) e.preventDefault();
    }, {passive:false});
    createCanvasEl.addEventListener('touchend', ()=>{ isDraggingCrop=false; lastDist=0; });
    createCanvasEl.addEventListener('mousedown', (e)=>{ if(e.target.closest('#textOverlayWrapper')) return; isDraggingCrop=true; lastX=e.clientX; lastY=e.clientY; });
    window.addEventListener('mousemove', (e)=>{ if(!isDraggingCrop) return; const dx=e.clientX-lastX, dy=e.clientY-lastY; cropX+=dx; cropY+=dy; lastX=e.clientX; lastY=e.clientY; updateCropTransform(); });
    window.addEventListener('mouseup', ()=> isDraggingCrop=false);
    createCanvasEl.addEventListener('wheel', (e)=>{ e.preventDefault(); cropScale+=e.deltaY<0?0.1:-0.1; cropScale=Math.max(1,Math.min(3,cropScale)); updateCropTransform(); }, {passive:false});
  }
  function updateCropTransform(){ const t=`translate(${cropX}px, ${cropY}px) scale(${cropScale})`; if(createImage&&createImage.style.display!=='none') createImage.style.transform=t; if(createVideo&&createVideo.style.display!=='none') createVideo.style.transform=t; }
  initIphoneCrop();

  createPlaceholder?.addEventListener('click', ()=> stickerFileInput?.click());
  stickerFileInput?.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return; originalVideoFile=file.type.startsWith('video/')? file : null;
    const url=URL.createObjectURL(file); cropScale=1; cropX=0; cropY=0;
    if(file.type.startsWith('video/')){
      createImage.style.display='none'; createVideo.src=url; createVideo.style.display='block'; createVideo.load(); createVideo.style.transform='translate(0px,0px) scale(1)'; videoTrimBar.style.display='flex';
      trimStart.min=0; trimStart.value=0; trimEnd.value=6; if(trimLabel) trimLabel.textContent='0s - 6s (max 6s)';
      createVideo.addEventListener('loadedmetadata', ()=>{
        const dur=createVideo.duration; trimStart.max=dur; trimEnd.max=dur; trimEnd.value=Math.min(dur,6); trimStart.value=0;
        if(trimLabel) trimLabel.textContent=`${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`; createVideo.currentTime=0;
        createVideo.ontimeupdate=()=>{ const s=parseFloat(trimStart.value)||0, en=parseFloat(trimEnd.value)||6; if(createVideo.currentTime>=en) createVideo.currentTime=s; };
      }, {once:true}); ensureFFmpegLoaded();
    }else{
      if(createVideo){ createVideo.style.display='none'; createVideo.pause(); createVideo.ontimeupdate=null; }
      createImage.src=url; createImage.style.display='block'; if(videoTrimBar) videoTrimBar.style.display='none'; createImage.style.transform='translate(0px,0px) scale(1)';
    }
    createPlaceholder.style.display='none';
    if(textOverlayWrapper){ textOverlayWrapper.style.display='flex'; textOverlayWrapper.style.left='50%'; textOverlayWrapper.style.top='55%'; textOverlayWrapper.style.transform='translate(-50%,-50%)'; }
  });
  trimStart?.addEventListener('input', ()=>{
    let s=parseFloat(trimStart.value), en=parseFloat(trimEnd.value); if(s>=en-0.2) trimStart.value=(en-0.2).toFixed(1);
    if((parseFloat(trimEnd.value)-parseFloat(trimStart.value))>6) trimEnd.value=(parseFloat(trimStart.value)+6).toFixed(1);
    if(trimLabel) trimLabel.textContent=`${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`; if(createVideo) createVideo.currentTime=parseFloat(trimStart.value);
  });
  trimEnd?.addEventListener('input', ()=>{
    let s=parseFloat(trimStart.value), en=parseFloat(trimEnd.value); if(en<=s+0.2) trimEnd.value=(s+0.2).toFixed(1);
    if((parseFloat(trimEnd.value)-parseFloat(trimStart.value))>6){ trimEnd.value=(parseFloat(trimStart.value)+6).toFixed(1); showToast('Max 6 seconds'); }
    if(trimLabel) trimLabel.textContent=`${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`;
  });
  addTextBtn?.addEventListener('click', ()=>{ if(textOverlayWrapper) textOverlayWrapper.style.display='flex'; if(textOverlay) textOverlay.focus(); });
  boldTextBtn?.addEventListener('click', ()=>{ if(!textOverlay) return; textOverlay.classList.toggle('bold'); textOverlay.focus(); });
  zoomTextBtn?.addEventListener('click', ()=>{ textScale=textScale>=1.8?1:textScale+0.2; if(textOverlay) textOverlay.style.transform=`scale(${textScale})`; });
  cropBtn?.addEventListener('click', ()=>{ isCropped=!isCropped; showToast(isCropped? 'Crop mode: drag & pinch image' : 'Crop reset'); if(!isCropped){ cropScale=1; cropX=0; cropY=0; updateCropTransform(); } });

  function bakeImageWithTextAndCrop(src, cb){
    const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=512; const ctx=canvas.getContext('2d');
    const img=new Image(); img.src=src;
    img.onload=()=>{
      ctx.clearRect(0,0,512,512); ctx.save(); ctx.translate(256+cropX, 256+cropY); ctx.scale(cropScale,cropScale); ctx.drawImage(img,-256,-256,512,512); ctx.restore();
      if(textOverlay && textOverlay.textContent.trim()&&textOverlayWrapper.style.display!=='none'){
        const wRect=textOverlayWrapper.getBoundingClientRect(); const cRect=createCanvasEl.getBoundingClientRect();
        const relX=((wRect.left+wRect.width/2)-cRect.left)/cRect.width*512; const relY=((wRect.top+wRect.height/2)-cRect.top)/cRect.height*512;
        const fontSize=Math.round(22*textScale);
        ctx.font=`${textOverlay.classList.contains('bold')? '900':'800'} ${fontSize}px sans-serif`;
        ctx.fillStyle='white'; ctx.strokeStyle='black'; ctx.lineWidth=4; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.strokeText(textOverlay.textContent, relX, relY); ctx.fillText(textOverlay.textContent, relX, relY);
      }
      cb(canvas.toDataURL('image/png'));
    }; img.onerror=()=> cb(src);
  }

  createAddBtn?.addEventListener('click', async ()=>{
    const hasImage=createImage && createImage.src&&createImage.style.display!=='none'&&createImage.src!=='';
    const hasVideo=createVideo&&createVideo.src&&createVideo.style.display!=='none'&&createVideo.src!=='';
    if(!hasImage&&!hasVideo){ showToast('Select image or video first'); return; }
    createAddBtn.disabled=true; createAddBtn.textContent='Cutting...';
    const cuttingLoader=document.getElementById('cuttingLoader'); if(cuttingLoader){ cuttingLoader.classList.add('show'); cuttingLoader.style.display='flex'; }
    try{
      if(hasVideo){
        const start=parseFloat(trimStart.value)||0; const end=parseFloat(trimEnd.value)||6;
        if((end-start)>6.1){ showToast('Max 6 seconds'); createAddBtn.disabled=false; createAddBtn.textContent='Add'; return; }
        let finalSrc;
        if(originalVideoFile){ finalSrc=await cutVideoWithFFmpeg(originalVideoFile,start,end); }
        else{ finalSrc=createVideo.src.split('#')[0]+`#t=${start},${end}`; }

        // GENERATE POSTER FOR SAFARI
        let posterData=null;
        try{
          const tempV=document.createElement('video');
          tempV.src=finalSrc; tempV.muted=true; tempV.playsInline=true; tempV.preload='auto'; tempV.crossOrigin='anonymous';
          await new Promise((res)=>{
            let done=false;
            const finish=()=>{ if(!done){ done=true; res(); } };
            tempV.onloadeddata=()=>{ try{ tempV.currentTime=0.1; }catch{ finish(); } };
            tempV.onseeked=finish; tempV.onerror=finish;
            setTimeout(finish, 1200);
          });
          const c=document.createElement('canvas'); c.width=240; c.height=240;
          const cx=c.getContext('2d'); cx.drawImage(tempV,0,0,240,240);
          posterData=c.toDataURL('image/jpeg', 0.75);
        }catch{}

        if(posterData){ memoryVideoStickers.push({src:finalSrc, poster:posterData, type:'video'}); }
        else{ memoryVideoStickers.push({src:finalSrc, type:'video'}); }

        renderStickers(); closeCreatePage(); showToast('Video sticker added - 6s');
      }else if(hasImage){
        bakeImageWithTextAndCrop(createImage.src, (finalSrc)=>{
          stickers.push({src:finalSrc, type:'image'}); localStorage.setItem('my_stickers', JSON.stringify(stickers));
          renderStickers(); closeCreatePage(); showToast('Sticker added');
        });
        return;
      }
    }catch(err){ console.error(err); showToast('Error adding'); }
    finally{ createAddBtn.disabled=false; createAddBtn.textContent='Add'; if(cuttingLoader){ cuttingLoader.classList.remove('show'); cuttingLoader.style.display='none'; } setTimeout(()=>{ if(stickerPanel){ stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open'); } if(window.lucide) lucide.createIcons(); setTimeout(forcePlayStickerVideos, 400); },150); }
  });

  createClose?.addEventListener('click', closeCreatePage); createBack?.addEventListener('click', closeCreatePage); createCancelBtn?.addEventListener('click', closeCreatePage);
  createPage?.addEventListener('click', (e)=>{ if(e.target===createPage) closeCreatePage(); });

  let mediaRecorder=null, audioChunks=[], audioStream=null, isRecording=false, shouldSend=false;
  function animateWave(){ if(!voiceWaveBig) return; voiceWaveBig.querySelectorAll('span').forEach(sp=>{ sp.style.height=(8+Math.random()*22)+'px'; }); }
  async function startVoice(){
    try{
      audioChunks=[]; voiceSec=0; voiceStartTime=Date.now(); if(voiceTimer) voiceTimer.textContent='0:00';
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}); audioStream=stream;
      mediaRecorder=new MediaRecorder(stream,{mimeType:'audio/webm'}); mediaRecorder.ondataavailable=e=>{ if(e.data&&e.data.size>0) audioChunks.push(e.data); }; mediaRecorder.start(100);
      isRecording=true; shouldSend=false; voiceOverlay?.classList.add('show'); chatBackground.classList.add('voice-open');
      if(voiceInterval) clearInterval(voiceInterval); voiceInterval=setInterval(()=>{ const diff=Math.floor((Date.now()-voiceStartTime)/1000); voiceSec=diff; const m=Math.floor(diff/60), s=diff%60; if(voiceTimer) voiceTimer.textContent=`${m}:${String(s).padStart(2,'0')}`; animateWave(); },200);
      if(navigator.vibrate) navigator.vibrate(30);
    }catch(err){ showToast('Mic permission denied - use https'); isRecording=false; }
  }
  function cleanupStream(){ if(audioStream){ audioStream.getTracks().forEach(t=>t.stop()); audioStream=null; } if(voiceInterval) clearInterval(voiceInterval); voiceInterval=null; }
  function sendVoiceMessage(){
    if(audioChunks.length===0){ cleanupStream(); return; }
    const blob=new Blob(audioChunks,{type:'audio/webm'}); const url=URL.createObjectURL(blob);
    const id='msg_'+Date.now(); const timeStr=voiceTimer? voiceTimer.textContent : `0:${String(voiceSec).padStart(2,'0')}`;
    const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
    row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="bubble voice-bubble"><button class="voice-play-btn"><i data-lucide="play"></i></button><div class="voice-wave"><span></span><span></span><span></span><span></span></div><span class="voice-duration">${timeStr}</span><span class="msg-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><audio src="${url}"></audio></div>`;
    chatMessages.insertBefore(row, document.getElementById('typingIndicator')); bindRow(row); if(window.lucide) lucide.createIcons(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'}); cleanupStream(); audioChunks=[];
  }
  function stopVoice(send){ shouldSend=send; if(!mediaRecorder||mediaRecorder.state==='inactive'){ voiceOverlay?.classList.remove('show'); chatBackground.classList.remove('voice-open'); cleanupStream(); isRecording=false; return; } mediaRecorder.onstop=()=>{ if(shouldSend&&voiceSec>=1) sendVoiceMessage(); else{ cleanupStream(); audioChunks=[]; } voiceOverlay?.classList.remove('show'); chatBackground.classList.remove('voice-open'); isRecording=false; voiceSec=0; }; mediaRecorder.stop(); }
  let micPressTimer=null;
  micBtn?.addEventListener('pointerdown', (e)=>{ if(msgInput && msgInput.value.trim().length>0) return; e.preventDefault(); if(isRecording) return; micPressTimer=setTimeout(()=>{ startVoice(); },200); });
  micBtn?.addEventListener('pointerup', (e)=>{
    clearTimeout(micPressTimer); e.preventDefault();
    if(msgInput && msgInput.value.trim().length>0){
      const txt=msgInput.value.trim(); if(!txt) return; const replyData=window.getCurrentReplyData? window.getCurrentReplyData():null; let quotedHtml=''; if(replyData){ quotedHtml=`<div class="quoted-reply">${replyData.thumb? `<img class="quoted-thumb" src="${replyData.thumb}">`:''}<div class="quoted-content"><span class="quoted-name">${replyData.name}</span><span class="quoted-text">${replyData.text}</span></div></div>`; }
      const id='msg_'+Date.now(); const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
      row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sender-bubble">${quotedHtml}<p>${txt}</p><span class="msg-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
      chatMessages.insertBefore(row, document.getElementById('typingIndicator')); bindRow(row); msgInput.value=''; msgInput.style.height='auto'; micBtn.classList.remove('sending'); if(window.clearReplyData) window.clearReplyData(); if(window.lucide) lucide.createIcons(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    }
  });
  micBtn?.addEventListener('pointerleave', ()=> clearTimeout(micPressTimer));
  voiceCancelBtn?.addEventListener('click', ()=> stopVoice(false)); voiceStopBtn?.addEventListener('click', ()=> stopVoice(false)); voiceSendBtn?.addEventListener('click', ()=> stopVoice(true));

  function doDelete(type){ selectedMessages.forEach(id=>{ const row=document.querySelector(`[data-message-id="${id}"]`); if(row){ row.style.transition='opacity 0.25s'; row.style.opacity='0'; setTimeout(()=> row.remove(),250); } }); exitSelectMode(); if(type==='everyone') showToast('Deleted for everyone'); else showToast('Deleted for me'); }
  deleteActionBar?.addEventListener('click', e=>{ const btn=e.target.closest('[data-delete]'); if(!btn) return; doDelete(btn.dataset.delete); });
  headerCancelBtn?.addEventListener('click', ()=> exitSelectMode());
  overlay?.addEventListener('click', ()=>{ if(deleteActionBar?.classList.contains('show')) exitSelectMode(); else resetFocus(); });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      if(deleteActionBar?.classList.contains('show')) exitSelectMode(); else if(createPage?.classList.contains('show')) closeCreatePage(); else if(voiceOverlay?.classList.contains('show')) stopVoice(false); else if(videoFullOverlay?.classList.contains('show')) closeVideoFull(); else if(imagePreview?.classList.contains('show')) closePreview(); else if(plusMenu?.classList.contains('show')) plusMenu.classList.remove('show'); else resetFocus();
    }
  });

  window.showTyping=function(){ const t=document.getElementById('typingIndicator'); if(t){ t.classList.add('show','always-show'); t.style.display='flex'; chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'}); } }
  window.hideTyping=function(){ const t=document.getElementById('typingIndicator'); if(t){ t.classList.add('show','always-show'); t.style.display='flex'; } }
  window.showGroupTyping=function(){ const gt=document.getElementById('groupTypingIndicator'); if(gt){ gt.classList.add('show'); gt.style.display='flex'; } }
  setTimeout(()=>{ window.showTyping(); },200);
  renderChatStickersSelect(); renderStickers();
  setTimeout(forcePlayStickerVideos, 700);
  if(window.lucide) lucide.createIcons();
})();