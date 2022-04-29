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
    PackageFile = "../".concat(process.env.SECRET_PATH, "/").concat(req.params.name, "/package.json");
    if (fs.existsSync(PackageFile)) {
        if (fs.existsSync("../".concat(process.env.SECRET_PATH, "/").concat(req.params.name))) {
            fs.readFile(PackageFile, "utf8", function (err, data) {
                if (err) {
                    JSON.stringify({ Success: true, Message: err });
                }
                Package = JSON.parse(data);
                pm2.start({
                    watch: false,
                    daemon: false,
                    detached: true,
                    min_uptime: 5000,
                    watch_delay: 5000,
                    autorestart: false,
                    watch_ignore: true,
                    lines: process.env.MAX_LOG_LINES,
                    max_restarts: process.env.MAX_RELOADS,
                    restart_delay: process.env.RESTART_DELAY,
                    name: "".concat(process.env.SECRET_PATH.toUpperCase(), "_").concat(req.params.name),
                    script: "../".concat(process.env.SECRET_PATH, "/").concat(req.params.name, "/").concat(Package.main),
                    out_file: "../".concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strout.log"),
                    error_file: "../".concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strerr.log"),
                    max_memory_restart: "".concat(parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000000, "M"),
                }, function (err, apps) {
                    if (err) {
                        JSON.stringify({ Success: false, Message: err });
                    }
                    res.end(JSON.stringify({
                        Success: true,
                        Message: "".concat(req.params.name, " Started"),
                    }));
                });
            });
        }
        else {
            res.end(JSON.stringify({
                Success: false,
                Message: "Directory For This Application is Broken or Does Not Exist",
            }));
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Application is Broken, Please Delete \"".concat(req.params.name, "\" From File Manager & Re-create The Application"),
        }));
    }
});
module.exports = router;
