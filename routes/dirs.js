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
    Files = [];
    if (Blacklist.some(function (format) { return req.query.path.includes(format); })) {
        res.end(JSON.stringify({
            Success: false,
            Message: "Attempt To Access Illegal/Private Directory",
        }));
        return;
    }
    Path = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.query.path).replace(/\/\//g, "/");
    if (fs.existsSync(Path)) {
        Modules.getFiles(Path, function (Data) {
            if (Data == false) {
                res.end(JSON.stringify({
                    Success: false,
                    Message: "Path is not a Folder/Directory",
                }));
                return;
            }
            Data.forEach(function (File) {
                try {
                    var Stats = fs.statSync("".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.query.path, "/").concat(File.Name));
                    Files.push({
                        Name: File.Name,
                        isDirectory: File.isDirectory,
                        Stats: Stats,
                    });
                }
                catch (_a) { }
            });
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Fetched Directories",
                Data: Files,
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Could Not Fetch Directories",
        }));
    }
});
module.exports = router;
