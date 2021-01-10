const { client, TOPICS } = require("./client");
const { devices } = require("../../devices.json");
const { cloudEmitter, events } = require("../cloudEmiter");
const { handleRemoteControl } = require("../remoteControl");

const initMqtt = () => {
  client.on("connect", () => {
    devices.forEach(({ id }) => {
      client.subscribe(TOPICS.deviceState.replace(":device", id));
    });
    client.subscribe(TOPICS.remoteControl);

    client.on("message", (topic, message) => {
      const deviceState = devices.find(
        ({ id }) => topic === TOPICS.deviceState.replace(":device", id)
      );
      if (deviceState) {
        cloudEmitter.emit(events.GET_DEVICE_STATE_RESPONSE, {
          deviceId: deviceState.id,
          state: {
            on: message.toString() === "1",
          },
        });
      } else if (topic === TOPICS.remoteControl) {
        handleRemoteControl(JSON.parse(message));
      }
    });
  });
};
exports.initMqtt = initMqtt;
