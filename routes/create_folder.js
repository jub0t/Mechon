var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
var up = __dirname.replace("routes", "");
router.post("/", function (req, res) {
    var NewFolderPath = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.body.path);
    console.log(NewFolderPath);
    if (req.body.path) {
        if (fs.existsSync(NewFolderPath) &&
            fs.lstatSync(NewFolderPath).isDirectory()) {
            res.end(JSON.stringify({
                Success: false,
                Message: "This Directory Already Exists",
            }));
        }
        else {
            fs.mkdir(NewFolderPath, function () {
                res.end(JSON.stringify({
                    Success: true,
                    Message: "Successfuly Created New Folder",
                }));
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Folder Path is Missing",
        }));
    }
});
module.exports = router;
