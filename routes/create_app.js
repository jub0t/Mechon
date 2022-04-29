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
router.post("/", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    if (!req.body.name) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Could Not Find a Name for Application",
        }));
        return;
    }
    if (!req.body.main_entry) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Please provide a main entry file",
        }));
        return;
    }
    Name = req.body.name;
    MainEntry = req.body.main_entry;
    if (fs.existsSync("".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(Name))) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Application ".concat(Name, " Already Exists"),
        }));
    }
    else {
        fs.mkdir("".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(Name), function (err, data) {
            fs.open("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(Name, ".strerr.log"), "w", function () {
                fs.open("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(Name, ".strout.log"), "w", function () {
                    Modules.InsertBase(Name, MainEntry);
                    Modules.Sync()
                        .then(function (data) {
                        res.end(JSON.stringify({
                            Success: true,
                            Message: "Successfuly Created Application",
                        }));
                    })
                        .catch(function (err) {
                        res.end(JSON.stringify({
                            Success: false,
                            Message: "Looks Like An Error Occured Creating Discord Bot",
                        }));
                    });
                });
            });
        });
    }
});
module.exports = router;
