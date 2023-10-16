const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const port = 8080;
const app = express();
const cookieParser = require("cookie-parser");
const connectSqlite3 = require("connect-sqlite3");
const bcrypt = require("bcrypt");
const csurf = require("csurf");

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
    userId: req.session.userId,
  };
  res.render("home.handlebars", model);
});
app.get("/contact", function (req, res) {
  console.log("session: ", req.session);
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    title: "Contact",
    userId: req.session.userId,
  };
  res.render("contact.handlebars", model);
});
app.get("/about", function (req, res) {
  db.all("SELECT * FROM events", function (error, theEvents) {
    if (error) {
      const model = {
        hasDatabaseError: true,
        theError: error,
        events: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "about",
        userId: req.session.userId,
      };
      res.render("about.handlebars", model);
    } else {
      const model = {
        hasDatabaseError: false,
        theError: "",
        events: theEvents,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "Humans",
        userId: req.session.userId,
      };
      console.log("session: ", req.session);
      res.render("about.handlebars", model);
    }
  });
});
app.get("/about/new", (req, res) => {
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    const model = {
      isLoggedIn: req.session.isLoggedIn,
      name: req.session.name,
      isAdmin: req.session.isAdmin,
      title: "New Event",
      userId: req.session.userId,
    };
    res.render("newevent.handlebars", model);
  } else {
    res.redirect("/login");
  }
});
app.post("/about/new", (req, res) => {
  const newe = [
    req.body.eventdate,
    req.body.eventlocation,
    req.body.eventdesc,
    req.body.eventthumbnail,
    req.body.eventname,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "INSERT INTO events (date, location, edesc, ethumbnail, ename) VALUES (?, ?, ?, ?, ?)",
      newe,
      (error) => {
        if (error) {
          console.log("error", error);
        } else {
          console.log("line was added into event table!");
        }
      }
    );
    res.redirect("/about");
  } else {
    res.redirect("/login");
  }
});
app.get("/about/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    "SELECT * FROM events WHERE eid = ?",
    [id],
    function (error, foundEvent) {
      if (error) {
        const model = {
          hasDatabaseError: true,
          theError: error,
          events: {},
          isAdmin: req.session.isAdmin,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
        };
        res.render("event.handlebars", model);
      } else {
        const model = {
          hasDatabaseError: false,
          theError: "",
          event: foundEvent,
          isLoggedIn: req.session.isLoggedIn,
          userId: req.session.userId,
        };
        res.render("event.handlebars", model);
      }
    }
  );
});

app.get("/about/update/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    "SELECT * FROM events where eid =?",
    [id],
    function (error, theEvents) {
      if (error) {
        const model = {
          hasDatabaseError: true,
          theError: error,
          event: {},
          isAdmin: req.session.isAdmin,
          name: req.session.name,
          isLoggedIn: req.session.isLoggedIn,
        };
        console.log("error", error);
        res.render("editevent.handlebars", model);
      } else {
        const model = {
          hasDatabaseError: false,
          theError: "",
          event: theEvents,
          isAdmin: req.session.isAdmin,
          name: req.session.name,
          isLoggedIn: req.session.isLoggedIn,
          userId: req.session.userId,
        };
        res.render("editevent.handlebars", model);
      }
    }
  );
});

app.post("/about/update/:id", (req, res) => {
  const id = req.params.id;
  const newe = [
    req.body.eventdate,
    req.body.eventlocation,
    req.body.eventdesc,
    req.body.eventthumbnail,
    req.body.eventname,
    id,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "UPDATE events SET date=?, location=?, edesc=?, ethumbnail=?, ename =? WHERE eid=?",
      newe,
      (error) => {
        if (error) {
          console.log("erroe", error);
        } else {
          console.log("updated");
        }
        res.redirect("/about");
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/about/delete/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "DELETE FROM events where eid =?",
      [id],
      function (error, theEvents) {
        if (error) {
          const model = {
            hasDatabaseError: true,
            theError: error,
            events: [],
            isAdmin: req.session.isAdmin,
            name: req.session.name,
            isLoggedIn: req.session.isLoggedIn,
            userId: req.session.userId,
          };
          console.log("error");
          res.render("home.handlebars", model);
        } else {
          const model = {
            hasDatabaseError: false,
            theError: "",
            event: theEvents,
            isAdmin: req.session.isAdmin,
            name: req.session.name,
            isLoggedIn: req.session.isLoggedIn,
            userId: req.session.userId,
          };
          res.render("home.handlebars", model);
          res.redirect("/about");
        }
      }
    );
  } else {
    res.redirect("/login");
  }
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
        userId: req.session.userId,
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
        userId: req.session.userId,
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
      userId: req.session.userId,
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
    req.body.procolor,
    req.body.proalcohol,
    req.body.provolume,
    req.body.prothumbnail,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "INSERT INTO projects(pname, pyear, pdesc, ptype, pimgURL, pcolor, palcohol, pvolume, pthumbnail) VALUES (?,?,?,?,?,?,?,?,?)",
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
        // Handle error
      } else {
        db.all(
          "SELECT reviews.*, users.uun FROM reviews LEFT JOIN users ON reviews.uid = users.uid WHERE reviews.pid = ?",
          [id],
          function (error, foundReviews) {
            if (error) {
              // Handle error
            } else {
              // Calculate average rating
              const totalRating = foundReviews.reduce(
                (sum, review) => sum + review.rating,
                0
              );
              const averageRating = totalRating / foundReviews.length;

              const model = {
                hasDatabaseError: false,
                theError: "",
                project: foundProject,
                reviews: foundReviews,
                averageRating: averageRating.toFixed(2), // Rounded to 2 decimal places
                isAdmin: req.session.isAdmin,
                isLoggedIn: req.session.isLoggedIn,
                userId: req.session.userId,
                title: id,
              };
              res.render("human.handlebars", model);
            }
          }
        );
      }
    }
  );
});
app.post("/humans/:id/reviews", (req, res) => {
  const projectId = req.params.id;
  const { reviewText, rating } = req.body;
  const userId = req.session.userId;
  const userName = req.session.name;

  // Insert the review into the database
  db.run(
    "INSERT INTO reviews (uid, pid, review, rating, uname) VALUES (?, ?, ?, ?, ?)",
    [userId, projectId, reviewText, rating, userName],
    (error) => {
      if (error) {
        console.error("Error inserting review into the database:", error);
        res.status(500).send("Error submitting review.");
      } else {
        // Redirect the user back to the project page after submitting the review
        res.redirect(`/humans/${projectId}`);
        console.log(userName);
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
          userId: req.session.userId,
          helpers: {
            theType1(value) {
              return value == "Ale";
            },
            theType2(value) {
              return value == "Lager";
            },
            theType3(value) {
              return value == "Pilsner";
            },
            theType4(value) {
              return value == "Porter";
            },
            theType5(value) {
              return value == "IPA";
            },
            theType6(value) {
              return value == "APA";
            },
            theType7(value) {
              return value == "Stout";
            },
            theType8(value) {
              return value == "Weizenbock";
            },
            theType9(value) {
              return value == "bitter";
            },
            theType10(value) {
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
    req.body.procolor,
    req.body.proalcohol,
    req.body.provolume,
    req.body.prothumbnail,
    id,
  ];
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=?, pcolor=?, palcohol=?, pvolume=?, pthumbnail=? WHERE pid=?",
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
            userId: req.session.userId,
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
            userId: req.session.userId,
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
    userId: req.session.userId,
  };
  res.render("login.handlebars", model);
});
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE uun = ?", [username], (err, oneUser) => {
    if (err) {
      res.status(500).send({ error: "Server error" });
    } else if (!oneUser) {
      res.status(401).send({ error: "User not found" });
    } else {
      const result = bcrypt.compareSync(password, oneUser.upw);
      if (result) {
        if (oneUser.urole == "admin") {
          req.session.isAdmin = true;
        } else {
          req.session.isAdmin = false;
        }
        req.session.isLoggedIn = true;
        req.session.name = oneUser.uun;
        req.session.userId = oneUser.uid;
        res.redirect("/");
      } else {
        res.status(401).send({ error: "Wrong password" });
      }
    }
  });
});

app.get("/signup", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    title: "sign up",
    userId: req.session.userId,
  };
  res.render("signup.handlebars", model);
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (uname, urole, uun, upw) VALUES (?, ?, ?, ?)",
    [username, "customer", username, hash],
    (err) => {
      if (err) {
        res.status(500).send({ error: "Server errorsignup" });
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    console.log("error destroying session", error);
  });
  console.log("logged out");
  res.redirect("/");
});
db.run(
  "CREATE TABLE projects (pid INTEGER PRIMARY KEY AUTOINCREMENT, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL, pcolor TEXT NOT NULL, palcohol INTEGER NOT NULL, pvolume INTEGER NOT NULL, pthumbnail TEXT NOT NULL)",
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
          type: "Ale",
          desc: " Pistonhead Kustom Lager is Kustom brewed with a double-clutch of Münchener and Pilsner malt injected with Spalter Select, Magnum and Perle hops that will leave a hint of bitterness on your lips, but never in your heart.",
          year: 2022,
          url: "/img/Product-img.svg",
          color: "blue",
          alcohol: 5.0,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
        {
          id: "2",
          name: "Visualisation of 3D medical images",
          type: "Lager",
          desc: " Pistonhead Kustom Lager is Kustom brewed with a double-clutch of Münchener and Pilsner malt injected with Spalter Select, Magnum and Perle hops that will leave a hint of bitterness on your lips, but never in your heart.",
          year: 2012,
          url: "/img/Product-img.svg",
          color: "blue",
          alcohol: 5.0,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
      ];
      // inserts projects
      projects.forEach((oneProject) => {
        db.run(
          "INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL, pcolor, palcohol, pvolume, pthumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            oneProject.id,
            oneProject.name,
            oneProject.year,
            oneProject.desc,
            oneProject.type,
            oneProject.url,
            oneProject.color,
            oneProject.alcohol,
            oneProject.volume,
            oneProject.thumbnail,
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
  "CREATE TABLE users (uid INTEGER PRIMARY KEY, uname TEXT NOT NULL, urole TEXT NOT NULL, uun TEXT NOT NULL, upw TEXT NOT NULL)",
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
      users.forEach((oneUser) => {
        const hashedPassword = bcrypt.hashSync(oneUser.pw, 10);
        db.run(
          "INSERT INTO users (uid, uname, urole, uun, upw) VALUES (?, ?, ?, ?, ?)",
          [oneUser.id, oneUser.name, oneUser.role, oneUser.un, hashedPassword],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the user table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE reviews (rid INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, pid INTEGER, review TEXT NOT NULL, rating INTEGER NOT NULL, uname TEXT NOT NULL,  FOREIGN KEY(uid) REFERENCES users(uid), FOREIGN KEY(pid) REFERENCES projects(pid), FOREIGN KEY(uname) REFERENCES users(uname))",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table reviews created!");
      const reviews = [
        {
          uid: 1,
          pid: 1,
          review: "Woow tase like shit",
          rating: 5,
          username: "ebrin",
        },
        {
          uid: 1,
          pid: 2,
          review: "Woow tase like beer",
          rating: 1,
          username: "ebrin",
        },
      ];
      // inserts reviews
      reviews.forEach((oneReview) => {
        db.run(
          "INSERT INTO reviews (uid, pid, review, rating, uname) VALUES (?, ?, ?, ?, ?)",
          [
            oneReview.uid,
            oneReview.pid,
            oneReview.review,
            oneReview.rating,
            oneReview.username,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the reviews table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE events (eid INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, location TEXT NOT NULL, edesc TEXT NOT NULL, ethumbnail INTEGER NOT NULL, ename TEXT NOT NULL)",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table events created!");
      const events = [
        {
          eid: 1,
          date: "2023-10-15",
          location: "jönköping",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/chokladboll.jpg",
          name: "Drinking beer event",
        },
      ];
      events.forEach((oneEvent) => {
        db.run(
          "INSERT INTO events (eid, date, location, edesc, ethumbnail, ename) VALUES (?, ?, ?, ?, ?, ?)",
          [
            oneEvent.eid,
            oneEvent.date,
            oneEvent.location,
            oneEvent.description,
            oneEvent.thumbnail,
            oneEvent.name,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the reviews table!");
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
