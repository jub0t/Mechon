require("dotenv").config();
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = function (source, callback) {
    return fs.readdir(source, { withFileTypes: true }, function (err, files) {
        if (err) {
            callback(err);
        }
        else {
            callback(files
                .filter(function (dirent) { return dirent.isDirectory(); })
                .map(function (dirent) { return dirent.name; }));
        }
    });
};
