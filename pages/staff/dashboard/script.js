const appointmentStatsElem = document.getElementById('appointments-stats').getElementsByTagName('canvas')[0];
let chart = new Chart(appointmentStatsElem, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      
      borderCapStyle: 'round',
      borderColor: '#C40148',
      
      pointBackgroundColor: 'transparent',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 0,
      pointRadius: 5,
      
      pointHoverBackgroundColor: '#FF005D',
      pointHoverBorderColor: '#FFFFFF',
      pointHoverBorderWidth: 3,
      
      lineTension: 0.3,
      fill: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        border: {
          display: false
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          stepSize: 5
        },
        border: {
          display: false
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false,
        external: (context) => {
          const { chart, tooltip } = context;
          let tooltipEl = chart.canvas.parentNode.children[1];

          // Create tooltip element if it doesn't exist
          if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.id = "tooltip-wrapper";
              tooltipEl.style.cssText = `
                  height: 100%;
                  opacity: 0;
                  color: var(--trinary-colour);
                  font-weight: bold;
                  position: absolute;
                  translate: -50%;
                  transition: all 0.25s ease;
                  white-space: nowrap;
                  pointer-events: none;
                  padding-top: 0.5rem;
                  padding-bottom: 2.5rem;
              `;
              tooltipEl.appendChild(document.createTextNode(""));

              // Create and style divider element
              const divider = document.createElement('div');
              divider.style.cssText = `
                  height: 100%;
                  width: 1px;
                  border: 1px dashed color-mix(in srgb, transparent, var(--trinary-colour) 25%);
                  margin: 0 auto;
                  transition: all 0.25s ease;
                  position: relative;
              `;
              tooltipEl.appendChild(divider);

              // Append tooltip element to parent node
              chart.canvas.style.position = "relative";
              chart.canvas.style.zIndex = "1";
              chart.canvas.parentNode.style.position = "relative";
              chart.canvas.parentNode.appendChild(tooltipEl);
          }

          // Calculate tooltip position
          const { offsetLeft, offsetTop, offsetWidth } = chart.canvas;
          const leftPointPos = offsetLeft + tooltip.caretX;
          tooltipEl.style.left = leftPointPos + 'px';
          tooltipEl.style.top = `calc(${offsetTop}px - 1.5rem)`;
          tooltipEl.style.opacity = tooltip.opacity;

          // Update tooltip content
          tooltipEl.replaceChild(document.createTextNode(`${tooltip.dataPoints[0].formattedValue} Appointments`), tooltipEl.childNodes[0]);

          // Adjust divider position based on tooltip position
          const correction = tooltipEl.offsetWidth / 2;
          let dividerLeft = '0', dividerTranslateX = '-50%';

          if (leftPointPos <= correction) {
              dividerLeft = `-${correction}px`;
              dividerTranslateX = `calc(-50% + ${correction}px)`;
          } else if (leftPointPos >= offsetWidth - correction) {
              dividerLeft = `${correction}px`;
              dividerTranslateX = `calc(-50% - ${correction}px)`;
          }

          tooltipEl.children[0].style.left = dividerLeft;
          tooltipEl.style.translate = dividerTranslateX;

        }
      }
    }
  }
});

const fetchJson = url => fetch(url).then(res => res.json());

(async () => {
  const [user, job, appointments, patients] = await Promise.all([
    fetchJson('/grab/user'),
    fetchJson('/grab/user/job'),
    fetchJson('/grab/user/appointments'),
    fetchJson('/grab/user/patients')
  ]);

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

  // Groups appointments by date
  let formattedAppts = groupAppointments(appointments);

  // The grouped appointments to be displayed
  let currentAppts = getPeriodOfAppointments(currentDate, formattedAppts);

  // Initially set the chart to the current week
  updateChartDate(currentAppts, chart);
  
  // Update chart to other weeks
  Array.from(document.querySelectorAll('#appts-stats-filter button')).forEach((btn, i) => {
    btn.addEventListener('click', () => {
      // console.log(currentDate);
      switch (document.querySelector('#appts-stats-filter select').value) {
        case 'hourly':
          currentDate.setHours(currentDate.getHours() + (i ? 24 : -24));
          break;
        case 'daily':
          currentDate.setDate(currentDate.getDate() + (i ? 7 : -7));
          break;
        case 'weekly':
          for (let iteration = 0; iteration < 5; iteration++) {
            // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
            let currentDay = currentDate.getDay();

            if (currentDay == 1) { // it's a monday go back a week
              let previousDate = new Date(currentDate);
              currentDate.setDate(currentDate.getDate() + (i ? 7 : -7));

              if (previousDate.getDate() != 1 && currentDate.getMonth() !== previousDate.getMonth()) {
                currentDate.setMonth(currentDate.getMonth() + (i ? 0 : 1));
                currentDate.setDate(1);
              }
            } else { // it's not a monday so go back to nearest monday
              currentDate.setDate(i ? currentDate.getDate() + ((8 - currentDate.getDay()) % 7 || 7) : currentDate.getDate() - ((currentDate.getDay() + 6) % 7));
            }
          }
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + (i ? 4 : -4));
          break;
      }

      /* There's an issue with the code above */
      
      // console.log(currentDate);
      currentAppts = getPeriodOfAppointments(currentDate, formattedAppts);
      updateChartDate(currentAppts);
    });
  });

  document.querySelector('#appts-stats-filter select').addEventListener('change', () => {
    formattedAppts = groupAppointments(appointments);

    currentDate = new Date(getPeriodStart());
    currentAppts = getPeriodOfAppointments(currentDate, formattedAppts);
    updateChartDate(currentAppts);
  });
})();

// Function to update the chart data
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

// Sets the date back to the start of the chosen period
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
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' }) // test
    case 'daily':
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) // test
    case 'weekly':
      const firstMonday = (7 - date.getDay()) % 7;
      const weekOfMonth = Math.ceil((date.getDate() + firstMonday) / 7);
      const month = date.toLocaleDateString('en-GB', { month: 'short' });
      return `Wk ${weekOfMonth}, ${month}`;
    case 'monthly':
      date.setHours(0, 0, 0, 0);
      return date.toLocaleDateString('en-GB', { month: 'short' }) // test
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
      periodTimestamps = [];

      for (let iteration = 0; iteration < 5; iteration++) {
        periodTimestamps.push(newPeriodStart.getTime() + '');

        // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
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
      }
      break;
    case 'monthly':
      periodTimestamps = [newPeriodStart.getTime() + '', ...Array.from({length: 3}, (_, i) => (newPeriodStart.setMonth(newPeriodStart.getMonth() + 1)) + '')]; // Get 4 months' worth of timestamps
      break;
  }

  return periodTimestamps.map(timestamp => allAppointments.find(([apptTimestamp]) => apptTimestamp == timestamp) || [Number(timestamp), [formatDate(new Date(Number(timestamp))), 0]]); // Append appointments to each period
}