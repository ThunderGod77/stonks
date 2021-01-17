const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://mj:mj@cluster0.lk5fl.mongodb.net/hackathon?retryWrites=true&w=majority";

MongoClient.connect(uri).then((db) => {
  console.log("i connected successfully");
  exports.Users = db.db("hackathon").collection("users");
  exports.Courses =  db.db("hackathon").collection("courses");
  exports.Notes = db.db("hackathon").collection("notes");

}).catch(console.dir);
