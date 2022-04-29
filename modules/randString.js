require("dotenv").config();
var _a = require("fs/promises"), readdir = _a.readdir, stat = _a.stat;
var Terminal = require("system-commands");
var chalk = require("chalk");
var path = require("path");
var pm2 = require("pm2");
var fs = require("fs");
module.exports = function (count) {
    var letter = "0123456789~!@#$%^&*()_+}{[]|abcdefghikjlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var randomString = "";
    for (var i = 0; i < count; i++) {
        var randomStringNumber = Math.floor(1 + Math.random() * (letter.length - 1));
        randomString += letter.substring(randomStringNumber, randomStringNumber + 1);
    }
    return randomString;
};
