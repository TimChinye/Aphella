function hideLoadingOverlay() {
  let loadingOverlay = document.getElementById('loadingOverlay');
  let dots = loadingOverlay.firstElementChild;
  [dots, ...dots.children].forEach((dot) => {
    dot.addEventListener('animationiteration', (e) => {
      e.target.classList.add('stop-animation');
  
      let delay = 0.5;
  
      loadingOverlay.style.transition = `opacity ${delay}s ease-out`;
      setTimeout(() => loadingOverlay.style.opacity = '0', delay * 1000);
      setTimeout(() => loadingOverlay.hidden = true, 2 * delay * 1000);
    });
  });
}