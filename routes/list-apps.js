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
router.get("/", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    SecureData = [];
    pm2.list(function (err, list) {
        list.forEach(function (App) {
            if (App.name
                .toUpperCase()
                .startsWith("".concat(process.env.PROCESS_SECRET.toUpperCase()))) {
                SecureData.push({
                    CPU: App.monit.cpu,
                    Node_Version: App.pm2_env.node_version,
                    Memory: App.monit.memory,
                    Out_file: App.pm2_env.out_file,
                    Error_file: App.pm2_env.out_file,
                    App: {
                        Name: App.name.replace("".concat(process.env.PROCESS_SECRET.toUpperCase(), "_"), ""),
                        Pid: App.pid,
                        Version: App.pm2_env.version,
                        Entry: App.pm2_env.script,
                        Status: App.pm2_env.status,
                        Created: App.pm2_env.created_at,
                        Created_Date: new Date(App.pm2_env.created_at).toLocaleString(),
                    },
                });
            }
        });
        res.end(JSON.stringify(SecureData));
    });
});
module.exports = router;
