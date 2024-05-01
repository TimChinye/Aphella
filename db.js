const cache = require('memory-cache');
const postgres = require("postgres");

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
	host: PGHOST,
	database: PGDATABASE,
	username: PGUSER,
	password: PGPASSWORD,
	port: 5432,
	ssl: "require",
	connection: {
		options: `project=${ENDPOINT_ID}`,
	},
	onnotice: false
});

function updateCache(cacheKey, id, items) {
    const itemMap = new Map();
    const setItem = (item) => itemMap.set(item[id], item);

    // Get existing items from cache and add to map
    cache.get(cacheKey)?.forEach(setItem);

    // Add new items to map, overwriting duplicates
    if (Array.isArray(items)) {
        items.forEach(setItem);
    } else {
        setItem(items);
    }

    // Update cache with new array of items
    cache.put(cacheKey, Array.from(itemMap.values()));
}

let getPrescriptionsByAppointmentId = async (id) => {
	let prescriptions = await sql`SELECT * FROM prescription WHERE appointmentid = ${id};`;
	
	if (prescriptions[0]) updateCache('prescriptions', 'prescriptionid', prescriptions);

	return prescriptions;
};

let getVitals = async (id) => {
	let vitals = cache.get('vitals')?.find((vital) => vital.patientid == id);
	if (!vitals) {
		vitals = (await sql`SELECT * FROM vitals WHERE patientid = ${id};`)[0];

		if (vitals) updateCache('vitals', 'patientid', vitals);
	}

	return vitals;
};

let getMedicalHistory = async (id) => {
	let medicalHistories = cache.get('medicalHistories')?.find((medicalHistory) => medicalHistory.patientid == id);
	if (!medicalHistories) {
		medicalHistories = (await sql`SELECT * FROM medicalhistory WHERE patientid = ${id};`)[0];

		if (medicalHistories) updateCache('vitals', 'patientid', medicalHistories);
	}

	return medicalHistories;
};

module.exports = {
	loginUser: async (email, password) => {
		email = email.toLowerCase();
    	password = password;

		const type = email.endsWith("@aphella.com") ? 'staff' : 'patient';

		let user = cache.get('users')?.find((user) => user.emailaddress == email);
		if (!user) {
			user = (await sql`SELECT * FROM ${sql(type)} WHERE emailaddress = ${email}`)[0];
			
			if (user) updateCache('users', 'emailaddress', user);
		}

		return { user, userInDatabase: !!user };
	},
	getStaff: async (id) => {
		let staff;

		if (!id) {
			staff = await sql`SELECT * FROM staff`;

			if (staff[0]) {
				staff = await Promise.all(staff.map(async (staff) => {
					staff.phonenumber = staff.phonenumber.trim();
	
					if (!staff.type) {
						if (staff.jobid == 8) staff.type = 'admin';
						else staff.type = 'staff';
					}

					return staff;
				}));

				updateCache('staff', 'staffid', staff);
			}
		} else {
			staff = cache.get('staff')?.find((staff) => staff.staffid == id);
			if (!staff) staff = (await sql`SELECT * FROM staff WHERE staffid = ${id}`)[0];
	
			if (staff) {
				staff.phonenumber = staff.phonenumber.trim();
	
				if (!staff.type) {
					if (staff.jobid == 8) staff.type = 'admin';
					else staff.type = 'staff';
				}
	
				updateCache('staff', 'staffid', staff);
			}
		}

		return staff;
	},
	getPatient: async (id) => {
		let patient = cache.get('patients')?.find((patient) => patient.patientid == id);
		if (!patient) patient = (await sql`SELECT * FROM patient WHERE patientid = ${id}`)[0];

		if (patient) {
			patient.phonenumber = patient.phonenumber.trim();
			if (!patient.type) patient.type = 'patient';

			if (!patient.medicalHistory) patient.medicalHistory = await getMedicalHistory(patient.patientid);
			if (!patient.vitals) patient.vitals = await getVitals(patient.patientid);

			updateCache('patients', 'patientid', patient);
		}

		return patient;
	},
	getJob: async (id) => {
		let job = cache.get('jobs')?.find((job) => job.jobid == id);
		if (!job) {
			job = (await sql`SELECT * FROM job WHERE jobid = ${id};`)[0];

			if (job) updateCache('jobs', 'jobid', job);
		}

		return job;
	},
	getAppointmentsByUserId: async (type, id) => {
		let appointments;

		if (type == 'patient') {
			appointments = await sql`SELECT * FROM appointment WHERE patientid = ${id}`;
		} else {
			appointments = await sql`SELECT * FROM appointment AS appt JOIN appointmentstafflink AS link ON appt.appointmentid = link.appointmentid WHERE link.staffid = ${id};`;
		}

		if (appointments[0]) {
			appointments = await Promise.all(appointments?.map(async (appointment) => {
				appointment.prescriptions = await getPrescriptionsByAppointmentId(appointment.appointmentid);
				return appointment;
			}));
	
			updateCache('appointments', 'appointmentid', appointments);
		}

		return appointments;
	},
	getPatientsByDoctor: async function (id) {
		let patients = await sql`SELECT * FROM patient WHERE maindoctor = ${id};`;

		if (patients[0]) {
			patients = await Promise.all(patients.map(async (patient) => {
				patient.phonenumber = patient.phonenumber.trim();
				patient.type = 'patient';
	
				patient.medicalHistory = await getMedicalHistory(patient.patientid);
				patient.vitals = await getVitals(patient.patientid);
				
				return patient;
			}));

			updateCache('patients', 'patientid', patients);
		}

		return patients;
	},
	getRequestsReceivedByStaffId: async (id) => {
		let requests = await sql`SELECT * FROM request WHERE request.tostaff = ${id};`;

		if (requests[0]) {
			updateCache('requests', 'requestid', requests);
		}

		return requests;
	},
	getLastXRequestsReceivedByStaffId: async (id, amount) => {
		let requests = await sql`SELECT * FROM request WHERE date <= CURRENT_DATE AND request.tostaff = ${id} ORDER BY date DESC LIMIT ${amount};`;

		if (requests[0]) updateCache('requests', 'requestid', requests);

		return requests;
	},
	getPatients: async () => {
		let patients = await sql`SELECT * FROM patient`;

		if (patients[0]) {
			patients = await Promise.all(patients.map(async (patient) => {
				patient.phonenumber = patient.phonenumber.trim();
				patient.type = 'patient';
	
				patient.medicalHistory = await getMedicalHistory(patient.patientid);
				patient.vitals = await getVitals(patient.patientid);

				return patient;
			}));

			updateCache('patients', 'patientid', patients);
		}

		return patients;
	},
	getPrescriptionsByAppointmentId,
	getMedicalHistory,
	getVitals
}