// ==========================
// main.js - CHAT LIST + MOOD PILL + INPUT GROWING + GLOBAL FIXES
// ==========================
// SPEC FOR MOOD PILL:
// - Height fixed 28px always, never stretch
// - 3 states auto-cycle for MVP:
// 1) Playing now + wave bar -> tap = show artist card
// 2) Was feeling + time (2h ago) -> tap = show played time card
// 3) moon + typed mood -> tap = NOTHING
// - No swipe, only tap
// - Cycle: 3s each -> hide 1s -> loop
// - Later replace timer with real Spotify WebSocket event

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

function handleScroll() {
  const scrollTop = list? list.scrollTop : window.scrollY;
  if (window.innerWidth <= 768) {
    if (scrollTop > 50) list?.classList.add('scrolled');
    else list?.classList.remove('scrolled');
  }
}
if (list) list.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('scroll', handleScroll, { passive: true });

document.querySelectorAll(".chat-avatar").forEach(el => {
  const name = (el.dataset.name || "User").trim();
  const parts = name.split(/\s+/);
  let initials = parts.length === 1? parts[0][0] : parts[0][0] + parts[parts.length - 1][0];
  el.textContent = initials.toUpperCase().slice(0, 2);
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  el.style.background = avatarGradients[hash % avatarGradients.length];
});

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

function openChatBg() {
  if (window.innerWidth <= 768) {
    chatLoadList.classList.add('mobile-hide');
    chatBg.classList.add('mobile-show');
    document.querySelector('.sidebar-section')?.classList.add('hide-nav');
  }
  chatBg.classList.add('active-chat');
  initChatScrollLogic();
  const typing = document.getElementById('typingIndicator');
  if(typing){ typing.classList.add('show','always-show'); typing.style.display='flex'; }
}
allChatItems.forEach(item => { item.addEventListener('click', () => { openChatBg(); }); });
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
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, false);

// Edge swipe to go back
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
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    if (Math.abs(diffY) > 50) { isEdgeSwipe = false; return; }
    if (diffX < 0) { isEdgeSwipe = false; return; }
    if (diffX > 90) { isEdgeSwipe = false; openChatList(); }
  }, { passive: true });
})();

// Scroll btn position when reply preview shows
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

// ====================================================================
// MOOD PILL - FIXED VERSION - 28PX HEIGHT, TAP ONLY, 3 STATES CYCLE
// ====================================================================
// HTML expected:
// <div id="moodFloat" class="mood-float">
// <div id="moodPillWrapper" class="mood-pill-mini" data-state="playing" data-has-card="true">...</div>
// <div id="moodCard" class="mood-card">...</div>
// </div>
// If you use 3 separate pills inside moodFloat, this code handles both cases

(function(){
  const moodFloat = document.getElementById('moodFloat');
  if(!moodFloat) {
    console.log('moodFloat not found - skip mood pill');
    return;
  }

  const moodPills = moodFloat.querySelectorAll('.mood-pill-mini');
  const singlePill = document.getElementById('moodPillWrapper');
  const moodCard = document.getElementById('moodCard');
  const moodCardTitle = document.getElementById('moodCardTitle');
  const moodCardArtist = document.getElementById('moodCardArtist');
  const moodCardTime = document.getElementById('moodCardTime');

  // 3 STATES DATA FOR MVP - replace with Spotify later
  const states = [
    {
      state: 'playing',
      text: 'Asiwaju',
      sub: 'Playing now',
      icon: 'wave', // show wave bars
      hasCard: true,
      cardTitle: 'Asiwaju',
      cardArtist: 'Ruger',
      cardSub: 'Playing now • Spotify'
    },
    {
      state: 'recent',
      text: 'Was feeling • 2h ago',
      sub: '',
      icon: 'clock',
      hasCard: true,
      cardTitle: 'Chilling',
      cardArtist: 'Last vibe',
      cardSub: 'Played 2 hours ago'
    },
    {
      state: 'typed',
      text: '🌙 In my feelings',
      sub: '',
      icon: 'moon',
      hasCard: false, // tap does NOTHING
      cardTitle: '',
      cardArtist: '',
      cardSub: ''
    }
  ];

  let currentIndex = 0;
  let cycleTimer = null;
  let hideTimer = null;
  let isCardOpen = false;
  let isHidden = false;

  // Ensure fixed 28px height always
  function enforceHeight(){
    moodFloat.style.height = '28px';
    moodFloat.style.minHeight = '28px';
    moodFloat.style.maxHeight = '28px';
    if(singlePill){
      singlePill.style.height = '28px';
      singlePill.style.minHeight = '28px';
      singlePill.style.maxHeight = '28px';
    }
    moodPills.forEach(p=>{
      p.style.height = '28px';
      p.style.minHeight = '28px';
      p.style.maxHeight = '28px';
    });
  }

  function renderState(index){
    const data = states[index];
    if(!data) return;

    // If you have single pill that morphs content
    if(singlePill && moodPills.length <= 1){
      singlePill.dataset.state = data.state;
      singlePill.dataset.hasCard = data.hasCard? 'true' : 'false';
      singlePill.setAttribute('data-state', data.state);

      // Build inner HTML based on state
      if(data.state === 'playing'){
        singlePill.innerHTML = `
          <span class="mood-wave"><span></span><span></span><span></span></span>
          <span class="mood-text">${data.text}</span>
          <span class="mood-dot">•</span>
          <span class="mood-sub">${data.sub}</span>
        `;
      } else if(data.state === 'recent'){
        singlePill.innerHTML = `
          <i data-lucide="clock" class="mood-icon"></i>
          <span class="mood-text">${data.text}</span>
        `;
      } else {
        singlePill.innerHTML = `
          <i data-lucide="moon" class="mood-icon"></i>
          <span class="mood-text">${data.text}</span>
        `;
      }
      singlePill.classList.remove('hidden');
      singlePill.classList.add('active');
      moodFloat.classList.remove('hidden');
      moodFloat.style.opacity = '1';
      moodFloat.style.pointerEvents = 'auto';
    } else {
      // If you have 3 separate pills - toggle active
      moodPills.forEach((pill,i)=>{
        if(i===index){
          pill.classList.add('active');
          pill.classList.remove('hidden');
          pill.style.display = 'flex';
        } else {
          pill.classList.remove('active');
          pill.classList.add('hidden');
          pill.style.display = 'none';
        }
      });
      moodFloat.classList.remove('hidden');
    }

    // Update card content
    if(moodCardTitle) moodCardTitle.textContent = data.cardTitle;
    if(moodCardArtist) moodCardArtist.textContent = data.cardArtist;
    if(moodCardTime) moodCardTime.textContent = data.cardSub;

    enforceHeight();
    if(window.lucide) lucide.createIcons();
  }

  function hideMood(){
    moodFloat.style.opacity = '0';
    moodFloat.style.pointerEvents = 'none';
    moodFloat.classList.add('hidden');
    isHidden = true;
  }

  function showMood(){
    moodFloat.style.opacity = '1';
    moodFloat.style.pointerEvents = 'auto';
    moodFloat.classList.remove('hidden');
    isHidden = false;
  }

  function startCycle(){
    // Initial render
    renderState(0);
    currentIndex = 0;

    cycleTimer = setInterval(()=>{
      if(isCardOpen) return; // pause when card open

      if(isHidden){
        // Come back from hidden -> show next state
        isHidden = false;
        currentIndex = (currentIndex + 1) % states.length;
        showMood();
        renderState(currentIndex);
        return;
      }

      currentIndex++;
      if(currentIndex >= states.length){
        // After last state -> hide 1s then loop
        hideMood();
        currentIndex = states.length - 1; // keep at last before hide
        hideTimer = setTimeout(()=>{
          currentIndex = 0;
          showMood();
          renderState(0);
        }, 1000);
      } else {
        renderState(currentIndex);
      }
    }, 3000);
  }

  // TAP ONLY - NO SWIPE per spec
  moodFloat.addEventListener('click', (e)=>{
    e.stopPropagation();
    enforceHeight();

    const activePill = moodFloat.querySelector('.mood-pill-mini.active') || singlePill;
    if(!activePill) return;

    const state = activePill.dataset.state || activePill.getAttribute('data-state') || states[currentIndex].state;
    const hasCard = activePill.dataset.hasCard === 'true' || activePill.getAttribute('data-has-card') === 'true';

    // State 3: typed mood -> NOTHING happens
    if(state === 'typed'){
      return;
    }

    // State 1 & 2: toggle card
    if(hasCard){
      isCardOpen =!moodFloat.classList.contains('open');
      moodFloat.classList.toggle('open');

      if(isCardOpen){
        // Auto close card after 3s
        setTimeout(()=>{
          moodFloat.classList.remove('open');
          isCardOpen = false;
        }, 3000);
      }
    }
  });

  // Close card when clicking outside
  document.addEventListener('click', (e)=>{
    if(!moodFloat.contains(e.target)){
      moodFloat.classList.remove('open');
      isCardOpen = false;
    }
  });

  // Force height on resize too
  window.addEventListener('resize', enforceHeight);

  // Start cycle
  enforceHeight();
  startCycle();

  // Expose for backend Spotify later
  window.moodPill = {
    startCycle,
    stopCycle: ()=> { clearInterval(cycleTimer); clearTimeout(hideTimer); },
    showState: (idx)=> { currentIndex = idx; renderState(idx); },
    hide: hideMood,
    show: showMood,
    states
  };

  console.log('Mood pill fixed - 28px, tap only, 3 states cycle started');
})();

// ====================================================================
// INPUT BAR - WHATSAPP STYLE GROWS WITH TEXT - WHOLE BORDER GROWS
// ====================================================================
(function(){
  const msgInput = document.getElementById('msgInput');
  const chatInputBar = document.getElementById('chatInputBar');
  const inputPill = document.getElementById('inputPill') || document.querySelector('.input-pill');
  const micBtn = document.getElementById('micSendBtn');
  if(!msgInput) return;

  function autoGrow(){
    // Reset to auto to get correct scrollHeight
    msgInput.style.height = 'auto';
    const newHeight = Math.min(msgInput.scrollHeight, 100); // max 100px like WhatsApp
    msgInput.style.height = newHeight + 'px';

    // Grow whole bar container
    if(chatInputBar){
      const baseHeight = 62; // default bar height
      const extra = Math.max(0, newHeight - 22); // 22 = one line
      chatInputBar.style.minHeight = (baseHeight + extra) + 'px';
      chatInputBar.style.height = 'auto';
    }
    if(inputPill){
      const basePill = 42;
      const extra = Math.max(0, newHeight - 22);
      inputPill.style.minHeight = (basePill + extra) + 'px';
      inputPill.style.height = 'auto';
    }

    // Toggle send/mic icon
    if(msgInput.value.trim().length>0){
      micBtn?.classList.add('sending');
    } else {
      micBtn?.classList.remove('sending');
    }
  }

  msgInput.addEventListener('input', autoGrow);
  msgInput.addEventListener('focus', autoGrow);

  // Reset helper called after sending message
  window.resetInputBar = function(){
    msgInput.value = '';
    msgInput.style.height = 'auto';
    if(chatInputBar){
      chatInputBar.style.minHeight = '62px';
      chatInputBar.style.height = 'auto';
    }
    if(inputPill){
      inputPill.style.minHeight = '42px';
      inputPill.style.height = 'auto';
    }
    micBtn?.classList.remove('sending');
  };

  // Initial
  autoGrow();
})();

// ==========================
// DATE SEPARATOR FLOATING ON SCROLL
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

// FIX: SELECT MODE STILL SCROLLABLE
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

// FIX: TYPING ALWAYS SHOW
window.showTyping = function() {
  const typing = document.getElementById('typingIndicator');
  if (!typing) return;
  typing.classList.add('show','always-show');
  typing.style.display='flex';
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}
window.hideTyping = function() {
  const typing = document.getElementById('typingIndicator');
  if (!typing) return;
  typing.classList.add('show','always-show');
  typing.style.display='flex';
}
setTimeout(()=>{ window.showTyping(); }, 300);

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