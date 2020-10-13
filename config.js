const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT_SERVER: process.env.PORT_SERVER = 4000,
    TIMEOUT: process.env.TIMEOUT = 3500,
    infom: process.env.infom = [
		{ m: "5526", i: "10.20.30.140", ch: "30", clr: "004", start: "000", stop: "002", sts: "001", cport: 8501 }
    ],
	configdb : {
		user: "mi",
		password: "miadmin",
		server: "192.168.5.19",
		database: "mi",
		options: {
			enableArithAbort: true,
		},
	}
};