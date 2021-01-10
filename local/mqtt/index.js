const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://192.168.0.50");
const { devices, remotes } = require("../../devices.json");
const { cloudEmitter, events } = require("../cloudEmiter");
const TOPICS = {
  remoteControl: "home/remote-control/new",
  setDeviceState: "home/:device/onOff/set",
  getDeviceState: "home/:device/onOff/get",
  deviceState: "home/:device/onOff",
};

client.on("connect", () => {
  devices.forEach(({ id }) => {
    client.subscribe(TOPICS.deviceState.replace(":device", id));
  });

  client.on("message", (topic, message) => {
    const deviceState = devices.find(
      ({ id }) => topic === TOPICS.deviceState.replace(":device", id)
    );
    if (deviceState) {
      console.log("deviceState", message.toString());
      cloudEmitter.emit(events.GET_DEVICE_STATE_RESPONSE, {
        deviceId: deviceState.id,
        state: {
          on: message.toString() === "1",
        },
      });
    }

    if (topic === TOPICS.remoteControl) {
      onRemoteControl(JSON.parse(message));
    }
  });
});

const onRemoteControl = ({ id, btn: pressedButton, battLow: isBatteryLow }) => {
  const remoteControl = remotes.find((remote) => remote.id === id);
  if (!remoteControl) return console.log("Remote not found");
  const action = remoteControl.actions?.find(
    ({ button }) => button === pressedButton
  );
  if (!action) return console.log("Action not found");

  triggerDevice(action.device, action.action);
};

const triggerDevice = (id, action) => {
  console.log("Trigger", id, " with action", action);
  client.publish(TOPICS.setDeviceState.replace(":device", id), action);
};

exports.triggerDevice = triggerDevice;

const queryDeviceState = (deviceId) => {
  client.publish(TOPICS.getDeviceState.replace(":device", deviceId), "");
};
exports.queryDeviceState = queryDeviceState;
