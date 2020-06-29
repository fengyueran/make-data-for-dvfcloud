const path = require("path");
const config = require("./config/login-config.json");
const formatCases = require("./make-case-for-dvfcloud");

const dist = path.join(__dirname, `../dist/${config.username}/data`);

formatCases(dist);
