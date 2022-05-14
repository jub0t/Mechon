require("dotenv").config();
var fastFolderSize = require("fast-folder-size");
var Uploader = require("express-fileupload");
var Modules = require("./modules/loader");
var System = require("systeminformation");
var Terminal = require("system-commands");
var session = require("express-session");
var bodyParser = require("body-parser");
var express = require("express");
var cors = require("cors");
var chalk = require("chalk");
var https = require("https");
var pm2 = require("pm2");
var fs = require("fs");
var app = express();
var SETTINGS = require("./settings.json");
var Blacklist = SETTINGS.BLACK_LISTED_DIRS;
var sessionConf = {
    proxy: true,
    resave: false,
    saveUninitialized: true,
    secret: process.env.SECRET_PATH,
};
app.set("trust proxy", true);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: true }));
app.use(session(sessionConf));
app.use(Uploader());
app.use(cors());
app.use("/log", require("".concat(__dirname, "/routes/log")));
app.use("/dirs", require("".concat(__dirname, "/routes/dirs")));
app.use("/stop", require("".concat(__dirname, "/routes/stop")));
app.use("/info", require("".concat(__dirname, "/routes/info")));
app.use("/file", require("".concat(__dirname, "/routes/file")));
app.use("/start", require("".concat(__dirname, "/routes/start")));
app.use("/login", require("".concat(__dirname, "/routes/login")));
app.use("/login", require("".concat(__dirname, "/routes/login")));
app.use("/usage", require("".concat(__dirname, "/routes/usage")));
app.use("/restart", require("".concat(__dirname, "/routes/restart")));
app.use("/terminal", require("".concat(__dirname, "/routes/terminal")));
app.use("/dir_size", require("".concat(__dirname, "/routes/dir_size")));
app.use("/list-apps", require("".concat(__dirname, "/routes/list-apps")));
app.use("/error_log", require("".concat(__dirname, "/routes/error_log")));
app.use("/rename_dir", require("".concat(__dirname, "/routes/rename_dir")));
app.use("/delete_app", require("".concat(__dirname, "/routes/delete_app")));
app.use("/create_app", require("".concat(__dirname, "/routes/create_app")));
app.use("/reload_apps", require("".concat(__dirname, "/routes/reload_apps")));
app.use("/panel_stats", require("".concat(__dirname, "/routes/panel_stats")));
app.use("/delete_logs", require("".concat(__dirname, "/routes/delete_logs")));
app.use("/npm_install", require("".concat(__dirname, "/routes/npm_install")));
app.use("/create_file", require("".concat(__dirname, "/routes/create_file")));
app.use("/update_main", require("".concat(__dirname, "/routes/update_main")));
app.use("/upload_file", require("".concat(__dirname, "/routes/upload_file")));
app.use("/delete_[ath]", require("".concat(__dirname, "/routes/delete_logs")));
app.use("/file_content", require("".concat(__dirname, "/routes/file_content")));
app.use("/create_folder", require("".concat(__dirname, "/routes/create_folder")));
app.use("/install_package", require("".concat(__dirname, "/routes/install_package")));
app.use("/delete_error_logs", require("".concat(__dirname, "/routes/delete_error_logs")));
app.use("*", function (req, res, next) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (!req.session.username) {
            res.sendFile("".concat(__dirname, "/pages/login.html"));
        }
    }
    next();
});
app.get("/", function (req, res) {
    console.log(req.session.username);
    res.sendFile("".concat(__dirname, "/pages/home.html"));
});
app.get("/:name", function (req, res) {
    var Path = "".concat(__dirname, "/pages/").concat(req.params.name, ".html");
    if (fs.existsSync(Path)) {
        res.sendFile(Path);
    }
    else {
        res.end("This file does not exist");
    }
});
app.get("/system", function (req, res) {
    System.diskLayout().then(function (data) {
        res.end(JSON.stringify(data));
    });
});
app.listen(parseFloat(process.env.PORT), function () {
    console.clear();
    console.log(chalk.hex("#3082CF")(fs.readFileSync("./art.txt", "utf-8") || "", "\n\n[!] Dashboard Is Open On http://localhost:".concat(parseFloat(process.env.PORT))));
});
