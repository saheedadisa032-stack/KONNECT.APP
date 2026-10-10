// ===== SWIPE TO REPLY - FIXED HORIZONTAL VS VERTICAL SCROLL =====
(() => {
  const chatMessages = document.getElementById('chatMessages');
  const replyPreview = document.getElementById('replyPreview');
  const replyPreviewName = document.getElementById('replyPreviewName');
  const replyPreviewText = document.getElementById('replyPreviewText');
  const replyPreviewClose = document.getElementById('replyPreviewClose');
  const msgInputEl = document.getElementById('msgInput');
  const chatBg = document.getElementById('chatBackground');

  if(!chatMessages) return;

  let sX = 0, sY = 0, cX = 0, cY = 0;
  let curRow = null;
  let swiping = false;
  let isHorizontal = null; // null = not decided yet
  let vib = false;

  function setReply(row){
    if(row.classList.contains('no-actions')) return;
    if(row.classList.contains('select-mode')) return;
    const p = row.querySelector('.bubble p');
    const txt = p? p.innerText : row.querySelector('.voice-duration')?.innerText || 'Voice message';
    const isMe = row.classList.contains('sender');
    replyPreviewName.textContent = isMe? 'You' : 'Joshua dayo';
    replyPreviewText.textContent = txt.slice(0,80);
    replyPreview.classList.add('show');
    const scrollBtn = document.getElementById('scrollDownBtn');
    if(scrollBtn) scrollBtn.style.bottom = '138px';
    msgInputEl.focus();
    if(window.lucide) lucide.createIcons();
  }

  replyPreviewClose?.addEventListener('click', () => {
    replyPreview.classList.remove('show');
    const scrollBtn = document.getElementById('scrollDownBtn');
    if(scrollBtn) scrollBtn.style.bottom = '80px';
  });

  chatMessages.addEventListener('touchstart', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    if(row.classList.contains('no-actions')) return;
    if(document.querySelector('.popped-message-container.active')) return; // no swipe when hold pop dey
    if(row.classList.contains('select-mode')) return;

    curRow = row;
    sX = e.touches[0].clientX;
    sY = e.touches[0].clientY;
    cX = 0; cY = 0;
    swiping = false;
    isHorizontal = null; // reset detection
    vib = false;
    curRow.classList.remove('releasing');
  }, {passive:true});

  chatMessages.addEventListener('touchmove', e => {
    if(!curRow) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    cX = touchX - sX;
    cY = touchY - sY;

    // FIRST TIME - DECIDE IF NA HORIZONTAL OR VERTICAL
    if(isHorizontal === null){
      if(Math.abs(cX) < 5 && Math.abs(cY) < 5) return; // small move, wait
      isHorizontal = Math.abs(cX) > Math.abs(cY); // true = horizontal swipe, false = vertical scroll
      if(!isHorizontal){
        // na vertical scroll, cancel swipe
        curRow = null;
        return;
      }
    }

    if(!isHorizontal) return; // na scroll, no swipe

    // ONLY RIGHT SWIPE
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
      // prevent vertical scroll when we confirm horizontal
      if(e.cancelable && cX > 12) e.preventDefault();
    }
  }, {passive:false});

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
      bubble.style.transition = '';
    }, 300);

    curRow = null; cX = 0; cY = 0; swiping = false; isHorizontal = null;
  }, {passive:true});

  chatMessages.addEventListener('touchcancel', () => {
    if(curRow){
      const bubble = curRow.querySelector('.bubble');
      if(bubble) bubble.style.transform = 'translateX(0px)';
      curRow.classList.remove('swiping','releasing');
    }
    curRow = null; isHorizontal = null;
  }, {passive:true});

  // desktop double click
  chatMessages.addEventListener('dblclick', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    if(row.classList.contains('no-actions')) return;
    setReply(row);
  });
})();