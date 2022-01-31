const { readdir, stat } = require("fs/promises");
const Terminal = require("system-commands");
const SETTINGS = require("./settings.json");
const chalk = require("chalk");
const path = require("path");
const pm2 = require("pm2");
require("dotenv").config();
const fs = require("fs");

const randomString = (count) => {
  const letter =
    "0123456789~!@#$%^&*()_+}{[]|abcdefghikjlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  for (let i = 0; i < count; i++) {
    const randomStringNumber = Math.floor(
      1 + Math.random() * (letter.length - 1)
    );
    randomString += letter.substring(
      randomStringNumber,
      randomStringNumber + 1
    );
  }
  return randomString;
};

function GeneratePassword() {
  return `${randomWord()}${randomString(5)}`;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function randomWord() {
  Wordlist = require("./wordlist.json").words;
  return `${capitalizeFirstLetter(
    Wordlist[Math.floor(Math.random() * Wordlist.length)]
  )}`;
}

function randomPort(min = 2000, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

getDirectories = (source, callback) =>
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err);
    } else {
      callback(
        files
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name)
      );
    }
  });

const StopAll = new Promise(function (resolve, rej) {
  pm2.list((err, list) => {
    list.forEach((App) => {
      if (fs.existsSync(`./${process.env.SECRET_PATH}/${App.name}`)) {
        pm2.stop(App.name);
      } else {
        pm2.delete(App.name);
      }
    });
    resolve(`〚✔〛Successfuly Stoppped All Applications`);
  });
});

async function Start(Folder) {
  return new Promise((resolve, reject) => {
    if (SETTINGS.IGNORE_DIRECTORY.includes(Folder.toLowerCase())) {
      resolve(`〚✘〛Log Folders Was Ignored`);
      return;
    }
    console.log(chalk.blue(`〚≡〛Starting ${Folder}, Please Wait...`));
    if (!fs.existsSync(`./${process.env.SECRET_PATH}/${Folder}/node_modules`)) {
      Terminal(`cd ./${process.env.SECRET_PATH}/${Folder} && npm install`)
        .then((data) => {})
        .catch((err) => {});
    }
    PackageFile = `./${process.env.SECRET_PATH}/${Folder}/package.json`;
    if (fs.existsSync(PackageFile)) {
      fs.readFile(PackageFile, "utf8", function (err, data) {
        if (err) {
          console.error(err);
        }
        Package = JSON.parse(data);
        pm2.start({
          name: `${process.env.SECRET_PATH.toUpperCase()}_${Folder}`,
          detached: true,
          min_uptime: 5000,
          watch_delay: 5000,
          autorestart: false,
          exp_backoff_restart_delay: 100,
          max_restarts: process.env.MAX_RELOADS,
          restart_delay: process.env.RESTART_DELAY,
          script: `./${process.env.SECRET_PATH}/${Folder}/${Package.main}`,
          out_file: `./${process.env.SECRET_PATH}/logs/${Folder}.strout.log`,
          error_file: `./${process.env.SECRET_PATH}/logs/${Folder}.strerr.log`,
          max_memory_restart: `${
            parseFloat(process.env.MAXIMUM_RAM_BYTES) / 1000000
          }`,
          node_args: [],
        });
      });
    }
    resolve(`〚✔〛Successfuly Started ${Folder}`);
  });
}

async function Sync() {
  return new Promise((resolve, reject) => {
    StopAll.then((data) => {
      getDirectories(`./${process.env.SECRET_PATH}`, function (Data) {
        console.log(
          chalk.blue(`〚≡〛Syncing Applications, ${Data.length} in Queue...`)
        );
        new Promise((res, rej) => {
          Data.forEach((Folder) => {
            Start(Folder)
              .then((data) => {
                console.log(chalk.green(data));
              })
              .catch((err) => {
                console.log(chalk.red(err));
              });
          });
          resolve(`〚✔〛Successfuly Synced`);
        });
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

Initialize = new Promise(function (resolve, reject) {
  console.log(chalk.blue(`〚≡〛Initializing Dashboard, Please Wait`));
  EnvData = `PORT=${randomPort()}
MAX_RELOADS=5
USE_SSL=false
ADMIN_USERNAME=${randomWord()}
ADMIN_PASSWORD=${GeneratePassword()}
LOGIN_REQUIRED=true
MAX_LOG_LINES=1500
RESTART_DELAY=1000
MAX_FILE_UPLOAD_SIZE=500
SECRET_PATH=${randomWord()}${randomWord()}
MAXIMUM_RAM_BYTES=512000000
MAXIMUM_SSD_BYTES=20000000000
LOGIN_REQUIRED_MESSAGE=Please Login To Complete This Action`;
  if (!fs.existsSync(`.env`)) {
    fs.open(`.env`, "w", function (err, data) {
      console.log(chalk.green(`〚✔〛Successfuly Generated .env`));
      fs.writeFile(`.env`, EnvData, (err) => {
        if (err) {
          console.log(chalk.red(`Error Occured ${err}`));
        }
        console.log(chalk.green(`〚✔〛Successfuly Wrote Data To .env`));
        require("dotenv").config();
        if (process.env.SECRET_PATH) {
          if (!fs.existsSync(`./${process.env.SECRET_PATH}`)) {
            fs.mkdirSync(`./${process.env.SECRET_PATH}`);
            if (!fs.existsSync(`./${process.env.SECRET_PATH}/logs`)) {
              fs.mkdirSync(`./${process.env.SECRET_PATH}/logs`);
            }
            if (!fs.existsSync(`./${process.env.SECRET_PATH}/Master`)) {
              fs.mkdir(
                `./${process.env.SECRET_PATH}/Master`,
                function (err, data) {
                  console.log(chalk.blue(`〚≡〛Creating Master Base Code...`));
                  InsertBase("Master", "Index.js");
                  console.log(
                    chalk.green(`〚✔〛Successfuly Created Master Branch`)
                  );
                  console.log(
                    chalk.blue(`〚≡〛Installing Modules For Master...`)
                  );
                  Terminal(
                    `cd ./${process.env.SECRET_PATH}/Master && npm install`
                  )
                    .then((data) => {
                      console.log(
                        chalk.green(
                          `〚✔〛Successfuly Installed Modules For Master`
                        )
                      );
                      console.log(
                        chalk.blue(`〚≡〛Syncing Dashboard, Please Wait...`)
                      );
                      console.log(
                        chalk.green(`〚✔〛Dashboard is Ready To Be Used`)
                      );
                      resolve(`Dashboard is Ready To Be Used`);
                      Sync()
                        .then((data) => {
                          console.log(
                            chalk.green(`〚✔〛Successfuly Synced Dashboard`)
                          );
                        })
                        .catch((err) => {
                          console.log(chalk.red(`Error Ocured ${err}`));
                        });
                    })
                    .catch((err) => {
                      console.log(
                        chalk.red(
                          `An Error Occured While Installing Modules For Master`
                        )
                      );
                    });
                }
              );
            }
          }
        }
      });
    });
  } else {
    Sync()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject(`Sync Error ${err}`);
      });
  }
  if (!fs.existsSync(`./server.bat`)) {
    console.log(chalk.blue(`〚≡〛Creating Server Startup File...`));
    fs.open(`./server.bat`, "w", function (err, data) {
      fs.writeFile(
        `./server.bat`,
        `forever start ${__dirname}/index.js`,
        (err) => {
          if (err) throw err;
          console.log(
            chalk.green(`〚✔〛Successfuly Created Headless Server Startup File`)
          );
        }
      );
    });
  }
  if (fs.existsSync("./tailwind.config.js")) {
    if (fs.existsSync(`./BaseTemplate/tailwind.config.js`)) {
      try {
        fs.unlinkSync(`./BaseTemplate/tailwind.config.js`);
      } catch (err) {
        console.log(chalk.red(`Error: ${err}`));
      }
    }
    console.log(chalk.blue(`〚≡〛Backing Up Tailwinds Config...`));
    fs.copyFile(
      "./tailwind.config.js",
      "./BaseTemplate/tailwind.config.js",
      (err) => {
        if (err) {
          console.log(chalk.red(`Error: ${err}`));
        }
        console.log(chalk.green(`〚✔〛Successfuly Backed Up Tailwinds Config`));
      }
    );
  }
});

pm2.connect(function (err) {
  if (err) {
    process.exit(2);
  }
});

function getFiles(source, callback) {
  if (fs.existsSync(source)) {
    if (fs.lstatSync(`${source}`).isDirectory()) {
      data = [];
      fs.readdir(source, { withFileTypes: true }, (err, files) => {
        files.forEach((file) => {
          json = JSON.parse(JSON.stringify(file));
          data.push({ Name: json.name, isDirectory: file.isDirectory() });
        });
        if (err) {
          callback(err);
        } else {
          callback(data);
        }
      });
    } else {
      return callback(false);
    }
  }
}

const dirSize = async (directory) => {
  const files = await readdir(directory);
  const stats = files.map((file) => stat(path.join(directory, file)));
  return (await Promise.all(stats)).reduce(
    (accumulator, { size }) => accumulator + size,
    0
  );
};

function InsertBase(path_name, main_entry) {
  if (!main_entry.endsWith(".js")) {
    main_entry = `${main_entry}.js`;
  }
  PackageJsonBase = {
    name: path_name,
    version: "1.0.0",
    description: "",
    main: main_entry,
    scripts: {},
    keywords: [],
    license: "MIT",
    author: "Rigby#6654 From Zephyr",
    dependencies: {
      "discord.js": "^13.5.1",
    },
  };
  EntryPath = `./${process.env.SECRET_PATH}/${path_name}/${main_entry}`.replace(
    /\/\//g,
    "/"
  );
  Readme = `./${process.env.SECRET_PATH}/${path_name}/README.md`.replace(
    /\/\//g,
    "/"
  );
  fs.open(EntryPath, "w", function () {
    fs.open(EntryPath, "w", function () {
      fs.readFile("./BaseTemplate/index.js", function (err, data) {
        fs.writeFile(EntryPath, data, function (err) {
          if (err) return console.error(err);
          fs.open(
            `./${process.env.SECRET_PATH}/${path_name}/package.json`,
            "w",
            function () {
              fs.writeFile(
                `./${process.env.SECRET_PATH}/${path_name}/package.json`,
                JSON.stringify(PackageJsonBase, null, 4),
                function (err) {
                  if (err) return console.error(err);
                  fs.copyFile(`./BaseTemplate/readme.md`, Readme, (err) => {
                    if (err) throw err;
                    Terminal(
                      `cd ./${process.env.SECRET_PATH}/${path_name} && npm install`
                    )
                      .then((data) => {})
                      .catch((err) => {});
                    Sync()
                      .then((data) => {
                        console.log(
                          chalk.green(
                            `〚✔〛Successfuly Created New Bot: ${path_name}, Entry: ${main_entry}`
                          )
                        );
                        return true;
                      })
                      .catch((err) => {
                        return err;
                      });
                  });
                }
              );
            }
          );
        });
      });
    });
  });
}

module.exports = {
  getDirectories: getDirectories,
  InsertBase: InsertBase,
  Initialize: Initialize,
  getFiles: getFiles,
  dirSize: dirSize,
  Sync: Sync,
};
