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
const clr = 0;

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./db/machine.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the database.');
});

let sqlcmd = `SELECT * FROM numlist;`;
db.all(sqlcmd, [], (err, rows) => {
    if (err) {
        throw err;
    }
    rows.forEach((row) => {
        console.log(row.mac);
    });
});


cron_add = (m) => { //add machine to cron 
    let sqlcmd = "INSERT INTO numlist ( mac )  VALUES ( '" + m + "');";
    db.all(sqlcmd, [], (err, rows) => {
        if (err) {
            throw err;
        }
        // rows.forEach((row) => {
        //   console.log(row.mac);
        //});
    });
}

cron_remove = (m) => { //remove machine from cron
    let sqlcmd = "DELETE FROM numlist WHERE mac = " + m + ";";
    db.all(sqlcmd, [], (err, rows) => {
        if (err) {
            throw err;
        }
        // rows.forEach((row) => {
        //   console.log(row.mac);
        //});
    });
}


// const { PORT_SERVER, TIMEOUT, PORT_MA, ip, cmdt, cmde, mcode, infom } = require("./config");
const { PORT_SERVER, TIMEOUT, PORT_MA, cmdt, cmde, infom } = require("./config");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const configdb = {
    user: "mi",
    password: "miadmin",
    server: "192.168.5.19",
    // server: "192.168.5.20",
    database: "mi",
    options: {
        enableArithAbort: true,
    },
};

wlog = (w) => {
    const dd = new moment().format("YYYY-MM-DD");
    const path_log = "/logs/" + dd + ".log";
    const t = new moment().format("YYYY-MM-DD H:mm:ss");
    fs.appendFile(path.join(__dirname + path_log), w + " " + t + "\n", function(
        err
    ) {
        if (err) return console.log(err);
        console.log("log => " + w);
    });
};

pad = (n, width, z) => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


//machine ,amount, remark (start, stop, stoperror)
Save2Db = (machine, c_num, rem) => {
    sql.on("error", (err) => {
        return err;
    });
    sql
        .connect(configdb)
        .then((pool) => {
            return pool
                .request()
                .query("INSERT INTO [dbo].[machine_counter] ([machine_id],[counter_count],[remark]) VALUES ('" + machine + "'," + c_num + ",'" + rem + "')");
        })
        .then((result) => {
            return result;
        })
        .catch((err) => {
            return err;
        });
};


inlist = (m) => { //list all in current cron 
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    const client = new net.Socket();
    // let c = new Buffer.from([0x52,0x44,0x20,0x44,0x4d,0x33,0x30,0x2e,0x44,0x0d,0x0a]);
    // let c = "RD DM30.D\r";
    // let p = pad(n.ch, 2)
    let c = "RD DM3" + n.ch + ".D\r"
    client.connect(n.cport, n.i, () => {
        console.log("Connected");
        client.write(c);
    });
    client.on("data", (data) => {
        let x = parseInt(data);
        console.log(x);
        Save2Db(n.m, x, '');
        client.destroy();
    });

    client.setTimeout(TIMEOUT);
    client.on("timeout", () => {
        console.log("socket timeout");
        client.destroy();
    });
    client.on("close", (data) => {
        console.log("Closed");
    });

}



//*/30 * * * *  (every 30 min)
//0 * * * *  (every 1 hour)
const job30min = new CronJob("*/30 * * * *", () => {
        console.log("save from cron " + Date());
        wlog("save from cron " + Date());
        try {
            let sqlcmd = `SELECT * FROM numlist;`;
            db.all(sqlcmd, [], (err, rows) => {
                if (err) {
                    throw err;
                }
                rows.forEach((row) => {
                    console.log(row.mac);
                    inlist(row.mac)
                });
            });
        } catch (error) {
            console.log(error);
        }

    },
    null,
    true,
    "Asia/Bangkok"
);

// job30min.stop();
job30min.start();

//timestamp function
tst = () => {
    let tst = new moment().format("YYYY-MM-DD H:mm:ss");
    return tst;
};

app.get("/info", (req, res) => {
    let g = _.find(infom, (o) => { return o.m == 3403; });
    console.log(g)
    console.log("/");
    res.sendFile(path.join(__dirname + "/html/index.html"));
});

app.get("/", (req, res) => {
    console.log("/");
    res.sendFile(path.join(__dirname + "/html/index.html"));
});
app.get("/favicon.ico", (req, res) => {
    console.log("/fav.ico");
    res.sendFile(path.join(__dirname + "/html/favicon.ico"));
});
app.get("/log/:id", (req, res) => {
    const { id } = req.params;
    console.log("/log/" + id);

    let px = path.join(__dirname + "/logs/" + id + ".log");
    // try {
    if (fs.existsSync(px)) {
        //file exists
        res.sendFile(px);
    } else {
        // } catch (err) {
        console.error(err);
        res.json({ data: 0, code: "500", message: "read error", timestamp: tst() });
    }

});


app.get("/list", (req, res) => {
    console.log("/list");
    wlog("/list");
    sql.on("error", (err) => {
        res.json(err);
    });
    sql
        .connect(configdb)
        .then((pool) => {
            return pool
                .request()
                .query(
                    "SELECT TOP (20) [counter_id],[machine_id],[counter_count],[created] FROM [mi].[dbo].[machine_counter] ORDER BY created DESC"
                );
        })
        .then((result) => {
            res.send(result.recordset);
        })
        .catch((err) => {
            res.json(err);
        });
});

app.get("/current/:m", (req, res) => { //OK
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/current/" + n.m);
        wlog("/current/" + n.m);
        if (Number(n.m)) {
            try {
                const client = new net.Socket();
                // let c = "RDS DM30.D 16\r";  //old
                let c = "RD DM" + n.ch + ".D\r"; //new
                client.connect(n.cport, n.i, () => {
                    console.log("Connected : " + c);
                    client.write(c);
                });
                client.setTimeout(TIMEOUT);
                client.on("timeout", () => {
                    console.log("socket timeout");
                    client.destroy();
                    res.json({
                        data: 0,
                        code: "500",
                        message: "socket timeout",
                        timestamp: tst(),
                    });
                });
                client.on("data", (data) => {
                    let x = parseInt(data);
                    // let w = data.toString().split(" ");
                    // console.log("DATA : " + parseInt(w[n.ch]));
                    console.log("DATA : " + x);
                    client.destroy();
                    res.json({
                        // data: parseInt(w[n.ch]),
                        data: x,
                        status: "200",
                        message: "success",
                        timestamp: tst(),
                    });
                });
                client.on("close", (data) => {
                    console.log("Closed");
                });
            } catch (error) {
                console.log(error);
                res.json({ data: 0, code: "500", message: error, timestamp: tst() });
            }

        } else {
            res.json({ data: 0, code: "500", message: error, timestamp: tst() });
        }

    } else { //validate when id not found
        console.log("not found");
        res.json({ data: 0, code: "500", message: m + " not found", timestamp: tst() });
    }
});


app.get("/status/:m", (req, res) => {
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/status/" + n.m);
        wlog("/status/" + n.m);
        try {
            const client = new net.Socket();
            // let c = new Buffer.from([0x52,0x44,0x20,0x4d,0x52,0x30,0x30,0x31,0x0d,0x0a]);
            // let c = "RD MR001\r";
            let c = "RD MR" + n.ch + "1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected : " + c);
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let x = parseInt(data);
                console.log(x);
                client.destroy();
                if (x == 1) {
                    res.json({
                        data: x,
                        status: "200",
                        message: "active is running",
                        timestamp: tst(),
                    });
                } else {
                    res.json({
                        data: x,
                        status: "200",
                        message: "inactive not running",
                        timestamp: tst(),
                    });
                }
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }

    } else { //validate when id not found
        console.log("not found");
        res.json({ data: 0, code: "500", message: m + " not found", timestamp: tst() });
    }

});

app.get("/stop/:m", (req, res) => {
    //API STOP
    // job30min.stop();
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/stop_savedb/" + n.m);
        wlog("/stop_savedb/" + n.m);
        cron_remove(n.m)
            //===========stop==========
        try {
            const client = new net.Socket();
            // let c = new Buffer.from([0x52,0x44,0x20,0x44,0x4d,0x33,0x30,0x2e,0x44,0x0d,0x0a]);
            let c = "RD DM3" + n.clr + ".D\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected");
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
            });
            client.on("data", (data) => {
                let x = parseInt(data);
                console.log(x);
                Save2Db(g, x, 'stop'); //<===== save to db 
                res.json({ machine_id: g, counter_count: x, remark: "stop" });
                client.destroy();
                console.log("save2db success");
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
        }
        //======================
        try {
            console.log("/stop_cmd/" + g);
            wlog("/stop_cmd/" + g);
            const client = new net.Socket();
            // let c = new Buffer.from([0x57,0x52,0x20,0x4d,0x52,0x30,0x30,0x32,0x20,0x31,0x0d,0x0a]);
            let c = "WR MR" + n.clr + "2 1\r"; //<==== stop
            client.connect(n.cport, n.i, (data) => {
                console.log("Connected");
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let sto = data.toString();
                console.log(sto);
                client.destroy();
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }

    } else {
        res.json({ data: 0, code: "403", message: "machine stop not found" });
    }

});


//==========start=stoperror=============
app.get("/stoperror/:m", (req, res) => {
    //API STOP
    // job30min.stop();
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/status/" + n.m);
        wlog("/status/" + n.m);
        //===========saveDB==========
        try {
            const client = new net.Socket();
            // let c = new Buffer.from([0x52,0x44,0x20,0x44,0x4d,0x33,0x30,0x2e,0x44,0x0d,0x0a]);
            // let c = "RD DM30.D\r";
            let c = "RD DM3" + n.ch + ".D\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected");
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
            });
            client.on("data", (data) => {
                let x = parseInt(data);
                console.log(x);
                Save2Db(g, x, 'stoperror');
                // res.json({ machine_id : g, counter_count: x, remark: "stoperror" });
                client.destroy();
                console.log("save2db stoperror success");
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
        }
        //==========cmd stop pause===========
        try {
            console.log("/stoperror/" + g);
            const client = new net.Socket();
            // let c = new Buffer.from([0x57,0x52,0x20,0x4d,0x52,0x30,0x30,0x32,0x20,0x31,0x0d,0x0a]);
            // let c = "WR MR002 1\r";
            let c = "WR MR" + n.clr + "2 1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected => " + c);
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let sto = data.toString();
                console.log(sto);
                client.destroy();
                res.json({ data: 0, status: "200", message: "clear on stoperror success" });
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }

        //=========clear count=============

        try {
            const client = new net.Socket();
            // let cmd = new Buffer.from([0x57, 0x52, 0x20, 0x4d, 0x52, 0x30, 0x30, 0x34, 0x20, 0x31, 0x0d, 0x0a]);
            // let cmd = "WR MR004 1\r";
            let c = "WR MR" + n.clr + "4 1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected => " + cmd);
                client.write(cmd);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let x = 0;
                console.log("stoperror clearx => " + data.toString("utf8")); // OK msg
                client.destroy();
            });
            client.on("close", (data) => {
                console.log("stoperror Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }

        //=========end clear count=============

    } else {
        res.json({ data: 0, code: "403", message: "machine stop error not found" });
    }

});
//==========end=stoperror=============


app.get("/start/:m", (req, res) => {
    //API START
    // job30min.start();
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/start_cmd/" + n.m);
        wlog("/start_cmd/" + n.m);
        cron_add(n.m);
        try {
            const client = new net.Socket();
            let c = "WR MR" + n.ch + "0 1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected");
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let sta = data.toString();
                console.log(sta);
                client.destroy();
                Save2Db(n.m, 0, 'start');
                res.json({ machine_id: n.m, counter_count: 0, remark: "start" });

            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }
    } else {
        res.json({ data: 0, code: "403", message: "machine start not found" });
    }
});


app.get("/clear/:m", (req, res) => {
    //API CLEAR
    let { m } = req.params;
    let n = _.find(infom, (o) => { return o.m == m; });
    console.log(n);
    if (typeof n !== "undefined") { //display not found when id not found
        console.log("/clear_savedb/" + n.m);
        wlog("/clear_savedb/" + n.m);
        //===========get save2db===========
        try {
            const client = new net.Socket();
            let c = "RD DM3" + n.ch + ".D\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected");
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                // client.end();
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let x = parseInt(data);
                console.log(x);
                Save2Db(n.m, x, 'clear');
                client.destroy();
                res.json({
                    data: x,
                    status: "200",
                    message: "clear success",
                    timestamp: tst(),
                });
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error, timestamp: tst() });
        }


        //==========cmd stop===========
        try {
            console.log("/stop_cmd/" + n.m);
            wlog("/stop_cmd/" + n.m);
            const client = new net.Socket();
            // let c = new Buffer.from([0x57,0x52,0x20,0x4d,0x52,0x30,0x30,0x32,0x20,0x31,0x0d,0x0a]);
            // let c = "WR MR002 1\r";
            let c = "WR MR" + n.ch + "2 1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected => " + c);
                client.write(c);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let sto = data.toString();
                console.log(sto);
                client.destroy();
                //res.json({ data: 0, status: "200", message: "clear on stoperror success" });
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }


        //=========clear count=============
        try {
            console.log("/clear_cmd/" + n.m);
            wlog("/clear_cmd/" + n.m);
            const client = new net.Socket();
            let c = "WR MR" + n.ch + "4 1\r";
            client.connect(n.cport, n.i, () => {
                console.log("Connected");
                client.write(cmd);
            });
            client.setTimeout(TIMEOUT);
            client.on("timeout", () => {
                console.log("socket timeout");
                client.destroy();
                res.json({
                    data: 0,
                    code: "500",
                    message: "socket timeout",
                    timestamp: tst(),
                });
            });
            client.on("data", (data) => {
                let x = 0;
                console.log(data.toString("utf8"));
                x = parseInt(data).toString();
                client.destroy();
                res.json({ data: 0, status: "200", message: "clear success" });
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
            res.json({ data: 0, code: "500", message: error });
        }
        //=========end clear count=============
    }
});


app.get("*", (req, res) => {
    res.json({ data: 0, code: "403", message: "api not found" });
});
app.listen(PORT_SERVER, () =>
    console.log(`app listening at http://localhost : ${PORT_SERVER}`)
);