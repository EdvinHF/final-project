const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const port = 8080;
const app = express();
const connectSqlite3 = require("connect-sqlite3");
const bcrypt = require("bcrypt");

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
    secret: "superhardpassword3457234327@??!!!}}}}}}",
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
        title: "products",
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
          events: [],
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

app.get("/products", function (req, res) {
  db.all("SELECT * FROM products", function (error, theProducts) {
    if (error) {
      const model = {
        hasDatabaseError: true,
        theError: error,
        products: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "products",
        userId: req.session.userId,
      };
      res.render("products.handlebars", model);
    } else {
      const model = {
        hasDatabaseError: false,
        theError: "",
        products: theProducts,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
        title: "products",
        userId: req.session.userId,
      };
      console.log("session: ", req.session);
      res.render("products.handlebars", model);
    }
  });
});
app.get("/products/new", (req, res) => {
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

app.post("/products/new", (req, res) => {
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
      "INSERT INTO products(pname, pyear, pdesc, ptype, pimgURL, pcolor, palcohol, pvolume, pthumbnail) VALUES (?,?,?,?,?,?,?,?,?)",
      newp,
      (error) => {
        if (error) {
          console.log("error", error);
        } else {
          console.log("line was added into products table!");
        }
      }
    );
    res.redirect("/products");
  } else {
    res.redirect("/products");
  }
});
app.get("/products/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    "SELECT * FROM products WHERE pid = ?",
    [id],
    function (error, foundProduct) {
      if (error) {
        console.log("error", error);
      } else {
        db.all(
          "SELECT reviews.*, users.uun FROM reviews LEFT JOIN users ON reviews.uid = users.uid WHERE reviews.pid = ?",
          [id],
          function (error, foundReviews) {
            if (error) {
            } else {
              const model = {
                hasDatabaseError: false,
                theError: "",
                product: foundProduct,
                reviews: foundReviews,
                isAdmin: req.session.isAdmin,
                isLoggedIn: req.session.isLoggedIn,
                userId: req.session.userId,
                title: id,
              };
              res.render("product.handlebars", model);
            }
          }
        );
      }
    }
  );
});
app.post("/products/:id/reviews", (req, res) => {
  const productId = req.params.id;
  const { reviewText, rating } = req.body;
  const userId = req.session.userId;
  const userName = req.session.name;
  if (req.session.isLoggedIn === true) {
    db.run(
      "INSERT INTO reviews (uid, pid, review, rating, uname) VALUES (?, ?, ?, ?, ?)",
      [userId, productId, reviewText, rating, userName],
      (error) => {
        if (error) {
          console.error("Error inserting review into the database:", error);
          res.status(500).send("Error submitting review.");
        } else {
          res.redirect(`/products/${productId}`);
          console.log(userName);
        }
      }
    );
  }
});
app.get("/products/update/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.get(
      "SELECT * FROM products where pid =?",
      [id],
      function (error, theProduct) {
        if (error) {
          const model = {
            hasDatabaseError: true,
            theError: error,
            product: [],
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
            products: theProduct,
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
  } else {
    res.render("404.handlebars");
  }
});

app.post("/products/update/:id", (req, res) => {
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
      "UPDATE products SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=?, pcolor=?, palcohol=?, pvolume=?, pthumbnail=? WHERE pid=?",
      newp,
      (error) => {
        if (error) {
          console.log("erroe", error);
        } else {
          console.log("updated");
        }
        res.redirect("/products");
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/products/delete/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn === true && req.session.isAdmin === true) {
    db.run(
      "DELETE FROM products where pid =?",
      [id],
      function (error, theProduct) {
        if (error) {
          const model = {
            hasDatabaseError: true,
            theError: error,
            product: theProduct,
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
            product: theProduct,
            isAdmin: req.session.isAdmin,
            name: req.session.name,
            isLoggedIn: req.session.isLoggedIn,
            userId: req.session.userId,
          };
          res.render("home.handlebars", model);
          res.redirect("/products");
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
  const { username, password, passwordConfirm } = req.body;

  console.log(req.body);
  const hash = bcrypt.hashSync(password, 10);
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    title: "sign up",
    userId: req.session.userId,
    notMatching: "not-matching",
  };
  if (password == passwordConfirm) {
    db.run(
      "INSERT INTO users (uname, urole, uun, upw) VALUES (?, ?, ?, ?)",
      [username, "customer", username, hash],
      (err) => {
        if (err) {
          res.status(500).send({ error: "Server errorsignup" });
        } else {
          res.redirect("/login");
          console.log("line was added to the table");
        }
      }
    );
  } else {
    res.render("signup.handlebars", model);
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
  "CREATE TABLE products (pid INTEGER PRIMARY KEY AUTOINCREMENT, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL, pcolor TEXT NOT NULL, palcohol INTEGER NOT NULL, pvolume INTEGER NOT NULL, pthumbnail TEXT NOT NULL)",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table products created!");
      const products = [
        {
          id: "1",
          name: "Midnight Stout",
          type: "Stout",
          desc: "A velvety dark stout that embraces the essence of midnight. Rich roasted malt flavors mingle with hints of chocolate and coffee, delivering a smooth and indulgent experience for those who appreciate the depth of flavor.",
          year: 2022,
          url: "/img/Product-img.svg",
          color: "Dark Brown",
          alcohol: 4.2,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
        {
          id: "2",
          name: "Citrus Zest IPA",
          type: "IPA",
          desc: "Bursting with citrusy goodness, this IPA is a zesty delight for the senses. It's a bold and hoppy brew infused with the essence of fresh citrus fruits. The vibrant aroma and sharp, citrus flavors make it a favorite among IPA enthusiasts.",
          year: 2022,
          url: "/img/Product-img.svg",
          color: "piss",
          alcohol: 6.9,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
        {
          id: "3",
          name: "Mystic Oak Amber",
          type: "Lager",
          desc: "A beer steeped in mystique, Mystic Oak Amber combines the richness of amber ale with the complexity of oak aging. Subtle vanilla and oak notes complement the caramel malts, creating a beer that is both intriguing and satisfying.",
          year: 2023,
          url: "/img/Product-img.svg",
          color: "amber",
          alcohol: 5.2,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
        {
          id: "4",
          name: "Crimson Sunset Lager",
          type: "Lager",
          desc: "Crimson Sunset Lager paints the sky with its deep, reddish hues. This lager offers a harmonious blend of caramel sweetness and a touch of roasted malt bitterness. As the sun sets, savor the smooth finish and the lingering warmth of this exceptional brew.",
          year: 2018,
          url: "/img/Product-img.svg",
          color: "red",
          alcohol: 4.8,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
        {
          id: "5",
          name: "Velvet Porter",
          type: "Porter",
          desc: "Velvet Porter is a luxurious beer with a smooth, velvety texture. Its dark, mahogany color hints at the decadent flavors within. Expect a delightful blend of chocolate, toffee, and roasted coffee notes, making every sip a sumptuous experience.",
          year: 2019,
          url: "/img/Product-img.svg",
          color: "Dark Amber",
          alcohol: 5.0,
          volume: 33,
          thumbnail: "/img/Product-img.svg",
        },
      ];

      products.forEach((oneProduct) => {
        db.run(
          "INSERT INTO products (pid, pname, pyear, pdesc, ptype, pimgURL, pcolor, palcohol, pvolume, pthumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            oneProduct.id,
            oneProduct.name,
            oneProduct.year,
            oneProduct.desc,
            oneProduct.type,
            oneProduct.url,
            oneProduct.color,
            oneProduct.alcohol,
            oneProduct.volume,
            oneProduct.thumbnail,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the products table!");
            }
          }
        );
      });
    }
  }
);

db.run(
  "CREATE TABLE users (uid INTEGER PRIMARY KEY AUTOINCREMENT, uname TEXT NOT NULL, urole TEXT NOT NULL, uun TEXT NOT NULL, upw TEXT NOT NULL)",
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
        {
          id: "2",
          name: "ronie.coleman",
          role: "customer",
          un: "ronie.coleman",
          pw: "1234",
        },
        {
          id: "3",
          name: "chad",
          role: "customer",
          un: "chad",
          pw: "12345",
        },
        {
          id: "4",
          name: "carl",
          role: "customer",
          un: "carl",
          pw: "123456",
        },
        {
          id: "5",
          name: "lisa",
          role: "customer",
          un: "lisa",
          pw: "1234567",
        },
      ];
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
  "CREATE TABLE reviews (rid INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, pid INTEGER, review TEXT NOT NULL, rating INTEGER NOT NULL, uname TEXT NOT NULL,  FOREIGN KEY(uid) REFERENCES users(uid), FOREIGN KEY(pid) REFERENCES products(pid), FOREIGN KEY(uname) REFERENCES users(uname))",
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
          rating: 3,
          username: "ebrin",
        },
        {
          uid: 3,
          pid: 4,
          review: "Woow tase like beer",
          rating: 4.5,
          username: "chad",
        },
        {
          uid: 3,
          pid: 1,
          review: "Woow tase like beer",
          rating: 2,
          username: "chad",
        },
        {
          uid: 2,
          pid: 1,
          review: "Woow tase like beer",
          rating: 1,
          username: "ronie.coleman",
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
          location: "Jönköping",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/bence-boros-8T5UAV6KkZA-unsplash.jpg",
          name: "Drinking beer event",
        },
        {
          eid: 2,
          date: "2023-11-16",
          location: "Stockholm",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/adam-gavlak-lqWf-yoQztI-unsplash.jpg",
          name: "Drinking beer event in Stockholm",
        },
        {
          eid: 3,
          date: "2023-12-10",
          location: "Gothenburg",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/edvin-johansson-xySWKrVlcWQ-unsplash.jpg",
          name: "Drinking beer event in Gothenburg",
        },
        {
          eid: 4,
          date: "2024-02-27",
          location: "Amsterdam",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/max-van-den-oetelaar--e4vLFZV9QM-unsplash.jpg",
          name: "Drinking beer event in Amsterdam",
        },
        {
          eid: 5,
          date: "2024-02-15",
          location: "Paris",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam maxime excepturi voluptatibus nam repellendus ipsum et. Voluptates, cum cupiditate. Accusantium modi nesciunt molestiae! Eveniet, deserunt optio omnis nisi adipisci reprehenderit!",
          thumbnail: "/img/alexander-kagan-t9Td0zfDTwI-unsplash.jpg",
          name: "Drinking beer event in Paris",
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
