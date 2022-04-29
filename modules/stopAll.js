require("dotenv").config();
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = new Promise(function (resolve, rej) {
    pm2.list(function (err, list) {
        list.forEach(function (App) {
            if (fs.existsSync("./".concat(process.env.SECRET_PATH, "/").concat(App.name))) {
                pm2.stop(App.name);
            }
            else {
                pm2.delete(App.name);
            }
        });
        resolve("\u301A\u2714\u301BSuccessfuly Stoppped All Applications");
    });
});
