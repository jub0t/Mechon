var Modules = require("../modules/loader");
var up = __dirname.replace("routes", "");
var express = require("express");
var router = express.Router();
var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
router.get("/:name", function (req, res) {
    var Path = "".concat(up, "/public/").concat(req.params.name);
    if (fs.existsSync(Path)) {
        res.sendFile(Path);
    }
    else {
        res.end("This file does not exist");
    }
});
module.exports = router;
