// ==========================
// VARIABLES - CHAT LIST ONLY
// ==========================
const list = document.querySelector('.chat-load-list');
const chatLoadList = document.querySelector('.chat-load-list');
const chatBg = document.querySelector('.chat-background');
const chatContainer = document.getElementById('chatContainer');
const randomTab = document.getElementById('randomTab');
const title = document.getElementById('chatListTitle');
const randomIdle = document.getElementById('randomIdle');
const randomSearching = document.getElementById('randomSearching');
const startRandomBtn = document.getElementById('startRandomBtn');
const cancelRandomBtn = document.getElementById('cancelRandomBtn');
const backBtn = document.querySelector('.arrow-icon');
const callsIcons = document.getElementById('callsIcons');
const headerDeleteBtn = document.getElementById('headerDeleteBtn');

const tabs = document.querySelectorAll('.tab-btn');
const allChatItems = document.querySelectorAll('.chat-item');

const avatarGradients = [
  "linear-gradient(135deg, #FF6B6B, #EE5A24)",
  "linear-gradient(135deg, #70A1FF, #1E90FF)",
  "linear-gradient(135deg, #7BED9F, #2ED573)",
  "linear-gradient(135deg, #FFA502, #FF7F50)",
  "linear-gradient(135deg, #A29BFE, #6C5CE7)",
  "linear-gradient(135deg, #7ED6DF, #0984E3)",
  "linear-gradient(135deg, #FD79A8, #E84393)",
  "linear-gradient(135deg, #55EFC4, #00B894)"
];

let searchingTimeout = null;

// SCROLL HANDLER - for header shadow
function handleScroll() {
  const scrollTop = list? list.scrollTop : window.scrollY;
  if (window.innerWidth <= 768) {
    if (scrollTop > 50) list?.classList.add('scrolled');
    else list?.classList.remove('scrolled');
  }
}
if (list) list.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('scroll', handleScroll, { passive: true });

// AVATAR: initials + random gradient
document.querySelectorAll(".chat-avatar").forEach(el => {
  const name = (el.dataset.name || "User").trim();
  const parts = name.split(/\s+/);
  let initials = parts.length === 1? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  el.textContent = initials.toUpperCase().slice(0, 2);
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  el.style.background = avatarGradients[hash % avatarGradients.length];
});

// TABS: All, Chats, Groups, Random
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'random') {
      chatContainer.style.display = 'none';
      if (title) title.style.display = 'none';
      randomTab.style.display = 'flex';
      document.getElementById('midChatsText').textContent = 'Random';
      randomIdle.style.display = 'flex';
      randomSearching.style.display = 'none';
      chatBg.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#555"><i data-lucide="ghost" style="width:60px;height:60px;margin-bottom:16px;opacity:0.2"></i><p>Select Start Random Chat to begin</p></div>`;
    } else {
      chatContainer.style.display = 'flex';
      if (title) title.style.display = 'block';
      randomTab.style.display = 'none';
      document.getElementById('midChatsText').textContent = 'Chats';
      title.textContent = tab === 'all'? 'All Chats' : tab === 'chats'? 'Chats' : 'Groups';
      document.querySelectorAll('#chatContainer.chat-item').forEach(item => {
        if (tab === 'all') item.style.display = 'flex';
        else item.style.display = item.dataset.type === tab? 'flex' : 'none';
      });
      chatBg.innerHTML = '';
    }
    if(window.lucide) lucide.createIcons();
  });
});

// RANDOM CHAT
startRandomBtn?.addEventListener('click', () => {
  randomIdle.style.display = 'none';
  randomSearching.style.display = 'flex';
  if(window.lucide) lucide.createIcons();
  searchingTimeout = setTimeout(() => { startStrangerChat(); }, 2500);
});
cancelRandomBtn?.addEventListener('click', () => {
  clearTimeout(searchingTimeout);
  randomIdle.style.display = 'flex';
  randomSearching.style.display = 'none';
  chatBg.innerHTML = '';
});

// OPEN/CLOSE CHAT BACKGROUND - mobile logic
function openChatBg() {
  if (window.innerWidth <= 768) {
    chatLoadList.classList.add('mobile-hide');
    chatBg.classList.add('mobile-show');
    document.querySelector('.sidebar-section')?.classList.add('hide-nav');
  }
  chatBg.classList.add('active-chat');
  initChatScrollLogic();
  // FIX: force typing show when open
  const typing = document.getElementById('typingIndicator');
  if(typing){ typing.classList.add('show','always-show'); }
}
allChatItems.forEach(item => {
  item.addEventListener('click', () => { openChatBg(); });
});
function closeChatBg() {
  if (window.innerWidth <= 768) {
    chatLoadList.classList.remove('mobile-hide');
    chatBg.classList.remove('mobile-show');
    document.querySelector('.sidebar-section')?.classList.remove('hide-nav');
  }
  chatBg.classList.remove('active-chat');
}
window.closeChat = closeChatBg;
backBtn?.addEventListener('click', () => { closeChatBg(); });

// Prevent zoom
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, false);
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// EDGE SWIPE
(function() {
  const chatBgEl = document.querySelector('.chat-background');
  const chatListEl = document.querySelector('.chat-load-list');
  const sidebar = document.querySelector('.sidebar-section');
  if (!chatBgEl ||!chatListEl) return;
  let startX = 0, startY = 0, isEdgeSwipe = false;
  function openChatList() {
    chatBgEl.classList.remove('mobile-show');
    chatListEl.classList.remove('mobile-hide');
    if (sidebar) sidebar.classList.remove('hide-nav');
  }
  chatBgEl.addEventListener('touchstart', (e) => {
    if (e.touches.length!== 1) return;
    const touch = e.touches[0];
    startX = touch.clientX; startY = touch.clientY;
    if (startX > 30) { isEdgeSwipe = false; return; }
    if (e.target.closest('.msg-row') || e.target.closest('.bubble') || e.target.closest('.chat-input-bar')) {
      isEdgeSwipe = false; return;
    }
    isEdgeSwipe = true;
  }, { passive: true });
  chatBgEl.addEventListener('touchmove', (e) => {
    if (!isEdgeSwipe) return;
    if (e.touches.length!== 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    if (Math.abs(diffY) > 50) { isEdgeSwipe = false; return; }
    if (diffX < 0) { isEdgeSwipe = false; return; }
    if (diffX > 90) { isEdgeSwipe = false; openChatList(); }
  }, { passive: true });
  chatBgEl.addEventListener('touchend', () => { isEdgeSwipe = false; }, { passive: true });
})();

// SCROLL BUTTON SPACE when reply preview shows
(function() {
  const replyPreview = document.querySelector('.reply-preview');
  const scrollBtn = document.querySelector('.scroll-down-btn');
  const chatBgEl = document.querySelector('.chat-background');
  if (!replyPreview ||!scrollBtn) return;
  const observer = new MutationObserver(() => {
    if (replyPreview.classList.contains('show')) {
      scrollBtn.style.bottom = '138px';
      if (chatBgEl) chatBgEl.classList.add('has-reply');
    } else {
      scrollBtn.style.bottom = '80px';
      if (chatBgEl) chatBgEl.classList.remove('has-reply');
    }
  });
  observer.observe(replyPreview, { attributes: true, attributeFilter: ['class'] });
})();

// ==========================
// DATE SEPARATOR FLOATING ON SCROLL - SMALL
// ==========================
let floatingDateTimeout = null;
function initChatScrollLogic() {
  const chatMessages = document.getElementById('chatMessages');
  const floatingDate = document.getElementById('floatingDate');
  if (!chatMessages ||!floatingDate) return;

  const dateSeps = chatMessages.querySelectorAll('.date-sep');
  if (dateSeps.length === 0) return;

  chatMessages.addEventListener('scroll', () => {
    let currentDate = null;
    dateSeps.forEach(sep => {
      const rect = sep.getBoundingClientRect();
      const containerRect = chatMessages.getBoundingClientRect();
      if (rect.top <= containerRect.top + 100) {
        currentDate = sep.getAttribute('data-date');
      }
    });
    if (currentDate) {
      floatingDate.textContent = currentDate;
      floatingDate.classList.add('show');
      clearTimeout(floatingDateTimeout);
      floatingDateTimeout = setTimeout(() => {
        floatingDate.classList.remove('show');
      }, 1500);
    }
  }, { passive: true });
}

// ==========================
// FIX: SELECT MODE STILL SCROLLABLE
// ==========================
window.enableSelectModeScroll = function(){
  const cm = document.getElementById('chatMessages');
  if(cm){
    cm.style.overflowY = 'auto';
    cm.style.pointerEvents = 'auto';
  }
  document.getElementById('chatBackground')?.classList.add('select-mode','select-mode-active');
}
window.disableSelectModeScroll = function(){
  document.getElementById('chatBackground')?.classList.remove('select-mode','select-mode-active');
}

// Hook into existing select mode if you have function
const _origEnterSelect = window.enterSelectMode;
window.enterSelectMode = function(...args){
  if(_origEnterSelect) _origEnterSelect(...args);
  window.enableSelectModeScroll();
}
const _origExitSelect = window.exitSelectMode;
window.exitSelectMode = function(...args){
  if(_origExitSelect) _origExitSelect(...args);
  window.disableSelectModeScroll();
}

// ==========================
// FIX: TYPING ALWAYS SHOW BOUNCING
// ==========================
window.showTyping = function() {
  const typing = document.getElementById('typingIndicator');
  if (!typing) return;
  typing.classList.add('show','always-show');
  typing.style.display='flex';
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}
window.hideTyping = function() {
  // user say dont hide, so keep showing
  const typing = document.getElementById('typingIndicator');
  if (!typing) return;
  typing.classList.add('show','always-show');
  typing.style.display='flex';
}

// force typing visible on load
setTimeout(()=>{ window.showTyping(); }, 300);

// ==========================
// FIX: HOLD PILL MIDDLE IF LONG, UNDER IF SHORT
// ==========================
window.positionPillSmart = function(msgRow){
  const container = document.getElementById('poppedMessageContainer');
  if(!container ||!msgRow) return;
  const text = msgRow.querySelector('p')?.innerText || '';
  const isLong = text.length > 80 || msgRow.offsetHeight > 130;
  container.classList.toggle('long-msg', isLong);
  container.classList.toggle('short-msg',!isLong);
  container.setAttribute('data-long', isLong?'true':'false');
}

if(window.lucide) lucide.createIcons();
initChatScrollLogic();