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

const { PORT_SERVER, TIMEOUT, PORT_MA, ip, cmdt, cmde, mcode } = require("./config");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const config1 = {
    user: "mi",
    password: "miadmin",
    server: "192.168.5.19",
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

Save2Db = (machine, c_num, rem) => {
    sql.on("error", (err) => {
        return err;
    });
    sql
        .connect(config1)
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

//0 * * * *  (every 1 hour)
const job_5526 = new CronJob(
    "*/30 * * * *",
    () => {
        console.log("save from cron " + Date());
        wlog("save from cron " + Date());
        try {
            const client = new net.Socket();
            let c = new Buffer.from([
                0x52,
                0x44,
                0x20,
                0x44,
                0x4d,
                0x33,
                0x30,
                0x2e,
                0x44,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                Save2Db(5526, x, '');
                client.destroy();
            });
            client.on("close", (data) => {
                console.log("Closed");
            });
        } catch (error) {
            console.log(error);
        }
    },
    null,
    true,
    "Asia/Bangkok"
);

job_5526.stop();

tst = () => {
    let tst = new moment().format("YYYY-MM-DD H:mm:ss");
    return tst;
};

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
    // }

    // try {
    //   res.sendFile(x);
    // } catch (error) {
    //   res.json({ data: 0, code: "500", message: "read error", timestamp: tst() });
    // }
});
app.get("/list", (req, res) => {
    console.log("/list");
    wlog("/list");
    sql.on("error", (err) => {
        res.json(err);
    });
    sql
        .connect(config1)
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
app.get("/get/5526", (req, res) => {
    console.log("/get/5526");
    wlog("/get/5526");
    try {
        const client = new net.Socket();
        let c = new Buffer.from([
            0x52,
            0x44,
            0x20,
            0x44,
            0x4d,
            0x32,
            0x34,
            0x38,
            0x2e,
            0x44,
            0x0d,
            0x0a,
        ]);
        client.connect(PORT_MA, ip[0], (data) => {
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
            x = data.toString();
            console.log(xป);
            client.destroy();
            res.json({
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
});
app.get("/current/:m", (req, res) => {
    //API current
    let { m } = req.params;
    console.log("/current/" + m);
    wlog("/current/" + m);
    if (Number(m)) {
        try {
            const client = new net.Socket();
            let c = new Buffer.from([
                0x52,
                0x44,
                0x20,
                0x44,
                0x4d,
                0x33,
                0x30,
                0x2e,
                0x44,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                client.destroy();
                res.json({
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
});
app.get("/status/5526", (req, res) => {
    //API STATUS
    try {
        console.log("/status/5526");
        wlog("/status/5526");
        const client = new net.Socket();
        let c = new Buffer.from([
            0x52,
            0x44,
            0x20,
            0x4d,
            0x52,
            0x30,
            0x30,
            0x31,
            0x0d,
            0x0a,
        ]);
        client.connect(PORT_MA, ip[0], (data) => {
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
});

app.get("/stop/:id", (req, res) => {
    //API STOP
    job_5526.stop();
    const g = parseInt(req.params.id);
    const x = mcode.indexOf(g);
    console.log(x, req.params.id);
    if (x >= 0) {
        //===========stop==========
        try {
            const client = new net.Socket();
            let c = new Buffer.from([
                0x52,
                0x44,
                0x20,
                0x44,
                0x4d,
                0x33,
                0x30,
                0x2e,
                0x44,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                Save2Db(g, x, 'stop');
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
            console.log("/stop/" + g);
            wlog("/stop/" + g);
            const client = new net.Socket();
            let c = new Buffer.from([
                0x57,
                0x52,
                0x20,
                0x4d,
                0x52,
                0x30,
                0x30,
                0x32,
                0x20,
                0x31,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                let sto = data.toString();
                console.log(sto);
                client.destroy();
                // res.json({ data: sto, status: "200", message: "success" });

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
app.get("/stoperror/:id", (req, res) => {
    //API STOP
    job_5526.stop();
    const g = parseInt(req.params.id);
    wlog("/stoperror/" + g);
    const x = mcode.indexOf(g);
    console.log(x, req.params.id);
    if (x >= 0) {
        //===========saveDB==========
        try {
            const client = new net.Socket();
            let c = new Buffer.from([
                0x52,
                0x44,
                0x20,
                0x44,
                0x4d,
                0x33,
                0x30,
                0x2e,
                0x44,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
        //==========cmd stop ===========
        try {
            console.log("/stoperror/" + g);
            const client = new net.Socket();
            let c = new Buffer.from([
                0x57,
                0x52,
                0x20,
                0x4d,
                0x52,
                0x30,
                0x30,
                0x32,
                0x20,
                0x31,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
                console.log("Connected => " + c);
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
                let sto = data.toString();
                console.log(sto);
                client.destroy();
                //res.json({ data: sto, status: "200", message: "success" });
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
            let cmd = new Buffer.from([0x57, 0x52, 0x20, 0x4d, 0x52, 0x30, 0x30, 0x34, 0x20, 0x31, 0x0d, 0x0a]);
            client.connect(PORT_MA, ip[0], (data) => {
                console.log("Connected => " + cmd);
                client.write(cmd);
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
                let x = 0;
                console.log("stoperror clearx => " + data.toString("utf8")); // OK msg
                // x = parseInt(data).toString();
                client.destroy();
                //res.json({ data: 0, status: "200", message: "clear on stoperror success" });
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
        res.json({ data: 0, code: "403", message: "machine stop not found" });
    }

});
//==========end=stoperror=============


app.get("/start/:id", (req, res) => {
    //API START
    job_5526.start();
    const g = parseInt(req.params.id);
    const x = mcode.indexOf(g);
    console.log(x, req.params.id);
    if (x >= 0) {
        try {
            console.log("/start/" + g);
            const client = new net.Socket();
            let c = new Buffer.from([
                0x57,
                0x52,
                0x20,
                0x4d,
                0x52,
                0x30,
                0x30,
                0x30,
                0x20,
                0x31,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                let sta = data.toString();
                console.log(sta);
                client.destroy();
                Save2Db(g, 0, 'start');
                // res.json({ data: sta, status: "200", message: "success" });
                res.json({ machine_id: g, counter_count: 0, remark: "start" });

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
    console.log("/" + m + "/clear");
    if (Number(m)) {
        //======================
        try {
            const client = new net.Socket();
            let c = new Buffer.from([
                0x52,
                0x44,
                0x20,
                0x44,
                0x4d,
                0x33,
                0x30,
                0x2e,
                0x44,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
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
                Save2Db(m, x, 'clear');
                client.destroy();
                res.json({
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
        //=========clear count=============
        try {
            const client = new net.Socket();
            let cmd = new Buffer.from([
                0x57,
                0x52,
                0x20,
                0x4d,
                0x52,
                0x30,
                0x30,
                0x34,
                0x20,
                0x31,
                0x0d,
                0x0a,
            ]);
            client.connect(PORT_MA, ip[0], (data) => {
                console.log("Connected");
                client.write(cmd);
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