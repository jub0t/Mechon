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
app.use("/log", require("./routes/log"));
app.use("/dirs", require("./routes/dirs"));
app.use("/stop", require("./routes/stop"));
app.use("/info", require("./routes/info"));
app.use("/start", require("./routes/start"));
app.use("/login", require("./routes/login"));
app.use("/login", require("./routes/login"));
app.use("/usage", require("./routes/usage"));
app.use("/restart", require("./routes/restart"));
app.use("/terminal", require("./routes/terminal"));
app.use("/dir_size", require("./routes/dir_size"));
app.use("/list-apps", require("./routes/list-apps"));
app.use("/error_log", require("./routes/error_log"));
app.use("/rename_dir", require("./routes/rename_dir"));
app.use("/create_app", require("./routes/create_app"));
app.use("/reload_apps", require("./routes/reload_apps"));
app.use("/panel_stats", require("./routes/panel_stats"));
app.use("/delete_logs", require("./routes/delete_logs"));
app.use("/npm_install", require("./routes/npm_install"));
app.use("/create_file", require("./routes/create_file"));
app.use("/update_main", require("./routes/update_main"));
app.use("/upload_file", require("./routes/upload_file"));
app.use("/file_content", require("./routes/file_content"));
app.use("/create_folder", require("./routes/create_folder"));
app.use("/install_package", require("./routes/install_package"));
app.use("/delete_error_logs", require("./routes/delete_error_logs"));
app.post("/delete_path", function (req, res) {
    if (req.body.data) {
        var Data = req.body.data;
        for (var index = 0; index < Data.length; index++) {
            var NewObject = Data[index];
            var ObjectPath = "./".concat(process.env.SECRET_PATH, "/").concat(NewObject);
            if (ObjectPath == "./".concat(process.env.SECRET_PATH, "/logs")) {
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
app.post("/delete_app", function (req, res) {
    if (req.body.name) {
        if (fs.existsSync("./".concat(process.env.SECRET_PATH, "/").concat(req.body.name))) {
            fs.unlink("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strout.log"), function (err, data) { });
            fs.unlink("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strerr.log"), function (err, data) { });
            pm2.stop("".concat(process.env.PROCESS_SECRET.toUpperCase(), "_").concat(req.body.name), function (err, info) {
                pm2.delete("".concat(process.env.PROCESS_SECRET.toUpperCase(), "_").concat(req.body.name));
                if (err) {
                    res.end(JSON.stringify({
                        Success: false,
                        Message: "An Error Occured While Deleting App",
                    }));
                }
                else {
                    Modules.Sync()
                        .then(function (data) {
                        fs.rmdirSync("./".concat(process.env.SECRET_PATH, "/").concat(req.body.name), {
                            recursive: true,
                            force: true,
                        });
                        res.end(JSON.stringify({
                            Success: true,
                            Message: "Successfuly Deleted Discord Bot",
                        }));
                    })
                        .catch(function (err) {
                        res.end(JSON.stringify({
                            Success: false,
                            Message: "Looks Like An Error Occured Deleting Discord Bot",
                        }));
                    });
                }
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "No Name Given",
        }));
    }
});
app.get("/", function (req, res) {
    req.session.PORT = process.env.PORT;
    if (process.env.LOGIN_REQUIRED == "true") {
        if (req.session.username != null) {
            res.sendFile("./pages/index.html", { root: __dirname });
        }
        else {
            res.sendFile("./pages/login.html", { root: __dirname });
        }
    }
    else {
        res.sendFile("./pages/index.html", { root: __dirname });
    }
});
app.get("/system", function (req, res) {
    System.diskLayout().then(function (data) {
        res.end(JSON.stringify(data));
    });
});
app.get("/:name", function (req, res) {
    if (process.env.LOGIN_REQUIRED == "true") {
        if (req.session.username == null) {
            res.sendFile("./pages/login.html", { root: __dirname });
        }
    }
    var Path = "./pages/".concat(req.params.name, ".html");
    if (fs.existsSync(Path)) {
        res.sendFile(Path, { root: __dirname });
    }
    else {
        res.end("This file does not exist");
    }
});
app.get("/file/:name", function (req, res) {
    var Path = "./public/".concat(req.params.name);
    if (fs.existsSync(Path)) {
        res.sendFile(Path, { root: __dirname });
    }
    else {
        res.end("This file does not exist");
    }
});
app.listen(process.env.PORT, function () {
    console.clear();
    console.log(chalk.hex("#3082CF")(fs.readFileSync("./art.txt", "utf-8") || "", "\n\n[!] Dashboard Is Open On http://localhost:".concat(process.env.PORT || 2278)));
});
