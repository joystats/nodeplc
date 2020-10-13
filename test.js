#!node

const net = require("net");
const app = require("express")();
const sql = require("mssql");
const CronJob = require("cron").CronJob;
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const _ = require("lodash");
const bodyParser = require("body-parser");

try {

    const client = new net.Socket();


    //let c = "WR MR004 1\r"; //clear
    // let c = "RD DM248.D\r"; //get curr all
    //let c = "WR MR000 1\r"; //start
    // let c = "WR MR002 1\r"; //stop
    //let c = "RD MR001\r"; //status
    let c = "RD DM30.D\r"; //get curr now

    client.connect(8501, "10.20.30.140", (data) => {
        console.log("Connected");
        client.write(c);
    });
    client.setTimeout(3500);
    client.on("timeout", () => {
        console.log("socket timeout");
        client.destroy();
        // res.json({
        //     data: 0,
        //     code: "500",
        //     message: "socket timeout",
        //     timestamp: tst(),
        // });
    });
    client.on("data", (data) => {
        let sto = data.toString();
        // console.log(sto);
        console.log(">>> " + data);
        client.destroy();
    });
    client.on("close", (data) => {
        console.log("Closed");
    });
} catch (error) {
    console.log(error);
    // res.json({ data: 0, code: "500", message: error });
}