require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { wss: homeWss } = require("./cloudEmitter");
const { googleActionsRouter } = require("./googleActions");
const url = require("url");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/api/google-actions", googleActionsRouter);

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
  console.log(`Server listening at ${server.address().port}`);
});

server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  if (pathname === "/api/home") {
    homeWss.handleUpgrade(request, socket, head, (ws) => {
      homeWss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
