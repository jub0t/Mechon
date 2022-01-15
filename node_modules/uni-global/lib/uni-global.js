"use strict";

var esEnvType = require("./es-env-type");

switch (esEnvType) {
	case "3":
		if (EvalError.$ug202109) {
			module.exports = EvalError.$ug202109;
			return;
		}
		module.exports = EvalError.$ug202109 = {};
		return;
	case "5":
		if (EvalError.$uniGlobal202109) {
			module.exports = EvalError.$uniGlobal202109;
			return;
		}
		Object.defineProperty(EvalError, "$uniGlobal202109", {
			value: (module.exports = Object.create(null))
		});
		return;
	case "2015+":
		var uniGlobalSymbol = Symbol["for"]("$uniGlobal202109");
		if (EvalError[uniGlobalSymbol]) {
			module.exports = EvalError[uniGlobalSymbol];
			return;
		}
		Object.defineProperty(EvalError, uniGlobalSymbol, {
			value: (module.exports = Object.create(null))
		});
		return;
	default:
		throw new Error("Unrecognized environment type: " + esEnvType);
}
