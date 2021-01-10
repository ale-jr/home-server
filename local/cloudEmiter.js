const { EventEmitter } = require("events");
const Websocket = require("ws");
const { events, localListeners } = require("../cloudEmitter");

const cloudEmitter = new EventEmitter();

const initWebsocket = () => {
  const ws = new Websocket("ws://localhost:5000/home", {
    headers: {
      authorization: "xpto",
    },
  });

  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      const { event, args } = message;
      cloudEmitter.emit(event, ...args);

      console.log("event", event, "args", ...args);
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
        console.log(e);
      }
    };
    cloudEmitter.on(event, listener);
    return { event, listener };
  });

  let pingTimeout;
  const heartbit = () => {
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 31000);
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

  ws.on("error", () => {
    console.log("error");
  });
};

exports.initWebsocket = initWebsocket;
exports.cloudEmitter = cloudEmitter;
exports.events = events;
