let showingLoadingOverlays = [];

function updateLoadingStatus({ target: loadingOverlay, animationName }) {
  if (loadingOverlay.parentElement.id != 'loadingOverlay') return;
  else loadingOverlay = loadingOverlay.parentElement;

  if (loadingOverlay.classList.contains('stop-animating') && animationName == 'rotate') {

    loadingOverlay.removeAttribute('class');
    loadingOverlay.classList.add('stop-animation');

    setTimeout(() => {
      loadingOverlay.firstElementChild.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 500);
    }, 500);
  };
}

function hideLoadingOverlay(loadingOverlay, force) {
  if (!loadingOverlay) loadingOverlay = document.querySelector('main #loadingOverlay');

  if (loadingOverlay.classList.contains('animating')) {
    if (force) {
      loadingOverlay.removeAttribute('class');
      loadingOverlay.classList.add('stop-animation');
      loadingOverlay.firstElementChild.style.opacity = '0';
      loadingOverlay.style.opacity = '0';
      loadingOverlay.style.display = 'none';
    } else {
      loadingOverlay.removeAttribute('class');
      loadingOverlay.classList.add('stop-animating');
    }
  }
}

function showLoadingOverlay(loadingOverlay, relativeHeight, backgroundColor) {
  if (!loadingOverlay) loadingOverlay = document.querySelector('main #loadingOverlay');
  
  if (!loadingOverlay.classList.contains('animating')) {
    if (relativeHeight) loadingOverlay.style.height = '100%';
    if (backgroundColor) loadingOverlay.style.backgroundColor = backgroundColor;

    Object.assign(loadingOverlay.style, {
      opacity: '1',
      transition: 'opacity 0.5s ease-in',
      display: 'unset',
      zIndex: '1'
    });
    
    loadingOverlay.firstElementChild.style.opacity = '1';

    loadingOverlay.removeAttribute('class');
    loadingOverlay.classList.add('animating');
  }
}