require("dotenv").config();
var IGNORE = ["misc", "test.js", "index.js"];
var path = require("path");
var pm2 = require("pm2");
var INCLUDE = ["cache"];
var fs = require("fs");
var GREPPER = {};
pm2.connect(function (err) {
    if (err) {
        process.exit(2);
    }
});
function __Search(dir) {
    require("fs")
        .readdirSync(dir)
        .forEach(function (file) {
        if (IGNORE.includes(file)) {
            return;
        }
        var stat = fs.statSync(path.join(dir, file));
        if (stat.isFile() || INCLUDE.indexOf(file) !== -1) {
            GREPPER[file.replace(".js", "")] = require(dir + "/" + file);
        }
        else if (stat.isDirectory()) {
            __Search(path.join(dir, file));
        }
    });
}
__Search(__dirname);
for (var name_1 in GREPPER) {
    var exporter = GREPPER[name_1];
    if (Object.prototype.hasOwnProperty.call(exporter, "func")) {
        module.exports[name_1] = GREPPER.wrap.wrapExport(exporter.func, exporter.required || [], exporter.optional || []);
    }
    else {
        module.exports[name_1] = GREPPER[name_1];
    }
}
