const express = require("express");
const http = require("http");
const app = express();
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const apiRoutes = require("./src/modules/routes/routes");
require("dotenv").config();
const httpLogger = require("./src/services/httpLogger");
const { userConnect, userDisconnect } = require("./src/modules/controllers/user.controller");

const port = process.env.PORT || 8000;
const cors = require("cors");

let databaseUrl = '';

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  databaseUrl = process.env.MONGODB_URL
} else {
  databaseUrl = process.env.MONGODB_URL_PROD
}

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json({ limit: "50MB" }));

app.use(httpLogger);
mongoose
  .connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
  .then(() => {
    // if all is ok we will be here
    console.log("Database is connected successfully");
  })
  .catch((err) => {
    // if error we will be here
    console.log("Error with connecting to database");
  });

app.use(passport.initialize());
require("./src/services/passport")(passport);

app.use(cors());

app.use("/api", apiRoutes);

const server = http.createServer(app);
global.io = socketIo(server);

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    userDisconnect(socket.id);
    console.log("Client disconnected", socket.id);
  });
  
  socket.on("id", (id) => {
    userConnect(id, socket.id);
  });
});

server.listen(port, () => {
  console.log("Running RestHub on port " + port);
});
