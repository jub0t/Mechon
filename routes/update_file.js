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
    if (!req.body.content) {
        res.end(JSON.stringify({
            Success: true,
            Message: "No File Content To Update Found",
        }));
        return;
    }
    var Path = "./".concat(process.env.SECRET_PATH, "/").concat(req.query.path).replace(/\/\//gi, "/");
    if (fs.existsSync(Path)) {
        fs.writeFile(Path, req.body.content, function (err) {
            if (err)
                throw err;
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Updated File",
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "file is broken or does not exist",
        }));
    }
});
module.exports = router;
