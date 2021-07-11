const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");

const { Courses } = require("./../database/db");
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

router.use(function (err, req, res, next) {
    res.status(500).send({ err: "Some error occured" });
    console.log(err.stack);
});

module.exports = router;
