const { remotes } = require("../../devices.json");
const { triggerDevice } = require("../device");
const { callHomeFunction } = require("../homeFunctions");

const handleRemoteControl = ({
  id,
  btn: pressedButton,
  battLow: isBatteryLow,
}) => {
  const remoteControl = remotes.find((remote) => remote.id === id);
  if (!remoteControl) return console.log(`Remote control #${id} not found`);
  const action = remoteControl.actions?.find(
    ({ button }) => button === pressedButton
  );
  if (!action)
    return console.log(
      `Action not found for button ${pressedButton} on remote control #${id} (${remoteControl.name})`
    );

  if (isBatteryLow)
    console.log(
      `Remote control #${id} (${remoteControl.name}) is low on battery`
    );

  if (action.homeFunction) {
    const { arguments, name } = action.homeFunction;

    const functionsArgs = Array.isArray(arguments) ? arguments : [arguments];
    callHomeFunction(name,...functionsArgs);
  } else {
    triggerDevice(action.device, action.action);
  }
};

exports.handleRemoteControl = handleRemoteControl;
