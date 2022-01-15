"use strict";

var toShortString = require("type/lib/to-short-string")
  , uniGlobal     = require("uni-global")("medikoo/log/202110");

module.exports = function () { return uniGlobal.masterWriter || null; };
module.exports.register = function (writer) {
	if (uniGlobal.masterWriter) {
		throw new Error("Cannot register: Master log writer already registered");
	}
	if (!writer || typeof writer.writeMessage !== "function") {
		throw new Error(toShortString(writer) + "is not a LogWriter instance");
	}
	return (uniGlobal.masterWriter = writer);
};
