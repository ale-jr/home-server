const { triggerDevice } = require("../device");
const lightTimeout = (deviceId, time) => {
  triggerDevice(deviceId, "on");
  setTimeout(() => {
    triggerDevice(deviceId, "off");
  }, time);
};
exports.lightTimeout = lightTimeout;
