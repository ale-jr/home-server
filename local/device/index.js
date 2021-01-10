const { client, TOPICS } = require("../mqtt/client");

const triggerDevice = (id, action) => {
  console.log("Trigger", id, " with action", action);
  client.publish(TOPICS.setDeviceState.replace(":device", id), action);
};
exports.triggerDevice = triggerDevice;

const queryDeviceState = (deviceId) => {
  client.publish(TOPICS.getDeviceState.replace(":device", deviceId), "");
};
exports.queryDeviceState = queryDeviceState;
