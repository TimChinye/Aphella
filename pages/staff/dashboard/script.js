const fetchJson = url => fetch(url).then(res => res.json());

(async () => {
  const [user, job, appointments, patients] = await Promise.all([
    fetchJson('/grab/user'),
    fetchJson('/grab/user/job'),
    fetchJson('/grab/user/appointments'),
    fetchJson('/grab/user/patients')
  ]);

  /* Data has been obtained, stop loading */
  hideLoadingOverlay();

  /* Fill the basic info */

  document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
  document.getElementById('role').textContent = job.title;
  document.getElementById('profile-pic').src = user.profilepicturepath;

  const countAppointmentsToday = appointments.filter(appt => new Date(appt.dateofvisit).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).length;
  const countRegularPatients = patients.filter(pat => pat.maindoctor === user.staffid).length;

  document.querySelector('#patients-today h3').textContent = countAppointmentsToday;
  document.querySelector('#regular-patients-total h3').textContent = countRegularPatients;
  document.querySelector('#incomplete-requests h3').textContent = '0';

  /* Appointment Statistics */

  // Set initial date to display
  let currentDate = new Date(getPeriodStart());
  let [formattedAppts, currentAppts] = updateChart(currentDate, appointments);
  
  // Update chart to other weeks
  Array.from(document.querySelectorAll('#appts-stats-filter button')).forEach((btn, i) => {
    btn.addEventListener('click', () => {
        currentDate = changePeriod(i, currentDate);
        [formattedAppts, currentAppts] = updateChart(currentDate, appointments, formattedAppts);
    });
  });

  // Change the period/frequency
  document.querySelector('#appts-stats-filter select').addEventListener('change', () => {
    currentDate = new Date(getPeriodStart());
    [formattedAppts, currentAppts] = updateChart(currentDate, appointments);
  });

  /* Appointment Info (Header Part) */
  
  const calendarDays = document.getElementById('calendar-days');
  const calendarHeader = document.getElementById('calendar-header');

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
    let monthYear = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    calendarHeader.querySelector('h1').textContent = monthYear;
  }

  function selectDate(selectDate) {
    for (dayDiv of Array.from(calendarDays.children)) {
      let dayOfMonth = dayDiv.querySelector('strong').textContent;
      let monthAndYear = calendarHeader.querySelector('h1').textContent;
      let thisDate = new Date(`${dayOfMonth} ${monthAndYear}`);

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
    btn.addEventListener('click', () => {
      today.setDate(today.getDate() + (i ? 7 : -7));
      updateCalendarDays(today);
      updateMonthYear(today);
      selectDate(selectedDate);
    });
  });

  // Select a day when clicked
  let dayDivs = Array.from(calendarDays.children);
  dayDivs.forEach((dayDiv, i) => {
    dayDiv.addEventListener('click', () => {
      let dayOfMonth = dayDiv.querySelector('strong').textContent;
      let monthAndYear = calendarHeader.querySelector('h1').textContent;
      selectedDate = new Date(`${dayOfMonth} ${monthAndYear}`);

      // Remove 'selected-day' class from all dayDivs
      dayDivs.forEach(day => day.classList.remove('selected-day'));

      // Add 'selected-day' class to the clicked dayDiv
      if (i == (selectedDate.getDay() - 1 + 7) % 7) dayDiv.classList.add('selected-day');
    });
  });


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

  return periodTimestamps.map(timestamp => allAppointments.find(([apptTimestamp]) => apptTimestamp == timestamp) || [Number(timestamp), [formatDate(new Date(Number(timestamp))), 0]]); // Append appointments to each period
}