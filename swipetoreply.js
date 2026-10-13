// ===== SWIPE TO REPLY - FIXED + SELECT SCROLLABLE + QUOTED REPLY + THUMB =====
// IMPORTANT: DO NOT MODIFY LOGIC - This file is working as requested
// This handles swipe gesture to reply, exposes same function for hold pill
(() => {
  // Cache DOM elements
  const chatMessages = document.getElementById('chatMessages');
  const replyPreview = document.getElementById('replyPreview');
  const replyPreviewName = document.getElementById('replyPreviewName');
  const replyPreviewText = document.getElementById('replyPreviewText');
  const replyPreviewClose = document.getElementById('replyPreviewClose');
  const replyPreviewThumb = document.getElementById('replyPreviewThumb');
  const msgInputEl = document.getElementById('msgInput');

  if(!chatMessages) return;

  // Swipe tracking variables
  let sX = 0, sY = 0, cX = 0, cY = 0;
  let curRow = null;
  let swiping = false;
  let isHorizontal = null;
  let vib = false;
  let currentReplyData = null;

  // core function to set reply preview - used by swipe and hold pill
  // This is the SAME function hold pill Reply button must call
  function setReply(row){
    if(!row) return;
    if(row.classList.contains('no-actions')) return;
    // allow even if select-mode active but don't block scroll
    const bubble = row.querySelector('.bubble');
    if(!bubble) return;
    const p = bubble.querySelector('p:not(.img-caption-text)');
    const img = bubble.querySelector('.image-bubble img,.sticker-bubble img,.img-wrap img');
    const vid = bubble.querySelector('video');

    let txt = 'Message';
    if(p && p.innerText.trim()) txt = p.innerText.trim();
    else if(bubble.classList.contains('image-bubble')) txt = bubble.querySelector('.img-caption-text')?.innerText || 'Photo';
    else if(bubble.classList.contains('video-bubble')) txt = bubble.querySelector('.img-caption-text')?.innerText || 'Video';
    else if(bubble.classList.contains('sticker-bubble')) txt = 'Sticker';
    else if(bubble.classList.contains('voice-bubble')) txt = row.querySelector('.voice-duration')?.innerText || 'Voice message';

    const isMe = row.classList.contains('sender');
    replyPreviewName.textContent = isMe? 'You' : 'Joshua dayo';
    replyPreviewText.textContent = txt.slice(0,80);

    // Show thumbnail if image/video exists
    if(replyPreviewThumb){
      if(img && img.src &&!img.src.includes('data:')){
        replyPreviewThumb.src = img.src;
        replyPreviewThumb.style.display = 'block';
      } else if(vid){
        if(vid.poster){
          replyPreviewThumb.src = vid.poster;
          replyPreviewThumb.style.display = 'block';
        } else {
          replyPreviewThumb.style.display = 'none';
        }
      } else {
        replyPreviewThumb.style.display = 'none';
      }
    }

    // Save current reply data for sending message
    currentReplyData = {
      name: replyPreviewName.textContent,
      text: txt.slice(0,80),
      thumb: img? img.src : (vid? (vid.poster || '') : ''),
      isImage:!!img,
      isVideo:!!vid
    };

    replyPreview.classList.add('show');
    const scrollBtn = document.getElementById('scrollDownBtn');
    if(scrollBtn) scrollBtn.style.bottom = '138px';
    msgInputEl.focus();
    if(window.lucide) lucide.createIcons();
  }

  // expose globally so hold pill reply can call same function as swipe
  window.triggerSwipeReply = setReply;
  window.setReplyRow = setReply; // alias for other modules
  window.getCurrentReplyData = () => currentReplyData;
  window.clearReplyData = () => {
    currentReplyData = null;
    replyPreview.classList.remove('show');
    if(replyPreviewThumb) replyPreviewThumb.style.display = 'none';
    const scrollBtn = document.getElementById('scrollDownBtn');
    if(scrollBtn) scrollBtn.style.bottom = '80px';
  };

  // Close reply preview
  replyPreviewClose?.addEventListener('click', () => {
    window.clearReplyData();
  });

  // Touch start - detect row
  chatMessages.addEventListener('touchstart', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    if(row.classList.contains('no-actions')) return;
    if(row.classList.contains('call-row')) return;
    if(document.querySelector('.popped-message-container.active')) return;
    // FIX: allow swipe even in select-mode but still scrollable
    if(row.classList.contains('select-mode') && e.touches.length>1) return;

    curRow = row;
    sX = e.touches[0].clientX;
    sY = e.touches[0].clientY;
    cX = 0; cY = 0;
    swiping = false;
    isHorizontal = null;
    vib = false;
    curRow.classList.remove('releasing');
  }, {passive:true});

  // Touch move - handle swipe gesture
  chatMessages.addEventListener('touchmove', e => {
    if(!curRow) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    cX = touchX - sX;
    cY = touchY - sY;

    if(isHorizontal === null){
      if(Math.abs(cX) < 5 && Math.abs(cY) < 5) return;
      isHorizontal = Math.abs(cX) > Math.abs(cY);
      if(!isHorizontal){
        // FIX: vertical move = allow chat scroll even in select mode
        curRow = null;
        return;
      }
    }
    if(!isHorizontal) return;

    // if in select mode, dont swipe, allow scroll
    if(curRow.classList.contains('select-mode')){
      curRow = null;
      isHorizontal = null;
      return;
    }

    if(cX < 0) cX = 0;
    if(cX > 80) cX = 80;

    if(cX > 8){
      swiping = true;
      curRow.classList.add('swiping');
      curRow.classList.remove('releasing');
      const bubble = curRow.querySelector('.bubble');
      if(bubble) bubble.style.transform = `translateX(${cX}px)`;
      if(cX > 55 &&!vib){
        if(navigator.vibrate) navigator.vibrate(15);
        vib = true;
      }
      if(e.cancelable && cX > 12) e.preventDefault();
    }
  }, {passive:false});

  // Touch end - trigger reply if swiped enough
  chatMessages.addEventListener('touchend', () => {
    if(!curRow) { isHorizontal = null; return; }
    const bubble = curRow.querySelector('.bubble');
    if(!bubble){ curRow=null; isHorizontal=null; return; }

    bubble.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    bubble.style.transform = 'translateX(0px)';

    curRow.classList.remove('swiping');
    curRow.classList.add('releasing');

    if(cX > 50 && swiping && isHorizontal){
      setReply(curRow);
    }

    const rowRef = curRow;
    setTimeout(() => {
      rowRef.classList.remove('releasing');
      if(rowRef.querySelector('.bubble')) rowRef.querySelector('.bubble').style.transition = '';
    }, 300);

    curRow = null; cX = 0; cY = 0; swiping = false; isHorizontal = null;
  }, {passive:true});

  // Touch cancel - reset
  chatMessages.addEventListener('touchcancel', () => {
    if(curRow){
      const bubble = curRow.querySelector('.bubble');
      if(bubble) bubble.style.transform = 'translateX(0px)';
      curRow.classList.remove('swiping','releasing');
    }
    curRow = null; isHorizontal = null;
  }, {passive:true});

  // Double click to reply - desktop support
  chatMessages.addEventListener('dblclick', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    if(row.classList.contains('no-actions')) return;
    if(row.classList.contains('call-row')) return;
    setReply(row);
  });

  // Click on swipe icon - alternative trigger
  chatMessages.addEventListener('click', e => {
    const replyIcon = e.target.closest('.swipe-reply-icon');
    if(!replyIcon) return;
    const row = replyIcon.closest('.msg-row');
    if(row) setReply(row);
  });
})();