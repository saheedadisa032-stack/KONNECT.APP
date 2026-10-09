// ===== iPHONE WHATSAPP HOLD - FULL JS =====
(function() {
  const chatMessages = document.getElementById('chatMessages');
  const overlay = document.getElementById('messageFocusOverlay');
  const poppedContainer = document.getElementById('poppedMessageContainer');
  const actionPill = document.getElementById('messageActionPill');
  const emojiBar = document.getElementById('emojiReactBar');
  const emojiHint = document.getElementById('emojiHint');
  const emojiPlusBtn = document.getElementById('emojiPlusBtn');
  const headerCancelBtn = document.getElementById('headerCancelBtn');
  const callsWrap = document.querySelector('.calls');
  const chatInputBar = document.querySelector('.chat-input-bar');
  const deleteActionBar = document.getElementById('deleteActionBar');
  const replyPreview = document.getElementById('replyPreview');
  const replyPreviewName = document.getElementById('replyPreviewName');
  const replyPreviewText = document.getElementById('replyPreviewText');
  const chatBg = document.getElementById('chatBackground');

  if (!chatMessages || !overlay || !poppedContainer) {
    console.warn('Hold effect HTML missing');
    return;
  }

  let currentRow = null;
  let currentId = null;
  let pressTimer = null;

  const reactionsStore = {}; // backend: {msgId: emoji}
  let customEmojis = ['❤️','😂','😮','😢','🙏'];

  // ===== BACKEND READY =====
  function onDelete(messageId, type) {
    console.log('DELETE:', messageId, type);
    // TODO backend: fetch('/api/delete', {method:'POST', body: JSON.stringify({messageId, type})})
    const row = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!row) return;
    if (type === 'me') {
      row.style.transition = 'opacity 0.3s';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
    } else {
      row.style.transition = 'all 0.3s';
      row.style.opacity = '0';
      row.style.transform = 'scale(0.9)';
      setTimeout(() => row.remove(), 300);
    }
  }

  function onReact(messageId, emoji) {
    console.log('REACT:', messageId, emoji);
    // TODO backend: fetch('/api/react', {method:'POST', body: JSON.stringify({messageId, emoji})})
    reactionsStore[messageId] = emoji;

    if (!customEmojis.includes(emoji)) {
      customEmojis.pop();
      customEmojis.unshift(emoji);
      renderEmojiBar();
    }

    const badge = document.getElementById(`reaction-${messageId}`);
    if (badge) {
      badge.textContent = emoji;
      badge.classList.add('show');
    }
  }

  function onReply(messageId) {
    console.log('REPLY:', messageId);
    const row = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!row) return;
    const text = row.querySelector('.bubble p')?.innerText || 'Message';
    const isReceiver = row.classList.contains('receiver');

    resetFocus(); // clear blur first

    setTimeout(() => {
      if (replyPreviewName) replyPreviewName.textContent = isReceiver ? 'Joshua dayo' : 'You';
      if (replyPreviewText) replyPreviewText.textContent = text;
      if (replyPreview) replyPreview.classList.add('show');
      
      const scrollBtn = document.getElementById('scrollDownBtn');
      if (scrollBtn) scrollBtn.style.bottom = '138px';
      
      const input = document.getElementById('msgInput');
      if (input) input.focus();

      if (window.lucide) lucide.createIcons();
    }, 260);
  }

  function renderEmojiBar() {
    if (!emojiBar) return;
    const btns = emojiBar.querySelectorAll('[data-emoji]');
    btns.forEach((btn, i) => {
      if (customEmojis[i]) {
        btn.dataset.emoji = customEmojis[i];
        btn.textContent = customEmojis[i];
      }
    });
  }

  // ===== FOCUS MODE =====
  function enterFocusMode(row) {
    currentRow = row;
    currentId = row.dataset.messageId;
    
    if (!currentId) {
      currentId = 'msg_' + Date.now();
      row.dataset.messageId = currentId;
      // auto create badge if not exist
      let badge = row.querySelector('.msg-reaction-badge');
      if (!badge) {
        const bubble = row.querySelector('.bubble');
        if (bubble) {
          badge = document.createElement('span');
          badge.className = 'msg-reaction-badge';
          badge.id = `reaction-${currentId}`;
          bubble.appendChild(badge);
        }
      } else {
        badge.id = `reaction-${currentId}`;
      }
    }

    const bubble = row.querySelector('.bubble');
    if (!bubble) return;

    // clear old clone
    const old = poppedContainer.querySelector('.cloned-bubble');
    if (old) old.remove();

    const clone = bubble.cloneNode(true);
    clone.classList.add('cloned-bubble');
    clone.classList.remove('sending');
    // remove badge from clone to avoid double
    const cloneBadge = clone.querySelector('.msg-reaction-badge');
    if (cloneBadge) cloneBadge.remove();

    poppedContainer.insertBefore(clone, actionPill);

    overlay.classList.add('active');
    poppedContainer.classList.add('active');
    chatBg.classList.add('focus-mode');
    
    if (actionPill) actionPill.style.display = 'flex';
    if (emojiBar) emojiBar.classList.remove('show');
    if (emojiHint) emojiHint.classList.remove('show');

    if (navigator.vibrate) navigator.vibrate(30);
    if (window.lucide) lucide.createIcons();
  }

  function resetFocus() {
    overlay.classList.remove('active');
    poppedContainer.classList.remove('active');
    chatBg.classList.remove('focus-mode');
    if (actionPill) actionPill.style.display = 'flex';
    if (emojiBar) emojiBar.classList.remove('show');
    if (emojiHint) emojiHint.classList.remove('show');

    setTimeout(() => {
      const clone = poppedContainer.querySelector('.cloned-bubble');
      if (clone) clone.remove();
    }, 300);

    currentRow = null;
  }

  function enterDeleteMode() {
    if (callsWrap) callsWrap.classList.add('hide-calls');
    if (headerCancelBtn) headerCancelBtn.classList.add('show');
    if (chatInputBar) chatInputBar.style.display = 'none';
    if (deleteActionBar) deleteActionBar.classList.add('show');
    
    // KEEP overlay and popped message visible
    overlay.classList.add('active');
    poppedContainer.classList.add('active');
    if (actionPill) actionPill.style.display = 'none';
    if (emojiBar) emojiBar.classList.remove('show');
    if (window.lucide) lucide.createIcons();
  }

  function exitDeleteMode() {
    if (callsWrap) callsWrap.classList.remove('hide-calls');
    if (headerCancelBtn) headerCancelBtn.classList.remove('show');
    if (chatInputBar) chatInputBar.style.display = 'flex';
    if (deleteActionBar) deleteActionBar.classList.remove('show');
    resetFocus();
  }

  // ===== LONG PRESS BIND =====
   function bindRow(row) {
    let startX = 0, startY = 0;

    // BLOCK iPhone default menu only
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      enterFocusMode(row); // right-click = pop immediately for desktop
      return false;
    });

    row.addEventListener('selectstart', (e) => e.preventDefault());
    row.addEventListener('dragstart', (e) => e.preventDefault());

    // MOBILE - long press
    row.addEventListener('touchstart', (e) => {
      if (chatBg.classList.contains('focus-mode')) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      pressTimer = setTimeout(() => enterFocusMode(row), 480);
    }, {passive: true});

    row.addEventListener('touchmove', (e) => {
      if (!pressTimer) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 12 || dy > 12) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }, {passive: true});

    row.addEventListener('touchend', () => clearTimeout(pressTimer));

    // DESKTOP - left click HOLD (600ms) + right click instant
    row.addEventListener('mousedown', (e) => {
      if (chatBg.classList.contains('focus-mode')) return;

      if (e.button === 0) { // left click hold
        startX = e.clientX;
        startY = e.clientY;
        pressTimer = setTimeout(() => enterFocusMode(row), 500);
      }
    });

    row.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        clearTimeout(pressTimer);
      }
    });

    row.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    // extra: single left click to pop if you want instant (remove if you want only hold)
    row.addEventListener('click', (e) => {
      // if you want instant left click, uncomment below:
      // enterFocusMode(row);
    });
  }

  document.querySelectorAll('.msg-row').forEach(bindRow);

  // for new messages later
  const observer = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('msg-row')) {
          bindRow(node);
          // ensure badge exists
          if (!node.querySelector('.msg-reaction-badge')) {
            const id = node.dataset.messageId || 'msg_' + Date.now();
            node.dataset.messageId = id;
            const bubble = node.querySelector('.bubble');
            if (bubble) {
              const badge = document.createElement('span');
              badge.className = 'msg-reaction-badge';
              badge.id = `reaction-${id}`;
              bubble.appendChild(badge);
            }
          }
        }
      });
    });
  });
  observer.observe(chatMessages, {childList: true});

  // ===== ACTIONS =====
  if (actionPill) {
    actionPill.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !currentId) return;
      const act = btn.dataset.action;
      if (act === 'delete') enterDeleteMode();
      else if (act === 'react') {
        actionPill.style.display = 'none';
        emojiBar.classList.add('show');
      } else if (act === 'reply') {
        onReply(currentId);
      }
    });
  }

  if (emojiBar) {
    emojiBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-emoji]');
      if (!btn || !currentId) return;
      onReact(currentId, btn.dataset.emoji);
      resetFocus();
    });
  }

  if (emojiPlusBtn) {
    emojiPlusBtn.addEventListener('click', () => {
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const custom = prompt('Enter emoji:');
        if (custom && custom.trim() && currentId) {
          onReact(currentId, custom.trim());
          resetFocus();
        }
      } else {
        if (emojiHint) {
          emojiHint.classList.add('show');
          setTimeout(() => emojiHint.classList.remove('show'), 3200);
        }
      }
    });
  }

  if (deleteActionBar) {
    deleteActionBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete]');
      if (!btn || !currentId) return;
      onDelete(currentId, btn.dataset.delete);
      exitDeleteMode();
    });
  }

  if (headerCancelBtn) {
    headerCancelBtn.addEventListener('click', () => exitDeleteMode());
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      if (deleteActionBar && deleteActionBar.classList.contains('show')) {
        exitDeleteMode();
      } else {
        resetFocus();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (deleteActionBar && deleteActionBar.classList.contains('show')) exitDeleteMode();
      else resetFocus();
    }
  });

  renderEmojiBar();
  console.log('iPhone hold JS ready');
})();



// ===== FLOATING DATE ON SCROLL + TYPING BUBBLE =====
(function() {
  const chatMessages = document.getElementById('chatMessages');
  const floatingDate = document.getElementById('floatingDate');
  const typingRow = document.getElementById('typingIndicator');

  if (!chatMessages ||!floatingDate) return;

  let scrollTimeout = null;
  let isScrolling = false;

  function updateFloatingDate() {
    const seps = chatMessages.querySelectorAll('.date-sep');
    if (!seps.length) return;
    const chatTop = chatMessages.getBoundingClientRect().top + 90;
    let currentDate = seps[0].dataset.date || 'Today';
    seps.forEach(sep => {
      const rect = sep.getBoundingClientRect();
      if (rect.top <= chatTop) {
        currentDate = sep.dataset.date || currentDate;
      }
    });
    floatingDate.textContent = currentDate;
  }

  chatMessages.addEventListener('scroll', () => {
    updateFloatingDate();
    if (!isScrolling) {
      isScrolling = true;
      floatingDate.classList.add('show');
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      floatingDate.classList.remove('show');
    }, 1200);
  });

  updateFloatingDate();

  window.showTyping = function(show = true) {
    if (!typingRow) return;
    if (show) {
      typingRow.classList.add('show');
      setTimeout(() => {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
      }, 100);
    } else {
      typingRow.classList.remove('show');
    }
  };

  // 👇 SHOW TYPING NOW FOR YOU TO SEE - REMOVE LATER
  showTyping(true);

  const observer = new MutationObserver(() => updateFloatingDate());
  observer.observe(chatMessages, { childList: true });
})();