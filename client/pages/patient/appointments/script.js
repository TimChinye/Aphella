(async () => {
    showLoadingOverlay();

    const [user, userJob, userAppointments] = await Promise.all([
        fetchJson('/grab/user'),
        fetchJson('/grab/user/job'),
        fetchJson('/grab/user/appointments')
    ]);

    document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
    document.getElementById('role').textContent = userJob.title ?? 'Patient';
    document.getElementById('profile-pic').src = user.profilepicturepath.split('http://').join('https://');
    
    let currentMonth, currentYear;
    updateCalendar();

    document.getElementById("prev-month").addEventListener("click", () => {
        --currentMonth < 0 && (currentMonth = 12, currentYear--);
        updateCalendar(currentMonth, currentYear);
    });
    
    document.getElementById("next-month").addEventListener("click", () => {
        ++currentMonth >= 12 && (currentMonth = 0, currentYear++);
        updateCalendar(currentMonth, currentYear);
    });

    function updateCalendar(inputMonth, inputYear) {
        const calendarElement = document.getElementById('calendar-dotm');
        // calendarElement.innerHTML = "";
      
        let currentDate = new Date();
    
        currentMonth = inputMonth ?? currentDate.getMonth();
        currentYear = inputYear ?? currentDate.getFullYear();
        currentDate = new Date(currentYear, currentMonth, 1);
    
        const firstDay = (currentDate.getDay() + 6) % 7;
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(0);
    
        const lastDay = ((8 - currentDate.getDay()) % 7 || 7) - 1;
        const daysInMonth = currentDate.getDate();
    
        const displayMonthElement = document.querySelector('#display-month h2');
        displayMonthElement.innerHTML = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      
        function setDayElement(currentDate, additionalClass, index) {
            if (currentDate.getTime() === new Date().setHours(0, 0, 0, 0)) {
                additionalClass += ' currentDay';
            }
        
            let div = calendarElement.children[index + 1];
            if (!div) {
                let template = calendarElement.firstElementChild;

                div = template.content.cloneNode(true);
                calendarElement.appendChild(div);

                div = calendarElement.children[index + 1];
            }
        
            div.style.display = 'grid';
            div.querySelector('.day').innerHTML = currentDate.getDate();
        
            // Get appointments for this day
            let thisDaysAppts = userAppointments.filter(appointment => new Date(appointment.dateofvisit).toDateString() === currentDate.toDateString());
        
            let apptTypeContainer = div.querySelector('.apptTypeContainer');

            let displayedCount = 0;
            let appointmentTypes = ["Specialist Referral", "Vaccination", "Surgery", "Follow-up", "Diagnostic Testing", "Check-up", "Consultation", "Emergency"];
            let thisDayUniqueTypes = new Set(thisDaysAppts.map((appt) => appt.type));
            let htmlString = '';
            
            for (let type of appointmentTypes) {
                if (thisDayUniqueTypes.has(type) && displayedCount < 3) {
                    displayedCount++;

                    if (displayedCount == 3 && thisDaysAppts.length > 3) {
                        htmlString += `
                            <div class="apptType">
                                <div class="apptHighlight apptMore"></div>
                                <p class="apptLabel">and ${thisDaysAppts.length - displayedCount + 1} more...</p>
                            </div>
                        `;
                    } else {
                        htmlString += `
                            <div class="apptType">
                                <div class="apptHighlight appt${type.split(' ').join('').split('-').join('')}"></div>
                                <p class="apptLabel">${type}</p>
                            </div>
                        `;
                    }
                }
            }
            
            if (displayedCount < 3 && thisDaysAppts.length >= 3) {
                htmlString += `
                    <div class="apptType">
                        <div class="apptHighlight apptMore"></div>
                        <p class="apptLabel">and ${thisDaysAppts.length - displayedCount} more...</p>
                    </div>
                `;
            }
            
            apptTypeContainer.innerHTML = htmlString;
        
            if (additionalClass) div.classList = additionalClass.trim();
            else div.removeAttribute("class");
        }
        
        // Add days for the previous month
        for (let i = firstDay; i >= 1; i--) {
            const currentDate = new Date(currentYear, currentMonth, 1 - i);
            setDayElement(currentDate, 'otherMonth', firstDay - i);
        }
    
        // Add days for the current month
        for (let i = 0; i < daysInMonth; i++) {
            const currentDate = new Date(currentYear, currentMonth, i + 1);
            setDayElement(currentDate, '', firstDay + i);
        }
    
        // Add days for the next month
        for (let i = 1; i <= lastDay; i++) {
            const currentDate = new Date(currentYear, currentMonth + 1, i);
            setDayElement(currentDate, 'otherMonth', firstDay + daysInMonth + i - 1);
        }
        
        // Hide unused day elements
        for (let i = firstDay + daysInMonth + lastDay + 1; i < calendarElement.children.length; i++) {
            calendarElement.children[i].style.display = 'none';
        }
    };
    
    hideLoadingOverlay();
})();

function randomSkewedNum(strength, min, max, toMax) {
    strength = toMax ? (1 / strength) : strength;
    return Math.floor(Math.pow(Math.random(), strength) * (max - min + 1)) + min;
};