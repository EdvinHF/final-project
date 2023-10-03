const express = require("express"); // loads the express package
const sqlite3 = reqire("sqlite3");
const { engine } = require("express-handlebars"); // loads handlebars for Express
const port = 8080; // defines the port
const app = express(); // creates the Express application
const db = new sqlite3.Database("project jl.db")

// defines handlebars engine
app.engine("handlebars", engine());
// defines the view engine to be handlebars
app.set("view engine", "handlebars");
// defines the views directory
app.set("views", "./views");

// define static directory "public" to access css/ and img/
app.use(express.static("public"));

// MODEL (DATA)
const humans = [
  { id: "1", name: "kanelbulle", imgId: "1" },
  { id: "2", name: "chokladboll", imgId: "2" },
  { id: "3", name: "kladdkaka", imgId: "3" },
  { id: "4", name: "tårta", imgId: "4" },
  { id: "5", name: "korv", imgId: "5" },
];

const imgs = [
  { imgId: "1", name: "kanelbulle" },
  { imgId: "2", name: "chokladboll" },
  { imgId: "3", name: "kladdkaka" },
  { imgId: "4", name: "tårta" },
  { imgId: "5", name: "korv" },
];
db.run("CREATE TABLE projects (pid INTEGER PRIMARY KEY, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL
  TEXT NOT NULL)", (error) => {
  if (error) {
  // tests error: display error
  console.log("ERROR: ", error)
  } else {
  // tests error: no error, the table has been created
  console.log("---> Table projects created!")
  const projects=[
  { "id":"1", "name":"Counting people with a camera", "type":"research", "desc": "The purpose of this project is to count people passing through a
  corridor and to know how many are in the room at a certain time.", "year": 2022, "dev":"Python and OpenCV (Computer vision) library",
  "url":"/img/counting.png" },
  { "id":"2", "name":"Visualisation of 3D medical images", "type":"research", "desc": "The project makes a 3D model of the analysis of the body of
  a person and displays the detected health problems. It is useful for doctors to view in 3D their patients and the evolution of a disease.", "year":
  2012, "url":"/img/medical.png" },
  { "id":"3", "name":"Multiple questions system", "type":"teaching", "desc": "During the lockdowns in France, this project was useful to test the
  students online with a Quizz system.", "year": 2021, "url":"/img/qcm07.png" },
  { "id":"4", "name":"Image comparison with the Local Dissmilarity Map", "desc": "The project is about finding and quantifying the differences
  between two images of the same size. The applications were numerous: satallite imaging, medical imaging,...", "year": 2020, "type":"research",
  "url":"/img/diaw02.png" },
  { "id":"5", "name":"Management system for students' internships", "desc": "This project was about the creation of a database to manage the
  students' internships.", "year": 2012, "type":"teaching", "url":"/img/management.png" }
  ]
  // inserts projects
  projects.forEach( (oneProject) => {
  db.run("INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?, ?)", [oneProject.id, oneProject.name,
  oneProject.year, oneProject.desc, oneProject.type, oneProject.url], (error) => {
  if (error) {
  console.log("ERROR: ", error)
  } else {
  console.log("Line added into the projects table!")
  }
  })
  })
  }
  })
// CONTROLLER (THE BOSS)
// defines route "/"
app.get("/", function (request, response) {
  response.render("home.handlebars", { title: "Home" });
});

// defines route "/humans"
app.get("/humans", function (request, response) {
  response.render("humans.handlebars", {
    title: "Humans",
    listHumans: humans,
    listImages: imgs,
  });
});

app.get("/humans/:id", function (request, response) {
  const id = request.params.id;
  const foundHuman = humans.find((human) => human.id === id);
  response.render("human.handlebars", foundHuman);
});

app.get("/new-product", function (request, response) {
  response.render("new-product.handlebars");
});
app.use(function (req, res) {
  res.status(404).render("404.handlebars");
});

app.listen(port, () => {
  console.log(`Server running and listening on port ${port}...`);
});
