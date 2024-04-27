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

(async () => {
  showLoadingOverlay();
  const [user, userJob, userAppointments, userPatients, userRequestsReceived] = await Promise.all([
    fetchJson('/grab/user'),
    fetchJson('/grab/user/job'),
    fetchJson('/grab/user/appointments'),
    fetchJson('/grab/user/patients'),
    fetchJson('/grab/user/requests-received')
  ]);
  const staff = [], patients = [];

  /* Fill the basic info */

  document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
  document.getElementById('role').textContent = userJob.title;
  document.getElementById('profile-pic').src = user.profilepicturepath;

  const countAppointmentsToday = userAppointments.filter((appt) => new Date(appt.dateofvisit).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).length;
  const countRegularPatients = userPatients.filter((pat) => pat.maindoctor === user.staffid).length;

  document.querySelector('#patients-today h3').textContent = countAppointmentsToday;
  document.querySelector('#regular-patients-total h3').textContent = countRegularPatients;
  document.querySelector('#incomplete-requests h3').textContent = userRequestsReceived.length;

  /* Last 3 Requests */

  let lastRequestsReceived = await fetchJson('/grab/user/last-requests-received/' + 3);

  let requestRows = Array.from(document.getElementById('latest-patient-info').querySelectorAll('tbody > tr'));

  for (let i = 0; i < requestRows.length; i++) {
    let rRow = requestRows[i];
    rRow.children[0].textContent = lastRequestsReceived[i].requestid;
    rRow.children[1].textContent = new Date(lastRequestsReceived[i].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!staff[lastRequestsReceived[i].fromstaff]) {
      staff[lastRequestsReceived[i].fromstaff] = await fetchJson('/grab/staff/' + lastRequestsReceived[i].fromstaff);
    }
    rRow.children[2].textContent = `${staff[lastRequestsReceived[i].fromstaff].firstname} ${staff[lastRequestsReceived[i].fromstaff].lastname}`;
    rRow.children[3].innerHTML = lastRequestsReceived[i].details.replace(/\\n/g, '<br>');
  }

  /* Appointment Statistics */

  // Set initial date to display
  let currentDate = new Date(getPeriodStart());
  let [formattedAppts, currentAppts] = updateChart(currentDate, userAppointments);
  
  // Update chart to other weeks
  Array.from(document.querySelectorAll('#appts-stats-filter button')).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        currentDate = changePeriod(i, currentDate);
        [formattedAppts, currentAppts] = updateChart(currentDate, userAppointments, formattedAppts);
    });
  });

  // Change the period/frequency
  document.querySelector('#appts-stats-filter select').addEventListener('change', () => {
    currentDate = new Date(getPeriodStart());
    [formattedAppts, currentAppts] = updateChart(currentDate, userAppointments);
  });

  /* Appointment Info (Header Part) */
  
  const calendarDays = document.getElementById('calendar-days');
  const calendarHeader = document.getElementById('calendar-header');
  const appointmentsContainer = document.getElementById('appointments-content');

  // Function to update the calendar days
  function updateCalendarDays(date) {
    let weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    let dayDate = new Date(weekStart);

    for (dayDiv of Array.from(calendarDays.children)) {
      let dayOfMonth = dayDate.getDate();
      dayDiv.querySelector('strong').textContent = dayOfMonth;

      dayDate.setDate(dayDate.getDate() + 1);
    };
  }

  // Function to update the month and year
  function updateMonthYear(date) {
    let tempDate = new Date(date);
    tempDate.setDate(tempDate.getDate() + 3)
    let monthYear = tempDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    calendarHeader.querySelector('h1').textContent = monthYear;
  }

  function selectDate(selectDate) {
    let dayDivs = Array.from(calendarDays.children);
    for (let [i, dayDiv] of dayDivs.entries()) {
      let dayOfMonth = dayDiv.querySelector('strong').textContent;
      let monthAndYear = calendarHeader.querySelector('h1').textContent;
      let thisDate = new Date(`${dayOfMonth} ${monthAndYear}`);

      let thursdayOfMonth = dayDivs[3].querySelector('strong').textContent;
      let thisThursday = new Date(`${thursdayOfMonth} ${monthAndYear}`);

      let dayDifference = thisThursday.getDate() - thisDate.getDate();
      if (Math.abs(dayDifference) > 7) thisDate.setMonth(thisDate.getMonth() + (dayDifference > 0 ? 1 : -1));

      if (dayDiv.classList.contains('selected-day') && selectedDate.getTime() != thisDate.getTime()) {
        dayDiv.classList.remove('selected-day');
      }
      
      if (selectedDate.getTime() == thisDate.getTime()) {
        dayDiv.classList.add('selected-day');
      }
    };
  }

  let today = new Date();
  let selectedDate = new Date(today.setHours(0, 0, 0, 0));

  today.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  // Initial update
  updateCalendarDays(today);
  updateMonthYear(today);
  selectDate(selectedDate);

  // Button click handlers
  Array.from(document.querySelectorAll('#calendar-navigation button')).forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      today.setDate(today.getDate() + (i ? 7 : -7))
      updateCalendarDays(today);
      updateMonthYear(today);
      selectDate(selectedDate);

      // Could also make it so it loads appointments on every week (rather than on click):
      // loadingOverlay.parentElement.scrollTop = 0;
    });
  });

  // Select a day when clicked
  let dayDivs = Array.from(calendarDays.children);
  dayDivs.forEach((dayDiv, i) => {
    dayDiv.addEventListener('click', () => {
      let dayOfMonth = dayDiv.querySelector('strong').textContent;
      let monthAndYear = calendarHeader.querySelector('h1').textContent;
      selectedDate = new Date(`${dayOfMonth} ${monthAndYear}`);

      let thursdayOfMonth = dayDivs[3].querySelector('strong').textContent;
      let thisThursday = new Date(`${thursdayOfMonth} ${monthAndYear}`);

      let dayDifference = thisThursday.getDate() - selectedDate.getDate();
      if (Math.abs(dayDifference) > 7) selectedDate.setMonth(selectedDate.getMonth() + (dayDifference > 0 ? 1 : -1));

      // Remove 'selected-day' class from all dayDivs
      dayDivs.forEach((day) => day.classList.remove('selected-day'));

      // Add 'selected-day' class to the clicked dayDiv
      if (i == (selectedDate.getDay() - 1 + 7) % 7) {
        dayDiv.classList.add('selected-day');

        updateAppointmentsList();
      };
    });
  });

  /* Appointment Info (Appointments Schedulee) */

  // Show full week of appointments, scroll to today's appointments (scroll up and down). When you scroll up, the header changes accordingly to show the top most.

  let loadingOverlay = appointmentsContainer.previousElementSibling;

  let controller = new AbortController();
  async function updateAppointmentsList() {
    if (controller) {
      controller.abort();

      // Couldn't find a solution without using MutatorObserver
      if (loadingOverlay.className != '') await waitForClass(loadingOverlay, 'stop-animation');
    }

    controller = new AbortController();

    const apptsByDay = userAppointments.reduce((acc, appt) => {
      const date = new Date(appt.dateofvisit);
  
      let dateKey = date.setHours(0, 0, 0, 0);
      acc[dateKey] = [...(acc[dateKey] || []), appt];
  
      return acc;
    }, {});

    let tempToday = new Date(today);
    let weekTimestamps = [tempToday.getTime(), ...Array.from({length: 6}, (_, i) => (tempToday.setDate(tempToday.getDate() + 1)))];

    let thisWeekAppts = weekTimestamps.map((timestamp) => apptsByDay[Object.keys(apptsByDay).find((apptTimestamp) => apptTimestamp == timestamp)] || []);

    tempToday = new Date();
    tempToday.setHours(0, 0, 0, 0);

    async function processDayGroups(thisWeekAppts, weekTimestamps) {
      for (let i = 0; i < thisWeekAppts.length; i++) {
        const dayGroupData = thisWeekAppts[i];
        const dayGroupTemplate = document.getElementById('day-group-template');
        const dayGroupNode = dayGroupTemplate.content.cloneNode(true);
    
        let thisDay = new Date(weekTimestamps[i]);
        dayGroupNode.querySelector('h6').textContent = `${getRelativeDate(thisDay)}, ${thisDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    
        const appointmentTemplate = dayGroupNode.querySelector('#appointment-template');
    
        for (const appointment of dayGroupData.sort((a, b) => new Date(a.dateofvisit).getTime() - new Date(b.dateofvisit).getTime())) {
          const appointmentNode = appointmentTemplate.content.cloneNode(true);
    
          let patient;
          try {
            if (!patients[appointment.patientid]) {
              if (!(loadingOverlay.classList.contains('animating') || loadingOverlay.classList.contains('stop-animating'))) showLoadingOverlay(loadingOverlay, true, 'var(--panel-bg-colour)');
              patients[appointment.patientid] = await fetchJson('/grab/patients/' + appointment.patientid, { signal: controller.signal });
            }
            patient = patients[appointment.patientid];
          } catch (err) {
            if (err.name === 'AbortError') return hideLoadingOverlay(loadingOverlay, true);
            else throw err;
          }
    
          appointmentNode.querySelector('img').src = patient.profilepicturepath;
          appointmentNode.querySelector('span').textContent = new Date(appointment.dateofvisit).toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' });
          appointmentNode.querySelector('h6').textContent = `${patient.firstname} ${patient.lastname}`;
          appointmentNode.querySelector('p').textContent = appointment.type;
    
          dayGroupNode.querySelector('.day-group').appendChild(appointmentNode);
        }
    
        let targetDayGroup = appointmentsContainer.children[i + 2];
        if (targetDayGroup) {
          targetDayGroup.textContent = '';
          targetDayGroup.appendChild(dayGroupNode);
        } else {
          appointmentsContainer.appendChild(dayGroupNode);
        }
      }

      if (loadingOverlay.classList.contains('animating')) hideLoadingOverlay(loadingOverlay);

      if (document.querySelector('.selected-day')) {
        appointmentsContainer.scrollTop = appointmentsContainer.children[((selectedDate.getDay() - 1 + 7) % 7) + 2].offsetTop;
      }
    }

    processDayGroups(thisWeekAppts, weekTimestamps);
  }

  updateAppointmentsList();

  // Main data has been obtained and placed on the dashboard: stop loading
  hideLoadingOverlay();
})();

function updateChart(currentDate, appointments, formattedAppts = groupAppointments(appointments)) {
  let currentAppts = getPeriodOfAppointments(currentDate, formattedAppts);
  updateChartDate(currentAppts, chart);

  return [formattedAppts, currentAppts];
}

function getPeriodStart(providedDate = new Date()) {
  let date = new Date(resetDate(providedDate));
  switch (document.querySelector('#appts-stats-filter select').value) {
    case 'hourly':
      return date.setHours(0, 0, 0, 0); // Current Day
    case 'daily':
      return date.setDate(date.getDate() - 3); // Set's current day to be the middle
    case 'weekly':
      return date.setDate(date.getDate() - 2 * 7); // Set's current week to be the middle
    case 'monthly':
      return date.setMonth(date.getMonth() - 3);  // Set's current month to be in the middle
  }
}

function changePeriod(nextPeriod, currentDate) {
    switch (document.querySelector('#appts-stats-filter select').value) {
        case 'hourly':
          currentDate.setHours(currentDate.getHours() + (nextPeriod ? 24 : -24));
          break;
        case 'daily':
          currentDate.setDate(currentDate.getDate() + (nextPeriod ? 7 : -7));
          break;
        case 'weekly':
          for (let iteration = 0; iteration < 5; iteration++) {
            // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
            let currentDay = currentDate.getDay();

            if (currentDay == 1) { // it's a monday go back a week
              let previousDate = new Date(currentDate);
              currentDate.setDate(currentDate.getDate() + (nextPeriod ? 7 : -7));

              if (previousDate.getDate() != 1 && currentDate.getMonth() !== previousDate.getMonth()) {
                currentDate.setMonth(currentDate.getMonth() + (nextPeriod ? 0 : 1));
                currentDate.setDate(1);
              }
            } else { // it's not a monday so go back to nearest monday
              currentDate.setDate(nextPeriod ? currentDate.getDate() + ((8 - currentDate.getDay()) % 7 || 7) : currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
            }
          }
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + (nextPeriod ? 4 : -4));
          break;
      }
      return currentDate;
}

function updateChartDate(weekOfAppts) {
  chart.data.labels = weekOfAppts.map(([, [label]]) => label);
  chart.data.datasets[0].data = weekOfAppts.map(([, [, appointments]]) => appointments);
  chart.update();

  let displayDate = document.querySelector('#appts-stats-filter h4');

  let curDisplay = new Date(Number(weekOfAppts[Math.floor(weekOfAppts.length / 2)][0]));

  switch (document.querySelector('#appts-stats-filter select').value) {
    case 'hourly':
      curDisplay = curDisplay.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      break;
    case 'daily':
      curDisplay = curDisplay.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      break;
    case 'weekly':
      curDisplay = curDisplay.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      break;
    case 'monthly':
      curDisplay = curDisplay.toLocaleDateString('en-US', { year: 'numeric' });
      break;
  }

  if (displayDate.textContent != curDisplay) displayDate.textContent = curDisplay;
}

function resetDate(date) {
  switch (document.querySelector('#appts-stats-filter select').value) {
    case 'hourly':
      return date.setMinutes(0, 0, 0); // Current Day & Hour
    case 'daily':
      return date.setHours(0, 0, 0, 0); // Current Day
    case 'weekly':
      date.setHours(0, 0, 0, 0);
      let currentDate = new Date(date);
      date.setDate(date.getDate() - date.getDay() + 1) // First day of the week
      return (date.getMonth() == currentDate.getMonth()) ? date.getTime() : currentDate.setDate(1);
    case 'monthly':
      date.setHours(0, 0, 0, 0);
      return date.setDate(1); // First day of Current Month
  }
}

function formatDate(date) {
  switch (document.querySelector('#appts-stats-filter select').value) {
    case 'hourly':
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' });
    case 'daily':
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
    case 'weekly':
      const firstMonday = (7 - date.getDay()) % 7;
      const weekOfMonth = Math.ceil((date.getDate() + firstMonday) / 7);
      const month = date.toLocaleDateString('en-GB', { month: 'short' });
      return `Wk ${weekOfMonth}, ${month}`;
    case 'monthly':
      date.setHours(0, 0, 0, 0);
      return date.toLocaleDateString('en-GB', { month: 'short' });
  }
};

function groupAppointments(appointments) {
  const periodicAppointments = appointments.reduce((acc, appt) => {
    const date = new Date(appt.dateofvisit);

    let dateKey = resetDate(date);
    acc[dateKey] = [...(acc[dateKey] || []), appt];

    return acc;
  }, {});
  
  return Object.entries(periodicAppointments)
  .sort(([a], [b]) => a - b)
  .map(([timestamp, dAppt]) => {
    timestamp = Number(timestamp);
    return [timestamp, [formatDate(new Date(timestamp)), dAppt.length]];
  });
}

function getPeriodOfAppointments(currentPeriodStart, allAppointments) {
  const newPeriodStart = new Date(currentPeriodStart); // Clones the date such that original date isn't affected
  let periodTimestamps;
  
  switch(document.querySelector('#appts-stats-filter select').value) {
    case 'hourly':
      periodTimestamps = [newPeriodStart.getTime() + '', ...Array.from({length: 23}, (_, i) => (newPeriodStart.setHours(newPeriodStart.getHours() + 1)) + '')]; // Get a day's worth of timestamps
      break;
      case 'daily':
        periodTimestamps = [newPeriodStart.getTime() + '', ...Array.from({length: 6}, (_, i) => (newPeriodStart.setDate(newPeriodStart.getDate() + 1)) + '')]; // Get a week's worth of timestamps
        break;
    case 'weekly':
        periodTimestamps = [newPeriodStart.getTime() + '', ...Array.from({length: 4}, (_, i) => {
            let currentDay = newPeriodStart.getDay();
          
            if (currentDay == 1) { // it's a monday go back a week
              let previousDate = new Date(newPeriodStart);
              newPeriodStart.setDate(newPeriodStart.getDate() + 7);
          
              if (previousDate.getDate() != 1 && newPeriodStart.getMonth() !== previousDate.getMonth()) {
                newPeriodStart.setMonth(newPeriodStart.getMonth() + 0);
                newPeriodStart.setDate(1);
              }
            } else { // it's not a monday so go back to next monday
              newPeriodStart.setDate(newPeriodStart.getDate() + ((8 - newPeriodStart.getDay()) % 7 || 7));
            }
          
            return newPeriodStart.getTime() + '';
          })];
        break;
    case 'monthly':
      periodTimestamps = [newPeriodStart.getTime() + '', ...Array.from({length: 3}, (_, i) => (newPeriodStart.setMonth(newPeriodStart.getMonth() + 1)) + '')]; // Get 4 months' worth of timestamps
      break;
  }

  return periodTimestamps.map((timestamp) => allAppointments.find(([apptTimestamp]) => apptTimestamp == timestamp) || [Number(timestamp), [formatDate(new Date(Number(timestamp))), 0]]); // Append appointments to each period
}

function getRelativeDate(givenDate) {
  const currentDate = new Date();
  const diffTime = givenDate.getTime() - currentDate.getTime();
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

function waitForClass(element, className) {
  return new Promise((resolve, reject) => {
    // Check if the element already has the class
    if (element.classList.contains(className)) {
      resolve();
      return;
    }

    // Create a MutationObserver instance
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (element.classList.contains(className)) {
            observer.disconnect();
            resolve();
          }
        }
      });
    });

    // Start observing the element for attribute changes
    observer.observe(element, { attributes: true });
  });
};