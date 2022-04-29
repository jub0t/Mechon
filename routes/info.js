var Modules = require("../modules/loader");
var fastFolderSize = require("fast-folder-size");
var Uploader = require("express-fileupload");
var System = require("systeminformation");
var Terminal = require("system-commands");
var session = require("express-session");
var bodyParser = require("body-parser");
var express = require("express");
var chalk = require("chalk");
var https = require("https");
var pm2 = require("pm2");
var fs = require("fs");
var router = express.Router();
router.get("/:name", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    pm2.describe("".concat(process.env.SECRET_PATH.toUpperCase(), "_").concat(req.params.name), function (err, data) {
        if (err) {
            JSON.stringify(err);
        }
        var app = data[0].pm2_env;
        var Info = data[0];
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Applications Info",
            Data: {
                App: {
                    Name: Info.name,
                    Version: Info.version,
                    Uptime: Info.pm_uptime,
                    Pid: Info.pid,
                    Port: app.PORT,
                    Status: app.status,
                    NodeVersion: app.node_version,
                    Entry: app.script,
                    Out_file: app.out_file,
                    Error_file: app.out_file,
                },
                Server: {
                    CPU: Info.monit.cpu,
                    Memory: Info.monit.memory,
                    SystemDrive: app.SystemDrive,
                    Os: app.OS,
                    Processors: app.NUMBER_OF_PROCESSORS,
                    ProcessorLevel: app.PROCESSOR_LEVEL,
                    ProcessorArc: app.PROCESSOR_ARCHITECTURE,
                },
            },
        }));
    });
});
module.exports = router;
