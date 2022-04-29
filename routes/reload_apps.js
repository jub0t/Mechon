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
    Modules.Sync()
        .then(function (data) {
        res.end(JSON.stringify({
            Success: true,
            Message: "Dashboard Has Been Synced & Repaired",
            Data: data,
        }));
    })
        .catch(function (err) {
        console.log(err);
        res.end(JSON.stringify({
            Success: false,
            Message: err.toString(),
        }));
    });
});
module.exports = router;
