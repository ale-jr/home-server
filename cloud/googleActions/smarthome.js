const { smarthome } = require("actions-on-google");
const { events, cloudEmitter } = require("../cloudEmitter");
const jwt = require("../../smart-home-key.json");
const app = smarthome({
  jwt,
});

app.onSync(
  (body, headers) =>
    new Promise((resolve, reject) => {
      console.log("sync");
      let timeout;
      cloudEmitter.emit(events.GET_ALL_DEVICES);
      const onResponse = (devices) => {
        clearTimeout(timeout);
        const payload = {
          agentUserId: headers.decoded.user_id,
          devices: devices.map(({ id, deviceInfo, traits, type }) => ({
            id,
            traits: traits.map((trait) => `action.devices.traits.${trait}`),
            type: `action.devices.types.${type.toUpperCase()}`,
            name: {
              defaultNames: [deviceInfo.name],
              name: deviceInfo.name,
              nicknames: [deviceInfo.name],
            },
            willReportState: true,
            deviceInfo: {
              manufacturer: "xpto",
              model: deviceInfo.model,
              hwVersion: "0.1",
              swVersion: "0.1",
            },
          })),
        };
        console.log(payload);
        resolve({
          requestId: body.requestId,
          payload,
        });
      };
      cloudEmitter.once(events.GET_ALL_DEVICES_RESPONSE, onResponse);
      timeout = setTimeout(() => {
        cloudEmitter.removeListener(
          events.GET_ALL_DEVICES_RESPONSE,
          onResponse
        );
        reject(new Error("Timeout exceeded"));
      }, 3000);
    })
);

const getDeviceState = (deviceId) =>
  new Promise((resolve, reject) => {
    let timeout;
    cloudEmitter.emit(events.GET_DEVICE_STATE, deviceId);
    const onDeviceStateResponse = ({ deviceId, state }) => {
      clearTimeout(timeout);
      resolve({ deviceId, state });
    };
    cloudEmitter.once(events.GET_DEVICE_STATE_RESPONSE, onDeviceStateResponse);
    setTimeout(() => {
      cloudEmitter.removeListener(
        events.GET_DEVICE_STATE_RESPONSE,
        onDeviceStateResponse
      );

      reject(new Error("Timeout exceeded"));
    }, 5000);
  });

app.onQuery(async (body, headers) => {
  console.log("onQuery", headers.decoded.user_id);
  const getDeviceStatePromises = body.inputs[0].payload.devices.map(({ id }) =>
    getDeviceState(id)
  );

  console.log(getDeviceStatePromises.length);

  const deviceStates = await Promise.all(getDeviceStatePromises);

  console.log();

  const devices = {};
  deviceStates.forEach(
    ({ deviceId, state }) => (devices[deviceId] = { ...state, online: true })
  );

  return {
    requestId: body.requestId,
    payload: {
      devices,
    },
  };
});

cloudEmitter.on(events.GET_DEVICE_STATE_RESPONSE, ({ deviceId, state }) => {
  app.reportState({
    agentUserId: process.env.USER_ID,
    payload: {
      devices: {
        states: {
          [deviceId]: { ...state, online: true },
        },
      },
    },
  });
});

const executeCommand = (deviceId, params) =>
  new Promise((resolve, reject) => {
    let timeout;
    cloudEmitter.emit(events.UPDATE_DEVICE_STATE, {
      deviceId,
      state: params.on,
    });
    const getDeviceStateListener = ({ deviceId, state }) => {
      clearTimeout(timeout);
      resolve({
        ids: [String(deviceId)],
        status: "SUCCESS",
        states: { ...state, online: true },
      });
    };
    cloudEmitter.once(events.GET_DEVICE_STATE_RESPONSE, getDeviceStateListener);
    setTimeout(() => {
      cloudEmitter.removeListener(
        events.GET_DEVICE_STATE_RESPONSE,
        getDeviceStateListener
      );
      reject(new Error("Timeout exceeded"));
    }, 5000);
  });
app.onExecute(async (body, header) => {
  const executeCommandsPromises = [];
  body.inputs[0].payload.commands.forEach(({ devices, execution }) => {
    devices.forEach(({ id }) => {
      execution.forEach(({ params }) => {
        executeCommandsPromises.push(executeCommand(id, params));
      });
    });
  });

  const executedCommands = await Promise.all(executeCommandsPromises);

  console.log("executedCommands", executedCommands);
  return {
    requestId: body.requestId,
    payload: {
      commands: executedCommands,
    },
  };
});

exports.app = app;

