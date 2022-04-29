var express = require("express");
var router = express.Router();
var fs = require("fs");
var up = __dirname.replace("routes", "");
function content(path) {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
}
router.get("/ram", function (req, res) {
    res.json(content("".concat(up, "/database/ram_usage.json")));
});
router.get("/cpu", function (req, res) {
    res.json(content("".concat(up, "/database/cpu_usage.json")));
});
router.get("/all", function (req, res) {
    res.json({
        ram: content("".concat(up, "/database/ram_usage.json")),
        cpu: content("".concat(up, "/database/cpu_usage.json")),
    });
});
router.post("/reset", function (req, res) {
    try {
        fs.writeFileSync("".concat(up, "/database/ram_usage.json"), JSON.stringify({ data: { ram: [], timestamps: [] } }));
        fs.writeFileSync("".concat(up, "/database/cpu_usage.json"), JSON.stringify({ data: { cpu: [], timestamps: [] } }));
        res.end(JSON.stringify({
            Success: true,
            Message: "Successfuly Reset logs",
        }));
    }
    catch (_a) {
        res.end(JSON.stringify({
            Success: false,
            Message: "An internal server error occured",
        }));
    }
});
module.exports = router;
