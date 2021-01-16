const express = require("express");

const bodyParser = require("body-parser");
const app = express();

const userRoutes = require("./routes/users");

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/ping", (req, res, next) => {
  res.status(200).json({ name: "pong" });
});
app.use("/user", userRoutes);

app.listen(8080, () => {
  console.log("Serving on port 8080");
});
