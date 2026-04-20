window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  document.getElementById('progress').style.width = (window.scrollY / h * 100) + '%';
});
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}
