const { EventEmitter } = require("events");
const Websocket = require("ws");
const { events, localListeners } = require("../cloudEmitter");

const cloudEmitter = new EventEmitter();

const initWebsocket = () => {
  const ws = new Websocket("wss://home.alejr.dev/api/home", {
    headers: {
      authorization: process.env.WS_API_KEY,
    },
  });

  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      const { event, args } = message;
      cloudEmitter.emit(event, ...args);
    } catch (e) {
      console.error(e);
    }
  });

  let eventListeners = localListeners.map((event) => {
    const listener = (...args) => {
      try {
        ws.send(
          JSON.stringify({
            event,
            args,
          })
        );
      } catch (e) {
        console.error(e);
      }
    };
    cloudEmitter.on(event, listener);
    return { event, listener };
  });

  let pingTimeout;
  const heartbit = () => {
    ws.pong();
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 30000);
  };
  ws.on("open", heartbit);
  ws.on("ping", heartbit);
  const onClose = (reason) => {
    eventListeners.forEach(({ event, listener }) => {
      cloudEmitter.removeListener(event, listener);
    });
    console.log("connection closed", reason);
    clearTimeout(pingTimeout);
    initWebsocket();
  };
  ws.on("close", onClose);

  ws.on("error", (e) => {
    console.error(e);
  });
};

exports.initWebsocket = initWebsocket;
exports.cloudEmitter = cloudEmitter;
exports.events = events;
