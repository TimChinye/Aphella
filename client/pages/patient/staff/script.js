(async () => {
    showLoadingOverlay();

    const [user, userJob, staff] = await Promise.all([
        fetchJson('/grab/user'),
        fetchJson('/grab/user/job'),
        fetchJson('/grab/staff')
    ]);

    document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
    document.getElementById('role').textContent = userJob.title;
    document.getElementById('profile-pic').src = user.profilepicturepath.split('http://').join('https://');

    let allStaff = [];

    for (curStaff of staff) {
        let path = '/grab/job/' + curStaff.jobid;

        curStaff.job = JSON.parse(localStorage.getItem(path));
        if (!curStaff.job) curStaff.job = await fetchJson(path);

        allStaff.push(curStaff);
    }

    const staffGrid = document.getElementById('staffGrid');
    let template = staffGrid.firstElementChild;
    
    allStaff = allStaff.sort((a, b) => a.lastname.localeCompare(b.lastname));
    allStaff.forEach(staff => {
        let clone = document.importNode(template.content, true);
        
        let img = clone.querySelector('img');
        img.src = staff.profilepicturepath;
        
        let h5 = clone.querySelector('h5');
        h5.textContent = `Dr. ${staff.firstname} ${staff.lastname}`;
        
        let h6 = clone.querySelector('h6');
        h6.textContent = staff.job.title;

        let figure = clone.querySelector('figure');
        figure.dataset.staffid = staff.staffid;
    
        staffGrid.appendChild(clone);
    });
    
    document.getElementById('staffSelect').addEventListener('change', (e) => {
        let staffFigures  = Array.from(document.querySelectorAll('#staffGrid figure')); // ignores template
        let selectedOption = e.target.value;
      
        staffFigures = staffFigures.sort((a, b) => {
            let staffA = allStaff.find(staff => staff.staffid == a.dataset.staffid);
            let staffB = allStaff.find(staff => staff.staffid == b.dataset.staffid);
            
            switch (selectedOption) {
                case "firstNameAsc":
                    return staffA.firstname.localeCompare(staffB.firstname);
                case "firstNameDesc":
                    return staffB.firstname.localeCompare(staffA.firstname);
                // case "lastNameAsc":
                //     return aStaff.lastname.localeCompare(bStaff.lastname);
                //
                // Again, it's the default anyways
                case "lastNameDesc":
                    return staffB.lastname.localeCompare(staffA.lastname);
                case "title":
                    return staffA.job.title.localeCompare(staffB.job.title);
                case "gender":
                    return staffA.gender.localeCompare(staffB.gender);
                default:
                    return staffA.lastname.localeCompare(staffB.lastname);
            }
        });

        // Reorder the figures in the DOM
        staffFigures.forEach(figure => staffGrid.appendChild(figure));
    });

    // Get all the checkboxes
    let mGenderCheckbox = document.getElementById('mGender');
    let fGenderCheckbox = document.getElementById('fGender');
    let iGenderCheckbox = document.getElementById('iGender');
    let uGenderCheckbox = document.getElementById('uGender');

    // Function to filter the staff figures
    function filterStaffFigures() {
        let staffFigures = Array.from(document.querySelectorAll('#staffGrid figure'));

        staffFigures.forEach(figure => {
            let staff = allStaff.find(staff => staff.staffid == figure.dataset.staffid);

            // Determine the visibility of the figure based on the checked state of the checkboxes
            let isVisible = 
                (staff.gender === 'Male' && mGenderCheckbox.checked) ||
                (staff.gender === 'Female' && fGenderCheckbox.checked) ||
                (staff.gender === 'Indetermined' && iGenderCheckbox.checked) ||
                (staff.gender === 'Unknown' && uGenderCheckbox.checked);

            // Set the display style of the figure
            figure.style.display = isVisible ? '' : 'none';
        });
    }

    // Add the event listener to each checkbox
    [mGenderCheckbox, fGenderCheckbox, iGenderCheckbox, uGenderCheckbox].forEach((checkbox) => {
        checkbox.addEventListener('change', filterStaffFigures);
    });

    document.querySelector('#staffHeader input[type="search"]').addEventListener('input', (e) =>{
        let providedName = e.target.value.trim();

        
        let staffFigures = Array.from(document.querySelectorAll('#staffGrid figure'));

        staffFigures.forEach(figure => {
            let staff = allStaff.find(staff => staff.staffid == figure.dataset.staffid);

            // Set the display style of the figure
            figure.style.display = (`${staff.firstname} ${staff.lastname}`.toLowerCase().includes(providedName)) ? '' : 'none';
        });
    })

    hideLoadingOverlay();
})();

let formatApptDate = (appt) => [0, Number.POSITIVE_INFINITY].includes(appt) ? (appt ? 'Unknown' : 'N/A') : `${new Date(appt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\r\n(${getRelativeDate(new Date(appt))})`;