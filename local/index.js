require("dotenv").config();
const { initWebsocket } = require("./cloudEmiter");
const { initMqtt } = require("./mqtt");
require("./googleActions");

initWebsocket();
initMqtt();
