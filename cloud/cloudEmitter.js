const WebSocket = require("ws");
const { EventEmitter } = require("events");
const { events, cloudListeners } = require("../cloudEmitter");

const cloudEmitter = new EventEmitter();
exports.cloudEmitter = cloudEmitter;

const wss = new WebSocket.Server({ noServer: true });
wss.on("connection", (ws, req) => {
  if (req.headers.authorization !== process.env.WS_API_KEY) {
    ws.terminate();
  }
  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      const { event, args } = message;
      cloudEmitter.emit(event, ...args);
    } catch (e) {
      console.error(e);
    }
  });

  const eventListeners = cloudListeners.map((event) => {
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

  ws.on("close", () => {
    eventListeners.forEach(({ event, listener }) => {
      cloudEmitter.removeListener(event, listener);
    });
  });

  ws.on("error", (e) => {
    console.error(e);
  });

  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = false;
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

wss.on("close", () => clearInterval(interval));

exports.wss = wss;
exports.events = events;
