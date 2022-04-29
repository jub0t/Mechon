var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
require("dotenv").config();
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var SETTINGS = require("../settings.json");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = function Start(Folder) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    if (SETTINGS.IGNORE_DIRECTORY.includes(Folder.toLowerCase())) {
                        resolve("\u301A\u2718\u301BLog Folders Was Ignored");
                        return;
                    }
                    console.log(chalk.blue("\u301A\u2261\u301BStarting ".concat(Folder, ", Please Wait...")));
                    if (!fs.existsSync("./".concat(process.env.SECRET_PATH, "/").concat(Folder, "/node_modules"))) {
                        Terminal("cd ./".concat(process.env.SECRET_PATH, "/").concat(Folder, " && npm install"))
                            .then(function (data) { })
                            .catch(function (err) { });
                    }
                    PackageFile = "./".concat(process.env.SECRET_PATH, "/").concat(Folder, "/package.json");
                    if (fs.existsSync(PackageFile)) {
                        fs.readFile(PackageFile, "utf8", function (err, data) {
                            if (err) {
                                console.error(err);
                            }
                            Package = JSON.parse(data);
                            pm2.start({
                                watch: false,
                                daemon: false,
                                detached: true,
                                min_uptime: 5000,
                                watch_delay: 5000,
                                autorestart: false,
                                watch_ignore: true,
                                max_restarts: process.env.MAX_RELOADS,
                                restart_delay: process.env.RESTART_DELAY,
                                name: "".concat(process.env.PROCESS_SECRET.toUpperCase(), "_").concat(Folder),
                                script: "./".concat(process.env.SECRET_PATH, "/").concat(Folder, "/").concat(Package.main),
                                out_file: "./".concat(process.env.SECRET_PATH, "/logs/").concat(Folder, ".strout.log"),
                                error_file: "./".concat(process.env.SECRET_PATH, "/logs/").concat(Folder, ".strerr.log"),
                                max_memory_restart: "".concat(parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000000, "M"),
                            });
                        });
                    }
                    resolve("\u301A\u2714\u301BSuccessfuly Started ".concat(Folder));
                })];
        });
    });
};
