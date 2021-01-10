const { remotes } = require("../../devices.json");
const { triggerDevice } = require("../device");

const handleRemoteControl = ({
  id,
  btn: pressedButton,
  battLow: isBatteryLow,
}) => {
  const remoteControl = remotes.find((remote) => remote.id === id);
  if (!remoteControl) return console.log("Remote not found");
  const action = remoteControl.actions?.find(
    ({ button }) => button === pressedButton
  );
  if (!action) return console.log("Action not found");

  triggerDevice(action.device, action.action);
};

exports.handleRemoteControl = handleRemoteControl;
