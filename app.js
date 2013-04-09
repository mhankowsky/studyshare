var express = require("express");
var app = express();
var fs = require("fs");
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "585448871465575";
var FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";
var mongo = require('mongodb');
var host = 'localhost';
var port = mongo.Connection.DEFAULT_PORT;
var optionsWithEnableWriteAccess = {
    w: 1
};
var dbName = 'studyshareDb';
var mongoose = require('mongoose/'), db = mongoose.connect('mongodb://localhost/studyshareDb');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var UserSchema = new Schema({
    id: ObjectId,
    facebookId: String,
    facebookAccessToken: String,
    facebookRefreshToken: String,
    fullName: String,
    name: {
        familyName: String,
        givenName: String,
        middleName: String
    }
});
mongoose.model('User', UserSchema);
var User = mongoose.model('User');
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({
    secret: 'keyboard cat'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname));
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    User.findOne({
        _id: user._id
    }, function (err, user) {
        done(err, user);
    });
});
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:8889/auth/facebook/callback",
    passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
    User.findOne({
        _id: profile.id
    }, function (err, user) {
        if(err) {
            var user = new User();
            user.facebookId = profile.id;
            user.fullName = profile.displayName;
            user.name = profile.name;
            user.facebookAccessToken = accessToken;
            user.facebookRefreshToken = refreshToken;
            user.save(function (err) {
                if(err) {
                    throw err;
                }
                done(null, user);
            });
        } else {
            user.facebookAccessToken = accessToken;
            user.facebookRefreshToken = refreshToken;
            done(null, user);
        }
    });
}));
app.get('/account', ensureAuthenticated, function (req, res) {
    res.send({
        user: req.user
    });
});
app.get('/auth/facebook', passport.authorize('facebook', {
    scope: []
}));
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
function openDb(collection, onOpen) {
    client.open(onDbReady);
    function onDbReady(error) {
        if(error) {
            throw error;
        }
        client.collection(collection, onCollectionReady);
    }
    function onCollectionReady(error, sscollection) {
        if(error) {
            throw error;
        }
        onOpen(sscollection);
    }
}
function closeDb() {
    client.close();
}
function insert(dbName, document) {
    function onDbOpen(collection) {
        collection.insert(document, onInsert);
    }
    openDb(dbName, onDbOpen);
}
function onInsert(err) {
    if(err) {
        throw err;
    }
    console.log('documents inserted!');
    closeDb();
}
function getClasses(query) {
    var classesArray;
    openDb("classesCollection", findClasses);
    function findClasses(collection) {
        classesArray = collection.find({
        }).toArray(callback);
        function callback(error, doc) {
            if(error) {
                throw error;
            }
            console.log(doc);
            closeDb();
        }
    }
    return classesArray;
}
app.get("/classes", function (request, response) {
    var classesArray = getClasses({
    });
    response.send({
        classes: classesArray,
        success: true
    });
});
app.get("/static/:staticFilename", function (request, response) {
    response.sendfile("static/" + request.params.staticFilename);
});
app.listen(8889);
