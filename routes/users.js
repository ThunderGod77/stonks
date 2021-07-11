const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");

const { Users } = require("./../database/db");
const { ObjectID } = require("mongodb");

router.get("/test", (req, res) => {
  res.status(200).json({ ping: "pong" });
});
//user
router.post("/login", async (req, res, next) => {
  try {
    const result = await Users.findOne({ email: req.body.email });
    const passSame = await bcrypt.compare(req.body.password, result.password);
    console.log(result._id);
    if (passSame) {
      const token = await jwt.sign(
        { id: result._id, email: result.email },
        "somesupersecretkey",
        { expiresIn: "48h" }
      );
      res
        .status(200)
        .json({ same: true, token: token, _id: result._id.toString() });
    } else {
      res.status(200).json({ same: false });
    }
  } catch (err) {
    next(err);
    throw new Error("some problem");
  }
});

router.post("/addUser", async (req, res, next) => {
  try {
    const search = await Users.findOne({ email: req.body.email });

    if (search) {
      res.status(200).json({ message: "email already exists", n: false });
      return;
    }
  } catch (err) {
    next(err);
    throw new Error("some problem");
  }
  var result;
  const username = req.body.username;
  const email = req.body.email;
  const phoneNum = req.body.phoneNum;
  const password = req.body.password;

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    next(err);
    throw new Error("Problem with hashing");
  }

  try {
    result = await Users.insertOne({
      username: username,
      email: email,
      phoneNum: phoneNum,
      password: hashedPassword,
    });
    console.log(result.insertedId);
  } catch (err) {
    next(err);
    throw new Error("Database is having a problem");
  }

  res.status(201).json({ ins: result.insertedId });
});

//user lofin verification middleware
const verifyUser = async (req, res, next) => {

  try {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({'msg': 'bad/no token'});
    let decodedToken = await jwt.verify(token, "somesupersecretkey");
    if (!decodedToken) return res.status(401).json({'msg': "can't decode token"});
    req.body._id = decodedToken.id;
    req.body.verified = true;
    next();
  }
  catch (err) {

    console.log(err.stack);
    return res.status(401).send({"msg": "bad authentication"});


  }

};


router.use(function (err, req, res, next) {
    res.status(500).send({ err: "Some error occured" });
    console.log(err.stack);
});

module.exports = router;
