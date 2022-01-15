"use strict";

var uniGlobal = require("uni-global")("medikoo/log/202110");

if (uniGlobal.emitter) {
	module.exports = uniGlobal.emitter;
	return;
}

var ee = require("event-emitter");

// Emitter of log events on which log writers depend
module.exports = uniGlobal.emitter = ee();
