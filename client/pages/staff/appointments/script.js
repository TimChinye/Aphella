(async () => {
    showLoadingOverlay();

    const [user, userJob, userAppointments] = await Promise.all([
        fetchJson('/grab/user'),
        fetchJson('/grab/user/job'),
        fetchJson('/grab/user/appointments')
    ]);
    let currentMonth, currentYear;

    console.log(userAppointments);

    document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
    document.getElementById('role').textContent = userJob.title;
    document.getElementById('profile-pic').src = user.profilepicturepath.split('http://').join('https://');
    
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
    
        const lastDay = (currentDate.getDay() + 6) % 7;
        const daysInMonth = currentDate.getDate();
    
        const displayMonthElement = document.querySelector('#display-month h2');
        displayMonthElement.innerHTML = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      
        let dayCount = 1;
        let nextMonthDayCount = 1;
      
        function setDayElement(day, additionalClass, currentDate, index) {
            if (currentDate.getTime() === new Date().setHours(0, 0, 0, 0)) {
                additionalClass = 'currentDay';
            }
        
            let div = calendarElement.children[index];
            if (!div) {
                div = document.createElement('div');
                calendarElement.appendChild(div);
            } else if (div.style.display == 'none') div.style.display = 'grid';
        
            div.innerHTML = day;
        
            // Get appointments for this day
            let appointmentsOnThisDay = userAppointments.filter(appointment => new Date(appointment.dateofvisit).toDateString() === currentDate.toDateString());
        
            if (appointmentsOnThisDay.length > 0) {
                const appointmentContainer = document.createElement('div');
                appointmentContainer.classList.add('apptTypeContainer');
                div.appendChild(appointmentContainer);
        
                const displayMax = 3;
                let appointmentTypes = ["Special Referral", "Vaccination", "Surgery", "Follow-up", "Diagnostic", "Check-up", "Consulation", "Emergency"];
                let shuffledTypes = appointmentTypes.sort(() => Math.random() - 0.5);
        
                for (let i = 0; i < appointmentsOnThisDay.length && i < displayMax; i++) {
                    if (i == displayMax - 1 && appointmentsOnThisDay.length > displayMax) {
                        appointmentContainer.innerHTML += `
                            <div class="apptType">
                                <div class="apptHighlight apptMore"></div>
                                <p class="apptLabel">and ${appointmentsOnThisDay.length - i} more...</p>
                            </div>
                        `;
                    } else {
                        let apptType = shuffledTypes[i];
                        appointmentContainer.innerHTML += `
                            <div class="apptType">
                                <div class="apptHighlight appt${apptType.split(' ').join('').split('-').join('')}"></div>
                                <p class="apptLabel">${apptType}</p>
                            </div>
                        `;
                    }
                }
            }
        
            if (additionalClass) div.classList = additionalClass;
            else div.removeAttribute("class");
        }
        
        // Add days for the previous month
        for (let i = 0; i < firstDay; i++) {
            const currentDate = new Date(currentYear, currentMonth, -i);
            setDayElement(currentDate.getDate(), 'otherMonth', currentDate, i);
        }
    
        // Add days for the current month
        for (let i = 0; i < daysInMonth; i++) {
            const currentDate = new Date(currentYear, currentMonth, i + 1);
            setDayElement(dayCount++, '', currentDate, firstDay + i);
        }
    
        // Add days for the next month
        for (let i = lastDay; i < 6; i++) {
            const currentDate = new Date(currentYear, currentMonth + 1, i + 1);
            setDayElement(nextMonthDayCount++, 'otherMonth', currentDate, firstDay + daysInMonth + i - lastDay);
        }
        
        // Hide unused day elements
        for (let i = firstDay + daysInMonth + 6 - lastDay; i < calendarElement.children.length; i++) {
            calendarElement.children[i].style.display = 'none';
        }
    
        // let allDays = Array.from(calendarElement.children);
        // for (day of allDays) {
        //     let appointmentsNum = randomSkewedNum(10, 0, 50, false);
    
        //     if (appointmentsNum > 0) {
        //         const div = document.createElement('div');
        //         div.classList.add('apptTypeContainer');
        //         day.appendChild(div);
    
        //         const displayMax = 3;
        //         let appointmentTypes = ["Special Referral", "Vaccination", "Surgery", "Follow-up", "Diagnostic", "Check-up", "Consulation", "Emergency"];
    
        //         let shuffledTypes = appointmentTypes.sort(() => Math.random() - 0.5);
    
        //         for (let i = 0; i < appointmentsNum && i < displayMax; i++) {
        //             if (i == displayMax - 1 && appointmentsNum > displayMax) {
        //                 div.innerHTML += `
        //                 <div class="apptType">
        //                     <div class="apptHighlight apptMore"></div>
        //                     <p class="apptLabel">and ${appointmentsNum - i} more...</p>
        //                 </div>
        //             `;
        //             } else {
        //                 let apptType = shuffledTypes[i];
        //                 div.innerHTML += `
        //                 <div class="apptType">
        //                     <div class="apptHighlight appt${apptType.split(' ').join('').split('-').join('')}"></div>
        //                     <p class="apptLabel">${apptType}</p>
        //                 </div>
        //             `;
        //             }
        //         }
        //     }
        // }
    };
    
    hideLoadingOverlay();
})();

function randomSkewedNum(strength, min, max, toMax) {
    strength = toMax ? (1 / strength) : strength;
    return Math.floor(Math.pow(Math.random(), strength) * (max - min + 1)) + min;
};