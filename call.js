document.addEventListener('DOMContentLoaded', function(){
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

  if(!overlay) return;

  var callState = 'idle', sec=0, timer=null, ringingTimer=null;

  function isMobile(){ return window.innerWidth <= 768; }

  function setCaller(name){
    var src='https://i.pravatar.cc/300?img=12';
    ['callName','pillName','expandedName','incomingNameList','incomingNameChat'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.textContent=name||'Joshua dayo';
    });
    ['callBigAva','pillAva','expandedAva','incomingAvaList','incomingAvaChat'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.src=src;
    });
    if(window.lucide) lucide.createIcons();
  }

  function startTimer(){
    clearInterval(timer); sec=0;
    timer=setInterval(function(){
      sec++; var m=Math.floor(sec/60), s=sec%60;
      var t=(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
      if(statusEl) statusEl.textContent=t;
      var pt=document.getElementById('pillTime'); if(pt) pt.textContent=t;
      var et=document.getElementById('expandedTime'); if(et) et.textContent=t+' • tap';
    },1000);
  }
  function stopTimer(){ clearInterval(timer); timer=null; sec=0; }

  // ===== NAV - MOBILE ONLY =====
  function hideNavMobile(){
    if(!isMobile()) return;
    document.body.classList.add('call-minimized-chat');
    document.body.classList.remove('call-minimized-list','call-active');
  }
  function showNavMobile(){
    if(!isMobile()) return;
    document.body.classList.remove('call-minimized-chat','call-active');
    document.body.classList.add('call-minimized-list');
  }
  function hideNavForFullCall(){
    if(!isMobile()) return;
    document.body.classList.add('call-active');
    document.body.classList.remove('call-minimized-chat','call-minimized-list');
  }
  function restoreNav(){
    document.body.classList.remove('call-active','call-minimized-chat','call-minimized-list');
  }

  function openOutgoing(){
    setCaller(document.querySelector('#chatBackground .chat-name')?.textContent.trim()||'Joshua dayo');
    callState='outgoing';
    overlay.classList.add('show'); overlay.classList.remove('minimized');
    if(pill) pill.classList.add('hidden');
    if(expanded) expanded.classList.add('hidden');
    if(statusEl) statusEl.textContent='calling...';
    hideNavForFullCall();
    clearTimeout(ringingTimer);
    ringingTimer=setTimeout(function(){ if(callState==='outgoing') onConnected(); },2500);
  }
  function onConnected(){ callState='connected'; startTimer(); if(window.lucide) lucide.createIcons(); }

  if(startBtn){
    var nb=startBtn.cloneNode(true); startBtn.parentNode.replaceChild(nb,startBtn); startBtn=nb;
    startBtn.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); openOutgoing(); },true);
  }

  // FORCE SHOW INCOMING
  function showIncoming(data){
    setCaller(data&&data.name?data.name:'Joshua dayo');
    callState='incoming';
    [incomingList,incomingChat].forEach(function(el){
      if(!el) return;
      el.classList.add('show');
      el.style.setProperty('display','flex','important');
    });
    try{ if(ringtone){ ringtone.currentTime=0; ringtone.play(); } }catch(e){}
    if(window.lucide) lucide.createIcons();
  }
  function hideIncoming(){
    [incomingList,incomingChat].forEach(function(el){
      if(!el) return;
      el.classList.remove('show');
      el.style.setProperty('display','none','important');
    });
    try{ if(ringtone){ ringtone.pause(); ringtone.currentTime=0; } }catch(e){}
    if(callState==='incoming') callState='idle';
  }

  window.KonnektCall={showIncoming:showIncoming,hideIncoming:hideIncoming,onConnected:onConnected,end:function(){ endCall(); }};
  window.showKonnektIncoming=showIncoming;

  document.getElementById('acceptCallList')?.addEventListener('click',function(e){ e.stopPropagation(); hideIncoming(); overlay.classList.add('show'); hideNavForFullCall(); onConnected(); });
  document.getElementById('acceptCallChat')?.addEventListener('click',function(e){ e.stopPropagation(); hideIncoming(); overlay.classList.add('show'); hideNavForFullCall(); onConnected(); });
  document.getElementById('declineCallList')?.addEventListener('click',function(e){ e.stopPropagation(); hideIncoming(); });
  document.getElementById('declineCallChat')?.addEventListener('click',function(e){ e.stopPropagation(); hideIncoming(); });

  // ===== MINIMIZE - MOBILE NAV LOGIC ONLY =====
  document.getElementById('callGoChat')?.addEventListener('click',function(){
    overlay.classList.remove('show'); overlay.classList.add('minimized');
    if(pill) pill.classList.remove('hidden');
    if(expanded) expanded.classList.add('hidden');
    if(chatBackground) chatBackground.classList.add('mobile-show');
    if(chatList) chatList.classList.add('mobile-hide');
    hideNavMobile(); // mobile only hide
  });

  document.getElementById('callGoList')?.addEventListener('click',function(){
    overlay.classList.remove('show'); overlay.classList.add('minimized');
    if(pill) pill.classList.remove('hidden'); if(expanded) expanded.classList.remove('hidden');
    if(isMobile()){
      if(chatBackground) chatBackground.classList.remove('mobile-show');
      if(chatList) chatList.classList.remove('mobile-hide');
    }
    showNavMobile(); // mobile only show
  });

  if(pill){
    pill.addEventListener('click',function(e){ e.stopPropagation(); expanded.classList.contains('hidden')?expanded.classList.remove('hidden'):expanded.classList.add('hidden'); });
  }
  document.getElementById('expandBackToCall')?.addEventListener('click',function(e){
    e.stopPropagation(); overlay.classList.add('show'); overlay.classList.remove('minimized');
    if(pill) pill.classList.add('hidden'); if(expanded) expanded.classList.add('hidden'); hideNavForFullCall();
  });
  document.addEventListener('click',function(e){
    if(!expanded||expanded.classList.contains('hidden')) return;
    if(expanded.contains(e.target)||(pill&&pill.contains(e.target))||overlay.contains(e.target)) return;
    expanded.classList.add('hidden');
  });

  function endCall(){
    clearTimeout(ringingTimer); stopTimer(); callState='idle';
    overlay.classList.remove('show','minimized');
    if(pill) pill.classList.add('hidden'); if(expanded) expanded.classList.add('hidden');
    hideIncoming(); restoreNav();
    document.querySelectorAll('.konnekt-glass-btn, .konnekt-exp-btn').forEach(function(b){ b.classList.remove('active','mute-active'); });
    if(window.lucide) lucide.createIcons();
  }
  document.getElementById('callEndBtn')?.addEventListener('click',endCall);
  document.getElementById('pillEndBtn')?.addEventListener('click',function(e){ e.stopPropagation(); endCall(); });

  function wiggle(btn,isMute){
    if(!btn) return; btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle');
    if(isMute){ btn.classList.toggle('mute-active'); btn.classList.remove('active'); }else{ btn.classList.toggle('active'); btn.classList.remove('mute-active'); }
    if(window.lucide) setTimeout(function(){ lucide.createIcons(); },80);
    setTimeout(function(){ btn.classList.remove('wiggle'); },500);
  }
  document.getElementById('callMuteBtn')?.addEventListener('click',function(){ wiggle(this,true); var pm=document.getElementById('pillMuteBtn'); if(pm){ pm.classList.toggle('mute-active'); pm.classList.remove('active'); } });
  document.getElementById('callSpeakerBtn')?.addEventListener('click',function(){ wiggle(this,false); var ps=document.getElementById('pillSpeakerBtn'); if(ps){ ps.classList.toggle('active'); ps.classList.remove('mute-active'); } });
  document.getElementById('callVideoBtn')?.addEventListener('click',function(){ wiggle(this,false); });
  document.getElementById('pillMuteBtn')?.addEventListener('click',function(e){ e.stopPropagation(); wiggle(this,true); var cm=document.getElementById('callMuteBtn'); if(cm){ cm.classList.toggle('mute-active'); cm.classList.remove('active'); } });
  document.getElementById('pillSpeakerBtn')?.addEventListener('click',function(e){ e.stopPropagation(); wiggle(this,false); var cs=document.getElementById('callSpeakerBtn'); if(cs){ cs.classList.toggle('active'); cs.classList.remove('mute-active'); } });

  console.log('CALL.JS CLEAN - DESKTOP NO HIDE, MOBILE FIXED');
});