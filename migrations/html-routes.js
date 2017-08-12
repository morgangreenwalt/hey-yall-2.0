var path = require("path");
// // Node Dependencies
var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
//image upload
var fileUpload = require("express-fileupload");
var path = require("path");

//models
var models = require("../models");

//SQL tie-ins
var config = require("../db.js");
var mysql = require("mysql");
var connection = mysql.createConnection(config.mySQLKeys);

//validation for form errors
var expressValidator = require("express-validator");

//Secured routing
var passport = require("passport");

//hash password
var bcrypt = require("bcrypt");
var saltRounds = 10;

module.exports = function(app) {
    app.get("/", function(req, res) {
        // console.log(req.user);
        // console.log(req.isAuthenticated())
        res.render("register", { title: "Register" });
    });
    // Pages from the old app
    // app.get("/preferences", function(req, res) {
    //     res.sendFile(path.join(__dirname, "../public/preferences.html"));
    // });

    app.get("/suggestions", function(req, res) {
        res.sendFile(path.join(__dirname, "../public/suggestions.html"));
    });

    // Developers page
    app.get("/developers", function(req, res) {
        res.render("developers", { title: "Developers" });
    });

    app.get("/preferences", function(req, res) {
        res.render("preferences", { title: "Preferences" });
    });

    app.get("/indiv_meetup", function(req, res) {
        res.render("indiv_meetup", { title: "Indiv_meetup" });
    });

    //Connect Page
    app.get("/connect", authenticationMiddleware(), function(req, res) {
        var user = req.user
        models.user.findAll({ where: { id: { $ne: req.user[0] } }, include: [{ model: models.relationships }] }).then(function(data) {
            console.log(data)

            var users = []

            for (var i = 0; i < data.length; i++) {
                if (data[i].relationships.length === 0) {
                    users.push(data[i])
                }
            }


            if (data.length === 0) {
                res.render("connect", {
                    data: {
                        users: data,
                        name: user[1]
                    }
                });

            } else {
                res.render("connect", {
                    data: {
                        users: users,
                        name: user[1]
                    }
                });

            }
        });
    });

    app.post("/connect/:id", authenticationMiddleware(), function(req, res) {
        console.log(req.user[0])

        models.relationships.create({ friendID: req.user[0], status: "pending", userId: req.params.id }).then(function(data) {
            res.redirect("/connect")
        })


        // res.redirect("/connect")
    });

    //register page
    app.get("/register", function(req, res) {
        res.render("register", { title: "Registration" });
    });

    app.post("/register", function(req, res) {
        //Going to be adding user to database
        //Validation
        // ----------------------------------------------------
        req.checkBody("username", "Username field cannot be empty.").notEmpty();
        req
            .checkBody("username", "Username must be between 4-15 characters long.")
            .len(4, 15);
        req
            .checkBody("email", "The email you entered is invalid, please try again.")
            .isEmail();
        req
            .checkBody(
                "email",
                "Email address must be between 4-100 characters long, please try again."
            )
            .len(4, 100);
        req
            .checkBody("password", "Password must be between 8-100 characters long.")
            .len(8, 100);
        req
            .checkBody(
                "password",
                "Password must include one lowercase character, one uppercase character, a number, and a special character."
            )
            .matches(
                /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/,
                "i"
            );
        req
            .checkBody(
                "passwordMatch",
                "Password must be between 8-100 characters long."
            )
            .len(8, 100);
        req
            .checkBody("passwordMatch", "Passwords do not match, please try again.")
            .equals(req.body.password);

        // Additional validation to ensure username is alphanumeric with underscores and dashes
        req
            .checkBody(
                "username",
                "Username can only contain letters, numbers, or underscores."
            )
            .matches(/^[A-Za-z0-9_-]+$/, "i");

        var errors = req.validationErrors();

        if (errors) {
            console.log(`errors: ${JSON.stringify(errors)}`);

            res.render("register", {
                title: "Registration Error",
                errors: errors
            });
        } else {
            var username = req.body.username;
            var email = req.body.email;
            var password = req.body.password;

            bcrypt.hash(password, saltRounds, function(err, hash) {
                // Store hash in your password DB.
                models.user
                    .create({ userName: username, email: email, password: hash })
                    .then(function(data) {
                        console.log(data.dataValues.id);

                        var user_id = data.dataValues.id;
                        //   creates sessions
                        console.log(user_id);
                        req.logIn([user_id, username], function(err) {
                            res.redirect("main");
                        });
                    });
            });
        }
    });

    //login page
    app.get("/login", function(req, res) {
        res.render("login", { title: "Login" });
    });

    app.post(
        "/login",
        passport.authenticate("local", {
            successRedirect: "/profile",
            failureRedirect: "/register"
        })
    );

    // Main page
    app.get("/main", authenticationMiddleware(), function(req, res) {
        res.render("main", { data: { name: req.user[1] } });
    });

    //Profile Page
    app.get("/profile", authenticationMiddleware(), function(req, res) {
        console.log(req.user);

        models.user.findOne({ where: { id: req.user[0] } }).then(function(data) {
            //   console.log(data)
            var image = data.dataValues.image;
            var user = req.user;

            models.relationships
                .findAll({
                    include: [{ model: models.user }]
                })
                .then(function(results) {
                    // console.log(results[0])
                    var accepted = [];
                    var pending = [];

                    for (var i = 0; i < results.length; i++) {
                        if (results[i].dataValues.status === "pending" && results[i].userId === user[0]) {
                            pending.push(results[i].friendID);
                        } else if (results[i].dataValues.status === "accepted" && results[i].userId === user[0]) {
                            accepted.push(results[i].friendID);
                        }
                    }


                    models.event.findAll({ where: { id: 2 } }).then(function(getEvents) {


                        models.user.findAll({ where: { id: pending } }).then(function(pendingData) {
                            models.user.findAll({ where: { id: accepted } }).then(function(acceptedData) {


                                res.render("profile", {
                                    data: {
                                        name: user[1],
                                        image: image,
                                        friends: acceptedData,
                                        friendRequest: pendingData,
                                        eventsObject: getEvents
                                    }
                                });
                            })
                        })
                    });

                });
        });
    });

    app.post("/profile", authenticationMiddleware(), function(req, res, next) {
        // req.file is the `avatar` file
        // req.body will hold the text fields, if there were any

        // res.send(res.file)
        var user = req.user;
        //Image upload
        if (!req.files) {
            res.send("No files");
        } else {
            var file = req.files.image;
            var extension = path.extname(file.name);

            if (
                extension !== ".png" &&
                extension !== ".gif" &&
                extension !== ".jpg" &&
                extension !== ".PNG" &&
                extension !== ".GIF" &&
                extension !== ".JPG"
            ) {
                res.send("Only Images");
            } else {
                file.mv("./public/uploads/" + file.name, function(err) {
                    if (err) throw err;
                    var image = req.files.image.name;

                    models.user.update({ image: image }, { where: { id: user[0] } });
                    res.redirect("profile");
                });
            }
        }
    });

    app.get("/logout", function(req, res) {
        req.logout();
        req.session.destroy();
        res.redirect("/login");
    });

    app.post("/profile/:id", authenticationMiddleware(), function(req, res) {
        var username = req.user[0]
        var friendrequest = req.params.id

        models.relationships.update({ status: "accepted" }, { where: { friendID: friendrequest, userId: username } }).then(function(data) {

            models.relationships.create({ friendID: username, status: "accepted", userId: friendrequest }).then(function(data) {
                res.redirect("/profile")
            });

        });

    });

    //===================================================Event Post=================================================//
    app.post("/meetups", authenticationMiddleware(), function(req, res) {
        models.event.create({
            eventName: req.body.eventName,
            date: req.body.date,
            status: "open",
            totalAttendees: 0
        }).then(function(newEvent) {

            res.redirect("/meetups");
        });
        console.log("I'm trying to add a new event with the name " + req.body.eventName);
    });

    //===================================================Others Profile Page=================================================//
    app.post("/:id", authenticationMiddleware(), function(req, res) {
        // console.log(req.params.username)

        var userId = req.params.id;

        models.user.findOne({ where: { id: userId } }).then(function(data) {
            console.log(data);

            var username = data.userName;
            var image = data.image;

            res.render("userprofile", {
                data: { name: username, image: image }
            });
        });
    });

    app.get("/meetups/:eventID/:userName", authenticationMiddleware(), function(req, res) {

        db.user.findAll({
            attributes: ["id"],
            where: { userName: req.params.userName }
        }).then(function(getEvents2) {

            db.eventMembers.create({
                eventId: req.params.eventID,
                userId: getEvents2[0].id,
            }).then(function(newEvent) {
                db.event.findAll({
                    attributes: ["totalAttendees"],
                    where: { id: req.params.eventID }
                }).then(function(getEvent) {
                    var total = getEvent[0].totalAttendees + 1
                    db.event.update({
                        totalAttendees: total,
                    }).then(function(getEvent3) {
                        res.redirect("/");
                    })
                })
            });

        });
    });

};

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

//Checks if user is logged in
function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(
            `req.session.passport.user: ${JSON.stringify(req.session.passport)}`
        );
        //if true it renders next page
        if (req.isAuthenticated()) return next();
        res.redirect("/login");
    };
}