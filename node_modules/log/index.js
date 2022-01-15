"use strict";

var loggerPrototype = require("./lib/private/logger-prototype");

// Exports "info" level logger as a starting point
module.exports = loggerPrototype._createLevel("info");
