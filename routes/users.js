const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");

const { Users, Courses } = require("./../database/db");
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
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.body.verified = "false1";
    next();
  }
  const token = authHeader;
  let decodedToken;
  try {
    decodedToken = await jwt.verify(token, "somesupersecretkey");
  } catch (err) {
    req.body.verified = "false2";
    next();
  }
  if (!decodedToken) {
    req.body.verified = "false3";
    next();
  }

  req.body._id = decodedToken.id;
  req.body.verified = true;

  next();
};
router.get("/testOP", verifyUser, (req, res, next) => {
  console.log(req.body);
  res.status(200).json({ mo: "lo" });
});

//Course
router.post("/getCourses", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }
  try {
    const courses = await Courses.find({ userId: req.body._id });
    res.status(200).json({ msg: "found", courses });
  } catch (err) {
    next(err);
    throw new Error("Database is having a problem");
  }
});

router.post("/addCourses", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }
  let course = {
    courseName: req.body.courseName,
    courseLink: req.body.courseLink,
    description: req.body.description,
    rating: req.body.rating,
    resourcesLink: req.body.resources,
    notes: [],
    userId: req.body._id,
  };
  try {
    console.log(req.body._id);
    const result = await Courses.insertOne({ course });
  } catch (error) {
    next(err);
    throw new Error("Database is having a problem");
  }
  res.status(201).json({ msg: "course added succesfully" });
});

router.post("/deleteCourses", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }

  try {
    const result = await Courses.deleteOne({
      _id: new ObjectID(req.body.courseId),
    });
  } catch (error) {
    next(err);
    throw new Error("Database is having a problem");
  }
  res.status(201).json({ msg: "course added succesfully" });
});

router.post("/updateCourses", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }

  try {
    const result = await Courses.updateOne(
      { _id: new ObjectID(req.body.courseId) },
      {
        $set: {
          courseName: req.body.courseName,
          courseLink: req.body.courseLink,
          resourcesLink: req.body.resources,
          description: req.body.description,
          rating: req.body.rating,
        },
      }
    );
  } catch (error) {
    next(err);
    throw new Error("Database is having a problem");
  }
  res.status(201).json({ msg: "course added succesfully" });
});

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
});

module.exports = router;
