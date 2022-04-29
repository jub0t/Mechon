require("dotenv").config();
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = function getFiles(source, callback) {
    if (fs.existsSync(source)) {
        if (fs.lstatSync("".concat(source)).isDirectory()) {
            data = [];
            fs.readdir(source, { withFileTypes: true }, function (err, files) {
                files.forEach(function (file) {
                    json = JSON.parse(JSON.stringify(file));
                    data.push({ Name: json.name, isDirectory: file.isDirectory() });
                });
                if (err) {
                    callback(err);
                }
                else {
                    callback(data);
                }
            });
        }
        else {
            return callback(false);
        }
    }
};
