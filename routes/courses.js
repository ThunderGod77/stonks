const express = require("express");
const router = express.Router();

const { Courses, Notes } = require("./../database/db");

router.get("/test", (req, res) => {
  res.status(200).json({ ping: "pong" });
});

router.post("/addCourse", async (req, res, next) => {
  const courseName = req.body.courseName;
  const courseLink = req.body.courseLink;
  const description = req.body.description;
  const rating = req.body.rating;
  const resourcesLink = req.body.resourcesLink;
  try {
    const result = Courses.insertOne({
      courseName,
      courseLink,
      description,
      rating,
      resourcesLink,
    });
    console.log(result._id);
  } catch (error) {
    next(error);
    throw new Error("Database is having a problem");
  }
});

router.post("addNotes", (req, res, next) => {
  const courseLink;
});

router.use(function (err, req, res, next) {
  res.status(500).send({ err: "Some error occured" });
});

module.exports = router;
