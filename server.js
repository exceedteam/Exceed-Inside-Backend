const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const apiRoutes = require("./src/modules/routes/routes");
require("dotenv").config();
const httpLogger = require("./src/services/httpLogger");

const port = process.env.PORT || 8000;
const cors = require("cors");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json({ limit: "50MB" }));

app.use(httpLogger);
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
  .then(() => {
    // if all is ok we will be here
    console.log("Database is connected successfully");
  })
  .catch(err => {
    // if error we will be here
    console.log("Error with connecting to database");
  });

app.use(passport.initialize());
require("./src/services/passport")(passport);

app.use(cors());

app.use("/api", apiRoutes);

app.listen(port, () => {
  console.log("Running RestHub on port " + port);
});
