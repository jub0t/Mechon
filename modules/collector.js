require("dotenv").config();
var pm2 = require("pm2");
var fs = require("fs");
var up = __dirname.replace("modules", "");
if (!fs.existsSync("".concat(up, "/database/ram_usage.json"))) {
    fs.openSync("".concat(up, "/database/ram_usage.json"), "wr");
}
if (!fs.existsSync("".concat(up, "/database/cpu_usage.json"))) {
    fs.openSync("".concat(up, "/database/cpu_usage.json"), "wr");
}
setInterval(function () {
    try {
        pm2.list(function (err, list) {
            var total_ram = 0;
            list.forEach(function (App) {
                total_ram += App.monit.memory;
            });
            fs.readFile("".concat(up, "/database/ram_usage.json"), "utf-8", function (err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    try {
                        var Json = JSON.parse(data);
                    }
                    catch (_a) {
                        var Json = {};
                    }
                    if (!Json.data)
                        Json.data = {};
                    if (!Json.data.ram)
                        Json.data.ram = [];
                    if (!Json.data.timestamps)
                        Json.data.timestamps = [];
                    if (Json.data.ram.length >=
                        parseFloat(process.env.MAX_COLLECTOR_ROWS) ||
                        Json.data.timestamps.length >=
                            parseFloat(process.env.MAX_COLLECTOR_ROWS)) {
                        Json.data.ram = [];
                        Json.data.timestamps = [];
                    }
                    Json.data.ram.push(total_ram);
                    Json.data.timestamps.push(new Date().getTime());
                    fs.writeFile("".concat(up, "/database/ram_usage.json"), JSON.stringify(Json), function (err, data) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        });
    }
    catch (err) {
        console.log(err);
        console.log("Unable to collect ram usage");
    }
    try {
        pm2.list(function (err, list) {
            var total_cpu = 0;
            list.forEach(function (App) {
                total_cpu += App.monit.cpu;
            });
            fs.readFile("".concat(up, "/database/cpu_usage.json"), "utf-8", function (err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    try {
                        var Json = JSON.parse(data);
                    }
                    catch (_a) {
                        var Json = {};
                    }
                    if (!Json.data)
                        Json.data = {};
                    if (!Json.data.cpu)
                        Json.data.cpu = [];
                    if (!Json.data.timestamps)
                        Json.data.timestamps = [];
                    if (Json.data.cpu.length >=
                        parseFloat(process.env.MAX_COLLECTOR_ROWS) ||
                        Json.data.timestamps.length >=
                            parseFloat(process.env.MAX_COLLECTOR_ROWS)) {
                        Json.data.cpu = [];
                        Json.data.timestamps = [];
                    }
                    Json.data.cpu.push(total_cpu);
                    Json.data.timestamps.push(new Date().getTime());
                    fs.writeFile("".concat(up, "/database/cpu_usage.json"), JSON.stringify(Json), function (err, data) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
        });
    }
    catch (err) {
        console.log(err);
        console.log("Unable to collect cpu usage");
    }
}, parseFloat(process.env.DATA_COLLECTOR_INTERVAL) * 1000);
