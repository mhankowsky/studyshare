var express = require("express");
var app = express();
var $ = require("jquery");
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
    facebookId: String,
    facebookAccessToken: String,
    fullName: String,
    profilePicture: String,
    name: {
        familyName: String,
        givenName: String,
        middleName: String
    },
    classIDs: [
        ObjectId
    ]
}, {
    strict: false
});
var ClassSchema = new Schema({
    name: String,
    deptNum: Number,
    classNum: Number,
    owner: ObjectId,
    studentIDs: [
        ObjectId
    ]
});
var BuildingSchema = new Schema({
    name: String,
    lat: Number,
    long: Number
});
var EventSchema = new Schema({
    name: String,
    cls: ObjectId,
    building: ObjectId,
    startTime: String,
    endTime: String,
    owner: ObjectId,
    attendees: [
        ObjectId
    ]
});
var User = mongoose.model('User', UserSchema, 'users');
var Building = mongoose.model('Building', BuildingSchema, 'buildings');
var Event = mongoose.model('Event', EventSchema, 'events');
var Class = mongoose.model('Class', ClassSchema, 'classes');
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
        facebookId: user.facebookId
    }, function (err, user) {
        done(err, user);
    });
});
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    profileFields: [
        'photos', 
        'id', 
        'displayName', 
        'name'
    ],
    callbackURL: "http://localhost:8889/auth/facebook/callback",
    passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
    User.findOne({
        facebookId: profile.id
    }, function (err, user) {
        if(err) {
        }
        if(user === null) {
            var user = new User();
            user.facebookId = profile.id;
            user.fullName = profile.displayName;
            user.name = profile.name;
            user.profilePicture = profile.photos[0].value;
            user.facebookAccessToken = accessToken;
            user.classes = [];
            user.save(function (err1) {
                if(err1) {
                    throw err1;
                }
                done(null, user);
            });
        } else {
            user.facebookAccessToken = accessToken;
            done(null, user);
        }
    });
}));
app.get('/account', ensureAuthenticated, function (req, res) {
    var user = req.user;
    var classIDs = req.user.classIDs;
    var classes = [];
    Class.find({
    }).where('_id').in(classIDs).exec(function (err, records) {
        user.set("classes", records);
        res.send({
            user: user
        });
    });
});
app.get('/facebook_friends', ensureAuthenticated, function (req, res) {
    var theUrl = "https://graph.facebook.com/" + req.user.facebookId + "/friends" + "?access_token=" + req.user.facebookAccessToken;
    $.ajax({
        type: "get",
        url: theUrl,
        success: function (response) {
            var idArray = $.map(response.data, function (val, i) {
                return val.id;
            });
            User.find({
            }, {
                facebookAccessToken: 0
            }).where("facebookId").in(idArray).exec(function (err, records) {
                res.send(records);
            });
        },
        error: function (response) {
            console.log("error :(?");
            res.send(response);
        }
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
    res.redirect('auth/facebook');
}
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/static/login.html');
});
app.get('/buildings', function (req, res) {
    Building.findOne({
    }, function (err, building) {
        res.send(building);
    });
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
app.get("/static/:staticFilename", ensureAuthenticated, function (request, response) {
    response.sendfile("static/" + request.params.staticFilename);
});
app.listen(8889);
