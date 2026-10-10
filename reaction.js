(function() {
  const chatMessages = document.getElementById('chatMessages');
  const overlay = document.getElementById('messageFocusOverlay');
  const poppedContainer = document.getElementById('poppedMessageContainer');
  const poppedClone = document.getElementById('poppedClone');
  const actionPill = document.getElementById('messageActionPill');
  const emojiBar = document.getElementById('emojiReactBar');
  const emojiPlusBtn = document.getElementById('emojiPlusBtn');
  const headerCancelBtn = document.getElementById('headerCancelBtn');
  const callsWrap = document.querySelector('.calls');
  const chatInputBar = document.getElementById('chatInputBar');
  const deleteActionBar = document.getElementById('deleteActionBar');
  const selectedCount = document.getElementById('selectedCount');
  const toast = document.getElementById('toast');

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

  const galleryInput = document.getElementById('galleryInput');
  const cameraInput = document.getElementById('cameraInput');
  const imagePreview = document.getElementById('imagePreviewOverlay');
  const previewImage = document.getElementById('previewImage');
  const previewClose = document.getElementById('previewClose');
  const captionInput = document.getElementById('captionInput');
  const previewSendBtn = document.getElementById('previewSendBtn');

  const createPage = document.getElementById('createStickerPage');
  const createClose = document.getElementById('createStickerClose');
  const createBack = document.getElementById('createStickerBack');
  const createCancelBtn = document.getElementById('createCancelBtn');
  const createImage = document.getElementById('createStickerImage');
  const createPlaceholder = document.getElementById('createPlaceholder');
  const stickerFileInput = document.getElementById('stickerFileInput');
  const textOverlay = document.getElementById('textOverlay');
  const addTextBtn = document.getElementById('addTextBtn');
  const createAddBtn = document.getElementById('createAddBtn');

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

  function showToast(msg="Added to favorites"){
    if(!toast) return;
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 2000);
    if(window.lucide) lucide.createIcons();
  }

  function enterFocusMode(row) {
    if(row.classList.contains('no-actions')) return;
    if(row.classList.contains('select-mode')) return;
    currentRow = row;
    currentId = row.dataset.messageId;
    const isSticker = row.querySelector('.sticker-bubble');
    if(isSticker) poppedContainer.classList.add('is-sticker');
    else poppedContainer.classList.remove('is-sticker');
    const bubble = row.querySelector('.bubble');
    if (!bubble) return;
    poppedClone.innerHTML = '';
    const clone = bubble.cloneNode(true);
    clone.classList.add('cloned-bubble');
    const badge = clone.querySelector('.msg-reaction-badge');
    if(badge) badge.remove();
    poppedClone.appendChild(clone);
    overlay.classList.add('active');
    poppedContainer.classList.add('active');
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
    if(callsWrap) callsWrap.classList.add('hide-calls');
    if(headerCancelBtn) headerCancelBtn.classList.add('show');
    if(selectedCount){ selectedCount.textContent='0 selected'; selectedCount.classList.add('show'); }
    if(chatInputBar) chatInputBar.style.display='none';
    if(deleteActionBar) deleteActionBar.classList.add('show');
    overlay.classList.remove('active');
    poppedContainer.classList.remove('active');
    if(window.lucide) lucide.createIcons();
  }
  function exitSelectMode(){
    selectedMessages.clear();
    document.querySelectorAll('.msg-row').forEach(r=> r.classList.remove('select-mode','selected'));
    if(callsWrap) callsWrap.classList.remove('hide-calls');
    if(headerCancelBtn) headerCancelBtn.classList.remove('show');
    if(selectedCount) selectedCount.classList.remove('show');
    if(chatInputBar) chatInputBar.style.display='flex';
    if(deleteActionBar) deleteActionBar.classList.remove('show');
    resetFocus();
  }
  function updateSelectedCount(){
    if(selectedCount) selectedCount.textContent = `${selectedMessages.size} selected`;
  }
  function renderStickers(){
    if(!stickerGrid) return;
    stickerGrid.querySelectorAll('.sticker-item').forEach(e=>e.remove());
    stickers.forEach(src=>{
      const div = document.createElement('div');
      div.className = 'sticker-item';
      div.innerHTML = `<img src="${src}">`;
      div.onclick = ()=> sendSticker(src);
      stickerGrid.insertBefore(div, stickerAddBox.nextSibling);
    });
    if(window.lucide) lucide.createIcons();
  }
  function sendSticker(src){
    const id = 'msg_'+Date.now();
    const row = document.createElement('div');
    row.className = 'msg-row sender';
    row.dataset.messageId = id;
    row.innerHTML = `<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sticker-bubble"><img src="${src}"><span class="msg-meta sticker-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
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
    document.querySelectorAll('.image-bubble img').forEach(img=>{
      const div = document.createElement('div');
      div.className = 'sticker-item selectable';
      div.innerHTML = `<img src="${img.src}">`;
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
      if(row.classList.contains('select-mode')) return;
      startX=e.touches[0].clientX; startY=e.touches[0].clientY;
      pressTimer=setTimeout(()=>enterFocusMode(row),480);
    },{passive:true});
    row.addEventListener('touchmove', e=>{
      if(!pressTimer) return;
      const dx=Math.abs(e.touches[0].clientX-startX), dy=Math.abs(e.touches[0].clientY-startY);
      if(dx>12||dy>12){ clearTimeout(pressTimer); pressTimer=null; }
    },{passive:true});
    row.addEventListener('touchend', ()=> clearTimeout(pressTimer));
    row.addEventListener('mousedown', e=>{ if(e.button!==0) return; if(row.classList.contains('select-mode')) return; pressTimer=setTimeout(()=>enterFocusMode(row),500); });
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
  }
  document.querySelectorAll('.msg-row').forEach(bindRow);
  new MutationObserver(muts=>{
    muts.forEach(m=> m.addedNodes.forEach(n=>{ if(n.nodeType===1 && n.classList.contains('msg-row')) bindRow(n); }));
  }).observe(chatMessages,{childList:true});

  if(actionPill){
    actionPill.addEventListener('click', e=>{
      const btn=e.target.closest('button'); if(!btn||!currentId) return;
      const act=btn.dataset.action;
      if(act==='delete'||act==='select'){ enterSelectMode(); if(currentRow){ currentRow.classList.add('selected'); selectedMessages.add(currentId); updateSelectedCount(); } }
      else if(act==='react'){ actionPill.style.display='none'; emojiBar.classList.add('show'); }
      else if(act==='reply'){
        const text=currentRow?.querySelector('.bubble p')?.innerText||'';
        resetFocus();
        setTimeout(()=>{
          document.getElementById('replyPreviewName').textContent=currentRow.classList.contains('receiver')?'Joshua dayo':'You';
          document.getElementById('replyPreviewText').textContent=text;
          document.getElementById('replyPreview').classList.add('show');
          msgInput.focus();
        },250);
      }
      else if(act==='favorite'){ showToast('Added to favorites'); resetFocus(); }
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
  if(emojiPlusBtn){
    emojiPlusBtn.addEventListener('click', ()=>{
      const custom=prompt('Enter emoji:'); if(custom&&currentId){
        const badge=document.getElementById(`reaction-${currentId}`);
        if(badge){ badge.textContent=custom.trim(); badge.classList.add('show'); }
        resetFocus();
      }
    });
  }
  if(plusBtn && plusMenu){
    plusBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isShow=plusMenu.classList.contains('show');
      if(isShow){ plusMenu.classList.add('closing'); setTimeout(()=> plusMenu.classList.remove('show','closing'),250); }
      else{ plusMenu.classList.add('show'); stickerPanel?.classList.remove('show'); chatBackground.classList.remove('sticker-open'); if(window.lucide) lucide.createIcons(); }
    });
    document.addEventListener('click', (e)=>{
      if(!plusMenu.contains(e.target) && e.target!==plusBtn &&!e.target.closest('#inputPlusBtn')){
        if(plusMenu.classList.contains('show')){ plusMenu.classList.add('closing'); setTimeout(()=> plusMenu.classList.remove('show','closing'),250); }
      }
    });
    plusMenu.querySelectorAll('[data-action]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const act=b.dataset.action; plusMenu.classList.remove('show');
        if(act==='send-image') galleryInput?.click();
        if(act==='camera') cameraInput?.click();
        if(act==='create-sticker'){ createPage?.classList.add('show'); if(window.lucide) lucide.createIcons(); }
      });
    });
  }
  function openPreview(src){
    if(!imagePreview||!previewImage) return;
    previewImage.src=src; imagePreview.classList.add('show');
  }
  function handleFile(file){ if(!file) return; openPreview(URL.createObjectURL(file)); }
  galleryInput?.addEventListener('change', e=> handleFile(e.target.files[0]));
  cameraInput?.addEventListener('change', e=> handleFile(e.target.files[0]));
  previewClose?.addEventListener('click', ()=> imagePreview.classList.remove('show'));
  imagePreview?.addEventListener('click', e=>{ if(e.target===imagePreview || e.target.classList.contains('preview-blur-bg')) imagePreview.classList.remove('show'); });
  previewSendBtn?.addEventListener('click', ()=>{
    const src=previewImage.src;
    const caption=captionInput.value.trim();
    if(!src) return;
    const id='msg_'+Date.now();
    const row=document.createElement('div');
    row.className='msg-row sender';
    row.dataset.messageId=id;
    if(caption){
      row.innerHTML=`
        <div class="select-circle"><i data-lucide="check"></i></div>
        <div class="swipe-reply-icon"><i data-lucide="reply"></i></div>
        <div class="bubble image-bubble with-caption">
          <div class="img-wrap">
            <img src="${src}">
            <span class="msg-meta over-image"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span>
          </div>
          <div class="img-caption-wrap">
            <p class="img-caption-text">${caption}</p>
          </div>
          <span class="msg-reaction-badge" id="reaction-${id}"></span>
        </div>`;
    } else {
      row.innerHTML=`
        <div class="select-circle"><i data-lucide="check"></i></div>
        <div class="swipe-reply-icon"><i data-lucide="reply"></i></div>
        <div class="bubble image-bubble">
          <div class="img-wrap">
            <img src="${src}">
            <span class="msg-meta over-image"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span>
          </div>
          <span class="msg-reaction-badge" id="reaction-${id}"></span>
        </div>`;
    }
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row);
    if(window.lucide) lucide.createIcons();
    imagePreview.classList.remove('show');
    captionInput.value='';
    galleryInput.value='';
    cameraInput.value='';
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
  });
  if(stickerBtn && stickerPanel){
    stickerBtn.addEventListener('click', ()=>{
      const isShow=stickerPanel.classList.contains('show');
      if(isShow){
        stickerPanel.classList.remove('show');
        chatBackground.classList.remove('sticker-open');
      } else {
        renderStickers();
        msgInput.blur();
        stickerPanel.classList.add('show');
        chatBackground.classList.add('sticker-open');
        plusMenu?.classList.remove('show');
        if(window.lucide) lucide.createIcons();
      }
    });
  }
  stickerPanelClose?.addEventListener('click', ()=> {
    stickerPanel.classList.remove('show');
    chatBackground.classList.remove('sticker-open');
  });
  msgInput?.addEventListener('focus', ()=>{
    if(stickerPanel?.classList.contains('show')){
      stickerPanel.classList.remove('show');
      chatBackground.classList.remove('sticker-open');
    }
  });
  msgInput?.addEventListener('input', ()=>{
    if(msgInput.value.trim().length>0 && stickerPanel?.classList.contains('show')){
      stickerPanel.classList.remove('show');
      chatBackground.classList.remove('sticker-open');
    }
    if(msgInput.value.trim().length>0) micBtn?.classList.add('sending');
    else micBtn?.classList.remove('sending');
    msgInput.style.height='auto'; msgInput.style.height=msgInput.scrollHeight+'px';
  });
  stickerAddBox?.addEventListener('click', ()=>{
    renderChatStickersSelect(); chatStickerSelectMode?.classList.add('show'); stickerPanel?.classList.remove('show'); chatBackground.classList.remove('sticker-open'); if(window.lucide) lucide.createIcons();
  });
  if(chatStickerSelectMode){
    addStickerConfirmBtn?.addEventListener('click', ()=>{
      const selected=chatStickerSelectMode.querySelectorAll('.sticker-item.selected img');
      selected.forEach(img=> stickers.push(img.src));
      localStorage.setItem('my_stickers', JSON.stringify(stickers));
      renderStickers();
      chatStickerSelectMode.classList.remove('show');
      msgInput.blur();
      stickerPanel.classList.add('show');
      chatBackground.classList.add('sticker-open');
      showToast('Sticker added');
    });
    stickerSelectClose?.addEventListener('click', ()=> chatStickerSelectMode.classList.remove('show'));
    chatStickerSelectMode.addEventListener('click', e=>{ if(e.target===chatStickerSelectMode) chatStickerSelectMode.classList.remove('show'); });
  }
  function closeCreatePage(){
    createPage.classList.remove('show');
    createImage.src='';
    createImage.style.display='none';
    createPlaceholder.style.display='flex';
    if(textOverlay) textOverlay.textContent='';
    if(stickerFileInput) stickerFileInput.value='';
  }
  createPlaceholder?.addEventListener('click', ()=> stickerFileInput?.click());
  stickerFileInput?.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const url=URL.createObjectURL(file); createImage.src=url; createImage.style.display='block'; createPlaceholder.style.display='none';
  });
  addTextBtn?.addEventListener('click', ()=>{ textOverlay.focus(); });
  createAddBtn?.addEventListener('click', ()=>{
    if(!createImage.src || createImage.style.display==='none') {
      showToast('Select image first');
      return;
    }
    stickers.push(createImage.src);
    localStorage.setItem('my_stickers', JSON.stringify(stickers));
    renderStickers();
    closeCreatePage();
    msgInput.blur();
    setTimeout(()=>{
      stickerPanel.classList.add('show');
      chatBackground.classList.add('sticker-open');
      if(window.lucide) lucide.createIcons();
    },150);
    showToast('Added to sticker pack');
  });
  createClose?.addEventListener('click', closeCreatePage);
  createBack?.addEventListener('click', closeCreatePage);
  createCancelBtn?.addEventListener('click', closeCreatePage);
  createPage?.addEventListener('click', (e)=>{
    if(e.target===createPage) closeCreatePage();
  });

  // ===== VOICE NOTE - WORKING FIX =====
  let mediaRecorder = null;
  let audioChunks = [];
  let audioStream = null;
  let isRecording = false;
  let shouldSend = false;

  function updateTimer(){
    voiceSec++;
    const m=Math.floor(voiceSec/60), s=voiceSec%60;
    if(voiceTimer) voiceTimer.textContent=`${m}:${String(s).padStart(2,'0')}`;
  }
  function animateWave(){
    if(!voiceWaveBig) return;
    voiceWaveBig.querySelectorAll('span').forEach(sp=>{
      sp.style.height = (8 + Math.random()*22)+'px';
    });
  }

  async function startVoice(){
    try{
      audioChunks = [];
      voiceSec = 0;
      if(voiceTimer) voiceTimer.textContent='0:00';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream = stream;
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = e=>{ if(e.data && e.data.size>0) audioChunks.push(e.data); };
      mediaRecorder.start(100);
      isRecording = true;
      shouldSend = false;
      voiceOverlay?.classList.add('show');
      chatBackground.classList.add('voice-open');
      if(voiceInterval) clearInterval(voiceInterval);
      voiceInterval = setInterval(()=>{ updateTimer(); animateWave(); }, 300);
      if(navigator.vibrate) navigator.vibrate(30);
    }catch(err){
      console.error(err);
      showToast('Mic permission denied - use https');
      isRecording = false;
    }
  }

  function cleanupStream(){
    if(audioStream){
      audioStream.getTracks().forEach(t=>t.stop());
      audioStream = null;
    }
    if(voiceInterval) clearInterval(voiceInterval);
    voiceInterval = null;
  }

  function sendVoiceMessage(){
    if(audioChunks.length===0){
      cleanupStream();
      return;
    }
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const id='msg_'+Date.now();
    const timeStr = voiceTimer? voiceTimer.textContent : `0:${String(voiceSec).padStart(2,'0')}`;
    const row=document.createElement('div');
    row.className='msg-row sender';
    row.dataset.messageId=id;
    row.innerHTML=`
      <div class="select-circle"><i data-lucide="check"></i></div>
      <div class="bubble voice-bubble">
        <button class="voice-play-btn"><i data-lucide="play"></i><i data-lucide="pause" class="pause-icon" style="display:none"></i></button>
        <div class="voice-wave"><span></span><span></span><span></span><span></span></div>
        <span class="voice-duration">${timeStr}</span>
        <span class="msg-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span>
        <audio src="${url}"></audio>
      </div>`;
    chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
    bindRow(row);
    const btn = row.querySelector('.voice-play-btn');
    const aud = row.querySelector('audio');
    btn.addEventListener('click', ()=>{
      if(aud.paused){
        document.querySelectorAll('.voice-bubble audio').forEach(a=>{
          if(a!==aud){ a.pause(); a.currentTime=0; }
        });
        document.querySelectorAll('.voice-play-btn.pause-icon').forEach(p=>p.style.display='none');
        document.querySelectorAll('.voice-play-btn [data-lucide="play"]').forEach(p=>p.style.display='block');
        aud.play();
        btn.querySelector('[data-lucide="play"]').style.display='none';
        btn.querySelector('.pause-icon').style.display='block';
      } else {
        aud.pause();
        btn.querySelector('[data-lucide="play"]').style.display='block';
        btn.querySelector('.pause-icon').style.display='none';
      }
      if(window.lucide) lucide.createIcons();
    });
    aud.addEventListener('ended', ()=>{
      btn.querySelector('[data-lucide="play"]').style.display='block';
      btn.querySelector('.pause-icon').style.display='none';
      if(window.lucide) lucide.createIcons();
    });
    if(window.lucide) lucide.createIcons();
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    cleanupStream();
    audioChunks=[];
  }

  function stopVoice(send){
    shouldSend = send;
    if(!mediaRecorder || mediaRecorder.state==='inactive'){
      voiceOverlay?.classList.remove('show');
      chatBackground.classList.remove('voice-open');
      cleanupStream();
      isRecording=false;
      return;
    }
    mediaRecorder.onstop = ()=>{
      if(shouldSend && voiceSec>=1){
        sendVoiceMessage();
      } else {
        cleanupStream();
        audioChunks=[];
      }
      voiceOverlay?.classList.remove('show');
      chatBackground.classList.remove('voice-open');
      isRecording=false;
      voiceSec=0;
    };
    mediaRecorder.stop();
  }

  // MIC BUTTON - TAP TO START RECORDING (simplest + works on mobile)
  let micPressTimer=null;
  micBtn?.addEventListener('pointerdown', (e)=>{
    if(msgInput.value.trim().length>0) return; // text mode
    e.preventDefault();
    if(isRecording) return;
    micPressTimer = setTimeout(()=>{ startVoice(); }, 200);
  });
  micBtn?.addEventListener('pointerup', (e)=>{
    clearTimeout(micPressTimer);
    e.preventDefault();
    if(msgInput.value.trim().length>0){
      // send text
      const txt=msgInput.value.trim(); if(!txt) return;
      const id='msg_'+Date.now();
      const row=document.createElement('div'); row.className='msg-row sender'; row.dataset.messageId=id;
      row.innerHTML=`<div class="select-circle"><i data-lucide="check"></i></div><div class="swipe-reply-icon"><i data-lucide="reply"></i></div><div class="bubble sender-bubble"><p>${txt}</p><span class="msg-meta"><span class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><i data-lucide="check-check" class="tick-icon blue"></i></span><span class="msg-reaction-badge" id="reaction-${id}"></span></div>`;
      chatMessages.insertBefore(row, document.getElementById('typingIndicator'));
      bindRow(row); msgInput.value=''; msgInput.style.height='auto'; micBtn.classList.remove('sending');
      if(window.lucide) lucide.createIcons();
      chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
    }
  });
  micBtn?.addEventListener('pointerleave', ()=> clearTimeout(micPressTimer));

  // VOICE OVERLAY BUTTONS
  voiceCancelBtn?.addEventListener('click', ()=> stopVoice(false));
  voiceStopBtn?.addEventListener('click', ()=> stopVoice(false));
  voiceSendBtn?.addEventListener('click', ()=> stopVoice(true));

  // DELETE
  deleteActionBar?.addEventListener('click', e=>{
    const btn=e.target.closest('[data-delete]'); if(!btn) return;
    selectedMessages.forEach(id=>{
      const row=document.querySelector(`[data-message-id="${id}"]`);
      if(row){ row.style.transition='opacity 0.25s'; row.style.opacity='0'; setTimeout(()=> row.remove(),250); }
    });
    exitSelectMode();
  });
  headerCancelBtn?.addEventListener('click', ()=> exitSelectMode());
  overlay?.addEventListener('click', ()=>{ if(deleteActionBar?.classList.contains('show')) exitSelectMode(); else resetFocus(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(deleteActionBar?.classList.contains('show')) exitSelectMode(); else if(createPage?.classList.contains('show')) closeCreatePage(); else if(voiceOverlay?.classList.contains('show')) stopVoice(false); else resetFocus(); } });

  window.showTyping = function(){
    const typing = document.getElementById('typingIndicator');
    if(typing) typing.classList.add('show');
    chatMessages.scrollTo({top:chatMessages.scrollHeight, behavior:'smooth'});
  }
  window.hideTyping = function(){
    const typing = document.getElementById('typingIndicator');
    if(typing) typing.classList.remove('show');
  }

  renderChatStickersSelect();
  if(window.lucide) lucide.createIcons();
})();