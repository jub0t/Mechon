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
    ToRename = req.body.ToRename;
    NewName = req.body.NewName;
    var Path = "../".concat(process.env.SECRET_PATH, "/").concat(ToRename)
        .replace(/\\/g, "/")
        .toString()
        .replace(/\/\//g, "/");
    var NewPath = "../".concat(process.env.SECRET_PATH, "/").concat(NewName)
        .replace(/\\/g, "/")
        .toString()
        .replace(/\/\//g, "/");
    fs.rename(Path, NewPath, function (err) {
        if (err) {
            res.end(JSON.stringify({
                Success: false,
                Message: "Unable To Rename",
                Error: err,
            }));
            return;
        }
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Renamed",
        }));
    });
});
module.exports = router;
