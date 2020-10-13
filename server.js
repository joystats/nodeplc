const net = require("net");
const app = require("express")();
const sql = require("mssql");
const CronJob = require("cron").CronJob;
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const _ = require("lodash");
const bodyParser = require("body-parser");

const { PORT_SERVER, TIMEOUT, infom, configdb } = require("./config");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

add_machine = (m) => { //add machine to cron 
	sql.connect(configdb)
	.then((pool) => {
		return pool
			.request()
			.query(`INSERT INTO machine_counter_running (machine_id)  VALUES ('${m}')`);
	})
	.then((result) => {
		return result;
	})
	.then(() => {
		pool.close()
	})
	.catch((err) => {
		return err;
	});
}

remove_machine = (m) => { //remove machine from cron
    sql.connect(configdb)
	.then((pool) => {
		return pool
			.request()
			.query(`DELETE FROM machine_counter_running WHERE machine_id='${m}'`);
	})
	.then((result) => {
		return result;
	})
	.then(() => {
		pool.close()
	})
	.catch((err) => {
		return err;
	});
}

getMachineData = (m) => {
	let n = _.find(infom, (o) => { return o.m == m; });
	return n;
}

wlog = (w) => {
    const dd = new moment().format("YYYY-MM-DD");
    const path_log = "/logs/" + dd + ".log";
    const t = new moment().format("YYYY-MM-DD H:mm:ss");
    fs.appendFile(path.join(__dirname + path_log), w + " " + t + "\n", function(err) {
        if (err) return console.log(err);
    });
};

pad = (n, width, z) => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

Save2Db = (postData) => {
	const { machine_id, counter_count, remark, type, header_id=0 } = postData
    sql.on("error", (err) => {
        return err;
    });
    sql.connect(configdb)
	.then((pool) => {
		return pool
			.request()
			.query(`INSERT INTO machine_counter (machine_id,counter_count,remark,status,type,header_id) VALUES ('${machine_id}','${counter_count}','${remark}','1','${type}','${header_id}')`);
	})
	.then((result) => {
		return result;
	})
	.then(() => {
		pool.close()
	})
	.catch((err) => {
		return err;
	});
};

task_schedule = (m) => {
    let n = getMachineData(m)
	try {
		const client = new net.Socket();
		client.connect(n.cport, n.i, () => {
			let c = "RD DM" + n.ch + ".D\r"
			client.write(c,()=>{
				let command_clear = "WR MR" + n.clr + " 1\r"
				client.write(command_clear);
			});
		});
		client.on("data", (data) => {
			let counter_count = parseInt(data);
			const postData = {
				machine_id: n.m, 
				counter_count: counter_count,
				remark: 'บันทึกอัตโนมัติ', 
				type: 'cronjob',
				header_id:0
			}
			Save2Db(postData);
			client.destroy();
		});

		client.setTimeout(TIMEOUT);
		client.on("timeout", () => {
			console.log("on timeout");
			client.destroy();
		});
	} catch (error) {
		console.log(error);
	}
}

app.get("/test",(req, res)=>{
	 try {
            sql.connect(configdb)
			.then((pool) => {
				return pool
					.request()
					.query(`SELECT machine_id FROM machine_counter_running`);
			})
			.then((data) => {
				if(data.recordset){
					data.recordset.map((item, index)=>{
						//console.log(item.machine_id)
						task_schedule(item.machine_id)
					})
				}
				res.end('end')
			})
			.then(() => {
				pool.close()
			})
			.catch((err) => {
				return err;
			});
			
        } catch (error) {
            console.log(error);
        }
})

//*/30 * * * *  (every 30 min)
//0 * * * *  (every 1 hour)
const job30min = new CronJob("*/30 * * * *", () => {
        wlog("save from cron " + Date());
        try {
            sql.connect(configdb)
			.then((pool) => {
				return pool
					.request()
					.query(`SELECT machine_id FROM machine_counter_running`);
			})
			.then((data) => {
				if(data.recordset){
					data.recordset.map((item, index)=>{
						//console.log(item.machine_id)
						task_schedule(item.machine_id)
					})
				}
				res.end('end')
			})
			.catch((err) => {
				return err;
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

app.get("/", (req, res) => {
    console.log("/");
    res.sendFile(path.join(__dirname + "/html/index.html"));
});

app.get("/start/:m", (req, res) => {
	const { m } = req.params
   let n = getMachineData(m)
   console.log(n);
    if (typeof n !== "undefined") {
		wlog("/start_cmd/" + n.m);
		remove_machine(n.m)
		add_machine(n.m);
        try {
			const client = new net.Socket();
            client.connect(n.cport, n.i, () => {
				let command_start = "WR MR" + n.start + " 1\r";
				client.write(command_start);
            });
			client.on('data',function(data){
				console.log('on read')
				const postData = {
					machine_id: n.m, 
					counter_count: 0,
					remark: 'R_วิ่งเครื่อง', 
					type: 'start',
					header_id:0
				}
                Save2Db(postData);
                res.json(postData);
				client.destroy();
			});
			
			client.setTimeout(TIMEOUT);
			client.on("timeout", () => {
				console.log("on timeout");
				client.destroy();
			});
			
        } catch (error) {
            console.log('on error'+error);
			res.json({success: false, message: error});
			client.destroy();
        }
		
    } else {
		client.destroy();
		res.json({success: false, message: "machine start not found"});
    }
});


app.get("/stop/:m/:remark", (req, res) => {
	 let { m, remark } = req.params;
    let n = getMachineData(m)
    if (typeof n !== "undefined") {
		wlog("/stop_savedb/" + n.m);
       remove_machine(n.m)
        try {
			const client = new net.Socket();
            client.connect(n.cport, n.i, () => {
				let c = "RD DM" + n.ch + ".D\r";
                client.write(c,()=>{
					let command_stop = "WR MR" + n.stop + " 1\r";
					 client.write(command_stop)
				});
            });
            client.on("data", (data) => {
                let counter_count = parseInt(data);
				const postData = {
					machine_id: n.m, 
					counter_count: counter_count,
					remark: remark, 
					type: 'stop',
					header_id:0
				}
                Save2Db(postData);
				
				res.json(postData);
                client.destroy();
            });
			
			client.setTimeout(TIMEOUT);
			client.on("timeout", () => {
				console.log("on timeout");
				client.destroy();
			});

        } catch (error) {
            client.destroy();
        }
		
	}

});

app.get("/current/:m", (req, res) => { //OK
    let { m } = req.params;
    let n = getMachineData(m)
    if (typeof n !== "undefined") { //display not found when id not found
        wlog("/current/" + n.m);
		try {
			const client = new net.Socket();
			client.connect(n.cport, n.i, () => {
				let c = "RD DM" + n.ch + ".D\r";
				client.write(c);
			});
		   
			client.on("data", (data) => {
				let counter_count = parseInt(data);
				const postData = {
					machine_id: n.m, 
					counter_count: counter_count,
					remark: 'get current', 
					type: 'current',
					header_id:0
				}
				res.json(postData);
				client.destroy();
			});
			
			client.setTimeout(TIMEOUT);
			client.on("timeout", () => {
				console.log("on timeout");
				client.destroy();
			});
		} catch (error) {
			console.log(error);
			res.json({ data: 0, code: "500", message: error, timestamp: tst() });
		}

    } else { //validate when id not found
        console.log("not found");
        res.json({ data: 0, code: "500", message: m + " not found", timestamp: tst() });
    }
});


app.get("/status/:m", (req, res) => {
    let { m } = req.params;
    let n =  getMachineData(m)
    if (typeof n !== "undefined") { //display not found when id not found
        wlog("/status/" + n.m);
        try {
            const client = new net.Socket();
            client.connect(n.cport, n.i, () => {
				let c = "RD MR" + n.sts + "\r";
                client.write(c);
            });
            client.on("data", (data) => {
				let x = parseInt(data);
				//const json = JSON.stringify(data);
				res.json(data)
				client.destroy();
            });
			
			client.setTimeout(TIMEOUT);
			client.on("timeout", () => {
				console.log("on timeout");
				client.destroy();
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


app.get("*", (req, res) => {
    res.json({ data: 0, code: "403", message: "api not found" });
});
app.listen(PORT_SERVER, () =>
    console.log(`app listening at http://localhost : ${PORT_SERVER}`)
);