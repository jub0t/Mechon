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
router.post("/:name", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    pm2.stop("".concat(process.env.SECRET_PATH.toUpperCase(), "_").concat(req.params.name), function (err, apps) {
        if (err) {
            JSON.stringify(err);
        }
        res.end(JSON.stringify({
            Success: true,
            Message: "".concat(req.params.name, " Stopped"),
        }));
    });
});
module.exports = router;
