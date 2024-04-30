if (new URLSearchParams(window.location.search).has('clear')) localStorage.clear();

function updateAppointmentsIcon() {
  // Get the current day of the week
  let today = new Date().toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase();
  let appointmentsItem = document.querySelector('a[href="/appointments"]');
  appointmentsItem?.querySelectorAll('img')?.forEach(img => {
      let src = img.getAttribute('src');
      let updatedSrc = src.replace('thursday', today);
      img.setAttribute('src', updatedSrc);
  });
}

const fetchJson = async (url, options = {}) => {
  // Check if the data is in the cache
  const cachedData = localStorage.getItem(url);
  if (cachedData !== null) {
    // Parse and return the cached data
    return JSON.parse(cachedData);
  }

  // If the data is not in the cache, fetch it
  const response = await fetch(url, options);
  const data = await response.json();

  // Cache the data
  localStorage.setItem(url, JSON.stringify(data));

  // Return the fetched data
  return data;
};

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

  if (force) {
    loadingOverlay.removeAttribute('class');
    loadingOverlay.classList.add('stop-animation');
    loadingOverlay.firstElementChild.style.opacity = '0';
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.display = 'none';
  } else if (loadingOverlay.classList.contains('animating')) {
    loadingOverlay.removeAttribute('class');
    loadingOverlay.classList.add('stop-animating');
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

function getRelativeDate(givenDate) {
  const diffTime = givenDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays === -1) {
    return "Yesterday";
  } else if (diffDays > 1) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}