(async () => {
  let user = await fetch('/grab/user').then(res => res.json());
  let job = await fetch('/grab/user/job').then(res => res.json());
  let appointments = await fetch('/grab/user/appointments').then(res => res.json());
  let patients = await fetch('/grab/user/patients').then(res => res.json());

  hideLoadingOverlay();

  document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
  document.getElementById('role').textContent = job.title;
  document.getElementById('profile-pic').src = user.profilepicturepath.split('http://').join('https://');
})();

const appointmentStatsElem = document.getElementById('appointments-stats').getElementsByTagName('canvas')[0];
const config = {
  type: 'line',
  data: {
    labels: ['18 Oct', '19 Oct', '20 Oct', '21 Oct', '22 Oct', '23 Oct', '24 Oct'],
    datasets: [
      {
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
        
        lineTension: 0.4,
        fill: false
      }
    ]
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
};