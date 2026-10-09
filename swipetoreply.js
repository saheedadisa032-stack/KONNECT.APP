// ===== SWIPE TO REPLY ONLY - FADE OUT FIX =====
(() => {
  const chatMessages = document.getElementById('chatMessages');
  const replyPreview = document.getElementById('replyPreview');
  const replyPreviewName = document.getElementById('replyPreviewName');
  const replyPreviewText = document.getElementById('replyPreviewText');
  const replyPreviewClose = document.getElementById('replyPreviewClose');
  const msgInputEl = document.getElementById('msgInput');

  let sX = 0, cX = 0, curRow = null, swiping = false, vib = false;

  function setReply(row){
    const p = row.querySelector('.bubble p');
    const txt = p? p.innerText : '';
    const isMe = row.classList.contains('sender');
    replyPreviewName.textContent = isMe? 'You' : 'Joshua dayo';
    replyPreviewText.textContent = txt;
    replyPreview.classList.add('show');
    msgInputEl.focus();
  }

  replyPreviewClose.addEventListener('click', () => {
    replyPreview.classList.remove('show');
  });

  chatMessages.addEventListener('touchstart', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    curRow = row;
    sX = e.touches[0].clientX;
    swiping = false;
    vib = false;
    curRow.classList.remove('releasing'); // clear fade
  }, {passive:true});

  chatMessages.addEventListener('touchmove', e => {
    if(!curRow) return;
    cX = e.touches[0].clientX - sX;
    if(cX < 0) cX = 0;
    if(cX > 75) cX = 75;
    if(cX > 8){
      swiping = true;
      curRow.classList.add('swiping');
      curRow.classList.remove('releasing');
      curRow.querySelector('.bubble').style.transform = `translateX(${cX}px)`;
      if(cX > 55 &&!vib){
        if(navigator.vibrate) navigator.vibrate(20);
        vib = true;
      }
    }
  }, {passive:true});

  chatMessages.addEventListener('touchend', () => {
    if(!curRow) return;
    const b = curRow.querySelector('.bubble');
    b.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    b.style.transform = 'translateX(0px)';

    // FADE OUT HERE
    curRow.classList.remove('swiping');
    curRow.classList.add('releasing');

    if(cX > 50 && swiping) setReply(curRow);

    setTimeout(() => {
      curRow && curRow.classList.remove('releasing');
      b.style.transition = '';
    }, 300); // wait for fade

    curRow = null; cX = 0; swiping = false;
  });

  chatMessages.addEventListener('dblclick', e => {
    const row = e.target.closest('.msg-row');
    if(!row) return;
    setReply(row);
  });
})();