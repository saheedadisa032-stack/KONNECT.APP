// Put this in general.js - run before anything
(function(){
  var ram = navigator.deviceMemory || 4;
  if(ram < 3 || /Android.*(4|5|6|7|8)\./.test(navigator.userAgent)){
    document.body.classList.add('low-end');
    // Disable all backdrop-filter for low end
    var style = document.createElement('style');
    style.textContent = '*{backdrop-filter:none !important; -webkit-backdrop-filter:none !important;}';
    document.head.appendChild(style);
  }
})();