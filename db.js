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

		if (email.endsWith("@aphella.com"))
			user = (await sql`SELECT * FROM staff WHERE emailaddress = ${email}`)[0];
		else user = (await sql`SELECT * FROM patient WHERE emailaddress = ${email}`)[0];

		return { user, userInDatabase: !!user };
	},
};
