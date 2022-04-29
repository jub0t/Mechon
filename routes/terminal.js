var Modules = require("../modules/loader");
var exec = require("child_process").exec;
var session = require("express-session");
var express = require("express");
var pm2 = require("pm2");
var fs = require("fs");
var router = express.Router();
router.post("/run", function (req, res) {
    if (req.body.command) {
        exec(req.body.command, function (error, stdout, stderr) {
            if (!stdout || stdout == "") {
                res.end(JSON.stringify({
                    Success: true,
                    Data: "'".concat(req.body.command, "' is not recognized as an internal or external command"),
                }));
            }
            //   if (error) {
            //     res.end(
            //       JSON.stringify({
            //         Success: false,
            //         Message: "Internal server error occured",
            //         Data: error,
            //       })
            //     );
            //     return;
            //   }
            //   if (stderr) {
            //     res.end(
            //       JSON.stringify({
            //         Success: false,
            //         Message: `stderr... ${stderr}`,
            //         Data: error,
            //       })
            //     );
            //     return;
            //   }
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Ran Command",
                Data: stdout,
            }));
        });
    }
    else {
        JSON.stringify({
            Success: false,
            Message: "No command entered",
        });
    }
});
module.exports = router;
