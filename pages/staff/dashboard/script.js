const appointmentStatsElem = document.getElementById('appointments-stats').getElementsByTagName('canvas')[0];
let chart = new Chart(appointmentStatsElem, {
  type: 'line',
  data: {
    labels: ['18 Oct', '19 Oct', '20 Oct', '21 Oct', '22 Oct', '23 Oct', '24 Oct'],
    datasets: [{
      data: [3, 17, 6, 20, 2, 22, 7],
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

  document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
  document.getElementById('role').textContent = job.title;
  document.getElementById('profile-pic').src = user.profilepicturepath;

  const today = new Date();
  const countAppointmentsToday = appointments.filter(appt => new Date(appt.dateofvisit).setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)).length;
  const countRegularPatients = patients.filter(pat => pat.maindoctor === user.staffid).length;

  document.querySelector('#patients-today h3').textContent = countAppointmentsToday;
  document.querySelector('#regular-patients-total h3').textContent = countRegularPatients;
  document.querySelector('#incomplete-requests h3').textContent = '0';

  const dailyAppointments = appointments.reduce((acc, appt) => {
    const date = new Date(appt.dateofvisit);
    const dateKey = date.setHours(0, 0, 0, 0);
    acc[dateKey] = [...(acc[dateKey] || []), appt];
    return acc;
  }, {});
  
  const formattedDailyAppts = Object.entries(dailyAppointments)
  .sort(([a], [b]) => a - b)
  .map(([timestamp, dAppt]) => [Number(timestamp), [new Date(Number(timestamp)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), dAppt.length]]);

  // Get the range for the current week
  const currentWeek = today;
  currentWeek.setDate(currentWeek.getDate() - 3); // Set the current date as the centre

  let weekOfAppts = getWeekOfAppointments(currentWeek, formattedDailyAppts);

  // Initially set the chart to the current week
  updateChartDate(weekOfAppts, chart);
  
  // Update chart to other weeks
  Array.from(document.querySelectorAll('#appts-stats-filter button')).forEach((btn, i) => {
    btn.addEventListener('click', () => {
      let interval = 7;
      currentWeek.setDate(currentWeek.getDate() + (i ? interval : -interval));

      weekOfAppts = getWeekOfAppointments(currentWeek, formattedDailyAppts);
      updateChartDate(weekOfAppts);
    });
  });
})();

// Function to update the chart data
function updateChartDate(weekOfAppts) {
  chart.data.labels = weekOfAppts.map(([timestamp]) => new Date(Number(timestamp)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
  chart.data.datasets[0].data = weekOfAppts.map(([, [, appointments]]) => appointments);
  chart.update();

  let displayMonth = document.querySelector('#appts-stats-filter h4');

  let curMonth = new Date(Number(weekOfAppts[3][0])).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  if (displayMonth.textContent != curMonth) displayMonth.textContent = curMonth;
}

function getWeekOfAppointments(currentWeek, allAppointments) {
  const newWeek = new Date(currentWeek); // Clones the date such that any alterations in this function don't affect the "currentWeek"
  const weekTimestamps = [newWeek.getTime(), ...Array.from({length: 6}, (_, i) => (newWeek.setDate(newWeek.getDate() + 1)))]; // Get week's worth of timestamps
  return weekTimestamps.map(timestamp => allAppointments.find(([apptTimestamp]) => apptTimestamp == timestamp) || [timestamp, [new Date(Number(timestamp)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), 0]]); // Append appointments to each day
}