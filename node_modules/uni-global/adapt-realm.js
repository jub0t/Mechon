"use strict";

var ensureObject  = require("type/object/ensure")
  , toShortString = require("type/lib/to-short-string")
  , esEnvType     = require("./lib/es-env-type")
  , uniGlobal     = require("./lib/uni-global");

module.exports = function (realmGlobal) {
	ensureObject(realmGlobal, { name: "realmGlobal" });
	if (typeof realmGlobal.EvalError !== "function") {
		throw new TypeError("Expected a realm global recieved: " + toShortString(realmGlobal));
	}

	switch (esEnvType) {
		case "3":
			if (realmGlobal.EvalError.$ug202109) {
				if (realmGlobal.EvalError.$ug202109 === uniGlobal) return;
				throw new Error("Cannot adapt realm, as it already has uni-global defined");
			}
			realmGlobal.EvalError.$ug202109 = uniGlobal;
			return;
		case "5":
			if (realmGlobal.EvalError.$uniGlobal202109) {
				if (realmGlobal.EvalError.$uniGlobal202109 === uniGlobal) return;
				throw new Error("Cannot adapt realm, as it already has uni-global defined");
			}
			Object.defineProperty(realmGlobal.EvalError, "$uniGlobal202109", { value: uniGlobal });
			return;
		case "2015+":
			var uniGlobalSymbol = Symbol["for"]("$uniGlobal202109");
			if (realmGlobal.EvalError[uniGlobalSymbol]) {
				if (realmGlobal.EvalError[uniGlobalSymbol] === uniGlobal) return;
				throw new Error("Cannot adapt realm, as it already has uni-global defined");
			}
			Object.defineProperty(realmGlobal.EvalError, uniGlobalSymbol, { value: uniGlobal });
			return;
		default:
			throw new Error("Unrecognized environment type: " + esEnvType);
	}
};
