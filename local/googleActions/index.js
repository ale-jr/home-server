const { cloudEmitter, events } = require("../cloudEmiter");
const { devices } = require("../../devices.json");
const { triggerDevice, queryDeviceState } = require("../device");

cloudEmitter.on(events.GET_ALL_DEVICES, () => {
  cloudEmitter.emit(events.GET_ALL_DEVICES_RESPONSE, devices);
});

cloudEmitter.on(events.UPDATE_DEVICE_STATE, ({ deviceId, state }) => {
  triggerDevice(deviceId, state ? "on" : "off");
});

cloudEmitter.on(events.GET_DEVICE_STATE, (deviceId) => {
  queryDeviceState(deviceId);
});
