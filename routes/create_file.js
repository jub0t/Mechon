var express = require("express");
var chalk = require("chalk");
var fs = require("fs");
var router = express.Router();
var up = __dirname.replace("routes", "");
router.post("/", function (req, res) {
    if (req.body.path) {
        var Path = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.body.path);
        if (fs.existsSync(Path) && fs.lstatSync(Path).isFile()) {
            res.end(JSON.stringify({
                Success: false,
                Message: "This File Already Exists",
            }));
        }
        else {
            fs.open(Path, "w", function () {
                res.end(JSON.stringify({
                    Success: true,
                    Message: "Successfuly Created New File",
                }));
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "File Path/Name is Missing",
        }));
    }
});
module.exports = router;
