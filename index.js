const {
  getFiles,
  InsertBase,
  getDirectories,
  Sync,
  Initialize,
} = require("./loader");
const fastFolderSize = require("fast-folder-size");
const Uploader = require("express-fileupload");
const System = require("systeminformation");
const Terminal = require("system-commands");
const session = require("express-session");
const bodyParser = require("body-parser");
const express = require("express");
const chalk = require("chalk");
const pm2 = require("pm2");
const fs = require("fs");
const app = express();

const SETTINGS = require("./settings.json");
Blacklist = SETTINGS.BLACK_LISTED_DIRS;
require("dotenv").config();

if (process.env.SECRET_PATH) {
  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: process.env.SECRET_PATH,
    })
  );
}
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: true }));
app.use(Uploader());

app.get("/start/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  PackageFile = `./${process.env.SECRET_PATH}/${req.params.name}/package.json`;
  if (fs.existsSync(PackageFile)) {
    if (fs.existsSync(`./${process.env.SECRET_PATH}/${req.params.name}`)) {
      fs.readFile(PackageFile, "utf8", function (err, data) {
        if (err) {
          JSON.stringify({ Success: true, Message: err });
        }
        Package = JSON.parse(data);
        pm2.start(
          {
            detached: true,
            min_uptime: 5000,
            watch_delay: 5000,
            autorestart: false,
            name: `${process.env.SECRET_PATH.toUpperCase()}_${req.params.name}`,
            exp_backoff_restart_delay: 100,
            max_restarts: process.env.MAX_RELOADS,
            restart_delay: process.env.RESTART_DELAY,
            script: `./${process.env.SECRET_PATH}/${req.params.name}/${Package.main}`,
            out_file: `./${process.env.SECRET_PATH}/logs/${req.params.name}.strout.log`,
            error_file: `./${process.env.SECRET_PATH}/logs/${req.params.name}.strerr.log`,
            max_memory_restart: `${
              parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000000
            }`,
            lines: process.env.MAX_LOG_LINES,
            node_args: [],
          },
          function (err, apps) {
            if (err) {
              JSON.stringify({ Success: false, Message: err });
            }
            res.end(
              JSON.stringify({
                Success: true,
                Message: `${req.params.name} Started`,
              })
            );
          }
        );
      });
    } else {
      res.end(
        JSON.stringify({
          Success: false,
          Message: `Directory For This Application is Broken or Does Not Exist`,
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: `Application is Broken, Please Delete "${req.params.name}" From File Manager & Re-create The Application`,
      })
    );
  }
});

app.post("/install_package", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Terminal(
    `cd ./${process.env.SECRET_PATH}/${req.body.bot_app} && npm install ${req.body.package_name}`
  )
    .then((data) => {
      res.end(
        JSON.stringify({
          Success: true,
          Message: `Successfuly Installed ${req.body.package_name}`,
          Data: data,
        })
      );
    })
    .catch((err) => {
      res.end(
        JSON.stringify({
          Success: false,
          Message: `An Error Occured`,
          Error: err,
        })
      );
    });
});

app.get("/generate_tailwinds", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Terminal(`npm run generate_tailwinds`)
    .then((data) => {
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Successfuly Generated Tailwinds",
          Data: data,
        })
      );
    })
    .catch((err) => {
      res.end(
        JSON.stringify({
          Success: false,
          Message: `An Error Occured`,
          Error: err,
        })
      );
    });
});

app.get("/update_tailwinds", (req, res) => {
  if (req.body.data) {
    if (fs.existsSync("./tailwind.config.js")) {
      try {
        Data = JSON.parse(req.body.data);
        fs.write("./tailwind.config.js", JSON.stringify(Data), (err, data) => {
          if (err) {
            res.end(
              JSON.stringify({
                Success: false,
                Message: `Unable To Update Tailwinds Config`,
                Error: err,
              })
            );
            return;
          }
          res.end(
            JSON.stringify({
              Success: false,
              Message: `Tailwinds Config Updated`,
            })
          );
        });
      } catch {
        res.end(
          JSON.stringify({
            Success: false,
            Message: `Could Not Parse Data To Json`,
          })
        );
      }
    } else {
      res.end(
        JSON.stringify({
          Success: false,
          Message: `Tailwinds Config File is Missing`,
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: `Confige Data is Missing`,
      })
    );
  }
});

app.get("/stop/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  pm2.stop(
    `${process.env.SECRET_PATH.toUpperCase()}_${req.params.name}`,
    function (err, apps) {
      if (err) {
        JSON.stringify(err);
      }
      res.end(
        JSON.stringify({
          Success: true,
          Message: `${req.params.name} Stopped`,
        })
      );
    }
  );
});

app.get("/panel_stats", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  let CurrentPath = __dirname.replace(/\\/g, "/");
  getDirectories(`./${process.env.SECRET_PATH}`, function (dirs) {
    res.end(
      JSON.stringify({
        Success: true,
        Message: `Successfuly Fetched Data`,
        Data: {
          Env: {
            SecretPath: process.env.SECRET_PATH,
            MaxRam: parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000,
            MaxSSD: parseFloat(process.env.MAXIMUM_SSD_BYTES) / 1000,
            Username: process.env.ADMIN_USERNAME,
            Path: CurrentPath.split("/")[CurrentPath.split("/").length - 1],
            Port: parseFloat(process.env.PORT),
          },
          Dirs: dirs.filter((name) => name != "logs"),
        },
      })
    );
  });
});

app.post("/rename_dir", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  ToRename = req.body.ToRename;
  NewName = req.body.NewName;
  const Path = `./${process.env.SECRET_PATH}/${ToRename}`
    .replace(/\\/g, "/")
    .toString()
    .replace(/\/\//g, "/");
  const NewPath = `./${process.env.SECRET_PATH}/${NewName}`
    .replace(/\\/g, "/")
    .toString()
    .replace(/\/\//g, "/");
  fs.rename(Path, NewPath, (err) => {
    if (err) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: `Unable To Rename`,
          Error: err,
        })
      );
      return;
    }
    res.end(
      JSON.stringify({
        Success: true,
        Message: `Successfuly Renamed`,
      })
    );
  });
});

app.post("/upload_file", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (!req.files) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: `Could Not Find Any File To Upload`,
      })
    );
    return;
  }
  Path = `./${process.env.SECRET_PATH}/${req.query.path}`.replace(/\/\//g, "/");
  File = req.files.file;
  File.mv(`${Path}/${req.files.file.name}`);
  res.end(
    JSON.stringify({
      Success: true,
      Message: `Successfuly Uplaoded ${File}`,
    })
  );
});

app.get("/restart/:name", (req, res) => {
  pm2.restart(
    `${process.env.SECRET_PATH.toUpperCase()}_${req.params.name}`,
    function (err, apps) {
      if (err) {
        JSON.stringify(err);
      }
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Application Has Been Restarted",
        })
      );
    }
  );
});

app.get("/info/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  pm2.describe(
    `${process.env.SECRET_PATH.toUpperCase()}_${req.params.name}`,
    function (err, data) {
      if (err) {
        JSON.stringify(err);
      }
      const app = data[0].pm2_env;
      const Info = data[0];
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Successfuly Fetched Applications Info",
          Data: {
            App: {
              Name: Info.name,
              Version: Info.version,
              Uptime: Info.pm_uptime,
              Pid: Info.pid,
              Port: app.PORT,
              Status: app.status,
              NodeVersion: app.node_version,
              Entry: app.script,
              Out_file: app.out_file,
              Error_file: app.out_file,
            },
            Server: {
              CPU: Info.monit.cpu,
              Memory: Info.monit.memory,
              SystemDrive: app.SystemDrive,
              Os: app.OS,
              Processors: app.NUMBER_OF_PROCESSORS,
              ProcessorLevel: app.PROCESSOR_LEVEL,
              ProcessorArc: app.PROCESSOR_ARCHITECTURE,
            },
          },
        })
      );
    }
  );
});

app.get("/list-apps", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  SecureData = [];
  pm2.list((err, list) => {
    list.forEach((App) => {
      if (
        App.name
          .toUpperCase()
          .startsWith(`${process.env.SECRET_PATH.toUpperCase()}`)
      ) {
        SecureData.push({
          CPU: App.monit.cpu,
          Node_Version: App.pm2_env.node_version,
          Memory: App.monit.memory,
          Out_file: App.pm2_env.out_file,
          Error_file: App.pm2_env.out_file,
          App: {
            Name: App.name.replace(
              `${process.env.SECRET_PATH.toUpperCase()}_`,
              ""
            ),
            Pid: App.pid,
            Version: App.pm2_env.version,
            Entry: App.pm2_env.script,
            Status: App.pm2_env.status,
            Created: App.pm2_env.created_at,
            Created_Date: new Date(App.pm2_env.created_at).toLocaleString(),
          },
        });
      }
    });
    res.end(JSON.stringify(SecureData));
  });
});

app.get("/error_log/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (
    fs.existsSync(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strerr.log`
    )
  ) {
    fs.readFile(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strerr.log`,
      "utf8",
      function (err, log) {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Error Log",
            Data: log,
          })
        );
      }
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Could Not Fetch Error Logs",
      })
    );
  }
});

app.get("/log/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (
    fs.existsSync(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strout.log`
    )
  ) {
    fs.readFile(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strout.log`,
      "utf8",
      function (err, log) {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Error Log",
            Data: log,
          })
        );
      }
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Could Not Fetch Output Logs",
      })
    );
  }
});

app.post("/create_app", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (!req.body.name) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Could Not Find a Name for Application",
      })
    );
    return;
  }
  if (!req.body.main_entry) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Please provide a main entry file",
      })
    );
    return;
  }
  Name = req.body.name;
  MainEntry = req.body.main_entry;
  if (fs.existsSync(`./${process.env.SECRET_PATH}/${Name}`)) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: `Application ${Name} Already Exists`,
      })
    );
  } else {
    fs.mkdir(`./${process.env.SECRET_PATH}/${Name}`, function (err, data) {
      fs.open(
        `./${process.env.SECRET_PATH}/logs/${Name}.strerr.log`,
        "w",
        function () {
          fs.open(
            `./${process.env.SECRET_PATH}/logs/${Name}.strout.log`,
            "w",
            function () {
              InsertBase(Name, MainEntry);
              Sync()
                .then((data) => {
                  res.end(
                    JSON.stringify({
                      Success: true,
                      Message: `Successfuly Created Application`,
                    })
                  );
                })
                .catch((err) => {
                  res.end(
                    JSON.stringify({
                      Success: false,
                      Message:
                        "Looks Like An Error Occured Creating Discord Bot",
                    })
                  );
                });
            }
          );
        }
      );
    });
  }
});

app.get("/output_log/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  if (
    fs.existsSync(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strout.log`
    )
  ) {
    fs.readFile(
      `./${process.env.SECRET_PATH}/logs/${req.params.name}.strout.log`,
      "utf8",
      function (err, log) {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Error Log",
            Data: log,
          })
        );
      }
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Could Not Fetch Output Logs",
      })
    );
  }
});

app.get("/file_content", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Blocked = false;
  Blacklist.forEach((Content) => {
    if (req.query.path.toString().includes(Content)) {
      Blocked = true;
    }
  });
  if (Blocked) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Access Denied",
      })
    );
    return;
  }
  Path = `./${process.env.SECRET_PATH}/${req.query.path}`;
  if (fs.existsSync(Path)) {
    if (fs.lstatSync(Path).isDirectory()) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "You Can Not Open Folders",
        })
      );
    } else {
      fs.readFile(Path, "utf8", function (err, content) {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Fetched Error Log",
            Data: {
              Content: content,
            },
          })
        );
      });
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "This File Does Not Exist",
      })
    );
  }
});

app.get("/dirs", (req, res) => {
  Files = [];
  if (Blacklist.some((format) => req.query.path.includes(format))) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Attempt To Access Illegal/Private Directory",
      })
    );
    return;
  }
  Path = `./${process.env.SECRET_PATH}/${req.query.path}`.replace(/\/\//g, "/");
  if (fs.existsSync(Path)) {
    getFiles(Path, function (Data) {
      if (Data == false) {
        res.end(
          JSON.stringify({
            Success: false,
            Message: "Path is not a Folder/Directory",
          })
        );
        return;
      }
      Data.forEach((File) => {
        try {
          let Stats = fs.statSync(
            `./${process.env.SECRET_PATH}/${req.query.path}/${File.Name}`
          );
          Files.push({
            Name: File.Name,
            isDirectory: File.isDirectory,
            Stats: Stats,
          });
        } catch {}
      });
      res.end(
        JSON.stringify({
          Success: true,
          Message: `Successfuly Fetched Directories`,
          Data: Files,
        })
      );
    });
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Could Not Fetch Directories",
      })
    );
  }
});

app.post("/delete_logs", (req, res) => {
  if (
    fs.existsSync(
      `./${process.env.SECRET_PATH}/logs/${req.body.name}.strout.log`
    )
  ) {
    fs.writeFile(
      `./${process.env.SECRET_PATH}/logs/${req.body.name}.strout.log`,
      "",
      (err) => {
        if (err) throw err;
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Deleted Logs",
          })
        );
      }
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Logs file is broken or does not exist",
      })
    );
  }
});

app.post("/delete_error_logs", (req, res) => {
  if (
    fs.existsSync(
      `./${process.env.SECRET_PATH}/logs/${req.body.name}.strerr.log`
    )
  ) {
    fs.writeFile(
      `./${process.env.SECRET_PATH}/logs/${req.body.name}.strerr.log`,
      "",
      (err) => {
        if (err) throw err;
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Deleted Error Logs",
          })
        );
      }
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Logs file is broken or does not exist",
      })
    );
  }
});

app.post("/update_file", (req, res) => {
  if (!req.body.content) {
    res.end(
      JSON.stringify({
        Success: true,
        Message: "No File Content To Update Found",
      })
    );
    return;
  }
  Path = `./${process.env.SECRET_PATH}/${req.query.path}`.replace(
    /\/\//gi,
    "/"
  );
  if (fs.existsSync(Path)) {
    fs.writeFile(Path, req.body.content, (err) => {
      if (err) throw err;
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Successfuly Updated File",
        })
      );
    });
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "file is broken or does not exist",
      })
    );
  }
});

app.post("/update_main", (req, res) => {
  if (req.body.new_main) {
    if (req.body.name) {
      if (!req.body.new_main.toString().endsWith(".js")) {
        req.body.new_main = `${req.body.new_main}.js`;
      }
      Path = `./${process.env.SECRET_PATH}/${req.body.name}/package.json`;
      console.log(Path);
      if (fs.existsSync(Path)) {
        fs.readFile(Path, "utf8", (err, data) => {
          Data = JSON.parse(data);
          Data.main = req.body.new_main;
          if (
            !fs.existsSync(
              `./${process.env.SECRET_PATH}/${req.body.name}/${req.body.new_main}`
            )
          ) {
            fs.open(
              `./${process.env.SECRET_PATH}/${req.body.name}/${req.body.new_main}`,
              function (err, data) {}
            );
          }
          fs.writeFile(Path, JSON.stringify(Data, null, 4), (err, data) => {
            res.end(
              JSON.stringify({
                Success: true,
                Message: "Successfuly Updated",
                data: data,
              })
            );
          });
        });
      } else {
        res.end(
          JSON.stringify({
            Success: false,
            Message: "Bot Does Not Exist",
          })
        );
      }
    } else {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "No Bot Name Given/Found",
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "New Main Entry Not Found",
      })
    );
  }
});

app.post("/create_file", (req, res) => {
  if (req.body.path) {
    Path = `./${process.env.SECRET_PATH}/${req.body.path}`;
    if (fs.existsSync(Path) && fs.lstatSync(Path).isFile()) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "This File Already Exists",
        })
      );
    } else {
      fs.open(Path, "w", function () {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Created New File",
          })
        );
      });
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "File Path/Name is Missing",
      })
    );
  }
});

app.post("/create_folder", (req, res) => {
  NewFolderPath = `./${process.env.SECRET_PATH}/${req.body.path}`;
  if (req.body.path) {
    if (
      fs.existsSync(NewFolderPath) &&
      fs.lstatSync(NewFolderPath).isDirectory()
    ) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "This Directory Already Exists",
        })
      );
    } else {
      fs.mkdir(NewFolderPath, function () {
        res.end(
          JSON.stringify({
            Success: true,
            Message: "Successfuly Created New Folder",
          })
        );
      });
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Folder Path is Missing",
      })
    );
  }
});

app.post("/delete_path", (req, res) => {
  if (req.body.data) {
    Data = req.body.data;
    for (let index = 0; index < Data.length; index++) {
      let NewObject = Data[index];
      let ObjectPath = `./${process.env.SECRET_PATH}/${NewObject}`;
      if (ObjectPath == `./${process.env.SECRET_PATH}/logs`) {
        res.end(
          JSON.stringify({
            Success: false,
            Message: "Access Denied By Server.",
          })
        );
      }
      try {
        if (fs.lstatSync(ObjectPath).isDirectory()) {
          try {
            fs.rmdirSync(ObjectPath, { recursive: true, force: true });
          } catch (err) {
            console.error(err);
          }
        } else {
          try {
            fs.unlink(ObjectPath, (err) => {
              if (err) throw err;
            });
          } catch (err) {
            console.error(err);
          }
        }
      } catch {}
    }
    res.end(
      JSON.stringify({
        Success: true,
        Message: "Successfuly Deleted Files/Folders.",
      })
    );
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "No Folder/Files Proivded To Delete",
      })
    );
  }
});

const GetSSDChartData = new Promise(function (resolve, reject) {
  getDirectories(`./${process.env.SECRET_PATH}`, function (Data) {
    StorageNames = [];
    StorageSizes = [];
    StorageNames = StorageNames.filter(function (e) {
      return e != null;
    });
    StorageSizes = StorageSizes.filter(function (e) {
      return e != null;
    });

    for (let i = 0; i < Data.length; i++) {
      const appFolder = Data[i];
      if (appFolder == "logs") continue;
      fastFolderSize(
        `./${process.env.SECRET_PATH}/${appFolder}`,
        function (err, bytes) {
          StorageSizes.push(bytes / 100000);
          StorageNames.push(appFolder);
        }
      );
    }
    resolve({ Names: StorageNames, Sizes: StorageSizes });
  });
});

async function FreeStoragePush(data) {
  return new Promise((resolve, reject) => {
    Sizes = [];
    Names = [];
    Sizes = data.Sizes;
    Names = data.Names;
    Names = Names.filter(function (e) {
      return e != null;
    });
    Sizes = Sizes.filter(function (e) {
      return e != null;
    });

    Sizes.push(
      parseFloat(process.env.MAXIMUM_SSD_BYTES) / 1000000 -
        parseFloat(data.Sizes.reduce((a, b) => a + b, 0))
    );
    Names.push("Free");
    resolve({ Names: Names, Sizes: Sizes });
  });
}

app.get("/ssd_chart", (req, res) => {
  GetSSDChartData.then((data) => {
    FreeStoragePush(data).then((new_data) => {
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Successfuly Fetched Data",
          Data: {
            Names: new_data.Names,
            Sizes: new_data.Sizes,
          },
        })
      );
    });
  }).catch((err) => {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "An Error Occured",
      })
    );
  });
});

app.post("/delete_app", (req, res) => {
  if (req.body.name) {
    if (fs.existsSync(`./${process.env.SECRET_PATH}/${req.body.name}`)) {
      fs.unlink(
        `./${process.env.SECRET_PATH}/logs/${req.body.name}.strout.log`,
        function (err, data) {}
      );
      fs.unlink(
        `./${process.env.SECRET_PATH}/logs/${req.body.name}.strerr.log`,
        function (err, data) {}
      );
      pm2.stop(
        `${process.env.SECRET_PATH.toUpperCase()}_${req.body.name}`,
        function (err, info) {
          pm2.delete(
            `${process.env.SECRET_PATH.toUpperCase()}_${req.body.name}`
          );
          if (err) {
            res.end(
              JSON.stringify({
                Success: false,
                Message: "An Error Occured While Deleting App",
              })
            );
          } else {
            Sync()
              .then((data) => {
                fs.rmdirSync(`./${process.env.SECRET_PATH}/${req.body.name}`, {
                  recursive: true,
                  force: true,
                });
                res.end(
                  JSON.stringify({
                    Success: true,
                    Message: "Successfuly Deleted Discord Bot",
                  })
                );
              })
              .catch((err) => {
                res.end(
                  JSON.stringify({
                    Success: false,
                    Message: "Looks Like An Error Occured Deleting Discord Bot",
                  })
                );
              });
          }
        }
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "No Name Given",
      })
    );
  }
});

app.get("/npm_install/:name", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Path = `./${process.env.SECRET_PATH}/${req.params.name}`;
  if (fs.existsSync(Path)) {
    if (fs.lstatSync(Path).isDirectory()) {
      if (req.params.name) {
        Terminal(`cd ${Path} && npm install`)
          .then((data) => {
            res.end(
              JSON.stringify({
                Success: true,
                Message: "Successfuly Installed All Modules",
                Data: data,
              })
            );
          })
          .catch((err) => {
            res.end(
              JSON.stringify({
                Success: false,
                Message: `An Error Occured While Trying To Install Modules For ${req.params.name}`,
              })
            );
          });
      } else {
        res.end(
          JSON.stringify({
            Success: false,
            Message: "No Bot Name Found",
          })
        );
      }
    } else {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "Illegal Attempt To Run Npm Install on a File",
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "App Directory is Broken Or Does Not Exist",
      })
    );
  }
});

app.get("/dir_size/:path", async (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Path = `./${process.env.SECRET_PATH}/${req.params.path}`;
  if (fs.existsSync(Path)) {
    if (fs.lstatSync(Path).isDirectory()) {
      fastFolderSize(Path, (err, bytes) => {
        if (err) {
          throw err;
        }
        getFiles(Path, function (data) {
          res.end(
            JSON.stringify({
              Success: true,
              Message: "Successfuly Fetched Directory Data",
              Data: {
                Size: bytes,
                TotalStorage: parseFloat(process.env.MAXIMUM_SSD_BYTES),
                TotalRam: parseFloat(process.env.MAXIMUM_RAM_BYTES),
                Objects: data,
              },
            })
          );
        });
      });
    } else {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "Illegal Attempt To Run Npm Install on a File",
        })
      );
    }
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "App Directory is Broken Or Does Not Exist",
      })
    );
  }
});

let FetchSSDUsage = new Promise(function (resolve, reject) {
  PrimaryData = [];
  try {
    getFiles(`./${process.env.SECRET_PATH}`, function (files) {
      files.forEach((file) => {
        FilePath = `./${process.env.SECRET_PATH}/${file.Name}`;
        if (file.isDirectory == true) {
          fastFolderSize(`${FilePath}`, function (err, Bytes) {
            if (err) {
              console.log(err);
            }
            PrimaryData.push({
              Name: file.Name,
              isDirectory: file.isDirectory,
              Path: `./${process.env.SECRET_PATH}/${file.Name}`,
              Stats: {
                Size: Bytes,
              },
            });
          });
        } else {
          fs.stat(FilePath, function (err, stats) {
            PrimaryData.push({
              Name: file.Name,
              isDirectory: file.isDirectory,
              Path: `./${process.env.SECRET_PATH}/${file.Name}`,
              Stats: {
                Size: stats.size,
              },
            });
          });
        }
      });
      resolve(PrimaryData);
    });
  } catch (err) {
    reject(err);
  }
});

app.get("/ssd_usage", async (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  fastFolderSize(".", (err, Storage) => {
    if (err) {
      throw err;
    }
    Total = parseFloat(process.env.MAXIMUM_SSD_BYTES) / 1000;
    Free = Total - Storage / 1000;
    res.end(
      JSON.stringify({
        Success: true,
        Message: "SSD Usage Fetched in KiloBytes",
        Data: {
          Total: Total,
          Free: Free,
          Used: Storage / 100,
          Percent: {
            Used:
              parseFloat((((Storage / 1000) * 100) / Total).toFixed(2)) || 0,
            Free: parseFloat(((Free * 100) / Total).toFixed(2)) || 0,
          },
        },
      })
    );
  });
});

app.get("/file/:name", (req, res) => {
  res.sendFile(`./public/${req.params.name}`, { root: __dirname });
});
app.get("/edit", (req, res) => {
  res.sendFile(`./public/edit.html`, { root: __dirname });
});
app.get("/tailwinds", (req, res) => {
  res.sendFile(`./public/tailwinds.css`, { root: __dirname });
});
app.get("/favicon.png", (req, res) => {
  res.sendFile(`./public/favicon.png`, { root: __dirname });
});
app.get("/file_manager", (req, res) => {
  res.sendFile(`./public/file_manager.html`, { root: __dirname });
});
app.get("/javascript", (req, res) => {
  res.sendFile(`./public/index.js`, { root: __dirname });
});
app.get("/css", (req, res) => {
  res.sendFile(`./public/index.css`, { root: __dirname });
});
app.get("/show_log", (req, res) => {
  res.sendFile(`./public/show_log.html`, { root: __dirname });
});
app.get("/show_error_log", (req, res) => {
  res.sendFile(`./public/show_error_log.html`, { root: __dirname });
});
app.get("/system", (req, res) => {
  System.diskLayout().then((data) => {
    res.end(JSON.stringify(data));
  });
});
app.get("/reload_apps", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (!req.session.username) {
      res.end(
        JSON.stringify({
          Success: false,
          Message: process.env.LOGIN_REQUIRED_MESSAGE,
        })
      );
      return;
    }
  }
  Sync()
    .then((data) => {
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Dashboard Has Been Synced & Repaired",
          Data: data,
        })
      );
    })
    .catch((err) => {
      res.end(
        JSON.stringify({
          Success: false,
          Message: "Unknown Error Occured",
        })
      );
    });
});

app.get("/", (req, res) => {
  if (process.env.LOGIN_REQUIRED == "true") {
    if (req.session) {
      if (req.session.username) {
        res.sendFile(`./public/index.html`, { root: __dirname });
      } else {
        res.sendFile(`./public/login.html`, { root: __dirname });
      }
    } else {
      res.sendFile(`./public/login.html`, { root: __dirname });
    }
  } else {
    res.sendFile(`./public/index.html`, { root: __dirname });
  }
});

app.post("/login", (req, res) => {
  if (!req.body.username) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "No Username Given",
      })
    );
    return;
  }
  if (!req.body.username) {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "You forgot to give a password",
      })
    );
    return;
  }
  if (
    req.body.username == process.env.ADMIN_USERNAME &&
    req.body.password == process.env.ADMIN_PASSWORD
  ) {
    req.session.username = req.body.username;
    req.session.save(function (err) {
      res.end(
        JSON.stringify({
          Success: true,
          Message: "Successfuly Logged in",
        })
      );
    });
  } else {
    res.end(
      JSON.stringify({
        Success: false,
        Message: "Wrong Username/Password",
      })
    );
  }
});

Initialize.then((data) => {
  if (process.env.PORT) {
    app.listen(process.env.PORT, () => {
      console.log(
        chalk.cyan(
          `〚✇〛Dashboard Is Open On http://localhost:${process.env.PORT}`
        )
      );
    });
  } else {
    console.log(chalk.red(`Valid Port Not Found`));
  }
}).catch((err) => {
  console.log(chalk.red(`Initializing Error ${err}`));
});
