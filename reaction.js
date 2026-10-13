// reaction-and-other.js
// Handles: hold pill popup, select mode, stickers, voice, file preview, create sticker page
// SPEC FIXES IN THIS FILE:
// - Hold pill Reply MUST call same function as swipe-to-reply (triggerSwipeReply)
// - Video sticker autoplay muted loop inside panel
// - Plus icon pill menu - DO NOT TOUCH (working)
// - Fix Add/Unadd favorites toggle
// - Video full overlay X icon to close
// - Add sticker mode X icon beside Add button to cancel
// - Video trim to max 3s when adding as sticker
// - Creation editor: text + zoom + crop must reflect on final sticker
// - iPhone 17 style crop: direct drag/pinch on image

(function() {
  const chatMessages = document.getElementById('chatMessages');
  const overlay = document.getElementById('messageFocusOverlay');
  const poppedContainer = document.getElementById('poppedMessageContainer');
  const poppedClone = document.getElementById('poppedClone');
  const actionPill = document.getElementById('messageActionPill');
  const emojiBar = document.getElementById('emojiReactBar');
  const emojiPlusBtn = document.getElementById('emojiPlusBtn');
  const headerCancelBtn = document.getElementById('headerCancelBtn');
  const selectedGroup = document.getElementById('selectedPill'); // fixed id: selectedPill X+count in one pill
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
  const addStickerCancelX = document.getElementById('addStickerCancelX'); // NEW X beside Add sticker

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
  const videoFullClose = document.getElementById('videoFullClose'); // X icon to close video

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
  const stickerCanvas = document.getElementById('stickerCanvas');

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

  let currentRow = null;
  let currentId = null;
  let pressTimer = null;
  let selectedMessages = new Set();
  let stickers = JSON.parse(localStorage.getItem('my_stickers') || '[]');
  let voiceInterval = null;
  let voiceSec = 0;
  let voiceStartTime = 0;
  let previewType = 'image';
  let previewObjectUrl = '';
  let isCropped = false;
  // iPhone 17 crop vars
  let cropScale = 1, cropX = 0, cropY = 0, lastDist = 0, lastX = 0, lastY = 0;

  function showToast(msg="Added to favorites"){
    if(!toast) return;
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 2000);
    if(window.lucide) lucide.createIcons();
  }

  window.addCallMessage = function(type){
    const id = 'call_'+Date.now();
    let icon = 'phone', label = 'Voice call', sub = '';
    let missed = false;
    if(type==='missed-voice'){ icon='phone-missed'; label='Missed voice call'; sub='Tap to call back'; missed=true; }
    if(type==='missed-video'){ icon='video-off'; label='Missed video call'; sub='Tap to call back'; missed=true; }
    if(type==='voice-ended'){ icon='phone'; label='Voice call ended'; sub='Today'; }
    if(type==='video-ended'){ icon='video'; label='Video call - 2:30'; sub='Today'; }
    const row = document.createElement('div');
    row.className='msg-row no-actions call-row';
    row.dataset.messageId=id;
    row.innerHTML=`<div class="bubble call-bubble ${missed?'missed':''}"><i data-lucide="${icon}" class="call-icon ${missed?'missed':''}"></i><div class="call-info"><span>${label}</span><span class="call-time">${sub}</span></div></div>`;
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    if(window.lucide) lucide.createIcons();
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
  }

  function enterFocusMode(row) {
    if(row.classList.contains('no-actions')) return;
    currentRow = row;
    currentId = row.dataset.messageId;

    // FAV TOGGLE - FIXED: correctly check if exists
    const mediaEl = row.querySelector('.sticker-bubble img,.sticker-bubble video,.image-bubble img,.video-bubble video');
    if(mediaEl && favText && favIcon){
      const src = (mediaEl.src || mediaEl.currentSrc || '').split('#')[0];
      const exists = stickers.some(s=> (typeof s==='string'? s : s.src).split('#')[0] === src);
      if(exists){
        favText.textContent = 'Remove from favorites';
        favIcon.setAttribute('data-lucide','x');
      } else {
        favText.textContent = 'Add to favorites';
        favIcon.setAttribute('data-lucide','star');
      }
      if(window.lucide) lucide.createIcons();
    }

    const bubble = row.querySelector('.bubble');
    if (!bubble) return;
    poppedClone.innerHTML = '';
    const clone = bubble.cloneNode(true);
    clone.classList.add('cloned-bubble');
    const badge = clone.querySelector('.msg-reaction-badge');
    if(badge) badge.remove();
    clone.querySelectorAll('img,video').forEach(el=>{
      el.style.pointerEvents='none';
      el.style.display='block';
    });
    poppedClone.appendChild(clone);
    overlay.classList.add('active');
    poppedContainer.classList.add('active','always-middle');
    if(row.querySelector('.sticker-bubble')) poppedContainer.classList.add('is-sticker');
    else poppedContainer.classList.remove('is-sticker');
    chatBackground.classList.add('focus-mode');
    if(actionPill) actionPill.style.display = 'flex';
    if(emojiBar) emojiBar.classList.remove('show');
    if(navigator.vibrate) navigator.vibrate(25);
    if(window.lucide) lucide.createIcons();
  }
  function resetFocus() {
    overlay.classList.remove('active');
    poppedContainer.classList.remove('active');
    chatBackground.classList.remove('focus-mode');
    if(actionPill) actionPill.style.display = 'flex';
    if(emojiBar) emojiBar.classList.remove('show');
    currentRow = null;
  }

  function enterSelectMode(){
    document.querySelectorAll('.msg-row').forEach(r=>{
      if(r.classList.contains('no-actions')) return;
      r.classList.add('select-mode');
    });
    chatBackground.classList.add('select-mode','select-mode-active');
    chatMessages.style.overflowY='auto';
    chatMessages.style.pointerEvents='auto';
    if(callsWrap) callsWrap.classList.add('hide-calls');
    if(selectedGroup) selectedGroup.classList.add('show');
    if(selectedCount){ selectedCount.textContent='0'; selectedCount.classList.add('show'); }
    if(chatInputBar) chatInputBar.style.display='none';
    if(deleteActionBar) deleteActionBar.classList.add('show');
    updateDeleteBarLogic();
    overlay.classList.remove('active');
    poppedContainer.classList.remove('active');
    if(window.lucide) lucide.createIcons();
  }
  function exitSelectMode(){
    selectedMessages.clear();
    document.querySelectorAll('.msg-row').forEach(r=> r.classList.remove('select-mode','selected'));
    chatBackground.classList.remove('select-mode','select-mode-active');
    if(callsWrap) callsWrap.classList.remove('hide-calls');
    if(selectedGroup) selectedGroup.classList.remove('show');
    if(selectedCount) selectedCount.classList.remove('show');
    if(chatInputBar) chatInputBar.style.display='flex';
    if(deleteActionBar) deleteActionBar.classList.remove('show');
    resetFocus();
  }
  window.enterSelectMode = enterSelectMode;
  window.exitSelectMode = exitSelectMode;

  function updateSelectedCount(){ if(selectedCount){ selectedCount.textContent = `${selectedMessages.size}`; } updateDeleteBarLogic(); }
  function updateDeleteBarLogic(){
    const deleteForEveryone = deleteActionBar?.querySelector('[data-delete="everyone"]');
    const deleteForMe = deleteActionBar?.querySelector('[data-delete="me"]');
    if(!deleteForEveryone ||!deleteForMe) return;
    if(selectedMessages.size===0){ deleteForEveryone.style.display='flex'; deleteForMe.style.display='flex'; return; }
    let hasReceiver=false, hasSender=false;
    selectedMessages.forEach(id=>{ const row=document.querySelector(`[data-message-id="${id}"]`); if(row?.classList.contains('receiver')) hasReceiver=true; if(row?.classList.contains('sender')) hasSender=true; });
    if(hasReceiver &&!hasSender){ deleteForEveryone.style.display='none'; deleteForMe.style.display='flex'; }
    else if(hasSender &&!hasReceiver){ if(selectedMessages.size>1){ deleteForEveryone.style.display='flex'; deleteForMe.style.display='none'; } else { deleteForEveryone.style.display='flex'; deleteForMe.style.display='flex'; } }
    else { deleteForEveryone.style.display='none'; deleteForMe.style.display='flex'; }
  }

  // render stickers with video autoplay muted loop in panel - FIXED
  function renderStickers(){
    if(!stickerGrid) return;
    stickerGrid.querySelectorAll('.sticker-item').forEach(e=>e.remove());
    const seen = new Set();
    stickers.forEach(item=>{
      const src = typeof item === 'string'? item : item.src;
      const type = typeof item === 'string'? 'image' : (item.type || 'image');
      const cleanSrc = src.split('#')[0];
      if(seen.has(cleanSrc)) return;
      seen.add(cleanSrc);
      const div = document.createElement('div');
      div.className = 'sticker-item' + (type==='video'? ' is-video' : '');
      if(type === 'video'){
        // autoplay muted loop in panel as requested
        div.innerHTML = `<video src="${cleanSrc}" muted loop autoplay playsinline></video>`;
      } else {
        div.innerHTML = `<img src="${cleanSrc}">`;
      }
      div.onclick = ()=> sendSticker(cleanSrc, type);
      stickerGrid.insertBefore(div, stickerAddBox.nextSibling);
    });
    if(window.lucide) lucide.createIcons();
  }
  function sendSticker(src, type='image'){
    const id = 'msg_'+Date.now();
    const row = document.createElement('div');
    row.className = 'msg-row sender'; row.dataset.messageId = id;
    const media = type==='video'? `<video src="${src}" autoplay loop muted playsinline></video>` : `<img src="${src}">`;
    row.innerHTML = `<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sticker-bubble">${media}<span class="msg-meta sticker-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row);
    if(window.lucide) lucide.createIcons();
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    stickerPanel.classList.remove('show');
    chatBackground.classList.remove('sticker-open');
  }
  renderStickers();

  function renderChatStickersSelect(){
    if(!stickerSelectGrid) return;
    stickerSelectGrid.innerHTML = '';
    const favSrcs = new Set(stickers.map(s=> (typeof s==='string'? s : s.src).split('#')[0]));
    document.querySelectorAll('.image-bubble img,.video-bubble video,.sticker-bubble img,.sticker-bubble video').forEach(el=>{
      const src = el.src || el.currentSrc;
      if(!src) return;
      const clean = src.split('#')[0];
      if(favSrcs.has(clean)) return;
      const div = document.createElement('div');
      div.className = 'sticker-item selectable selected';
      if(el.tagName==='VIDEO') div.innerHTML = `<video src="${clean}" muted playsinline></video>`;
      else div.innerHTML = `<img src="${clean}">`;
      div.dataset.src = clean;
      div.dataset.type = el.tagName==='VIDEO'? 'video' : 'image';
      div.onclick = ()=> div.classList.toggle('selected');
      stickerSelectGrid.appendChild(div);
    });
  }

  function bindRow(row){
    if(row.classList.contains('no-actions')) return;
    let startX=0,startY=0;
    row.addEventListener('contextmenu', e=>{ e.preventDefault(); enterFocusMode(row); return false; });
    row.addEventListener('touchstart', e=>{
      if(chatBackground.classList.contains('focus-mode')) return;
      startX=e.touches[0].clientX; startY=e.touches[0].clientY;
      pressTimer=setTimeout(()=>enterFocusMode(row),480);
    },{passive:true});
    row.addEventListener('touchmove', e=>{
      if(!pressTimer) return;
      const dx=Math.abs(e.touches[0].clientX-startX), dy=Math.abs(e.touches[0].clientY-startY);
      if(dx>12||dy>12){ clearTimeout(pressTimer); pressTimer=null; }
    },{passive:true});
    row.addEventListener('touchend', ()=> clearTimeout(pressTimer));
    row.addEventListener('mousedown', e=>{ if(e.button!==0) return; pressTimer=setTimeout(()=>enterFocusMode(row),500); });
    row.addEventListener('mouseup', ()=> clearTimeout(pressTimer));
    row.addEventListener('mouseleave', ()=> clearTimeout(pressTimer));
    const circle = row.querySelector('.select-circle');
    if(circle &&!circle.dataset.bound){
      circle.dataset.bound="1";
      circle.addEventListener('click', e=>{
        e.stopPropagation();
        row.classList.toggle('selected');
        const id=row.dataset.messageId;
        if(row.classList.contains('selected')) selectedMessages.add(id);
        else selectedMessages.delete(id);
        updateSelectedCount();
      });
    }
    const videoEl = row.querySelector('.video-bubble video');
    if(videoEl &&!videoEl.dataset.bound){
      videoEl.dataset.bound="1";
      row.querySelector('.video-play-center')?.addEventListener('click', (e)=>{ e.stopPropagation(); openVideoFull(videoEl.src, row.querySelector('.img-caption-text')?.innerText || ''); });
      videoEl.addEventListener('click', ()=>{ openVideoFull(videoEl.src, row.querySelector('.img-caption-text')?.innerText || ''); });
    }
  }
  document.querySelectorAll('.msg-row').forEach(bindRow);
  new MutationObserver(muts=>{ muts.forEach(m=> m.addedNodes.forEach(n=>{ if(n.nodeType===1 && n.classList.contains('msg-row')) bindRow(n); })); }).observe(chatMessages,{childList:true});

  function openVideoFull(src, caption){
    if(!videoFullOverlay) return;
    videoFullPlayer.src = src.split('#')[0];
    videoFullCaption.textContent = caption || '';
    videoFullOverlay.classList.add('show');
    if(window.lucide) lucide.createIcons();
  }
  // X icon for video preview close - FIXED to always work
  videoFullClose?.addEventListener('click', ()=>{
    videoFullOverlay.classList.remove('show');
    videoFullPlayer.pause();
    videoFullPlayer.src='';
  });
  videoFullOverlay?.addEventListener('click', (e)=>{
    if(e.target===videoFullOverlay || e.target.classList.contains('preview-blur-bg')){
      videoFullOverlay.classList.remove('show'); videoFullPlayer.pause();
    }
  });

  // REPLY - use same function as swipe to reply - SPEC REQUIRED
  function doReplyFromPill(){
    if(!currentRow) return;
    const rowToReply = currentRow;
    resetFocus();
    setTimeout(()=>{
      if(window.triggerSwipeReply){
        window.triggerSwipeReply(rowToReply); // SAME function as swipe
      }
    },150);
  }

  if(actionPill){
    actionPill.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn||!currentId) return;
      const act=btn.dataset.action;
      if(act==='delete'){
        if(currentRow && currentRow.classList.contains('receiver')){
          currentRow.style.transition='opacity 0.25s'; currentRow.style.opacity='0'; setTimeout(()=> currentRow.remove(),250);
          resetFocus(); showToast('Deleted for me');
        } else { enterSelectMode(); if(currentRow){ currentRow.classList.add('selected'); selectedMessages.add(currentId); updateSelectedCount(); } }
      }
      else if(act==='select'){ enterSelectMode(); if(currentRow){ currentRow.classList.add('selected'); selectedMessages.add(currentId); updateSelectedCount(); } }
      else if(act==='react'){ actionPill.style.display='none'; emojiBar.classList.add('show'); }
      else if(act==='reply'){ doReplyFromPill(); }
      else if(act==='favorite'){
        const imgEl = currentRow?.querySelector('.sticker-bubble img,.sticker-bubble video,.image-bubble img,.video-bubble video');
        if(!imgEl){ showToast('No media'); resetFocus(); return; }
        const src = (imgEl.src || imgEl.currentSrc || '').split('#')[0];
        const type = imgEl.tagName==='VIDEO'? 'video' : 'image';
        const idx = stickers.findIndex(s=> (typeof s==='string'? s : s.src).split('#')[0] === src);
        if(idx>=0){
          stickers.splice(idx,1);
          localStorage.setItem('my_stickers', JSON.stringify(stickers));
          renderStickers();
          showToast('Removed from favorites');
        } else {
          stickers.push({src, type});
          localStorage.setItem('my_stickers', JSON.stringify(stickers));
          renderStickers();
          showToast('Added to favorites');
        }
        resetFocus();
      }
    });
  }
  if(emojiBar){
    emojiBar.addEventListener('click', e=>{
      const btn=e.target.closest('[data-emoji]'); if(!btn||!currentId) return;
      const badge=document.getElementById(`reaction-${currentId}`);
      if(badge){ badge.textContent=btn.dataset.emoji; badge.classList.add('show'); }
      resetFocus();
    });
  }
  if(emojiPlusBtn){ emojiPlusBtn.addEventListener('click', ()=>{ const custom=prompt('Enter emoji:'); if(custom&&currentId){ const badge=document.getElementById(`reaction-${currentId}`); if(badge){ badge.textContent=custom.trim(); badge.classList.add('show'); } resetFocus(); } }); }

  // PLUS PILL - DO NOT TOUCH per spec - working
  if(plusBtn && plusMenu){
    plusBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isShow=plusMenu.classList.contains('show');
      if(isShow){
        plusMenu.classList.add('closing');
        setTimeout(()=> plusMenu.classList.remove('show','closing'),250);
      }
      else{
        plusMenu.classList.add('show');
        stickerPanel?.classList.remove('show');
        chatBackground.classList.remove('sticker-open');
        if(window.lucide) lucide.createIcons();
      }
    });
    document.addEventListener('click', (e)=>{
      if(!plusMenu.contains(e.target) && e.target!==plusBtn &&!e.target.closest('#inputPlusBtn')){
        if(plusMenu.classList.contains('show')){ plusMenu.classList.add('closing'); setTimeout(()=> plusMenu.classList.remove('show','closing'),250); }
      }
    });
    plusMenu.querySelectorAll('[data-action]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const act=b.dataset.action; plusMenu.classList.remove('show');
        if(act==='send-file') galleryInput?.click();
        if(act==='camera') cameraInput?.click();
        if(act==='create-sticker'){ createPage?.classList.add('show'); if(window.lucide) lucide.createIcons(); }
      });
    });
  }

  function openPreview(src, type='image'){
    if(!imagePreview) return;
    previewType = type; previewObjectUrl = src;
    if(type==='video'){ previewImage.style.display='none'; previewVideo.src=src; previewVideo.style.display='block'; }
    else { previewVideo.style.display='none'; previewVideo.pause(); previewImage.src=src; previewImage.style.display='block'; }
    imagePreview.classList.add('show');
    if(window.lucide) lucide.createIcons();
  }
  function handleFile(file){
    if(!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    openPreview(url, isVideo? 'video' : 'image');
  }
  galleryInput?.addEventListener('change', e=> handleFile(e.target.files[0]));
  cameraInput?.addEventListener('change', e=> handleFile(e.target.files[0]));
  function closePreview(){ imagePreview.classList.remove('show'); if(previewVideo){ previewVideo.pause(); previewVideo.src=''; } captionInput.value=''; }
  previewClose?.addEventListener('click', closePreview);
  previewCancelText?.addEventListener('click', closePreview);
  imagePreview?.addEventListener('click', e=>{ if(e.target===imagePreview || e.target.classList.contains('preview-blur-bg')) closePreview(); });
  previewSendBtn?.addEventListener('click', ()=>{
    const caption=captionInput.value.trim();
    const replyData = window.getCurrentReplyData? window.getCurrentReplyData() : null;
    let quotedHtml = '';
    if(replyData){ quotedHtml = `<div class="quoted-reply">${replyData.thumb? `<img class="quoted-thumb" src="${replyData.thumb}">` : ''}<div class="quoted-content"><span class="quoted-name">${replyData.name}</span><span class="quoted-text">${replyData.text}</span></div></div>`; }
    const id='msg_'+Date.now(); const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
    if(previewType==='video'){ row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble video-bubble with-caption">${quotedHtml}<div class="video-wrap"><video src="${previewObjectUrl}"></video><button class="video-play-center"><i data-lucide="play"></i></button><span class="video-duration">00:10</span><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div>${caption? `<div class="img-caption-wrap"><p class="img-caption-text">${caption}</p></div>` : ''}<span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; }
    else { if(caption){ row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble image-bubble with-caption">${quotedHtml}<div class="img-wrap"><img src="${previewObjectUrl}"><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div><div class="img-caption-wrap"><p class="img-caption-text">${caption}</p></div><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; } else { row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble image-bubble">${quotedHtml}<div class="img-wrap"><img src="${previewObjectUrl}"><span class="msg-meta over-image right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span></div><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`; } }
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row); if(window.lucide) lucide.createIcons(); closePreview(); galleryInput.value=''; cameraInput.value=''; if(window.clearReplyData) window.clearReplyData(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
  });

  // Sticker panel toggle
  if(stickerBtn && stickerPanel){
    stickerBtn.addEventListener('click', ()=>{
      const isShow=stickerPanel.classList.contains('show');
      if(isShow){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); }
      else { renderStickers(); msgInput.blur(); stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open'); plusMenu?.classList.remove('show'); if(window.lucide) lucide.createIcons(); }
    });
  }
  stickerPanelClose?.addEventListener('click', ()=> { stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); });
  msgInput?.addEventListener('focus', ()=>{ if(stickerPanel?.classList.contains('show')){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); } });
  msgInput?.addEventListener('input', ()=>{
    if(msgInput.value.trim().length>0 && stickerPanel?.classList.contains('show')){ stickerPanel.classList.remove('show'); chatBackground.classList.remove('sticker-open'); }
    if(msgInput.value.trim().length>0) micBtn?.classList.add('sending'); else micBtn?.classList.remove('sending');
    msgInput.style.height='auto'; msgInput.style.height=msgInput.scrollHeight+'px';
  });
  // Add sticker box - open select from chat
  stickerAddBox?.addEventListener('click', ()=>{ renderChatStickersSelect(); chatStickerSelectMode?.classList.add('show'); stickerPanel?.classList.remove('show'); chatBackground.classList.remove('sticker-open'); if(window.lucide) lucide.createIcons(); });
  if(chatStickerSelectMode){
    addStickerConfirmBtn?.addEventListener('click', ()=>{
      const selected=chatStickerSelectMode.querySelectorAll('.sticker-item.selected');
      selected.forEach(el=>{
        const src = el.dataset.src.split('#')[0]; const type = el.dataset.type || 'image';
        const exists = stickers.some(s=> (typeof s==='string'? s : s.src).split('#')[0] === src);
        if(!exists) stickers.push({src, type});
      });
      localStorage.setItem('my_stickers', JSON.stringify(stickers));
      renderStickers();
      chatStickerSelectMode.classList.remove('show');
      msgInput.blur(); stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open');
      showToast('Sticker added');
    });
    stickerSelectClose?.addEventListener('click', ()=> chatStickerSelectMode.classList.remove('show'));
    // X icon beside Add sticker to cancel - NEW per spec
    addStickerCancelX?.addEventListener('click', ()=> chatStickerSelectMode.classList.remove('show'));
    chatStickerSelectMode.addEventListener('click', e=>{ if(e.target===chatStickerSelectMode) chatStickerSelectMode.classList.remove('show'); });
  }

  // ===== CREATE STICKER PAGE - iPhone 17 style crop + trim to 3s + text/zoom/crop reflect =====
  function closeCreatePage(){
    createPage.classList.remove('show');
    createImage.src=''; createImage.style.display='none';
    if(createVideo){ createVideo.src=''; createVideo.style.display='none'; createVideo.pause(); }
    createPlaceholder.style.display='flex';
    if(textOverlay) textOverlay.textContent='';
    if(textOverlayWrapper) textOverlayWrapper.style.display='none';
    if(videoTrimBar) videoTrimBar.style.display='none';
    if(stickerFileInput) stickerFileInput.value='';
    cropScale=1; cropX=0; cropY=0;
    if(createImage){ createImage.style.transform = `translate(0px,0px) scale(1)`; }
    if(createVideo){ createVideo.style.transform = `translate(0px,0px) scale(1)`; }
  }

  // Text drag
  let isDraggingText=false, startDragX=0, startDragY=0, startLeft=0, startTop=0;
  let textScale=1;
  function initTextDrag(){
    if(!textOverlayWrapper) return;
    textOverlayWrapper.addEventListener('touchstart', (e)=>{
      if(e.target.classList.contains('resize-handle')) return;
      const touch = e.touches[0]; isDraggingText=true; startDragX=touch.clientX; startDragY=touch.clientY;
      const rect = textOverlayWrapper.getBoundingClientRect(); const parentRect = createCanvasEl.getBoundingClientRect();
      startLeft = rect.left - parentRect.left; startTop = rect.top - parentRect.top;
    }, {passive:true});
    textOverlayWrapper.addEventListener('touchmove', (e)=>{ if(!isDraggingText) return; const touch=e.touches[0]; const dx=touch.clientX-startDragX, dy=touch.clientY-startDragY; textOverlayWrapper.style.left = (startLeft+dx)+'px'; textOverlayWrapper.style.top = (startTop+dy)+'px'; }, {passive:true});
    textOverlayWrapper.addEventListener('touchend', ()=> isDraggingText=false);
  }
  initTextDrag();

  // iPhone 17 style crop - direct pinch/drag on image/video
  function initIphoneCrop(){
    if(!createCanvasEl) return;
    let isDraggingCrop=false;
    createCanvasEl.addEventListener('touchstart', (e)=>{
      if(e.target.closest('#textOverlayWrapper')) return;
      if(e.touches.length===1){
        isDraggingCrop=true;
        lastX=e.touches[0].clientX; lastY=e.touches[0].clientY;
      } else if(e.touches.length===2){
        lastDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      }
    }, {passive:true});
    createCanvasEl.addEventListener('touchmove', (e)=>{
      if(e.touches.length===1 && isDraggingCrop){
        const dx=e.touches[0].clientX-lastX;
        const dy=e.touches[0].clientY-lastY;
        cropX+=dx; cropY+=dy;
        lastX=e.touches[0].clientX; lastY=e.touches[0].clientY;
        updateCropTransform();
      } else if(e.touches.length===2){
        const dist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        if(lastDist>0){
          cropScale *= dist/lastDist;
          cropScale = Math.max(1, Math.min(3, cropScale));
          updateCropTransform();
        }
        lastDist=dist;
      }
      if(e.touches.length>0) e.preventDefault();
    }, {passive:false});
    createCanvasEl.addEventListener('touchend', ()=>{ isDraggingCrop=false; lastDist=0; });

    // Mouse drag for desktop testing
    createCanvasEl.addEventListener('mousedown', (e)=>{
      if(e.target.closest('#textOverlayWrapper')) return;
      isDraggingCrop=true; lastX=e.clientX; lastY=e.clientY;
    });
    window.addEventListener('mousemove', (e)=>{
      if(!isDraggingCrop) return;
      const dx=e.clientX-lastX, dy=e.clientY-lastY;
      cropX+=dx; cropY+=dy; lastX=e.clientX; lastY=e.clientY;
      updateCropTransform();
    });
    window.addEventListener('mouseup', ()=> isDraggingCrop=false);
    createCanvasEl.addEventListener('wheel', (e)=>{
      e.preventDefault();
      cropScale += e.deltaY<0? 0.1 : -0.1;
      cropScale = Math.max(1, Math.min(3, cropScale));
      updateCropTransform();
    }, {passive:false});
  }
  function updateCropTransform(){
    const t = `translate(${cropX}px, ${cropY}px) scale(${cropScale})`;
    if(createImage && createImage.style.display!=='none') createImage.style.transform = t;
    if(createVideo && createVideo.style.display!=='none') createVideo.style.transform = t;
  }
  initIphoneCrop();

  createPlaceholder?.addEventListener('click', ()=> stickerFileInput?.click());
  stickerFileInput?.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return; const url=URL.createObjectURL(file);
    cropScale=1; cropX=0; cropY=0;
    if(file.type.startsWith('video/')){
      createImage.style.display='none';
      createVideo.src=url; createVideo.style.display='block'; createVideo.load();
      createVideo.style.transform = `translate(0px,0px) scale(1)`;
      videoTrimBar.style.display='flex';
      trimStart.min=0; trimStart.value=0; trimEnd.value=3;
      trimLabel.textContent='0s - 3s (max 3s)';
      createVideo.addEventListener('loadedmetadata', ()=>{
        const dur = createVideo.duration;
        trimStart.max = dur; trimEnd.max = dur;
        trimEnd.value = Math.min(dur, 3);
        trimStart.value = 0;
        trimLabel.textContent = `${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`;
        createVideo.currentTime = 0;
      }, {once:true});
    } else {
      if(createVideo){ createVideo.style.display='none'; createVideo.pause(); }
      createImage.src=url; createImage.style.display='block'; videoTrimBar.style.display='none';
      createImage.style.transform = `translate(0px,0px) scale(1)`;
    }
    createPlaceholder.style.display='none';
    if(textOverlayWrapper){ textOverlayWrapper.style.display='flex'; textOverlayWrapper.style.left='50%'; textOverlayWrapper.style.top='55%'; textOverlayWrapper.style.transform='translate(-50%,-50%)'; }
  });
  trimStart?.addEventListener('input', ()=>{
    let s=parseFloat(trimStart.value), en=parseFloat(trimEnd.value);
    if(s>=en-0.2) trimStart.value = (en-0.2).toFixed(1);
    if((parseFloat(trimEnd.value)-parseFloat(trimStart.value))>3){ trimEnd.value = (parseFloat(trimStart.value)+3).toFixed(1); }
    trimLabel.textContent = `${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`;
    if(createVideo) createVideo.currentTime = parseFloat(trimStart.value);
  });
  trimEnd?.addEventListener('input', ()=>{
    let s=parseFloat(trimStart.value), en=parseFloat(trimEnd.value);
    if(en<=s+0.2) trimEnd.value = (s+0.2).toFixed(1);
    if((parseFloat(trimEnd.value)-parseFloat(trimStart.value))>3){
      trimEnd.value = (parseFloat(trimStart.value)+3).toFixed(1);
      showToast('Max 3 seconds');
    }
    trimLabel.textContent = `${parseFloat(trimStart.value).toFixed(1)}s - ${parseFloat(trimEnd.value).toFixed(1)}s`;
  });
  addTextBtn?.addEventListener('click', ()=>{ if(textOverlayWrapper) textOverlayWrapper.style.display='flex'; textOverlay.focus(); });
  boldTextBtn?.addEventListener('click', ()=>{ if(!textOverlay) return; textOverlay.classList.toggle('bold'); textOverlay.focus(); });
  zoomTextBtn?.addEventListener('click', ()=>{ textScale = textScale >= 1.8? 1 : textScale+0.2; textOverlay.style.transform = `scale(${textScale})`; });
  cropBtn?.addEventListener('click', ()=>{
    // Toggle crop mode hint - iPhone style already active via drag/pinch
    isCropped =!isCropped;
    showToast(isCropped? 'Crop mode: drag & pinch image' : 'Crop reset');
    if(!isCropped){ cropScale=1; cropX=0; cropY=0; updateCropTransform(); }
  });

  // Final export - text + zoom + crop must reflect
  createAddBtn?.addEventListener('click', ()=>{
    const hasImage = createImage.src && createImage.style.display!=='none';
    const hasVideo = createVideo && createVideo.src && createVideo.style.display!=='none';
    if(!hasImage &&!hasVideo) { showToast('Select image or video first'); return; }
    // For MVP, we save with trim hash and also bake text/crop info via canvas if image
    // Video: trim to max 3s using #t=start,end
    let src = hasVideo? createVideo.src : createImage.src;
    let type = hasVideo? 'video' : 'image';

    if(hasVideo){
      const start = parseFloat(trimStart.value)||0; const end = parseFloat(trimEnd.value)||3;
      if((end-start)>3.1){ showToast('Max 3 seconds'); return; }
      src = src.split('#')[0] + `#t=${start},${end}`;
    }

    // If image and text exists, bake text + crop + zoom onto canvas for final sticker
    if(hasImage && (textOverlay.textContent.trim() || cropScale!==1 || cropX!==0 || cropY!==0)){
      const canvas = stickerCanvas || document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      // Simple bake: draw image with crop
      const img = new Image();
      img.src = createImage.src;
      img.onload = ()=>{
        ctx.clearRect(0,0,512,512);
        // Apply crop transform
        ctx.save();
        ctx.translate(256 + cropX, 256 + cropY);
        ctx.scale(cropScale, cropScale);
        ctx.drawImage(img, -256, -256, 512, 512);
        ctx.restore();
        // Draw text
        if(textOverlay.textContent.trim()){
          ctx.font = `${textOverlay.classList.contains('bold')? '900' : '800'} ${22*textScale}px sans-serif`;
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.textAlign = 'center';
          const tx = parseFloat(textOverlayWrapper.style.left) || 256;
          const ty = parseFloat(textOverlayWrapper.style.top) || 280;
          ctx.strokeText(textOverlay.textContent, tx, ty);
          ctx.fillText(textOverlay.textContent, tx, ty);
        }
        const finalSrc = canvas.toDataURL('image/png');
        saveSticker(finalSrc, 'image');
      };
      return;
    }

    saveSticker(src, type);
  });

  function saveSticker(src, type){
    const cleanCheck = src.split('#')[0];
    const exists = stickers.some(s=> (typeof s==='string'? s : s.src).split('#')[0] === cleanCheck);
    if(exists){ showToast('Already in pack'); return; }
    stickers.push({src, type});
    localStorage.setItem('my_stickers', JSON.stringify(stickers));
    renderStickers(); closeCreatePage();
    setTimeout(()=>{ stickerPanel.classList.add('show'); chatBackground.classList.add('sticker-open'); if(window.lucide) lucide.createIcons(); },150);
    showToast('Added to sticker pack');
  }

  createClose?.addEventListener('click', closeCreatePage);
  createBack?.addEventListener('click', closeCreatePage);
  createCancelBtn?.addEventListener('click', closeCreatePage);
  createPage?.addEventListener('click', (e)=>{ if(e.target===createPage) closeCreatePage(); });

  // VOICE RECORDING
  let mediaRecorder = null; let audioChunks = []; let audioStream = null; let isRecording = false; let shouldSend = false;
  function animateWave(){ if(!voiceWaveBig) return; voiceWaveBig.querySelectorAll('span').forEach(sp=>{ sp.style.height = (8 + Math.random()*22)+'px'; }); }
  async function startVoice(){
    try{
      audioChunks = []; voiceSec = 0; voiceStartTime = Date.now();
      if(voiceTimer) voiceTimer.textContent='0:00';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream = stream;
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = e=>{ if(e.data && e.data.size>0) audioChunks.push(e.data); };
      mediaRecorder.start(100);
      isRecording = true; shouldSend = false;
      voiceOverlay?.classList.add('show'); chatBackground.classList.add('voice-open');
      if(voiceInterval) clearInterval(voiceInterval);
      voiceInterval = setInterval(()=>{
        const diff = Math.floor((Date.now()-voiceStartTime)/1000);
        voiceSec = diff;
        const m=Math.floor(diff/60), s=diff%60;
        if(voiceTimer) voiceTimer.textContent=`${m}:${String(s).padStart(2,'0')}`;
        animateWave();
      }, 200);
      if(navigator.vibrate) navigator.vibrate(30);
    }catch(err){ showToast('Mic permission denied - use https'); isRecording = false; }
  }
  function cleanupStream(){ if(audioStream){ audioStream.getTracks().forEach(t=>t.stop()); audioStream=null; } if(voiceInterval) clearInterval(voiceInterval); voiceInterval=null; }
  function sendVoiceMessage(){
    if(audioChunks.length===0){ cleanupStream(); return; }
    const blob = new Blob(audioChunks, { type: 'audio/webm' }); const url = URL.createObjectURL(blob);
    const id='msg_'+Date.now(); const timeStr = voiceTimer? voiceTimer.textContent : `0:${String(voiceSec).padStart(2,'0')}`;
    const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
    row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="bubble voice-bubble"><button class="voice-play-btn"><i data-lucide="play"></i></button><div class="voice-wave"><span></span><span></span><span></span><span></span></div><span class="voice-duration">${timeStr}</span><span class="msg-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><audio src="${url}"></audio></div>`;
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row);
    if(window.lucide) lucide.createIcons(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'}); cleanupStream(); audioChunks=[];
  }
  function stopVoice(send){ shouldSend = send; if(!mediaRecorder || mediaRecorder.state==='inactive'){ voiceOverlay?.classList.remove('show'); chatBackground.classList.remove('voice-open'); cleanupStream(); isRecording=false; return; } mediaRecorder.onstop = ()=>{ if(shouldSend && voiceSec>=1) sendVoiceMessage(); else { cleanupStream(); audioChunks=[]; } voiceOverlay?.classList.remove('show'); chatBackground.classList.remove('voice-open'); isRecording=false; voiceSec=0; }; mediaRecorder.stop(); }
  let micPressTimer=null;
  micBtn?.addEventListener('pointerdown', (e)=>{ if(msgInput.value.trim().length>0) return; e.preventDefault(); if(isRecording) return; micPressTimer = setTimeout(()=>{ startVoice(); }, 200); });
  micBtn?.addEventListener('pointerup', (e)=>{
    clearTimeout(micPressTimer); e.preventDefault();
    if(msgInput.value.trim().length>0){
      const txt=msgInput.value.trim(); if(!txt) return; const replyData = window.getCurrentReplyData? window.getCurrentReplyData() : null; let quotedHtml=''; if(replyData){ quotedHtml = `<div class="quoted-reply">${replyData.thumb? `<img class="quoted-thumb" src="${replyData.thumb}">` : ''}<div class="quoted-content"><span class="quoted-name">${replyData.name}</span><span class="quoted-text">${replyData.text}</span></div></div>`; }
      const id='msg_'+Date.now(); const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
      row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sender-bubble">${quotedHtml}<p>${txt}</p><span class="msg-meta right-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
      chatMessages.insertBefore(row, document.getElementById('typingIndicator')); bindRow(row); msgInput.value=''; msgInput.style.height='auto'; micBtn.classList.remove('sending'); if(window.clearReplyData) window.clearReplyData(); if(window.lucide) lucide.createIcons(); chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    }
  });
  micBtn?.addEventListener('pointerleave', ()=> clearTimeout(micPressTimer));
  voiceCancelBtn?.addEventListener('click', ()=> stopVoice(false));
  voiceStopBtn?.addEventListener('click', ()=> stopVoice(false));
  voiceSendBtn?.addEventListener('click', ()=> stopVoice(true));

  function doDelete(type){ selectedMessages.forEach(id=>{ const row=document.querySelector(`[data-message-id="${id}"]`); if(row){ row.style.transition='opacity 0.25s'; row.style.opacity='0'; setTimeout(()=> row.remove(),250); } }); exitSelectMode(); if(type==='everyone') showToast('Deleted for everyone'); else showToast('Deleted for me'); }
  deleteActionBar?.addEventListener('click', e=>{ const btn=e.target.closest('[data-delete]'); if(!btn) return; doDelete(btn.dataset.delete); });
  headerCancelBtn?.addEventListener('click', ()=> exitSelectMode());
  overlay?.addEventListener('click', ()=>{ if(deleteActionBar?.classList.contains('show')) exitSelectMode(); else resetFocus(); });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      if(deleteActionBar?.classList.contains('show')) exitSelectMode();
      else if(createPage?.classList.contains('show')) closeCreatePage();
      else if(voiceOverlay?.classList.contains('show')) stopVoice(false);
      else if(videoFullOverlay?.classList.contains('show')){ videoFullOverlay.classList.remove('show'); videoFullPlayer.pause(); }
      else if(imagePreview?.classList.contains('show')) closePreview();
      else if(plusMenu?.classList.contains('show')){ plusMenu.classList.remove('show'); }
      else resetFocus();
    }
  });

  window.showTyping = function(){ const typing=document.getElementById('typingIndicator'); if(typing){ typing.classList.add('show','always-show'); typing.style.display='flex'; chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'}); } }
  window.hideTyping = function(){ const typing=document.getElementById('typingIndicator'); if(typing){ typing.classList.add('show','always-show'); typing.style.display='flex'; } }
  window.showGroupTyping = function(){ const gt=document.getElementById('groupTypingIndicator'); if(gt){ gt.classList.add('show'); gt.style.display='flex'; } }
  setTimeout(()=>{ window.showTyping(); }, 200);

  renderChatStickersSelect();
  if(window.lucide) lucide.createIcons();
})();