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
    if (fs.existsSync("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strout.log"))) {
        fs.writeFile("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strout.log"), "", function (err) {
            if (err)
                throw err;
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Deleted Logs",
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Logs file is broken or does not exist",
        }));
    }
});
module.exports = router;
