var db = require("../models");

module.exports = function(app) {
    var exphbs = require('express-handlebars');
    app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
    app.set('view engine', 'handlebars');

    app.get("/api/user", function(req, res) {
        // Here we add an "include" property to our options in our findAll query
        // We set the value to an array of the models we want to include in a left outer join
        // In this case, just db.Post
        db.user.findAll({
            include: [db.preferences],
        }).then(function(dbUser) {
            res.json(dbUser);
        });
    });

    app.get("/api/event", function(req, res) {
        // Here we add an "include" property to our options in our findAll query
        // We set the value to an array of the models we want to include in a left outer join
        // In this case, just db.Post
        db.event.findAll({
            include: [{
                model: db.user,
                through: {
                    attributes: ["userID"]
                }
                // include:[{
                //   model: db.eventSuggestions,
                //   through: {
                //     attributes:["eventID"]
                //   }
                // }]        
            }],
        }).then(function(dbEvent) {
            res.json(dbEvent);
        });
    });

    app.get("/api/event/suggestions", function(req, res) {
        // Here we add an "include" property to our options in our findAll query
        // We set the value to an array of the models we want to include in a left outer join
        // In this case, just db.Post
        db.event.findAll({
            include: [db.eventSuggestions],
        }).then(function(dbEvent) {
            res.json(dbEvent);
        });
    });

    app.get("/api/friend", function(req, res) {
        // Here we add an "include" property to our options in our findAll query
        // We set the value to an array of the models we want to include in a left outer join
        // In this case, just db.Post
        db.user.findAll({

            include: [{
                model: db.relationships,
                include: [{ model: db.user }]
            }],

        }).then(function(dbEvent) {
            res.json(dbEvent);
        });
    });


    app.get("/meetups/:eventID", function(req, res) {
        db.eventSuggestions.findAll({
            include: [{
                model: db.event,
                // include: [db.user]
            }],
            where: { eventId: req.params.eventID }
        }).then(function(getEvents) {

            db.event.findAll({
                include: [db.user],
                where: { id: req.params.eventID }
            }).then(function(getEvents2) {

                var eventsObject = {
                    eventSuggestions: getEvents,
                    meetup: getEvents2,
                };
                console.log(eventsObject);
                // res.json(eventsObject);
                res.render("indiv_meetup", eventsObject);

            });
        });
    });

    app.post("/meetups/:eventID/:userName", function(req, res) {

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


    app.post("/suggestions/like/:suggestionID", function(req, res) {

        db.eventSuggestions.findAll({
            attributes: ["upVote"],
            where: { id: req.params.suggestionID }
        }).then(function(getEvent) {
            var total = getEvent[0].upVote + 1
            db.eventSuggestions.update({
                upVote: total,
            }).then(function(getEvent3) {
                res.redirect("/");
            })
        })
    });

    app.post("/suggestions/dislike/:suggestionID", function(req, res) {

        db.eventSuggestions.findAll({
            attributes: ["downVote"],
            where: { id: req.params.suggestionID }
        }).then(function(getEvent) {
            var total = getEvent[0].downVote + 1
            db.eventSuggestions.update({
                downVote: total,
            }).then(function(getEvent3) {
                res.redirect("/");
            })
        })
    });

    app.get("/api/userNameToId", function(req, res) {
        db.user.findAll({
            attributes: ["id"],
            where: { userName: "morgan greenwalt" }
        }).then(function(getEvents2) {
            var eventsObject = {
                eventSuggestions: getEvents2[0].id,
            };
            res.json(eventsObject)
                // db.event.create({
                //     eventName: req.body.eventName,
                //     date: req.body.date,
                //     status: "open",
                //     totalAttendees: 0
                // }).then(function(newEvent) {
                //     res.redirect("/main");
                // });

        });
    });

    //Morgan's routes -- Event page 
    app.get("/meetups", function(req, res) {
        db.event.findAll({

        }).then(function(getEvents) {
            var eventsObject = {
                event: getEvents
            };
            console.log(eventsObject);
            res.render("meetups", eventsObject);
            // res.json(eventsObject);
        });
    });

    //Morgan's routes -- Event page 
    app.post("/meetups", function(req, res) {
        db.event.create({
            eventName: req.body.eventName,
            date: req.body.date,
            status: "open",
            totalAttendees: 0
        }).then(function(newEvent) {
            res.redirect("/main");
        });
        console.log("I'm trying to add a new event with the name " + req.body.eventName);
    });
};