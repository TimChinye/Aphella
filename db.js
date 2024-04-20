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

module.exports = {
	loginUser: async (email, password) => {
		email = email.toLowerCase();
    	password = password;

		const type = email.endsWith("@aphella.com") ? 'staff' : 'patient';
		const user = (await sql`SELECT * FROM ${sql(type)} WHERE emailaddress = ${email}`)[0];

		return { user, userInDatabase: !!user };
	},
	getStaffById: async (id) => {
		const user = (await sql`SELECT * FROM staff WHERE staffid = ${id}`)[0];

		if (user) {
			user.phonenumber = user.phonenumber.trim();

			if (user.jobid == 8) user.type = 'admin';
			else user.type = 'staff';
		}

		return user;
	},
	getPatientById: async (id) => {
		const user = (await sql`SELECT * FROM patient WHERE patientid = ${id}`)[0];

		if (user) {
			user.phonenumber = user.phonenumber.trim();
			user.type = 'patient';
		}

		return user;
	},
	getUserJob: async (id) => {
		return (await sql`SELECT * FROM job WHERE jobid = ${id};`)[0];
	},
	getAppointments: async (id) => {
		return (await sql`SELECT appt.appointmentid, appt.type, appt.location, appt.dateofvisit, appt.diagnosis, appt.notes, appt.patientid, link.staffid FROM appointment AS appt JOIN appointmentstafflink AS link ON appt.appointmentid = link.appointmentid WHERE link.staffid = ${id};`)[0];
	}
}