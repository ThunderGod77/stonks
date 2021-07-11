const express = require("express");

const bodyParser = require("body-parser");
const app = express();

const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const noteRoutes = require("./routes/notes");

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
app.use("/course", courseRoutes);
app.use("/note", noteRoutes);

app.listen(8080, () => {
  console.log("Serving on port 8080");
});
