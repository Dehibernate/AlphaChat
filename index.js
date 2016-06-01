var express = require('express'),
app = express(),
http = require('http').createServer(app),
passport = require('passport'),
ejs = require('ejs'),
LocalStrategy = require('passport-local'),
storage = require('./storage');

var session = require('express-session');
var DataStore = require('./storage/connect-datastore')(session);

var sessionMiddleware = session({
    secret: 'PUT_YOUR_SECRET_HERE',
    resave: false,
    cookie: { maxAge: 6 * 60 * 60 * 1000 },
    saveUninitialized: false,
    unset: 'destroy',
    store: new DataStore({
        client: storage.dbClient
    })
});

var wsServer = app.listen(
    '65080',
    '0.0.0.0',
    function () {
        console.log('Websocket server listening at http://%s:%s',
            wsServer.address().address,
            wsServer.address().port);
    }
    );

var io = require('socket.io').listen(wsServer);

//Setup Morgan for logging, cookie and body parsers,
//the session middleware to handle sessions
//and initialise passport module for user authentication
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

//Setup the ejs renderer. Allows passing parameters to html pages
app.engine('html', ejs.__express);

//The two methods below are used by passport to remember the user session
passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    storage.dbClient.getEntity(['User', username], function (err, user) {
        if (err) {
            return done(err);
        }
        done(null, user);
    });
});

//Set the auth strategy of Passport - using local-passport (i.e. handling it manually)
passport.use(new LocalStrategy(
    function (username, password, done) {
        storage.dbClient.getEntity(['User', username], function (err, user) {
            if (err) return done(err);
            if (!user) return done(null, false);
            if (user.password != password) return done(null, false);

            return done(null, user);
        });
    }
    ));

app.use(function(req,res,next){
    //Disable caching - would break sessions, since ejs template changes
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

require('./io.js')(io, storage);
require('./routes.js')(app, passport, express, storage);

var server = http.listen(process.env.PORT || 8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});