var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
router.post("/", function (req, res) {
    if (fs.existsSync("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strout.log"))) {
        fs.writeFile("".concat(up, "/").concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strout.log"), "", function (err) {
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
