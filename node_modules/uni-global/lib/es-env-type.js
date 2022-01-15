"use strict";

if (!Object.defineProperty || !Object.create) module.exports = "3";
else if (typeof Symbol === "function" && Symbol["for"]) module.exports = "2015+";
else module.exports = "5";
