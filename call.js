document.addEventListener('DOMContentLoaded', function(){
  // ===== DOM =====
  var overlay = document.getElementById('callOverlay');
  var pill = document.getElementById('dynamicPill');
  var expanded = document.getElementById('expandedPill');
  var incomingList = document.getElementById('incomingTileList');
  var incomingChat = document.getElementById('incomingTileChat');
  var chatLoadList = document.getElementById('chatLoadList');
  var chatBackground = document.getElementById('chatBackground');
  var sidebarSection = document.querySelector('.sidebar-section');
  var statusEl = document.getElementById('callStatus');
  var startBtn = document.getElementById('startOutgoingCallBtn');
  var ringtone = document.getElementById('ringtoneAudio');

  if(!overlay ||!pill ||!expanded){
    console.log('KONNEKT: Missing core elements');
    return;
  }

  var callState = 'idle'; // idle, outgoing, incoming, connected
  var sec = 0;
  var timer = null;
  var ringingTimer = null;
  var autoTestTimer = null;

  // ===== SET CALLER INFO =====
  // BACKEND NOTE: Call this when you get caller data
  function setCaller(name){
    var n = name || 'Joshua dayo';
    var src = 'https://i.pravatar.cc/300?img=12';
    var names = ['callName','pillName','expandedName','incomingNameList','incomingNameChat'];
    var avas = ['callBigAva','pillAva','expandedAva','incomingAvaList','incomingAvaChat'];
    for(var i=0;i<names.length;i++){
      var el = document.getElementById(names[i]);
      if(el) el.textContent = n;
    }
    for(var j=0;j<avas.length;j++){
      var av = document.getElementById(avas[j]);
      if(av) av.src = src;
    }
    if(window.lucide) lucide.createIcons();
  }

  // ===== TIMER =====
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
      setT((m<10?'0'+m:m)+':'+(s<10?'0'+s:s));
    },1000);
  }

  function stopTimer(){
    clearInterval(timer);
    timer = null;
  }

  // ===== NAV CONTROL =====
  // BACKEND NOTE: Hide nav when full call shows
  function hideNavForCall(){
    document.body.classList.add('konnekt-in-call');
    var navs = document.querySelectorAll('#bottomNav,.bottom-nav,.mobile-bottom-nav,nav');
    for(var i=0;i<navs.length;i++){
      navs[i].style.display = 'none';
    }
    if(sidebarSection && window.innerWidth<=768){
      sidebarSection.style.display = 'none';
    }
    overlay.style.zIndex = '99999';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
  }

  function showNavAfterCall(){
    document.body.classList.remove('konnekt-in-call');
    var navs = document.querySelectorAll('#bottomNav,.bottom-nav,.mobile-bottom-nav,nav');
    for(var i=0;i<navs.length;i++){
      navs[i].style.display = '';
    }
    if(sidebarSection){
      sidebarSection.style.display = '';
    }
  }

  // ===== CHECK WHERE USER DEY =====
  function isInChatBackground(){
    if(!chatBackground) return false;
    if(chatBackground.classList.contains('mobile-hidden')) return false;
    if(chatBackground.classList.contains('hidden')) return false;
    if(chatBackground.style.display === 'none') return false;
    return true;
  }

  function isInChatLoadList(){
    if(!chatLoadList) return false;
    if(chatLoadList.classList.contains('mobile-hidden')) return false;
    if(chatLoadList.classList.contains('hidden')) return false;
    if(chatLoadList.style.display === 'none') return false;
    return true;
  }

  // ===== GO TO CHAT BACKGROUND =====
  function goToChatBackground(){
    console.log('KONNEKT: Go to chatBackground');
    if(chatBackground){
      chatBackground.classList.remove('mobile-hidden');
      chatBackground.classList.remove('hidden');
      chatBackground.style.display = 'flex';
      chatBackground.style.visibility = 'visible';
    }
    if(chatLoadList && window.innerWidth<=768){
      chatLoadList.classList.add('mobile-hidden');
    }
  }

  // ===== GO TO CHAT LOAD LIST =====
  function goToChatLoadList(){
    console.log('KONNEKT: Go to chatLoadList');
    if(chatLoadList){
      chatLoadList.classList.remove('mobile-hidden');
      chatLoadList.classList.remove('hidden');
      chatLoadList.style.display = 'flex';
      chatLoadList.style.visibility = 'visible';
    }
    if(chatBackground && window.innerWidth<=768){
      chatBackground.classList.add('mobile-hidden');
    }
  }

  // ===== TOGGLE LOGIC - YOUR REQUEST =====
  // If m in chat background and m in calling state it shud go back to chat load list
  // If m in chat load list and min calling state it shud go back to chat background
  function toggleFromCallingState(){
    if(isInChatBackground()){
      console.log('KONNEKT TOGGLE: Was in background -> Go list');
      goToChatLoadList();
    }else if(isInChatLoadList()){
      console.log('KONNEKT TOGGLE: Was in list -> Go background');
      goToChatBackground();
    }else{
      // Default
      if(window.innerWidth<=768){
        goToChatLoadList();
      }else{
        goToChatBackground();
      }
    }
  }

  function backToFullCall(){
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    pill.classList.add('hidden');
    expanded.classList.add('hidden');
  }

  function openOutgoing(n){
    setCaller(n);
    callState = 'outgoing';
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    pill.classList.add('hidden');
    expanded.classList.add('hidden');
    if(statusEl) statusEl.textContent = 'calling...';
    clearTimeout(ringingTimer);
    ringingTimer = setTimeout(function(){
      if(callState==='outgoing') onConnected();
    },2000);
    stopAutoTest();
  }

  function onConnected(){
    callState = 'connected';
    hideNavForCall();
    startTimer();
  }

  function showIncoming(d){
    var name = 'Joshua dayo';
    if(d && d.name) name = d.name;
    setCaller(name);
    callState = 'incoming';
    if(incomingList){
      incomingList.classList.add('show');
      incomingList.style.display = 'flex';
    }
    if(incomingChat){
      incomingChat.classList.add('show');
      incomingChat.style.display = 'flex';
    }
    try{ if(ringtone){ ringtone.currentTime=0; ringtone.play().catch(function(){}); } }catch(e){}
  }

  function hideIncoming(){
    if(incomingList){ incomingList.classList.remove('show'); incomingList.style.display='none'; }
    if(incomingChat){ incomingChat.classList.remove('show'); incomingChat.style.display='none'; }
    try{ if(ringtone){ ringtone.pause(); ringtone.currentTime=0; } }catch(e){}
    if(callState==='incoming') callState='idle';
  }

  function answerIncoming(){
    hideIncoming();
    stopAutoTest();
    hideNavForCall();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    onConnected();
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
  }

  // ===== START CALL BTN =====
  if(startBtn){
    startBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var cn = document.querySelector('.chat-name');
      var n = cn? cn.textContent.trim() : 'Joshua dayo';
      openOutgoing(n);
    }, true);
  }

  // Incoming accept/decline
  var aL = document.getElementById('acceptCallList');
  if(aL) aL.addEventListener('click', function(e){ e.stopPropagation(); answerIncoming(); });
  var aC = document.getElementById('acceptCallChat');
  if(aC) aC.addEventListener('click', function(e){ e.stopPropagation(); answerIncoming(); });
  var dL = document.getElementById('declineCallList');
  if(dL) dL.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); });
  var dC = document.getElementById('declineCallChat');
  if(dC) dC.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); });

  // ===== CALLING STATE ICONS - TOGGLE =====
  var chatIcon = document.getElementById('callGoChat');
  var listIcon = document.getElementById('callGoList');

  // Clean old listeners - clone trick like before
  if(chatIcon){
    var newChat = chatIcon.cloneNode(true);
    chatIcon.parentNode.replaceChild(newChat, chatIcon);
    chatIcon = newChat;
  }
  if(listIcon){
    var newList = listIcon.cloneNode(true);
    listIcon.parentNode.replaceChild(newList, listIcon);
    listIcon = newList;
  }

  if(chatIcon){
    chatIcon.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      overlay.classList.remove('show');
      overlay.classList.add('minimized');
      pill.classList.remove('hidden');
      expanded.classList.add('hidden');
      showNavAfterCall();
      toggleFromCallingState();
    });
  }

  if(listIcon){
    listIcon.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      overlay.classList.remove('show');
      overlay.classList.add('minimized');
      pill.classList.remove('hidden');
      expanded.classList.remove('hidden');
      showNavAfterCall();
      toggleFromCallingState();
    });
  }

  // ===== PILL CLICK =====
  pill.addEventListener('click', function(e){
    e.stopPropagation();
    if(expanded.classList.contains('hidden')){
      expanded.classList.remove('hidden');
    }else{
      expanded.classList.add('hidden');
    }
  });

  // Back to full call
  function attachBack(el){
    if(!el) return;
    el.addEventListener('click', function(e){
      e.stopPropagation();
      backToFullCall();
    });
  }
  attachBack(document.getElementById('expandBackToCall'));
  attachBack(document.querySelector('.konnekt-expanded-left'));
  attachBack(document.getElementById('expandedTime'));
  attachBack(document.getElementById('expandedName'));

  // Click outside expanded -> minimize to pill
  document.addEventListener('click', function(e){
    if(overlay.classList.contains('show')) return;
    if(expanded.classList.contains('hidden')) return;
    if(expanded.contains(e.target) || pill.contains(e.target)) return;
    expanded.classList.add('hidden');
  });

  // ===== EXPANDED PILL MUTE/SPEAKER WITH OVERLAY - FIXED =====
  // BACKEND NOTE: This is where overlay for expanded pill mute/speaker dey
  var expMute = document.getElementById('expandedMuteBtn');
  var expSpeaker = document.getElementById('expandedSpeakerBtn');
  var expEnd = document.getElementById('expandedEndBtn');
  var pillMute = document.getElementById('pillMuteBtn');
  var pillSpeaker = document.getElementById('pillSpeakerBtn');
  var muteBtn = document.getElementById('callMuteBtn');
  var speakerBtn = document.getElementById('callSpeakerBtn');
  var videoBtn = document.getElementById('callVideoBtn');
  var pillEnd = document.getElementById('pillEndBtn');
  var endBtn = document.getElementById('callEndBtn');

  // Wiggle + overlay function for expanded
  function wiggleExp(btn, isMute){
    if(!btn) return;
    // Wiggle animation
    btn.classList.remove('wiggle');
    void btn.offsetWidth;
    btn.classList.add('wiggle');

    if(isMute){
      // Mute - red overlay
      if(btn.classList.contains('mute-active')){
        btn.classList.remove('mute-active');
        console.log('KONNEKT EXPANDED: Mute OFF - overlay removed');
      }else{
        btn.classList.add('mute-active');
        btn.classList.remove('active');
        console.log('KONNEKT EXPANDED: Mute ON - red overlay');
      }
    }else{
      // Speaker - white glass overlay
      if(btn.classList.contains('active')){
        btn.classList.remove('active');
        console.log('KONNEKT EXPANDED: Speaker OFF - overlay removed');
      }else{
        btn.classList.add('active');
        btn.classList.remove('mute-active');
        console.log('KONNEKT EXPANDED: Speaker ON - white glass overlay');
      }
    }

    setTimeout(function(){ btn.classList.remove('wiggle'); },500);

    // BACKEND: Emit events here
    // socket.emit('call:toggle', {type: isMute?'mute':'speaker', value: btn.classList.contains(isMute?'mute-active':'active')})
  }

  // Expanded pill buttons
  if(expMute){
    expMute.addEventListener('click', function(e){
      e.stopPropagation();
      wiggleExp(this, true);
    });
  }
  if(expSpeaker){
    expSpeaker.addEventListener('click', function(e){
      e.stopPropagation();
      wiggleExp(this, false);
    });
  }
  if(expEnd){
    expEnd.addEventListener('click', function(e){
      e.stopPropagation();
      endCall();
    });
  }

  // Pill buttons
  if(pillMute){
    pillMute.addEventListener('click', function(e){
      e.stopPropagation();
      wiggleExp(this, true);
    });
  }
  if(pillSpeaker){
    pillSpeaker.addEventListener('click', function(e){
      e.stopPropagation();
      wiggleExp(this, false);
    });
  }
  if(pillEnd){
    pillEnd.addEventListener('click', function(e){
      e.stopPropagation();
      endCall();
    });
  }

  // Full overlay buttons
  if(muteBtn){ muteBtn.addEventListener('click', function(){ wiggleExp(this,true); }); }
  if(speakerBtn){ speakerBtn.addEventListener('click', function(){ wiggleExp(this,false); }); }
  if(videoBtn){ videoBtn.addEventListener('click', function(){ wiggleExp(this,false); }); }
  if(endBtn){ endBtn.addEventListener('click', endCall); }

  // ===== PUBLIC API =====
  window.KonnektCall = {
    showIncoming: showIncoming,
    hideIncoming: hideIncoming,
    openOutgoing: openOutgoing,
    onConnected: onConnected,
    end: endCall,
    answer: answerIncoming,
    backToFull: backToFullCall,
    goToList: goToChatLoadList,
    goToChat: goToChatBackground,
    toggle: toggleFromCallingState,
    getState: function(){ return callState; }
  };
  window.showKonnektIncoming = showIncoming;

  // ===== AUTO TEST - REMOVE BEFORE PROD =====
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

  console.log('KONNEKT V17 READY - EXPANDED OVERLAY + TOGGLE');
});