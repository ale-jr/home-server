const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://192.168.0.50");
exports.client = client;

const TOPICS = {
  remoteControl: "home/remote-control/new",
  setDeviceState: "home/:device/onOff/set",
  getDeviceState: "home/:device/onOff/get",
  deviceState: "home/:device/onOff",
};

exports.TOPICS = TOPICS;
