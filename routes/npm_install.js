var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
router.get("/", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.end(JSON.stringify({
                Success: false,
                Message: process.env.LOGIN_REQUIRED_MESSAGE,
            }));
            return;
        }
    }
    Path = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(req.params.name);
    if (fs.existsSync(Path)) {
        if (fs.lstatSync(Path).isDirectory()) {
            if (req.params.name) {
                Terminal("cd ".concat(Path, " && npm install"))
                    .then(function (data) {
                    res.end(JSON.stringify({
                        Success: true,
                        Message: "Successfuly Installed All Modules",
                        Data: data,
                    }));
                })
                    .catch(function (err) {
                    res.end(JSON.stringify({
                        Success: false,
                        Message: "An Error Occured While Trying To Install Modules For ".concat(req.params.name),
                    }));
                });
            }
            else {
                res.end(JSON.stringify({
                    Success: false,
                    Message: "No Bot Name Found",
                }));
            }
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
