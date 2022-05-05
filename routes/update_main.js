var Modules = require("../modules/loader");
var exec = require("child_process").exec;
var session = require("express-session");
var express = require("express");
var pm2 = require("pm2");
var fs = require("fs");
var router = express.Router();
router.post("/", function (req, res) {
    if (req.body.new_main) {
        if (req.body.name) {
            if (!req.body.new_main.toString().endsWith(".js")) {
                req.body.new_main = "".concat(req.body.new_main, ".js");
            }
            var Path = "./".concat(process.env.SECRET_PATH, "/").concat(req.body.name, "/package.json");
            if (fs.existsSync(Path)) {
                fs.readFile(Path, "utf8", function (err, data) {
                    var Data = JSON.parse(data);
                    Data.main = req.body.new_main;
                    if (!fs.existsSync("./".concat(process.env.SECRET_PATH, "/").concat(req.body.name, "/").concat(req.body.new_main))) {
                        fs.open("./".concat(process.env.SECRET_PATH, "/").concat(req.body.name, "/").concat(req.body.new_main), function (err, data) { });
                    }
                    fs.writeFile(Path, JSON.stringify(Data, null, 4), function (err, data) {
                        res.end(JSON.stringify({
                            Success: true,
                            Message: "Successfuly Updated",
                            data: data,
                        }));
                    });
                });
            }
            else {
                res.end(JSON.stringify({
                    Success: false,
                    Message: "Bot Does Not Exist",
                }));
            }
        }
        else {
            res.end(JSON.stringify({
                Success: false,
                Message: "No Bot Name Given/Found",
            }));
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "New Main Entry Not Found",
        }));
    }
});
module.exports = router;
