lucide.createIcons();

// ==========================
// VARIABLES
// ==========================
const list = document.querySelector('.chat-load-list');
const chatLoadList = document.querySelector('.chat-load-list');
const chatBg = document.querySelector('.chat-background');
const chatBackground = document.querySelector('.chat-background');
const chatContainer = document.getElementById('chatContainer');
const randomTab = document.getElementById('randomTab');
const title = document.getElementById('chatListTitle');
const randomIdle = document.getElementById('randomIdle');
const randomSearching = document.getElementById('randomSearching');
const startRandomBtn = document.getElementById('startRandomBtn');
const cancelRandomBtn = document.getElementById('cancelRandomBtn');
const backBtn = document.querySelector('.arrow-icon');

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
let activeNavIndex = 0;
let isDragging = false;
let startX = 0;

// ==========================
// SCROLL HANDLER - FOR GLASS HEADER
// ==========================
function handleScroll() {
  const scrollTop = list? list.scrollTop : window.scrollY;
  if (window.innerWidth <= 768) {
    if (scrollTop > 50) list?.classList.add('scrolled');
    else list?.classList.remove('scrolled');
  }
}

if (list) list.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('scroll', handleScroll, { passive: true });

// ==========================
// AVATAR - NAME + COLOR
// ==========================
document.querySelectorAll(".chat-avatar").forEach(el => {
  const name = (el.dataset.name || "User").trim();
  const parts = name.split(/\s+/);
  let initials = parts.length === 1? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  el.textContent = initials.toUpperCase().slice(0, 2);

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  el.style.background = avatarGradients[hash % avatarGradients.length];
});

// ==========================
// TABS - ALL / CHATS / GROUPS / RANDOM
// ==========================
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

      chatBackground.innerHTML = `
        <div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#555">
          <i data-lucide="ghost" style="width:60px;height:60px;margin-bottom:16px;opacity:0.2"></i>
          <p>Select Start Random Chat to begin</p>
        </div>`;
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

      chatBackground.innerHTML = '';
    }

    lucide.createIcons();
  });
});

// ==========================
// RANDOM CHAT - START / CANCEL
// ==========================
startRandomBtn?.addEventListener('click', () => {
  randomIdle.style.display = 'none';
  randomSearching.style.display = 'flex';
  lucide.createIcons();

  searchingTimeout = setTimeout(() => {
    startStrangerChat();
  }, 2500);
});

cancelRandomBtn?.addEventListener('click', () => {
  clearTimeout(searchingTimeout);
  randomIdle.style.display = 'flex';
  randomSearching.style.display = 'none';
  chatBackground.innerHTML = '';
});


// ==========================
// THIS IS FOR OPEN OF CHAT BACKGROUND
// ==========================
function openChatBg() {
  if (window.innerWidth <= 768) {
    chatLoadList.classList.add('mobile-hide');
    chatBg.classList.add('mobile-show');
    bottomNavEl?.classList.add('hide-nav');
  }
  chatBg.classList.add('active-chat');
}

allChatItems.forEach(item => {
  item.addEventListener('click', () => {
    openChatBg();
  });
});

// ==========================
// THIS IS FOR CLOSING OF CHAT BACKGROUND
// ==========================
function closeChatBg() {
  if (window.innerWidth <= 768) {
    chatLoadList.classList.remove('mobile-hide');
    chatBg.classList.remove('mobile-show');
    bottomNavEl?.classList.remove('hide-nav');
  }
  chatBg.classList.remove('active-chat');
}

backBtn?.addEventListener('click', () => {
  closeChatBg();
});

const msgInput = document.getElementById('msgInput');
const micBtn = document.getElementById('micSendBtn');

msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto';
  msgInput.style.height = msgInput.scrollHeight + 'px';
  
  if(msgInput.value.trim().length > 0){
    micBtn.classList.add('sending');
  } else {
    micBtn.classList.remove('sending');
  }
});

lucide.createIcons();


// kill pinch zoom & double tap zoom for iPhone
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