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
var up = __dirname.replace("routes", "");
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
    if (fs.existsSync("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strout.log"))) {
        fs.readFile("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strout.log"), "utf8", function (err, log) {
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Fetched Error Log",
                Data: log,
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Could Not Fetch Output Logs",
        }));
    }
});
module.exports = router;
