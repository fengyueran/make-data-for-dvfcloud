const path = require("path");
const loginConfig = require("./config/login-config.json");
const formatCases = require("./make-case-for-dvfcloud");

const dist = path.join(__dirname, `../dist/${loginConfig.username}/data`);

formatCases(dist);
