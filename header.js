function toggleMood(){
  document.getElementById('moodFloat').classList.toggle('open');
}
function setSong(title, artist){
  document.querySelector('.mood-card-title').textContent = title;
  document.querySelector('.mood-card-artist').textContent = artist;
}