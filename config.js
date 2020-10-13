const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    //PORT SERVER
    PORT_SERVER: process.env.PORT_SERVER = 4000,

    //SET TIMEOUT
    TIMEOUT: process.env.TIMEOUT = 3500,

    //PORT MACHINE
    // PORT_MA: process.env.PORT_MA = 8501,

    //IP MACHINE
    //ip: process.env.ip = ["10.20.20.214", "10.20.20.214", "10.20.20.214", "10.20.30.143"],

    //MACHINE CODE
    //mcode: process.env.mcode = [5522, 9988, 5526, 9987],

    //TOTAL//START//STOP//EXTRA MDCE
    cmde: process.env.cmde = ["DM248.D", "MR000", "MR002"],

    //INFO MACHINE not duplicate m:  // nch : 2 digit zero leading
    infom: process.env.infom = [
        { m: "3505", i: "10.20.20.214", ch: "00", cport: 8501 },
        { m: "3403", i: "10.20.20.214", ch: "01", cport: 8501 },

        { m: "5526", i: "10.20.30.140", ch: "00", clr: "004", start: "000", stop: "002", cport: 8501 },
        { m: "5512", i: "10.20.30.140", ch: "01", clr: "104", start: "100", stop: "102", cport: 8501 },
        { m: "5510", i: "10.20.30.140", ch: "03", clr: "304", start: "300", stop: "301", cport: 8501 },
    ],

    //CMD TIME 00:00 - 23:00
    cmdt: process.env.cmdt = [
        "DM200.D",
        "DM202.D",
        "DM204.D",
        "DM206.D",
        "DM208.D",
        "DM210.D",
        "DM212.D",
        "DM214.D",
        "DM216.D",
        "DM218.D",
        "DM220.D",
        "DM222.D",
        "DM224.D",
        "DM226.D",
        "DM228.D",
        "DM230.D",
        "DM232.D",
        "DM234.D",
        "DM236.D",
        "DM238.D",
        "DM240.D",
        "DM242.D",
        "DM244.D",
        "DM246.D"
    ]
};


//       let infom = [{ m: "3505", i: "10.20.20.214", ch: 1 }, 
//		{ m: "3403", i: "10.20.20.214", ch: 2 }]


// let m = _.find(infom, (o) => { return o.m == "3505"; });
// console.log(m.i)