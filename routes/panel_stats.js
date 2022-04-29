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
var SETTINGS = require("../settings.json");
var Blacklist = SETTINGS.BLACK_LISTED_DIRS;
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
    var CurrentPath = __dirname.replace(/\\/g, "/");
    Modules.getDirectories("".concat(up, "/").concat(process.env.SECRET_PATH), function (dirs) {
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Data",
            Data: {
                Env: {
                    SecretPath: process.env.SECRET_PATH,
                    MaxRam: parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000,
                    MaxSSD: parseFloat(process.env.MAXIMUM_SSD_BYTES) / 1000,
                    Username: process.env.ADMIN_USERNAME,
                    Path: CurrentPath.split("/")[CurrentPath.split("/").length - 1],
                    Port: parseFloat(process.env.PORT),
                },
                Dirs: dirs.filter(function (name) { return name != "logs"; }),
            },
        }));
    });
});
module.exports = router;
