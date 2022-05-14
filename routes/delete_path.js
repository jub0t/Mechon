var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var fs = require("fs");
var path = require("path");
router.post("/", function (req, res) {
    if (req.body.data) {
        var Data = req.body.data;
        for (var index = 0; index < Data.length; index++) {
            var NewObject = Data[index];
            var ObjectPath = "".concat(up, "/").concat(process.env.SECRET_PATH, "/").concat(NewObject);
            if (ObjectPath == "".concat(up, "/").concat(process.env.SECRET_PATH, "/logs")) {
                res.end(JSON.stringify({
                    Success: false,
                    Message: "Access Denied By Server.",
                }));
            }
            try {
                if (fs.lstatSync(ObjectPath).isDirectory()) {
                    try {
                        fs.rmdirSync(ObjectPath, { recursive: true, force: true });
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                else {
                    try {
                        fs.unlink(ObjectPath, function (err) {
                            if (err)
                                throw err;
                        });
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
            catch (_a) { }
        }
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Deleted Files/Folders.",
        }));
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "No Folder/Files Proivded To Delete",
        }));
    }
});
module.exports = router;
