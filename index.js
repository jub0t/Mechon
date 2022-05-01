require("dotenv").config();
var fastFolderSize = require("fast-folder-size");
var Uploader = require("express-fileupload");
var Modules = require("./modules/loader");
var cookieSession = require("cookie-session");
var System = require("systeminformation");
var Terminal = require("system-commands");
var session = require("express-session");
var bodyParser = require("body-parser");
var express = require("express");
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
    store: new session.MemoryStore(),
};
app.set("trust proxy", true);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: true }));
app.use(session(sessionConf));
app.use(Uploader());
app.use("/login", require("./routes/login"));
app.use("/file_content", require("./routes/file_content"));
app.use("/dir_size", require("./routes/dir_size"));
app.use("/info", require("./routes/info"));
app.use("/install_package", require("./routes/install_package"));
app.use("/list-apps", require("./routes/list-apps"));
app.use("/reload_apps", require("./routes/reload_apps"));
app.use("/npm_install", require("./routes/npm_install"));
app.use("/rename_dir", require("./routes/rename_dir"));
app.use("/restart", require("./routes/restart"));
app.use("/terminal", require("./routes/terminal"));
app.use("/upload_file", require("./routes/upload_file"));
app.use("/usage", require("./routes/usage"));
app.use("/stop", require("./routes/stop"));
app.use("/start", require("./routes/start"));
app.use("/error_log", require("./routes/error_log"));
app.use("/panel_stats", require("./routes/panel_stats"));
app.use("/log", require("./routes/log"));
app.use("/create_app", require("./routes/create_app"));
app.use("/dirs", require("./routes/dirs"));
app.use("/delete_logs", require("./routes/delete_logs"));
app.post("/delete_error_logs", function (req, res) {
    if (fs.existsSync("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strerr.log"))) {
        fs.writeFile("./".concat(process.env.SECRET_PATH, "/logs/").concat(req.body.name, ".strerr.log"), "", function (err) {
            if (err)
                throw err;
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Deleted Error Logs",
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Logs file is broken or does not exist",
        }));
    }
});
app.post("/update_file", function (req, res) {
    if (!req.body.content) {
        res.end(JSON.stringify({
            Success: true,
            Message: "No File Content To Update Found",
        }));
        return;
    }
    var Path = "./".concat(process.env.SECRET_PATH, "/").concat(req.query.path).replace(/\/\//gi, "/");
    if (fs.existsSync(Path)) {
        fs.writeFile(Path, req.body.content, function (err) {
            if (err)
                throw err;
            res.end(JSON.stringify({
                Success: true,
                Message: "Successfuly Updated File",
            }));
        });
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "file is broken or does not exist",
        }));
    }
});
app.post("/update_main", function (req, res) {
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
app.post("/create_file", function (req, res) {
    if (req.body.path) {
        var Path = "./".concat(process.env.SECRET_PATH, "/").concat(req.body.path);
        if (fs.existsSync(Path) && fs.lstatSync(Path).isFile()) {
            res.end(JSON.stringify({
                Success: false,
                Message: "This File Already Exists",
            }));
        }
        else {
            fs.open(Path, "w", function () {
                res.end(JSON.stringify({
                    Success: true,
                    Message: "Successfuly Created New File",
                }));
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "File Path/Name is Missing",
        }));
    }
});
app.post("/create_folder", function (req, res) {
    var NewFolderPath = "./".concat(process.env.SECRET_PATH, "/").concat(req.body.path);
    if (req.body.path) {
        if (fs.existsSync(NewFolderPath) &&
            fs.lstatSync(NewFolderPath).isDirectory()) {
            res.end(JSON.stringify({
                Success: false,
                Message: "This Directory Already Exists",
            }));
        }
        else {
            fs.mkdir(NewFolderPath, function () {
                res.end(JSON.stringify({
                    Success: true,
                    Message: "Successfuly Created New Folder",
                }));
            });
        }
    }
    else {
        res.end(JSON.stringify({
            Success: false,
            Message: "Folder Path is Missing",
        }));
    }
});
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
    if (process.env.LOGIN_REQUIRED == "true") {
        if (req.session) {
            if (req.session.username) {
                res.sendFile("./pages/index.html", { root: __dirname });
            }
            else {
                res.sendFile("./pages/login.html", { root: __dirname });
            }
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
    console.log(chalk.hex("#3082CF")(fs.readFileSync("./art.txt", "utf-8") || "", "\n\n[!] Dashboard Is Open On http://localhost:".concat(process.env.PORT || 2278)));
});
