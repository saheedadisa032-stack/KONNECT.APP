 // ==========================
// VARIABLES
// ========================== 
  
  
  const bottomNavEl = document.querySelector('.sidebar-section');
const navContainer = document.querySelector('.sidebar-section-1');
const navBtns = document.querySelectorAll('.icon-sidebar-btn');
const pill = document.querySelector('.nav-active-pill'); 
   
   
   // ==========================
// NAV BAR FOR WIGGLE - DRAGGABLE GLASS WITH BOUNCE
// ==========================
function movePill(index, animate = true) {
  const btn = navBtns[index];
  if (!btn ||!pill ||!navContainer) return;

  activeNavIndex = index;

  const cRect = navContainer.getBoundingClientRect();
  const bRect = btn.getBoundingClientRect();

  if (!animate) pill.style.transition = 'none';
  else pill.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), width 0.3s ease';

  pill.style.width = `${bRect.width}px`;
  pill.style.transform = `translateX(${bRect.left - cRect.left}px)`;

  navBtns.forEach(b => b.classList.remove('active', 'wiggle'));
  btn.classList.add('active');

  void btn.offsetWidth;
  btn.classList.add('wiggle');
  setTimeout(() => btn.classList.remove('wiggle'), 500);

  if (!animate) void pill.offsetWidth;
}

if (navBtns.length) {
  movePill(0, false);

  navBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      movePill(i, true);
      if (navigator.vibrate) navigator.vibrate(12);
    });

    btn.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX;
      pill.classList.add('dragging');
      btn.setPointerCapture(e.pointerId);
    });

    btn.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const cRect = navContainer.getBoundingClientRect();
      const curRect = navBtns[activeNavIndex].getBoundingClientRect();
      let newX = (curRect.left - cRect.left) + (e.clientX - startX);
      newX = Math.max(0, Math.min(newX, cRect.width - pill.offsetWidth));
      pill.style.transform = `translateX(${newX}px) scale(1.05)`;

      navBtns.forEach((b, idx) => {
        const r = b.getBoundingClientRect();
        if (e.clientX > r.left && e.clientX < r.right && idx!== activeNavIndex) {
          navBtns.forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          activeNavIndex = idx;
        }
      });
    });

    btn.addEventListener('pointerup', () => {
      if (!isDragging) return;
      isDragging = false;
      pill.classList.remove('dragging');
      movePill(activeNavIndex, true);
      if (navigator.vibrate) navigator.vibrate(12);
    });

    btn.addEventListener('pointercancel', () => {
      isDragging = false;
      pill.classList.remove('dragging');
      movePill(activeNavIndex, true);
    });
  });

  window.addEventListener('resize', () => movePill(activeNavIndex, false));
}

const chatMessages = document.getElementById('chatMessages');
const scrollDownBtn = document.getElementById('scrollDownBtn');
const scrollNewCount = document.getElementById('scrollNewCount');
let newMsgCount = 0;
let isAtBottom = true;

// check if user scrolled up
chatMessages.addEventListener('scroll', () => {
  const threshold = 150; // how far from bottom before we show btn
  const distanceFromBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight;
  
  if(distanceFromBottom > threshold){
    scrollDownBtn.classList.add('show');
    isAtBottom = false;
  } else {
    scrollDownBtn.classList.remove('show');
    scrollNewCount.classList.remove('show');
    newMsgCount = 0;
    isAtBottom = true;
  }
});

// click to go back down
scrollDownBtn.addEventListener('click', () => {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
});

// call this when new message arrives
function onNewMessage(){
  if(!isAtBottom){
    newMsgCount++;
    scrollNewCount.textContent = newMsgCount > 99 ? '99+' : newMsgCount;
    scrollNewCount.classList.add('show');
    scrollDownBtn.classList.add('show');
  } else {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
  }
}

lucide.createIcons();