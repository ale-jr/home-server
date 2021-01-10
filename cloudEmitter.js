const events = {
  GET_DEVICE_STATE: "GET_DEVICE_STATE",
  GET_DEVICE_STATE_RESPONSE: "GET_DEVICE_STATE_RESPONSE",
  UPDATE_DEVICE_STATE: "UPDATE_DEVICE_STATE",
  GET_ALL_DEVICES: "GET_ALL_DEVICES",
  GET_ALL_DEVICES_RESPONSE: "GET_ALL_DEVICES_RESPONSE",
};
exports.events = events;

exports.localListeners = [
  events.GET_DEVICE_STATE_RESPONSE,
  events.GET_ALL_DEVICES_RESPONSE,
];
exports.cloudListeners = [
  events.GET_DEVICE_STATE,
  events.UPDATE_DEVICE_STATE,
  events.GET_ALL_DEVICES,
];
