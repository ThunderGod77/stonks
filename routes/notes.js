const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");

const { Notes } = require("./../database/db");
const { ObjectID } = require("mongodb");

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

//Notes

router.get("/getNotes", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }
  try {
    let enotes = await Courses.findOne({
      _id: new ObjectID(req.body.courseId),
    });
    const notes = enotes.notes;
    res.status(200).json({ msg: "found", notes });
  } catch (err) {
    next(err);
    throw new Error("Database is having a problem");
  }
});

router.post("/addNotes", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }
  let courseId = req.body.courseId;
  let note = {
    noteId: v4(),
    text: req.body.text,
    timeStamp: req.body.timeStamp,
    heading: req.body.heading,
  };
  try {
    const result = await Courses.updateOne(
      { _id: new ObjectID(courseId) },
      { $push: { notes: note } }
    );
  } catch (err) {
    next(err);
    throw new Error("Database is having a problem");
  }
});
router.post("/deleteNotes", verifyUser, async (req, res, next) => {
  try {
    if (!req.body.verified) {
      next(err);
      throw new Error("not verified");
    }
    const result = Courses.updateOne(
      { _id: new ObjectID(req.body.courseId) },
      { $pull: { notes: { $elematch: { noteId: req.body.noteId } } } }
    );
    res.status(200).json({ msg: "done" });
  } catch (err) {
    next(err);
    throw new Error("not verified");
  }
});
router.post("/updateNotes", verifyUser, (req, res, next) => {
  try {
    if (!req.body.verified) {
      next(err);
      throw new Error("not verified");
    }
    const result = Courses.updateOne(
      { _id: new ObjectID(req.body.courseId), "notes.noteId": req.body.noteId },
      {
        $set: {
          "notes.$.heading": req.body.heading,
          "notes.$.text": req.body.text,
        },
      }
    );
    res.status(200).json({ msg: "done" });
  } catch (err) {
    next(err);
    throw new Error("not verified");
  }
});

router.use(function (err, req, res, next) {
    res.status(500).send({ err: "Some error occured" });
    console.log(err.stack);
});

module.exports = router;
