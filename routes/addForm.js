const express = require("express");
const router = express.Router();
const { formCol } = require("./../database/db");

router.get("/test", (req, res) => {
  res.status(200).json({ ping: "pong" });
});

router.post("/formFields", async (req, res, next) => {
  var result;
  try {
    result = await formCol.insertOne(req.body);
    console.log(result.insertedId);
  } catch (err) {
    next(err);
    throw new Error("Database is having a problem");
  }

  res.status(201).json({ ins: result.insertedId });
});

router.use(function (err, req, res, next) {
  res.status(500).send({ err: "Some error occured" });
});

module.exports = router;
