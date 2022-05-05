var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
router.get("/:name", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    if (fs.existsSync("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strerr.log"))) {
        fs.readFile("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.params.name, ".strerr.log"), "utf-8", function (err, log) {
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Fetched Error Log",
                Data: log,
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Could Not Fetch Error Logs",
        }));
    }
});
module.exports = router;
