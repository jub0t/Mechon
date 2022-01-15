"use strict";

var ensureString = require("type/string/ensure")
  , uniGlobal    = require("./lib/uni-global");

var objHasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = function (key) {
	key = ensureString(key, { name: "key" });
	if (objHasOwnProperty.call(uniGlobal, key)) return uniGlobal[key];
	var value = Object.create ? Object.create(null) : {};
	uniGlobal[key] = value;
	return value;
};
