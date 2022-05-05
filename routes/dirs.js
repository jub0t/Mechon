var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
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
