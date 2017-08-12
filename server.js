// *****************************************************************************
// Server.js - This file is the initial starting point for the Node/Express server.
//
// ******************************************************************************
// *** Dependencies
// =============================================================
var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require('method-override');
var expressValidator = require('express-validator');

//database
var mysql = require("mysql");
var config = require("./db.js");
var connection;

// if (process.env.JAWSDB_URL) {
//     connection = mysql.createConnection({
//         host: 'mna97msstjnkkp7h.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
//         port: 3306,
//         user: 'xxxv0dsbo8uhrx63',
//         password: 'acxw3kspv5wlu8tz',
//         database: 'htb7qjtmmjdjyih4'
//     });
// } else {
//     connection = mysql.createConnection(config.mySQLKeys);
// }

//Authentication packages
var session = require("express-session");
var passport = require("passport");

//using local database
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);

//Hashing password
var bcrypt = require("bcrypt");
//upload images
var fileUpload = require("express-fileupload");

// Sets up the Express App
// =============================================================
var app = express();
var PORT = process.env.PORT || 3000;

// Requiring our models for syncing
var db = require("./models");

// Static directory
app.use(express.static("public"));
app.use(fileUpload());

// Sets up the Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

app.use(expressValidator()); // this line must be immediately after any of the bodyParser middlewares!

// var sessionStore = new MySQLStore(config.mySQLKeys);

if (true) {
    var sessionStore = new MySQLStore({
        host: 'mna97msstjnkkp7h.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
        port: 3306,
        user: 'xxxv0dsbo8uhrx63',
        password: 'acxw3kspv5wlu8tz',
        database: 'htb7qjtmmjdjyih4'
    });
} else {
    var sessionStore = new MySQLStore(config.mySQLKeys);
}

//session handling
app.use(session({
    secret: 'jehrfgejrhfge',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    //   cookie: { secure: true }
}));

//init passport-- also test if user is logged in
app.use(passport.initialize());
app.use(passport.session());

// Handlebars
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');


app.use(function(req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})

// Routes
// =============================================================
require("./migrations/html-routes.js")(app);
require("./migrations/api-routes.js")(app);
// require("./migrations/user-routes.js")(app);

//=======================================================//

// passport.use(new LocalStrategy(
//     function(username, password, done) {
//         console.log(username, password);



//         connection.query("SELECT id, password FROM users WHERE userName = ?", [username], function(err, results, fields) {
//             if (err) done(err)
//                 // console.log(results)

//             if (results.length === 0) {
//                 done(null, false)
//             } else {
//                 var hash = results[0].password.toString();

//                 bcrypt.compare(password, hash, function(err, response) {
//                     if (response === true) {
//                         return done(null, [results[0].id, username]);
//                     } else {
//                         done(null, false)
//                     }
//                 })
//             }
//         })
//     }
// ));

passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log(username, password);

        db.user.findOne({ where: { userName: username } }).then(function(results) {
            console.log(results)

            if (results.length === 0) {
                done(null, false)
            } else {
                var hash = results.password.toString();

                bcrypt.compare(password, hash, function(err, response) {
                    if (response === true) {
                        return done(null, [results.id, username]);
                    } else {
                        done(null, false)
                    }
                })
            }
        })


    }
));


// Syncing our sequelize models and then starting our Express app
// =============================================================
db.sequelize.sync({ force: false }).then(function() {
    app.listen(PORT, function() {
        console.log("App listening on PORT " + PORT);
    });
});