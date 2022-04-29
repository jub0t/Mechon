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
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    Terminal("cd ./".concat(process.env.SECRET_PATH, "/").concat(req.body.bot_app, " && npm install ").concat(req.body.package_name))
        .then(function (data) {
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Installed ".concat(req.body.package_name),
            Data: data,
        }));
    })
        .catch(function (err) {
        res.end(JSON.stringify({
            Success: false,
            Message: "An Error Occured",
            Error: err,
        }));
    });
});
module.exports = router;
