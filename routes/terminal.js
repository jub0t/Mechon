require("dotenv").config();
var Modules = require("../modules/loader");
var exec = require("child_process").exec;
var session = require("express-session");
var express = require("express");
var pm2 = require("pm2");
var fs = require("fs");
var router = express.Router();
router.post("/run", function (req, res) {
    if (process.env.TERMINAL_ENABLED == "true") {
        if (req.body.command) {
            exec(req.body.command, function (error, stdout, stderr) {
                if (!stdout || stdout == "" || error || stderr) {
                    res.end(JSON.stringify({
                        Success: true,
                        Data: "'".concat(req.body.command, "' is not recognized as an internal or external command"),
                    }));
                }
                else {
                    res.end(JSON.stringify({
                        Success: true,
                        Message: "Successfuly Ran Command",
                        Data: stdout,
                    }));
                }
            });
        }
        else {
            res.json({
                Success: false,
                Message: "No command entered",
            });
        }
    }
    else {
        res.json({
            Success: false,
            Message: "Shell/Terminal access for this server is disabled",
        });
    }
});
module.exports = router;
