var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
router.get("/:path", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    Path = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.params.path);
    if (fs.existsSync(Path)) {
        if (fs.lstatSync(Path).isDirectory()) {
            fastFolderSize(Path, function (err, bytes) {
                if (err) {
                    throw err;
                }
                Modules.getFiles(Path, function (data) {
                    res.end(JSON.stringify({
                        Success: true,
                        Message: "Successfuly Fetched Directory Data",
                        Data: {
                            Size: bytes,
                            TotalStorage: parseFloat(process.env.MAXIMUM_SSD_BYTES),
                            TotalRam: parseFloat(process.env.MAXIMUM_RAM_BYTES),
                            Objects: data,
                        },
                    }));
                });
            });
        }
        else {
            res.end(JSON.stringify({
                Success: false,
                Message: "Illegal Attempt To Run Npm Install on a File",
            }));
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "App Directory is Broken Or Does Not Exist",
        }));
    }
});
module.exports = router;
