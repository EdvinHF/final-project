const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const port = 8080;
const app = express();
const cookieParser = require("cookie-parser");
const connectSqlite3 = require("connect-sqlite3");

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("project-jl.db");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use(express.static("public"));

const SQLiteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQLiteStore({ db: "session-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "Password",
  })
);

app.get("/", function (req, res) {
  console.log("session: ", req.session);
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    title: "Home",
  };
  res.render("home.handlebars", model);
});

app.get("/humans", function (req, res) {
  db.all("SELECT * FROM projects", function (error, theProjects) {
    if (error) {
      const model = {
        hasDatabaseError: true,
        theError: error,
        projects: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "humans",
      };
      res.render("humans.handlebars", model);
    } else {
      const model = {
        hasDatabaseError: false,
        theError: "",
        projects: theProjects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "Humans",
      };
      console.log("session: ", req.session);
      res.render("humans.handlebars", model);
    }
  });
});
app.get("/humans/new", (req, res) => {
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    const model = {
      isLoggedIn: req.session.isLoggedIn,
      name: req.session.name,
      isAdmin: req.session.isAdmin,
      title: "New Product",
    };
    res.render("newproduct.handlebars", model);
  } else {
    res.redirect("/login");
  }
});

app.post("/humans/new", (req, res) => {
  const newp = [
    req.body.proname,
    req.body.proyear,
    req.body.prodesc,
    req.body.protype,
    req.body.proimg,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "INSERT INTO projects(pname, pyear, pdesc, ptype, pimgURL) VALUES (?,?,?,?,?)",
      newp,
      (error) => {
        if (error) {
          console.log("error", error);
        } else {
          console.log("line was added into project table!");
        }
      }
    );
    res.redirect("/humans");
  } else {
    res.redirect("/humans");
  }
});
app.get("/humans/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    "SELECT * FROM projects WHERE pid = ?",
    [id],
    function (error, foundProject) {
      if (error) {
        const model = {
          hasDatabaseError: true,
          theError: error,
          project: {},
          isAdmin: req.session.isAdmin,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          title: id,
        };
        console.log("error");
        res.render("human.handlebars", model);
      } else {
        const model = {
          hasDatabaseError: false,
          theError: "",
          project: foundProject,
          isAdmin: req.session.isAdmin,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          title: id,
        };
        res.render("human.handlebars", model);
      }
    }
  );
});

app.get("/humans/update/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    "SELECT * FROM projects where pid =?",
    [id],
    function (error, theProjects) {
      if (error) {
        const model = {
          hasDatabaseError: true,
          theError: error,
          projects: {},
          isAdmin: req.session.isAdmin,
          name: req.session.name,
          isLoggedIn: req.session.isLoggedIn,
        };
        console.log("error", error);
        res.render("editproduct.handlebars", model);
      } else {
        const model = {
          hasDatabaseError: false,
          theError: "",
          project: theProjects,
          isAdmin: req.session.isAdmin,
          name: req.session.name,
          isLoggedIn: req.session.isLoggedIn,
          helpers: {
            theTypeR(value) {
              return value == "Research";
            },
            theTypeT(value) {
              return value == "Teaching";
            },
            theTypeO(value) {
              return value == "Other";
            },
          },
        };
        res.render("editproduct.handlebars", model);
      }
    }
  );
});

app.post("/humans/update/:id", (req, res) => {
  const id = req.params.id;
  const newp = [
    req.body.proname,
    req.body.proyear,
    req.body.prodesc,
    req.body.protype,
    req.body.proimg,
    id,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=? WHERE pid=?",
      newp,
      (error) => {
        if (error) {
          console.log("erroe", error);
        } else {
          console.log("updated");
        }
        res.redirect("/humans");
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/humans/delete/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "DELETE FROM projects where pid =?",
      [id],
      function (error, theProjects) {
        if (error) {
          const model = {
            hasDatabaseError: true,
            theError: error,
            projects: theProjects,
            isAdmin: req.session.isAdmin,
            name: req.session.name,
            isLoggedIn: req.session.isLoggedIn,
          };
          console.log("error");
          res.render("home.handlebars", model);
        } else {
          const model = {
            hasDatabaseError: false,
            theError: "",
            project: theProjects,
            isAdmin: req.session.isAdmin,
            name: req.session.name,
            isLoggedIn: req.session.isLoggedIn,
          };
          res.render("home.handlebars", model);
          res.redirect("/humans");
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    title: "Home",
  };
  res.render("login.handlebars", model);
});
app.post("/login", (req, res) => {
  const un = req.body.un;
  const pw = req.body.pw;

  if (un === "ebrin" && pw === "123") {
    console.log("hi ebrin");
    req.session.isAdmin = true;
    req.session.isLoggedIn = true;
    req.session.name = "edvin höglin forsberg";
    res.redirect("/");
  } else {
    req.session.isAdmin = false;
    req.session.isLoggedIn = false;
    req.session.name = "";
    console.log("poopie");
    res.redirect("/login");
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    console.log("error destroying session", error);
  });
  console.log("logged out");
  res.redirect("/");
});
db.run(
  "CREATE TABLE projects (pid INTEGER PRIMARY KEY AUTOINCREMENT,, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table projects created!");
      const projects = [
        {
          id: "1",
          name: "Counting people with a camera",
          type: "research",
          desc: "The purpose of this project is to count people passing through a corridor and to know how many are in the room at a certain time.",
          year: 2022,
          dev: "Python and OpenCV (Computer vision) library",
          url: "/img/tårta.png",
        },
        {
          id: "2",
          name: "Visualisation of 3D medical images",
          type: "research",
          desc: "The project makes a 3D model of the analysis of the body of a person and displays the detected health problems. It is useful for doctors to view in 3D their patients and the evolution of a disease.",
          year: 2012,
          url: "/img/kanelbulle.jpg",
        },
        {
          id: "3",
          name: "Multiple questions system",
          type: "teaching",
          desc: "During the lockdowns in France, this project was useful to test the students online with a Quizz system.",
          year: 2021,
          url: "/img/korv.jpg",
        },
        {
          id: "4",
          name: "Image comparison with the Local Dissmilarity Map",
          desc: "The project is about finding and quantifying the differences between two images of the same size. The applications were numerous: satallite imaging, medical imaging,...",
          year: 2020,
          type: "research",
          url: "/img/chokladboll.jpg",
        },
        {
          id: "5",
          name: "Management system for students' internships",
          desc: "This project was about the creation of a database to manage the students' internships.",
          year: 2012,
          type: "teaching",
          url: "/img/katt.png",
        },
        {
          id: "6",
          name: "Management system for students' internships",
          desc: "This project was about the creation of a database to manage the students' internships.",
          year: 2012,
          type: "teaching",
          url: "/img/tårta.jpg",
        },
      ];
      // inserts projects
      projects.forEach((oneProject) => {
        db.run(
          "INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?, ?)",
          [
            oneProject.id,
            oneProject.name,
            oneProject.year,
            oneProject.desc,
            oneProject.type,
            oneProject.url,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projects table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE skills (sid INTEGER PRIMARY KEY, sname TEXT NOT NULL, sdesc TEXT NOT NULL, stype TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table skills created!");
      const skills = [
        {
          id: "1",
          name: "PHP",
          type: "Programming language",
          desc: "Programming with PHP on the server side.",
        },
        {
          id: "2",
          name: "Python",
          type: "Programming language",
          desc: "Programming with Python.",
        },
        {
          id: "3",
          name: "Java",
          type: "Programming language",
          desc: "Programming with Java.",
        },
        {
          id: "4",
          name: "ImageJ",
          type: "Framework",
          desc: "Java Framework for Image Processing.",
        },
        {
          id: "5",
          name: "Javascript",
          type: "Programming language",
          desc: "Programming with Javascript on the client side.",
        },
        {
          id: "6",
          name: "Node",
          type: "Programming language",
          desc: "Programming with Javascript on the server side.",
        },
        {
          id: "7",
          name: "Express",
          type: "Framework",
          desc: "A framework for programming Javascript on the server side.",
        },
        {
          id: "8",
          name: "Scikit-image",
          type: "Library",
          desc: "A library for Image Processing with Python.",
        },
        {
          id: "9",
          name: "OpenCV",
          type: "Library",
          desc: "A library for Image Processing with Python.",
        },
      ];

      // inserts skills
      skills.forEach((oneSkill) => {
        db.run(
          "INSERT INTO skills (sid, sname, sdesc, stype) VALUES (?, ?, ?, ?)",
          [oneSkill.id, oneSkill.name, oneSkill.desc, oneSkill.type],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the skills table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE users (uid INTEGER PRIMARY KEY AUTOINCREMENT, uname TEXT NOT NULL, urole TEXT NOT NULL, un TEXT NOT NULL, pw TEXT NOT NULL)",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table users created!");
      const users = [
        {
          id: "1",
          name: "ebrin",
          role: "admin",
          un: "ebrin",
          pw: "123",
        },
      ];
      // inserts projects
      projects.forEach((oneUser) => {
        db.run(
          "INSERT INTO users (pid, pname, urole, un, pw) VALUES (?, ?, ?, ?)",
          [oneUser.id, oneUser.name, oneUser.role, oneUser.un, oneUser.pw],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projects table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE projectsSkills (psid INTEGER PRIMARY KEY, pid INTEGER, sid INTEGER, FOREIGN KEY (pid) REFERENCES projects (pid), FOREIGN KEY (sid) REFERENCES skills (sid))",
  (error) => {
    if (error) {
      // tests error: display error
      console.log("ERROR: ", error);
    } else {
      // tests error: no error, the table has been created
      console.log("---> Table projectsSkills created!");
      const projectsSkills = [
        { id: "1", pid: "1", sid: "2" },
        { id: "2", pid: "1", sid: "8" },
        { id: "3", pid: "1", sid: "9" },
        { id: "4", pid: "2", sid: "3" },
        { id: "5", pid: "2", sid: "4" },
        { id: "6", pid: "3", sid: "1" },
        { id: "7", pid: "4", sid: "2" },
        { id: "8", pid: "4", sid: "8" },
        { id: "9", pid: "4", sid: "9" },
        { id: "10", pid: "5", sid: "1" },
      ];
      // inserts projectsSkills
      projectsSkills.forEach((oneProjectSkill) => {
        db.run(
          "INSERT INTO projectsSkills (psid, pid, sid) VALUES (?, ?, ?)",
          [oneProjectSkill.id, oneProjectSkill.pid, oneProjectSkill.sid],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projectsSkills table!");
            }
          }
        );
      });
    }
  }
);

app.use(function (req, res) {
  res.status(404).render("404.handlebars");
});

app.listen(port, () => {
  console.log(`Server running and listening on port ${port}...`);
});
