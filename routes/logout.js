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
    if (req.body.confirm) {
        req.session.destroy();
        req.session = null;
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly logged out",
        }));
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Unknown/false logout request",
        }));
    }
});
module.exports = router;
