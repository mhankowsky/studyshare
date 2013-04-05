var express = require("express");
var app = express();
var fs = require("fs");
var mongo = require('mongodb');
var host = 'localhost';
var port = mongo.Connection.DEFAULT_PORT;
var optionsWithEnableWriteAccess = {
    w: 1
};
var dbName = 'studyshareDb';
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "585448871465575";
var FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";
app.use(express.bodyParser());
app.use(passport.initialize());
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:8889/auth/facebook/callback"
}, function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        return done(null, profile);
    });
}));
app.get('/account', ensureAuthenticated, function (req, res) {
    res.send({
        user: req.user
    });
});
app.get('/auth/facebook', passport.authenticate('facebook'), function (request, response) {
});
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/static/login.html'
}), function (request, response) {
    response.redirect('/static/index.html');
});
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/static/login.html');
}
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/static/login.html');
});
var client = new mongo.Db(dbName, new mongo.Server(host, port), optionsWithEnableWriteAccess);
function openDb(onOpen) {
    client.open(onDbReady);
    function onDbReady(error) {
        if(error) {
            throw error;
        }
        client.collection('usersCollection', onUsersCollectionReady);
        client.collection('locationsCollection', onLocationsCollectionReady);
        client.collection('classesCollection', onClassesCollectionReady);
        client.collection('eventsCollection', onEventsCollectionReady);
    }
    function onUsersCollectionReady(error, usersCollection) {
        if(error) {
            throw error;
        }
        onOpen(usersCollection);
    }
    function onLocationsCollectionReady(error, locationsCollection) {
        if(error) {
            throw error;
        }
        onOpen(locationsCollection);
    }
    function onClassesCollectionReady(error, classesCollection) {
        if(error) {
            throw error;
        }
        onOpen(classesCollection);
    }
    function onEventsCollectionReady(error, eventsCollection) {
        if(error) {
            throw error;
        }
        onOpen(eventsCollection);
    }
}
function closeDb() {
    client.close();
}
app.get("/static/:staticFilename", function (request, response) {
    response.sendfile("static/" + request.params.staticFilename);
});
app.listen(8889);
