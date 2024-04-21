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
});

let getPrescriptionsByAppointmentId = async (id) => {
	return await sql`SELECT * FROM prescription WHERE appointmentid = ${id};`;
};

let getVitals = async (id) => {
	return (await sql`SELECT * FROM vitals WHERE patientid = ${id};`)[0];
};

let getMedicalHistory = async (id) => {
	return (await sql`SELECT * FROM medicalhistory WHERE patientid = ${id};`)[0];
};

module.exports = {
	loginUser: async (email, password) => {
		email = email.toLowerCase();
    	password = password;

		const type = email.endsWith("@aphella.com") ? 'staff' : 'patient';
		const user = (await sql`SELECT * FROM ${sql(type)} WHERE emailaddress = ${email}`)[0];

		return { user, userInDatabase: !!user };
	},
	getStaff: async (id) => {
		const user = (await sql`SELECT * FROM staff WHERE staffid = ${id}`)[0];

		if (user) {
			user.phonenumber = user.phonenumber.trim();

			if (user.jobid == 8) user.type = 'admin';
			else user.type = 'staff';
		}

		return user;
	},
	getPatient: async (id) => {
		const user = (await sql`SELECT * FROM patient WHERE patientid = ${id}`)[0];

		if (user) {
			user.phonenumber = user.phonenumber.trim();
			user.type = 'patient';
		}

		return user;
	},
	getJob: async (id) => {
		return (await sql`SELECT * FROM job WHERE jobid = ${id};`)[0];
	},
	getAppointmentsByStaffId: async (id) => {
		let appointments = await sql`SELECT * FROM appointment AS appt JOIN appointmentstafflink AS link ON appt.appointmentid = link.appointmentid WHERE link.staffid = ${id};`;

		appointments = await Promise.all(appointments.map(async (appointment) => {
			appointment.prescriptions = await getPrescriptionsByAppointmentId(appointment.appointmentid);
			return appointment;
		}));

		return appointments;
	},
	getPatientsByDoctor: async function (id) {
		let patients = await sql`SELECT * FROM patient WHERE maindoctor = ${id};`;

		patients = await Promise.all(patients.map(async (patient) => {
			patient.medicalHistory = await getMedicalHistory(patient.patientid);
			patient.vitals = await getVitals(patient.patientid);
			return patient;
		}));

		return patients;
	},
	getPrescriptionsByAppointmentId,
	getMedicalHistory,
	getVitals
}