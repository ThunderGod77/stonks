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
    const courses = await Courses.find({ userId: req.body._id }).toArray();
    if (courses) {
	     return res.status(200).json(courses);
    }
    else {
      return res.status(404).json({"msg": "no courses found"})
    }
  } catch (err) {
    next(err);
    console.log(err.stack);
    throw new Error("Database is having a problem");
  }
});
router.get("/getCoursesbyName", verifyUser, async (req, res, next) => {
  if (!req.body.verified) {
    next(err);
    throw new Error("not verified");
  }
  try {
    const courses = await Courses.find({userId: req.body._id}).toArray();
    if (courses) {

      return res.status(200).json(courses);
    }
    else {
      return res.status(404).json({"msg": "can't find course"});
    }
  }
  catch (err) {
    next(err);
    console.log(err.stack);
    throw new Error("Database is having a problem");
  }
});


router.post("/addCourse", verifyUser, async (req, res, next) => {
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
    const result = await Courses.insertOne(course);
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
    console.log(err.stack);
});

module.exports = router;
