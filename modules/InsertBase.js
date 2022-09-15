require("dotenv").config();
var Modules = require("./loader");
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = function InsertBase(path_name, main_entry) {
    if (!main_entry.endsWith(".js")) {
        main_entry = "".concat(main_entry, ".js");
    }
    var PackageJsonBase = {
        name: path_name,
        version: "1.0.0",
        description: "Auto-generated file created by DBP",
        main: main_entry,
        scripts: {},
        keywords: [],
        license: "MIT",
        author: "jareer12/github",
        dependencies: {
            "discord.js": "^13.5.1",
        },
    };
    var EntryPath = "./".concat(process.env.SECRET_PATH, "/").concat(path_name, "/").concat(main_entry).replace(/\/\//g, "/");
    var Readme = "./".concat(process.env.SECRET_PATH, "/").concat(path_name, "/README.md").replace(/\/\//g, "/");
    fs.open(EntryPath, "w", function () {
        fs.open(EntryPath, "w", function () {
            fs.readFile("./template/index.js", "utf-8", function (err, data) {
                if (err)
                    return console.error(err);
                console.log(data);
                fs.writeFile(EntryPath, data, function (err) {
                    if (err)
                        return console.error(err);
                    fs.open("./".concat(process.env.SECRET_PATH, "/").concat(path_name, "/package.json"), "w", function () {
                        fs.writeFile("./".concat(process.env.SECRET_PATH, "/").concat(path_name, "/package.json"), JSON.stringify(PackageJsonBase, null, 4), function (err) {
                            if (err)
                                return console.error(err);
                            fs.copyFile("./template/README.md", Readme, function (err) {
                                if (err)
                                    throw err;
                                Terminal("cd ./".concat(process.env.SECRET_PATH, "/").concat(path_name, " && npm install"))
                                    .then(function (data) { })
                                    .catch(function (err) { });
                                Modules.Sync()
                                    .then(function (data) {
                                    console.log(chalk.green("\u301A\u2714\u301BSuccessfuly Created New Bot: ".concat(path_name, ", Entry: ").concat(main_entry)));
                                    return true;
                                })
                                    .catch(function (err) {
                                    return err;
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
