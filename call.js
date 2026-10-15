document.addEventListener('DOMContentLoaded', function(){
  // ELEMENTS
  var overlay = document.getElementById('callOverlay');
  var startBtn = document.getElementById('startOutgoingCallBtn');
  var statusEl = document.getElementById('callStatus');
  var pill = document.getElementById('dynamicPill');
  var expanded = document.getElementById('expandedPill');
  var incomingList = document.getElementById('incomingTileList');
  var incomingChat = document.getElementById('incomingTileChat');
  var ringtone = document.getElementById('ringtoneAudio');
  var chatBackground = document.getElementById('chatBackground');
  var chatList = document.getElementById('chatLoadList');

  if(!overlay){ console.error('callOverlay missing'); return; }

  // STATE
  var callState = 'idle'; // idle | incoming | outgoing | connected
  var sec = 0;
  var timer = null;
  var ringingTimer = null;

  function setCaller(name){
    var src = 'https://i.pravatar.cc/300?img=12';
    ['callName','pillName','expandedName','incomingNameList','incomingNameChat'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.textContent = name;
    });
    ['callBigAva','pillAva','expandedAva','incomingAvaList','incomingAvaChat'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.src = src;
    });
    if(window.lucide) lucide.createIcons();
  }

  function startTimer(){
    clearInterval(timer);
    sec = 0;
    if(statusEl) statusEl.textContent = '00:00';
    timer = setInterval(function(){
      sec++;
      var m = Math.floor(sec/60), s = sec%60;
      var t = (m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
      if(statusEl) statusEl.textContent = t;
      var pt = document.getElementById('pillTime'); if(pt) pt.textContent = t;
      var et = document.getElementById('expandedTime'); if(et) et.textContent = t+' • tap to expand';
    },1000);
  }

  function stopTimer(){
    clearInterval(timer);
    timer = null;
    sec = 0;
  }

  // ===== OUTGOING =====
  function openOutgoing(){
    var n = document.querySelector('#chatBackground .chat-name');
    var name = n ? n.textContent.trim() : 'Joshua dayo';
    setCaller(name);
    callState = 'outgoing';
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    if(pill) pill.classList.add('hidden');
    if(expanded) expanded.classList.add('hidden');
    if(statusEl) statusEl.textContent = 'calling...';
    
    // FAKE CONNECT AFTER 2.5s - later backend go call onConnected()
    clearTimeout(ringingTimer);
    ringingTimer = setTimeout(function(){
      if(callState !== 'outgoing') return;
      onConnected();
    }, 2500);
  }

  function onConnected(){
    callState = 'connected';
    startTimer();
    if(window.lucide) lucide.createIcons();
  }

  // FIX FOR PHONE ICON INSIDE CHAT BACKGROUND
  // Use capture + pointer-events fix
  if(startBtn){
    startBtn.style.pointerEvents = 'auto';
    // remove old listeners
    var newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    startBtn = newBtn;
    
    startBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openOutgoing();
    }, true);

    startBtn.addEventListener('touchstart', function(e){
      e.stopPropagation();
    }, {passive:true});
  }

  // ===== INCOMING =====
  function showIncoming(data){
    var name = (data && data.name) ? data.name : 'Joshua dayo';
    setCaller(name);
    callState = 'incoming';
    if(incomingList) incomingList.classList.add('show');
    if(incomingChat) incomingChat.classList.add('show');
    try{ if(ringtone){ ringtone.currentTime=0; ringtone.play(); } }catch(err){}
    if(window.lucide) lucide.createIcons();
  }

  function hideIncoming(){
    if(incomingList) incomingList.classList.remove('show');
    if(incomingChat) incomingChat.classList.remove('show');
    try{ if(ringtone){ ringtone.pause(); ringtone.currentTime=0; } }catch(err){}
    if(callState === 'incoming') callState = 'idle';
  }

  // EXPOSE FOR BACKEND PYTHON LATER
  window.KonnektCall = {
    showIncoming: showIncoming,
    hideIncoming: hideIncoming,
    onConnected: onConnected,
    end: function(){ endCall(); }
  };
  window.showKonnektIncoming = showIncoming; // for quick test

  // Answer / Decline
  document.getElementById('acceptCallList')?.addEventListener('click', function(e){
    e.stopPropagation(); hideIncoming(); overlay.classList.add('show'); onConnected();
  });
  document.getElementById('acceptCallChat')?.addEventListener('click', function(e){
    e.stopPropagation(); hideIncoming(); overlay.classList.add('show'); onConnected();
  });
  document.getElementById('declineCallList')?.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); });
  document.getElementById('declineCallChat')?.addEventListener('click', function(e){ e.stopPropagation(); hideIncoming(); });

  // ===== MINIMIZE =====
  document.getElementById('callGoChat')?.addEventListener('click', function(){
    overlay.classList.remove('show');
    overlay.classList.add('minimized');
    if(pill) pill.classList.remove('hidden');
    if(expanded) expanded.classList.add('hidden');
    if(chatBackground) chatBackground.classList.add('mobile-show');
  });

  document.getElementById('callGoList')?.addEventListener('click', function(){
    overlay.classList.remove('show');
    overlay.classList.add('minimized');
    if(pill) pill.classList.remove('hidden');
    if(expanded) expanded.classList.remove('hidden');
    // go to list view on mobile
    if(window.innerWidth <= 768){
      if(chatBackground) chatBackground.classList.remove('mobile-show');
      if(chatList) chatList.classList.remove('mobile-hide');
    }
  });

  // ===== PILL LOGIC AS YOU ASK =====
  // Tap pill -> expand
  // Tap pill again OR tap anywhere screen -> close back to pill
  // Tap expanded left side -> full call
  if(pill){
    pill.addEventListener('click', function(e){
      e.stopPropagation();
      if(expanded.classList.contains('hidden')){
        expanded.classList.remove('hidden');
      }else{
        expanded.classList.add('hidden');
      }
    });
  }

  document.getElementById('expandBackToCall')?.addEventListener('click', function(e){
    e.stopPropagation();
    overlay.classList.add('show');
    overlay.classList.remove('minimized');
    if(pill) pill.classList.add('hidden');
    if(expanded) expanded.classList.add('hidden');
  });

  // Tap anywhere on screen -> close expanded back to small pill
  document.addEventListener('click', function(e){
    if(!expanded || expanded.classList.contains('hidden')) return;
    if(expanded.contains(e.target)) return;
    if(pill && pill.contains(e.target)) return;
    if(overlay.contains(e.target)) return;
    // close expanded -> show small pill
    expanded.classList.add('hidden');
    if(pill && !overlay.classList.contains('show')){
      pill.classList.remove('hidden');
    }
  });

  // ===== END CALL =====
  function endCall(){
    clearTimeout(ringingTimer);
    stopTimer();
    callState = 'idle';
    overlay.classList.remove('show','minimized');
    if(pill) pill.classList.add('hidden');
    if(expanded) expanded.classList.add('hidden');
    hideIncoming();
    // reset buttons
    document.querySelectorAll('.konnekt-glass-btn, .konnekt-exp-btn').forEach(function(b){
      b.classList.remove('active','mute-active');
    });
  }

  document.getElementById('callEndBtn')?.addEventListener('click', endCall);
  document.getElementById('pillEndBtn')?.addEventListener('click', function(e){ e.stopPropagation(); endCall(); });

  // ===== WIGGLE + RED ACTIVE =====
  function wiggle(btn, isMute){
    if(!btn) return;
    btn.classList.remove('wiggle');
    void btn.offsetWidth;
    btn.classList.add('wiggle');
    if(isMute){
      btn.classList.toggle('mute-active'); // RED for mute only
    }else{
      // speaker active white? but we use red too as you said: red when active, white when off
      btn.classList.toggle('active');
    }
    if(window.lucide) setTimeout(function(){ lucide.createIcons(); }, 80);
    setTimeout(function(){ btn.classList.remove('wiggle'); }, 500);
  }

  document.getElementById('callMuteBtn')?.addEventListener('click', function(){
    wiggle(this, true);
    var pm = document.getElementById('pillMuteBtn'); if(pm) pm.classList.toggle('mute-active');
  });

  document.getElementById('callSpeakerBtn')?.addEventListener('click', function(){
    wiggle(this, false);
    var ps = document.getElementById('pillSpeakerBtn'); if(ps) ps.classList.toggle('active');
  });

  document.getElementById('callVideoBtn')?.addEventListener('click', function(){ wiggle(this, false); });

  document.getElementById('pillMuteBtn')?.addEventListener('click', function(e){
    e.stopPropagation(); wiggle(this, true);
    var cm = document.getElementById('callMuteBtn'); if(cm) cm.classList.toggle('mute-active');
  });

  document.getElementById('pillSpeakerBtn')?.addEventListener('click', function(e){
    e.stopPropagation(); wiggle(this, false);
    var cs = document.getElementById('callSpeakerBtn'); if(cs) cs.classList.toggle('active');
  });

  console.log('CALL.JS FULL READY - iPhone17');
});