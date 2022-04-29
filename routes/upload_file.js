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
    if (!req.files) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Could Not Find Any File To Upload",
        }));
        return;
    }
    Path = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.query.path).replace(/\/\//g, "/");
    File = req.files.file;
    File.mv("".concat(Path, "/").concat(req.files.file.name));
    res.end(JSON.stringify({
        Success: true,
        Message: "Successfuly Uplaoded File(s)",
    }));
});
module.exports = router;
