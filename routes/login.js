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
router.post("/", function (req, res) {
    if (!req.body.username) {
        res.end(JSON.stringify({
            Success: false,
            Message: "No Username Given",
        }));
        return;
    }
    if (!req.body.username) {
        res.end(JSON.stringify({
            Success: false,
            Message: "You forgot to give a password",
        }));
        return;
    }
    if (req.body.username == process.env.ADMIN_USERNAME &&
        req.body.password == process.env.ADMIN_PASSWORD) {
        req.session.username = req.body.username;
        req.session.save(function (err) {
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Logged in",
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Wrong Username/Password",
        }));
    }
});
module.exports = router;
