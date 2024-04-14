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
	login: async (email, password) => {
		email = email.toLowerCase();
    	password = password;

		const type = email.endsWith("@aphella.com") ? 'staff' : 'patient';
		user = (await sql`SELECT * FROM ${sql(type)} WHERE emailaddress = ${email}`)[0];

		if (user) {
			if (user.jobId == 'secretary') user.type = 'admin';
			else user.type = email.endsWith("@aphella.com") ? 'staff' : 'patient';
		}

		return { user, userInDatabase: !!user };
	},
}