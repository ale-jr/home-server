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

const agentUserId = "86913777-f538-4669-91b9-655be93e0e5d";

cloudEmitter.on(events.GET_DEVICE_STATE_RESPONSE, ({ deviceId, state }) => {
  app.reportState({
    agentUserId,
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

// const { devices, updateDeviceState } = require("../devices");
// const smartHomeApp = smarthome({
//   key: process.env.HOME_GRAPH_KEY,
// });

// smartHomeApp.onSync(async (body, headers) => {
//   console.log("sync");

//   const payload = {
//     agentUserId: headers.decoded.user_id,
//     devices: devices.map(({ id, deviceInfo, name, state, traits, type }) => ({
//       id,
//       traits: traits.map((trait) => `action.devices.traits.${trait}`),
//       type: `action.devices.types.${type.toUpperCase()}`,
//       name: {
//         defaultNames: [deviceInfo.name],
//         name: deviceInfo.name,
//         nicknames: [deviceInfo.name],
//       },
//       willReportState: false,
//       deviceInfo: {
//         manufacturer: "xpto",
//         model: deviceInfo.model,
//         hwVersion: "0.1",
//         swVersion: "0.1",
//       },
//     })),
//   };
//   console.log(payload, payload.traits, payload.deviceInfo, payload.name);
//   return {
//     requestId: body.requestId,
//     payload,
//   };
// });
// smartHomeApp.onQuery(async (body, headers) => {
//   const devicesResponse = {};
//   body.inputs[0].payload.devices.forEach(({ id }) => {
//     const device = devices.find(({ id: deviceId }) => +id === deviceId);
//     if (!device) throw new Error("device not found");
//     devicesResponse[id] = { ...device.state, online: true };
//   });

//   return {
//     requestId: body.requestId,
//     payload: {
//       devices: devicesResponse,
//     },
//   };
// });
// smartHomeApp.onExecute(async (body, headers) => {
//   const executedCommands = [];
//   body.inputs[0].payload.commands.map(
//     ({ devices: devicesToBeUpdated, execution }) => {
//       //For each device
//       devicesToBeUpdated.forEach(({ id }) => {
//         //For each command
//         execution.forEach(({ command, params }) => {
//           const trait = command.replace("action.devices.commands.", "");
//           const deviceState = updateDeviceState(id, trait, params);
//           executedCommands.push({
//             ids: [id],
//             status: "SUCCESS",
//             states: deviceState,
//           });
//         });
//       });
//     }
//   );

//   return {
//     requestId: body.requestId,
//     payload: {
//       commands: executedCommands,
//     },
//   };
// });
// smartHomeApp.onDisconnect(async (body, headers) => {});
