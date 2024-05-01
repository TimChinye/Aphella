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
    
    const patientIds = Array.from(new Set(userAppointments.map((a) => a.patientid)));

    if (!JSON.parse(localStorage.getItem('/grab/patients'))) await fetchJson('/grab/patients');
    let patients = await Promise.all(patientIds.map(async (id) => {
        let patient = JSON.parse(localStorage.getItem('/grab/patients'))?.find((p) => p.patientid == id);
        if (!patient) patient = await fetchJson('/grab/patients/' + id);
        return patient;
    }));
    
    document.querySelector('#patientsHeader > h3').textContent = `${patients.length} direct patients`;

    patients = await Promise.all(patients.map(async (patient) => {
        let path = '/grab/patients/' + patient.patientid + '/appointments';

        let patientAppointments = JSON.parse(localStorage.getItem(path));
        if (!patientAppointments) patientAppointments = await fetchJson(path);

        let now = new Date();
        let nextAppointment = "Unknown";
        let lastAppointment = "N/A";
        
        let closestPast = null;
        let closestFuture = null;
        
        patientAppointments.forEach(appt => {
            let apptDate = new Date(appt.dateofvisit);
            if (apptDate < now) {
                if (!closestPast || apptDate > closestPast) {
                    closestPast = apptDate;
                    lastAppointment = appt;
                }
            } else {
                if (!closestFuture || apptDate < closestFuture) {
                    closestFuture = apptDate;
                    nextAppointment = appt;
                }
            }
        });

        patient.lastAppointment = new Date(lastAppointment.dateofvisit).getTime() || 0;
        patient.nextAppointment = new Date(nextAppointment.dateofvisit).getTime() || Number.POSITIVE_INFINITY;

        return patient;
    }));

    patients = patients.sort((a, b) => b.lastAppointment - a.lastAppointment);

    let openContextMenu = null;

    const patientsTable = document.getElementById('patientsTable');
    for (let patient of patients) {
        const patientRow = patientsTable.tBodies[0].insertRow(-1);
        const { profilepicturepath, firstname, lastname, preferredlanguage, dateofbirth, lastAppointment, nextAppointment, maindoctor, medicalHistory: { allergies, chronicconditions } } = patient;

        const patientDetails = [
            preferredlanguage,
            new Date().getFullYear() - new Date(dateofbirth).getFullYear(),
            formatApptDate(lastAppointment),
            formatApptDate(nextAppointment),
            allergies,
            chronicconditions
        ];

        patient.age = patientDetails[1];
        patientRow.patient = patient;

        let cell = patientRow.insertCell(-1);
        let textNode = document.createTextNode(`${firstname} ${lastname}`);
        let picture = document.createElement('picture');
        let img = document.createElement('img');
        img.src = profilepicturepath;
        picture.appendChild(img);
        picture.appendChild(textNode);
        cell.appendChild(picture);
    
        for (let detail of patientDetails) {
            let textContent = document.createTextNode(detail);
            patientRow.insertCell(-1).appendChild(textContent);
        }
    
        // Define the actions and corresponding icons
        const actions = {
            "View Patient Info": "https://img.icons8.com/fluency-systems-regular/48/about-us-female.png",
            "Contact Patient": "https://img.icons8.com/fluency-systems-regular/48/contact-card.png",
            "Schedule Appointment": "https://img.icons8.com/fluency-systems-regular/48/overtime.png",
            "Prescribe Medication": "https://img.icons8.com/fluency-systems-regular/48/pill.png",
            "Update Note": "https://img.icons8.com/fluency-systems-regular/48/inscription.png"
        };

        // Determine the available actions based on the patient's main doctor
        const availableActions = maindoctor == user.staffid ? Object.keys(actions) : ["View Patient Info", "Contact Patient", "Schedule Appointment"];

        // Create a cell for the actions
        let actionCell = patientRow.insertCell(-1);

        // Create a div for the three dots icon
        let menuIcon = document.createElement('div');
        menuIcon.innerHTML = "⋮";
        menuIcon.style.cursor = "pointer";
        menuIcon.className = "menuIcon";

        // Create a div for the context menu
        let contextMenu = document.createElement('div');
        contextMenu.className = "contextMenu";

        // Append an image for each available action to the context menu
        for (let action of availableActions) {
            let img = Object.assign(document.createElement('img'), {
                src: actions[action],
                alt: action
            });
            
            let actionItem = document.createElement('div');
            actionItem.appendChild(img);
            actionItem.appendChild(document.createTextNode(action));
            contextMenu.appendChild(actionItem);
        }

        // Add an event listener to the three dots icon to toggle the context menu on click
        menuIcon.addEventListener('click', function() {
            if (openContextMenu == contextMenu) {
                contextMenu.style.display = "none";
                openContextMenu = null;
            } else if (openContextMenu) {
                contextMenu.style.display = "flex";
                openContextMenu.style.display = "none";
                openContextMenu = contextMenu;
            } else {
                contextMenu.style.display = "flex";
                openContextMenu = contextMenu;
            }
        });

        // Append the three dots icon and the context menu to the cell
        actionCell.appendChild(menuIcon);
        actionCell.appendChild(contextMenu);
    }

    // Add an event listener to the document to hide the context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!openContextMenu || e.target.matches('.menuIcon') || e.target.closest('.contextMenu')) return;
        
        openContextMenu.style.display = "none";
        openContextMenu = null;
    });
    
    document.getElementById('patientsSelect').addEventListener('change', (e) => {
        let rows = Array.from(patientsTable.rows).slice(1); // the first row is the header
        let selectedOption = e.target.value;
      
        rows.sort((a, b) => {
            switch (selectedOption) {
                case "firstNameAsc":
                    return a.patient.firstname.localeCompare(b.patient.firstname);
                case "firstNameDesc":
                    return b.patient.firstname.localeCompare(a.patient.firstname);
                // case "lastNameAsc":
                //     return a.patient.lastname.localeCompare(b.patient.lastname);
                //
                // It's the default anyways
                case "lastNameDesc":
                    return b.patient.lastname.localeCompare(a.patient.lastname);
                case "age":
                    return a.patient.age - b.patient.age;
                case "lastAppointment":
                    return b.patient.lastAppointment - a.patient.lastAppointment;
                case "nextAppointment":
                    return a.patient.nextAppointment - b.patient.nextAppointment;
                default:
                    return a.patient.lastname.localeCompare(b.patient.lastname);
            }
        });
      
        for (let row of rows) {
            patientsTable.tBodies[0].appendChild(row);
        }
    });

    hideLoadingOverlay();
})();

let formatApptDate = (appt) => [0, Number.POSITIVE_INFINITY].includes(appt) ? (appt ? 'Unknown' : 'N/A') : `${new Date(appt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\r\n(${getRelativeDate(new Date(appt))})`;