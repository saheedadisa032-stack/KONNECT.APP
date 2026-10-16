// ===== KONNEKT VIDEO WAITLIST - JS V4 CLEAN =====
// Handles bottom sheet open/close, input typing, leaf loader, thumb success
// Uses localStorage to remember if user already joined
// Call KonnektWaitlist.clearCache() to reset for testing

(function(){
  // --- DOM ELEMENTS ---
  var overlay = document.getElementById('videoWaitlistOverlay'); // Full dark background
  var sheet = document.getElementById('videoWaitlistSheet'); // The bottom popup
  var closeBtn = document.getElementById('waitlistCloseBtn'); // X close button
  var joinBtn = document.getElementById('waitlistJoinBtn'); // Join waitlist button
  var reasonInput = document.getElementById('waitlistReason'); // Textarea input
  var charCount = document.getElementById('waitlistCharCount'); // Char counter 0/200
  var btnText = overlay? overlay.querySelector('.konnekt-waitlist-btn-text') : null; // Button text span
  var loader = overlay? overlay.querySelector('.konnekt-waitlist-loader') : null; // Leaf cut loader wrapper
  var thumbCheck = overlay? overlay.querySelector('.konnekt-waitlist-check') : null; // Thumb up icon wrapper after load
  var successBox = document.getElementById('waitlistSuccess'); // Success box below button
  var footer = overlay? overlay.querySelector('.konnekt-waitlist-footer') : null; // Small footer text

  // Exit if HTML missing
  if(!overlay ||!sheet ||!closeBtn ||!joinBtn){
    console.log('WAITLIST: Required HTML not found');
    return;
  }

  // --- STATE ---
  var isOpen = false; // Is sheet currently open?
  var hasJoined = false; // Has user joined before?

  // Check localStorage if user don join before
  function getJoined(){
    try{
      return localStorage.getItem('konnekt_video_waitlist_joined') === '1';
    }catch(e){
      return false;
    }
  }
  hasJoined = getJoined();

  // Refresh Lucide icons (needed after show/hide)
  function refreshIcons(){
    if(window.lucide){
      try{ lucide.createIcons(); }catch(e){}
    }
  }

  // --- OPEN SHEET WITH BOUNCE ---
  function openWaitlist(){
    if(isOpen) return; // Prevent double open
    isOpen = true;
    hasJoined = getJoined(); // Re-check on open

    // Show overlay
    overlay.style.display = 'flex';
    // Small delay so animation can trigger
    requestAnimationFrame(function(){
      overlay.classList.add('show');
    });

    // Lock body scroll like iPhone sheet
    document.body.style.overflow = 'hidden';
    refreshIcons();

    // If already joined -> lock input, if not -> allow typing
    if(hasJoined){
      lockJoinedState(); // Input disabled, show "You're on the list"
    }else{
      unlockForTyping(); // Input enabled, user can type
    }
  }

  // --- CLOSE SHEET ---
  function closeWaitlist(){
    if(!isOpen) return;
    isOpen = false;

    // Animate sheet down
    sheet.style.animation = 'none';
    sheet.style.transform = 'translateY(0)';
    requestAnimationFrame(function(){
      sheet.style.transition = 'transform.4s cubic-bezier(.32,.72,0,1)';
      sheet.style.transform = 'translateY(110%)';
      overlay.style.opacity = '0';
    });

    // Hide after animation
    setTimeout(function(){
      overlay.classList.remove('show');
      overlay.style.display = 'none';
      overlay.style.opacity = '';
      sheet.style.transition = '';
      sheet.style.animation = '';
      sheet.style.transform = '';
      document.body.style.overflow = ''; // Unlock scroll
    }, 400);
  }

  // --- ALLOW TYPING (BEFORE JOIN) ---
  // User never join before, so textarea should be typable
  function unlockForTyping(){
    if(reasonInput){
      reasonInput.disabled = false; // Enable typing
      reasonInput.readOnly = false;
      reasonInput.style.pointerEvents = 'auto';
      reasonInput.style.userSelect = 'text';
      reasonInput.style.opacity = '1';
      reasonInput.value = ''; // Clear old text
      reasonInput.placeholder = "e.g., For long-distance, business meetings, family check-ins...";
      // Focus after sheet bounce finishes
      setTimeout(function(){ reasonInput.focus(); }, 400);
    }
    if(charCount) charCount.textContent = '0';

    // Reset button to Join Waitlist
    if(joinBtn){
      joinBtn.disabled = false;
      joinBtn.classList.remove('success','loading');
      if(btnText) btnText.textContent = 'Join Waitlist';
      if(btnText) btnText.style.opacity = '1';
    }
    if(loader) loader.classList.add('hidden'); // Hide leaf loader
    if(thumbCheck) thumbCheck.classList.add('hidden'); // Hide thumb icon
    if(successBox) successBox.classList.add('hidden'); // Hide success box
    if(footer) footer.style.display = 'block';
    refreshIcons();
  }

  // --- BLOCK TYPING (AFTER JOIN) ---
  // User already joined, so textarea should NOT be typable again
  function lockJoinedState(){
    var savedReason = '';
    try{
      savedReason = localStorage.getItem('konnekt_video_waitlist_reason') || '';
    }catch(e){}

    if(reasonInput){
      reasonInput.value = savedReason; // Show saved reason
      reasonInput.disabled = true; // Block typing
      reasonInput.readOnly = true;
      reasonInput.style.pointerEvents = 'none';
      reasonInput.style.userSelect = 'none';
      reasonInput.style.opacity = '.5';
    }
    if(charCount) charCount.textContent = String(savedReason.length);

    // Show "You're on the list" + thumb icon
    if(btnText) btnText.textContent = "You're on the list";
    if(loader) loader.classList.add('hidden');
    if(thumbCheck) thumbCheck.classList.remove('hidden'); // Show thumb up
    if(joinBtn){
      joinBtn.classList.add('success');
      joinBtn.classList.remove('loading');
      joinBtn.disabled = true; // Can\'t join again
      if(btnText) btnText.style.opacity = '1';
    }
    if(successBox) successBox.classList.remove('hidden'); // Show success message
    if(footer) footer.style.display = 'none';
    refreshIcons();
  }

  // --- JOIN ACTION WITH LEAF LOADER -> THUMB ---
  function doJoin(){
    // If already joined, just close
    if(getJoined()){
      closeWaitlist();
      return;
    }

    var reason = reasonInput? reasonInput.value.trim() : '';

    // Show leaf cut circle loader (not normal circle)
    joinBtn.classList.add('loading');
    joinBtn.disabled = true;
    if(btnText) btnText.style.opacity = '0'; // Hide text
    if(loader) loader.classList.remove('hidden'); // Show leaf loader
    if(thumbCheck) thumbCheck.classList.add('hidden');
    refreshIcons();

    // Simulate network request 1.6s like iPhone
    setTimeout(function(){
      // Save to localStorage so user can\'t join again on same device
      try{
        localStorage.setItem('konnekt_video_waitlist_joined','1');
        localStorage.setItem('konnekt_video_waitlist_reason',reason);
        localStorage.setItem('konnekt_video_waitlist_date',new Date().toISOString());
      }catch(e){}

      hasJoined = true;

      // Hide leaf loader, show thumb up icon (not emoji)
      if(loader) loader.classList.add('hidden');
      if(thumbCheck) thumbCheck.classList.remove('hidden'); // Thumb up icon = "We got you"
      if(btnText){
        btnText.textContent = "You're In!"; // Button text changes
        btnText.style.opacity = '1';
      }
      joinBtn.classList.remove('loading');
      joinBtn.classList.add('success');
      refreshIcons();

      // Show success box with thumb message
      setTimeout(function(){
        if(successBox) successBox.classList.remove('hidden');
        if(footer) footer.style.display = 'none';
        // Lock textarea after join so user no fit type again
        if(reasonInput){
          reasonInput.disabled = true;
          reasonInput.readOnly = true;
          reasonInput.style.pointerEvents = 'none';
          reasonInput.style.userSelect = 'none';
          reasonInput.style.opacity = '.5';
        }
        // Auto close after 2.2s like big apps
        setTimeout(function(){ closeWaitlist(); }, 2200);
      }, 400);

    }, 1600); // 1.6s loading like iOS
  }

  // --- CHAR COUNTER ---
  if(reasonInput && charCount){
    reasonInput.addEventListener('input', function(){
      if(this.disabled) return; // Don\'t count if disabled
      charCount.textContent = this.value.length;
      // Red if too long
      charCount.style.color = this.value.length > 180? '#ff453a' : '';
    });
    // Fix iPhone typing inside sheet
    reasonInput.addEventListener('touchstart', function(e){ e.stopPropagation(); }, {passive:true});
  }

  // --- VIDEO BUTTON TRIGGERS ---
  // Hook to your existing video call buttons to open waitlist instead of real call
  var videoTriggers = [
    document.getElementById('callVideoBtn'), // Call screen video btn
    document.getElementById('chatVideoBtn'), // Chat header video btn
    document.getElementById('startVideoCallBtn') // Start call btn
  ];
  // Also any button with data-waitlist-video attribute
  var extra = document.querySelectorAll('[data-waitlist-video]');
  for(var i=0;i<extra.length;i++) videoTriggers.push(extra[i]);

  // Attach click to open waitlist
  for(var j=0;j<videoTriggers.length;j++){
    var b = videoTriggers[j];
    if(!b) continue;
    (function(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        openWaitlist();
      });
    })(b);
  }

  // --- CLOSE HANDLERS ---
  closeBtn.addEventListener('click', function(e){ e.stopPropagation(); closeWaitlist(); });
  // Click dark background to close
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closeWaitlist(); });

  // Swipe down to close like iPhone sheet
  var startY=0, currentY=0, isDragging=false;
  sheet.addEventListener('touchstart', function(e){
    if(e.target === reasonInput) return; // Don't drag when typing
    startY = e.touches[0].clientY;
    isDragging = true;
    sheet.style.transition = 'none';
    sheet.style.animation = 'none';
  }, {passive:true});
  sheet.addEventListener('touchmove', function(e){
    if(!isDragging) return;
    currentY = e.touches[0].clientY - startY;
    if(currentY < 0) currentY = 0;
    if(currentY > 0){
      sheet.style.transform = 'translateY('+currentY+'px)';
      overlay.style.opacity = String(1 - (currentY/300));
    }
  }, {passive:true});
  sheet.addEventListener('touchend', function(){
    isDragging=false;
    sheet.style.transition='transform.4s cubic-bezier(.32,.72,0,1)';
    if(currentY > 120){
      closeWaitlist();
      setTimeout(function(){ sheet.style.transition=''; sheet.style.transform=''; overlay.style.opacity=''; }, 400);
    }else{
      sheet.style.transform='translateY(0)';
      overlay.style.opacity='';
      setTimeout(function(){ sheet.style.transition=''; }, 400);
    }
    currentY=0;
  });

  // Join button click
  joinBtn.addEventListener('click', function(e){ e.preventDefault(); doJoin(); });

  // ESC key to close (desktop)
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && isOpen) closeWaitlist(); });

  // --- PUBLIC API FOR OTHER DEVS ---
  window.KonnektWaitlist = {
    open: openWaitlist, // Open sheet: KonnektWaitlist.open()
    close: closeWaitlist, // Close sheet: KonnektWaitlist.close()
    isJoined: function(){ return getJoined(); }, // Check if joined

    // Clear cache so you can test rejoin flow on same device
    // Usage in console: KonnektWaitlist.clearCache()
    clearCache: function(){
      try{
        localStorage.removeItem('konnekt_video_waitlist_joined');
        localStorage.removeItem('konnekt_video_waitlist_reason');
        localStorage.removeItem('konnekt_video_waitlist_date');
        hasJoined = false;
        console.log('WAITLIST CACHE CLEARED - You can rejoin now');
        unlockForTyping(); // Reset to typable state
        return true;
      }catch(e){
        console.log('Clear failed', e);
        return false;
      }
    },

    // Clear and open immediately - for testing
    // Usage: KonnektWaitlist.resetAndOpen()
    resetAndOpen: function(){
      this.clearCache();
      openWaitlist();
    }
  };

  console.log('WAITLIST V4 READY - Thumb up, leaf loader. Use KonnektWaitlist.clearCache() to rejoin');
})();