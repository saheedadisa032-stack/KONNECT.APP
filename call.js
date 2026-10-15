document.addEventListener('DOMContentLoaded', function(){
  // ===== YOU FIT CHANGE THIS IF YOUR HTML ID DIFFERENT =====
  var CHAT_ICON_ID = 'callGoChat'; // First icon - chat bubble - go to chatBackground
  var LIST_ICON_ID = 'callGoList'; // Second icon - list/users - go to chatLoadList

  // ===== DOM =====
  var overlay = document.getElementById('callOverlay');
  var startBtn = document.getElementById('startOutgoingCallBtn');
  var statusEl = document.getElementById('callStatus');
  var pill = document.getElementById('dynamicPill');
  var expanded = document.getElementById('expandedPill');
  var incomingList = document.getElementById('incomingTileList');
  var incomingChat = document.getElementById('incomingTileChat');
  var ringtone = document.getElementById('ringtoneAudio');

  var chatLoadList = document.getElementById('chatLoadList');
  var chatBackground = document.getElementById('chatBackground');
  var sidebarSection = document.querySelector('.sidebar-section');

  // Check if elements exist
  if(!overlay){ console.log('Missing overlay'); return; }
  if(!pill){ console.log('Missing pill'); return; }
  if(!expanded){ console.log('Missing expanded'); return; }

  var callState = 'idle'; // idle, outgoing, incoming, connected
  var sec = 0;
  var timer = null;
  var ringingTimer = null;
  var autoTestTimer = null;

  // ===== SET CALLER INFO =====
  // BACKEND NOTE: Call this when you get caller data from server
  function setCaller(name){
    var displayName = name || 'Joshua dayo';
    var src = 'https://i.pravatar.cc/300?img=12';
    // Update all name displays
    var names = ['callName','pillName','expandedName','incomingNameList','incomingNameChat'];
    var avas = ['callBigAva','pillAva','expandedAva','incomingAvaList','incomingAvaChat'];
    for(var i=0;i<names.length;i++){
      var el = document.getElementById(names[i]);
      if(el) el.textContent = displayName;
    }
    for(var j=0;j<avas.length;j++){
      var av = document.getElementById(avas[j]);
      if(av) av.src = src;
    }
    if(window.lucide){ lucide.createIcons(); }
  }

  // ===== CALL TIMER =====
  // BACKEND NOTE: Timer starts when call connects
  function startTimer(){
    clearInterval(timer);
    sec = 0;
    function setT(t){
      if(statusEl) statusEl.textContent = t;
      var pt = document.getElementById('pillTime');
      if(pt) pt.textContent = t;
      var et = document.getElementById('expandedTime');
      if(et) et.textContent = t + ' • tap to return';
    }
    setT('00:00');
    timer = setInterval(function(){
      sec++;
      var m = Math.floor(sec/60);
      var s = sec%60;
      var t = (m<10?'0'+m:m) + ':' + (s<10?'0'+s:s);
      setT(t);
    },1000);
  }

  function stopTimer(){
    clearInterval(timer);
    timer = null;
    sec = 0;
  }

  // ===== NAV CONTROL - FIX NAV SHOWING INSIDE CALL =====
  // BACKEND NOTE: When full call overlay shows, hide nav so nav no dey inside call
  function hideNavForCall(){
    document.body.classList.add('konnekt-in-call');
    // Hide all possible navs
    var navs = document.querySelectorAll('#bottomNav,.bottom-nav,.mobile-bottom-nav,.mobile-nav, nav.navbar, nav');
    for(var i=0;i<navs.length;i++){
      navs[i].style.display = 'none';
      navs[i].style.visibility = 'hidden';
    }
    // Hide sidebar on mobile during full call
    if(window.innerWidth <= 768 && sidebarSection){
      sidebarSection.style.display = 'none';
    }
    // Force overlay on top
    overlay.style.zIndex = '99999';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
  }

  function showNavAfterCall(){
    // BACKEND NOTE: Show nav back when call goes to pill or ends
    document.body.classList.remove('konnekt-in-call');
    var navs = document.querySelectorAll('#bottomNav,.bottom-nav,.mobile-bottom-nav,.mobile-nav, nav.navbar, nav');
    for(var i=0;i<navs.length;i++){
      navs[i].style.display = '';
      navs[i].style.visibility = '';
    }
    if(sidebarSection){
      sidebarSection.style.display = '';
    }
  }

  // ============================================================
  // ===== TWO DIFFERENT FUNCTIONS FOR TWO ICONS - CORE FIX =====
  // ============================================================

  // FUNCTION 1: GO TO CHAT BACKGROUND - FOR CHAT ICON
  // This is what first icon (chat bubble) should do
  function goToChatBackground(){
    // BACKEND NOTE: Chat icon -> opens chatBackground (the main chat conversation)
    console.log('KONNEKT ICON 1: GO TO CHAT BACKGROUND');

    // On mobile, we need to switch views
    if(window.innerWidth <= 768){
      // Hide list, show chat
      if(chatLoadList){
        chatLoadList.classList.add('mobile-hidden');
        chatLoadList.style.display = 'none';
      }
      if(chatBackground){
        chatBackground.classList.remove('mobile-hidden');
        chatBackground.classList.remove('hidden');
        chatBackground.style.display = 'flex';
        chatBackground.style.visibility = 'visible';
        chatBackground.style.opacity = '1';
      }
      if(sidebarSection){
        sidebarSection.classList.add('mobile-hidden');
      }
    }else{
      // On desktop, just ensure chatBackground is visible
      if(chatBackground){
        chatBackground.classList.remove('hidden');
        chatBackground.style.display = 'flex';
        chatBackground.style.visibility = 'visible';
      }
      // On desktop, keep list visible too (if your layout is sidebar + chat)
      if(chatLoadList){
        chatLoadList.classList.remove('mobile-hidden');
        chatLoadList.style.display = 'flex';
      }
    }
  }

  // FUNCTION 2: GO TO CHAT LOAD LIST - FOR LIST ICON
  // This is what second icon (list/users) should do
  function goToChatList(){
    // BACKEND NOTE: List icon -> opens chatLoadList (the list of all chats)
    console.log('KONNEKT ICON 2: GO TO CHAT LIST');

    // On mobile, switch views
    if(window.innerWidth <= 768){
      // Hide chat, show list
      if(chatBackground){
        chatBackground.classList.add('mobile-hidden');
        chatBackground.style.display = 'none';
      }
      if(chatLoadList){
        chatLoadList.classList.remove('mobile-hidden');
        chatLoadList.classList.remove('hidden');
        chatLoadList.style.display = 'flex';
        chatLoadList.style.visibility = 'visible';
        chatLoadList.style.opacity = '1';
      }
      if(sidebarSection){
        sidebarSection.classList.add('mobile-hidden');
      }
    }else{
      // On desktop, show list
      if(chatLoadList){
        chatLoadList.classList.remove('hidden');
        chatLoadList.style.display = 'flex';
        chatLoadList.style.visibility = 'visible';
      }
      if(sidebarSection){
        sidebarSection.classList.remove('mobile-hidden');
        sidebarSection.style.display = '';
      }
    }
  }

  // ===== BACK TO FULL CALL =====
  // BACKEND NOTE: When user taps expanded pill, go back to full overlay
  function backToFullCall(){
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    pill.classList.add('hidden');
    expanded.classList.add('hidden');
  }

  // ===== CALL FLOW =====
  function openOutgoing(callerName){
    setCaller(callerName);
    callState = 'outgoing';
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    pill.classList.add('hidden');
    expanded.classList.add('hidden');
    if(statusEl) statusEl.textContent = 'calling...';
    clearTimeout(ringingTimer);
    ringingTimer = setTimeout(function(){
      if(callState === 'outgoing'){ onConnected(); }
    },2000);
    stopAutoTest();
    // BACKEND: socket.emit('call:start', {to: userId})
  }

  function onConnected(){
    callState = 'connected';
    hideNavForCall();
    startTimer();
    // BACKEND: socket.on('call:answered') => onConnected()
  }

  function showIncoming(data){
    var name = 'Joshua dayo';
    if(data && data.name){ name = data.name; }
    setCaller(name);
    callState = 'incoming';
    if(incomingList){
      incomingList.classList.add('show');
      incomingList.style.display = 'flex';
      incomingList.style.visibility = 'visible';
    }
    if(incomingChat){
      incomingChat.classList.add('show');
      incomingChat.style.display = 'flex';
      incomingChat.style.visibility = 'visible';
    }
    try{ if(ringtone){ ringtone.currentTime=0; ringtone.play().catch(function(){}); } }catch(e){}
    // BACKEND: socket.on('call:incoming', (data) => showIncoming(data))
  }

  function hideIncoming(){
    if(incomingList){ incomingList.classList.remove('show'); incomingList.style.display='none'; }
    if(incomingChat){ incomingChat.classList.remove('show'); incomingChat.style.display='none'; }
    try{ if(ringtone){ ringtone.pause(); ringtone.currentTime=0; } }catch(e){}
    if(callState === 'incoming'){ callState='idle'; }
  }

  function answerIncoming(){
    // FIX: Hide nav before showing call so nav no show inside calling state
    hideIncoming();
    stopAutoTest();
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    onConnected();
    // BACKEND: socket.emit('call:answer')
  }

  function endCall(){
    clearTimeout(ringingTimer);
    stopTimer();
    callState = 'idle';
    overlay.classList.remove('show');
    overlay.classList.remove('minimized');
    pill.classList.add('hidden');
    expanded.classList.add('hidden');
    hideIncoming();
    showNavAfterCall();
    var btns = document.querySelectorAll('.konnekt-glass-btn,.konnekt-exp-btn');
    for(var k=0;k<btns.length;k++){ btns[k].classList.remove('active','mute-active'); }
    startAutoTest();
    // BACKEND: socket.emit('call:end')
  }

  // ===== BUTTON EVENTS =====
  if(startBtn){
    startBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var cn = document.querySelector('.chat-name');
      var n = cn? cn.textContent.trim() : 'Joshua dayo';
      openOutgoing(n);
    }, true);
  }

  var acceptList = document.getElementById('acceptCallList');
  if(acceptList){ acceptList.addEventListener('click', function(e){ e.stopPropagation(); answerIncoming(); }); }
  var acceptChat = document.getElementById('acceptCallChat');
  if(acceptChat){ acceptChat.addEventListener('click', function(e){ e.stopPropagation(); answerIncoming(); }); }
  var declineList = document.getElementById('declineCallList');
  if(declineList){ declineList.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); }); }
  var declineChat = document.getElementById('declineCallChat');
  if(declineChat){ declineChat.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); }); }

  // ===== ICON 1: CHAT ICON -> CHAT BACKGROUND =====
  var chatIconBtn = document.getElementById(CHAT_ICON_ID);
  if(chatIconBtn){
    chatIconBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      // Minimize overlay to pill
      overlay.classList.remove('show');
      overlay.classList.add('minimized');
      pill.classList.remove('hidden');
      expanded.classList.add('hidden');
      // Different function: go to chat background
      goToChatBackground();
      showNavAfterCall();
    });
    console.log('KONNEKT: Chat icon attached to #' + CHAT_ICON_ID);
  }else{
    console.log('KONNEKT ERROR: Chat icon #' + CHAT_ICON_ID + ' not found - check your HTML ID');
  }

  // ===== ICON 2: LIST ICON -> CHAT LOAD LIST =====
  var listIconBtn = document.getElementById(LIST_ICON_ID);
  if(listIconBtn){
    listIconBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      // Minimize overlay to pill
      overlay.classList.remove('show');
      overlay.classList.add('minimized');
      pill.classList.remove('hidden');
      expanded.classList.remove('hidden');
      // Different function: go to chat load list
      goToChatList();
      showNavAfterCall();
    });
    console.log('KONNEKT: List icon attached to #' + LIST_ICON_ID);
  }else{
    console.log('KONNEKT ERROR: List icon #' + LIST_ICON_ID + ' not found - check your HTML ID');
  }

  // ===== PILL LOGIC =====
  pill.addEventListener('click', function(e){
    e.stopPropagation();
    if(expanded.classList.contains('hidden')){
      expanded.classList.remove('hidden');
    }else{
      expanded.classList.add('hidden');
    }
  });

  // Tap expanded to go full
  function attachBack(el){
    if(!el) return;
    el.addEventListener('click', function(e){ e.stopPropagation(); backToFullCall(); });
  }
  attachBack(document.getElementById('expandBackToCall'));
  attachBack(document.querySelector('.konnekt-expanded-left'));
  attachBack(document.getElementById('expandedTime'));
  attachBack(document.getElementById('expandedName'));

  // Click outside expanded -> minimize to pill
  document.addEventListener('click', function(e){
    if(overlay.classList.contains('show')) return;
    if(expanded.classList.contains('hidden')) return;
    if(callState!=='connected' && callState!=='outgoing') return;
    if(expanded.contains(e.target) || pill.contains(e.target)) return;
    expanded.classList.add('hidden');
    pill.classList.remove('hidden');
  });

  // End buttons
  var endBtn = document.getElementById('callEndBtn');
  if(endBtn){ endBtn.addEventListener('click', endCall); }
  var pillEnd = document.getElementById('pillEndBtn');
  if(pillEnd){ pillEnd.addEventListener('click', function(e){ e.stopPropagation(); endCall(); }); }
  var expEnd = document.getElementById('expandedEndBtn');
  if(expEnd){ expEnd.addEventListener('click', function(e){ e.stopPropagation(); endCall(); }); }

  // Mute / Speaker wiggle
  function wiggle(btn,isMute){
    if(!btn) return;
    btn.classList.remove('wiggle');
    void btn.offsetWidth;
    btn.classList.add('wiggle');
    if(isMute){
      if(btn.classList.contains('mute-active')){ btn.classList.remove('mute-active'); }
      else{ btn.classList.add('mute-active'); }
      btn.classList.remove('active');
    }else{
      if(btn.classList.contains('active')){ btn.classList.remove('active'); }
      else{ btn.classList.add('active'); }
      btn.classList.remove('mute-active');
    }
    setTimeout(function(){ btn.classList.remove('wiggle'); },500);
  }
  var muteBtn = document.getElementById('callMuteBtn'); if(muteBtn){ muteBtn.addEventListener('click', function(){ wiggle(this,true); }); }
  var speakerBtn = document.getElementById('callSpeakerBtn'); if(speakerBtn){ speakerBtn.addEventListener('click', function(){ wiggle(this,false); }); }
  var videoBtn = document.getElementById('callVideoBtn'); if(videoBtn){ videoBtn.addEventListener('click', function(){ wiggle(this,false); }); }
  var pillMute = document.getElementById('pillMuteBtn'); if(pillMute){ pillMute.addEventListener('click', function(e){ e.stopPropagation(); wiggle(this,true); }); }
  var pillSpeaker = document.getElementById('pillSpeakerBtn'); if(pillSpeaker){ pillSpeaker.addEventListener('click', function(e){ e.stopPropagation(); wiggle(this,false); }); }
  var expMute = document.getElementById('expandedMuteBtn'); if(expMute){ expMute.addEventListener('click', function(e){ e.stopPropagation(); wiggle(this,true); }); }
  var expSpeaker = document.getElementById('expandedSpeakerBtn'); if(expSpeaker){ expSpeaker.addEventListener('click', function(e){ e.stopPropagation(); wiggle(this,false); }); }

  // ===== PUBLIC API FOR BACKEND DEVS =====
  window.KonnektCall = {
    showIncoming: showIncoming,
    hideIncoming: hideIncoming,
    openOutgoing: openOutgoing,
    onConnected: onConnected,
    end: endCall,
    answer: answerIncoming,
    backToFull: backToFullCall,
    goToList: goToChatList,
    goToChat: goToChatBackground,
    getState: function(){ return callState; }
  };
  window.showKonnektIncoming = showIncoming;

  // ===== AUTO TEST - REMOVE BEFORE PROD =====
  // TODO: Delete this when backend ready
  function startAutoTest(){
    stopAutoTest();
    autoTestTimer = setInterval(function(){
      if(callState==='idle'){
        showIncoming({name:'Joshua dayo'});
        setTimeout(function(){ if(callState==='incoming'){ hideIncoming(); } },3500);
      }
    },4000);
    setTimeout(function(){ if(callState==='idle'){ showIncoming({name:'Joshua dayo'}); } },600);
  }
  function stopAutoTest(){ clearInterval(autoTestTimer); autoTestTimer=null; }
  startAutoTest();

  console.log('KONNEKT V14 READY - ICONS DIFFERENT');
});