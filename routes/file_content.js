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
    Blocked = false;
    Blacklist.forEach(function (Content) {
        if (req.query.path.toString().includes(Content)) {
            Blocked = true;
        }
    });
    if (Blocked) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Access Denied",
        }));
        return;
    }
    Path = "./".concat(process.env.SECRET_PATH, "/").concat(req.query.path);
    if (fs.existsSync(Path)) {
        if (fs.lstatSync(Path).isDirectory()) {
            res.end(JSON.stringify({
                Success: false,
                Message: "You Can Not Open Folders",
            }));
        }
        else {
            fs.readFile(Path, "utf8", function (err, content) {
                res.end(JSON.stringify({
                    Success: true,
                    Message: "Successfuly Fetched Error Log",
                    Data: {
                        Content: content,
                    },
                }));
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "This File Does Not Exist",
        }));
    }
});
module.exports = router;
