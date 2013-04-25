var express = require("express");
var app = express();
var request = require("request");
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
    facebookID: String,
    facebookAccessToken: String,
    fullName: String,
    profilePicture: String,
    name: {
        familyName: String,
        givenName: String,
        middleName: String
    },
    classNames: [
        String
    ],
    classIDs: [
        ObjectId
    ]
}, {
    strict: false
});
var ClassSchema = new Schema({
    name: String,
    num: Number,
    deptNum: Number,
    classNum: Number,
    ownerName: String,
    ownerID: ObjectId,
    studentNames: [
        String
    ],
    studentIDs: [
        ObjectId
    ]
}, {
    strict: false
});
var BuildingSchema = new Schema({
    name: String,
    lat: Number,
    long: Number
});
var EventSchema = new Schema({
    name: String,
    clsName: String,
    clsNum: Number,
    clsID: ObjectId,
    buildingName: String,
    buildingID: ObjectId,
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: Date.now
    },
    ownerName: String,
    ownerID: ObjectId,
    info: String,
    attendeesNames: [
        String
    ],
    attendeesIDs: [
        ObjectId
    ]
});
var User = mongoose.model('User', UserSchema, 'users');
var Building = mongoose.model('Building', BuildingSchema, 'buildings');
var AnEvent = mongoose.model('Event', EventSchema, 'events');
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
        facebookID: user.facebookID
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
        facebookID: profile.id
    }, function (err, user) {
        if(err) {
        }
        if(user === null) {
            var user = new User();
            user.facebookID = profile.id;
            user.fullName = profile.displayName;
            user.name = profile.name;
            user.profilePicture = profile.photos[0].value;
            user.facebookAccessToken = accessToken;
            user.classNames = [];
            user.classIDs = [];
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
    res.send({
        user: req.user
    });
});
app.get('/user/:id', ensureAuthenticated, function (req, res) {
    User.findOne({
        _id: req.params.id
    }, function (err, rec) {
        if(err) {
        }
        res.send({
            fullName: rec.fullName,
            profilePicture: rec.profilePicture,
            facebookID: rec.facebookID,
            classIDs: rec.classIDs,
            classNames: rec.classNames,
            classNums: rec.classNums
        });
    });
});
app.get('/facebook_friends', ensureAuthenticated, function (req, res) {
    var theUrl = "https://graph.facebook.com/" + req.user.facebookID + "/friends" + "?access_token=" + req.user.facebookAccessToken;
    request.get({
        url: theUrl
    }, function (e, r, response) {
        response = JSON.parse(response);
        if(e != null) {
            console.log("error :(?");
            r.send(response);
        } else {
            var idArray = response.data.map(function (val, i) {
                return val.id;
            });
            User.find({
            }, {
                facebookAccessToken: 0
            }).where("facebookID").in(idArray).exec(function (err, records) {
                res.send(records);
            });
        }
    });
});
app.get('/facebook_friends/:id', ensureAuthenticated, function (req, res) {
    var fbAccessToken;
    User.findOne({
        facebookID: req.params.id
    }, function (err, rec) {
        if(err) {
        }
        fbAccessToken = rec.facebookAccessToken;
        var theUrl = "https://graph.facebook.com/" + req.params.id + "/friends" + "?access_token=" + fbAccessToken;
        request.get({
            url: theUrl
        }, function (e, r, response) {
            response = JSON.parse(response);
            if(e != null) {
                console.log("error :(?");
                r.send(response);
            } else {
                var idArray = response.data.map(function (val, i) {
                    return val.id;
                });
                User.find({
                }, {
                    facebookAccessToken: 0
                }).where("facebookID").in(idArray).exec(function (err, records) {
                    res.send(records);
                });
            }
        });
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
    res.redirect('/auth/facebook');
}
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/static/login.html');
});
app.get('/buildings', function (req, res) {
    Building.find({
    }, function (err, buildings) {
        res.send(buildings);
    });
});
app.get('/classes', function (req, res) {
    Class.find({
    }, {
        name: 1,
        num: 1
    }, function (err, classes) {
        res.send(classes);
    });
});
app.get('/classes/:id', function (req, res) {
    Class.findOne({
        _id: req.params.id
    }, function (err, rec) {
        if(err) {
        }
        res.send({
            name: rec.name,
            num: rec.num,
            deptNum: rec.deptNum,
            classNum: rec.classNum,
            ownerName: rec.ownerName,
            ownerID: rec.ownerID,
            studentNames: rec.studentNames,
            studentIDs: rec.studentIDs
        });
    });
});
app.get('/events', function (req, res) {
    AnEvent.find({
    }, function (err, events) {
        res.send(events);
    });
});
app.post("/submit_event", ensureAuthenticated, function (req, res) {
    var theEvent = new AnEvent();
    theEvent.name = "Placeholder name";
    Building.findOne({
        name: req.body.building
    }, function (err, theBuilding) {
        theEvent.buildingName = theBuilding.name;
        theEvent.buildingID = theBuilding._id;
        Class.findOne({
            name: req.body.class
        }, function (err, theClass) {
            theEvent.clsName = theClass.name;
            theEvent.clsNum = theClass.num;
            theEvent.clsID = theClass._id;
            theEvent.ownerName = req.user.fullName;
            theEvent.ownerID = req.user._id;
            theEvent.attendeesNames = [
                req.user.fullName
            ];
            theEvent.attendeesIDs = [
                req.user._id
            ];
            theEvent.info = req.body.info;
            var startDate = new Date(req.body.start_date);
            console.log("1:" + startDate);
            startDate.setMinutes(req.body.offset);
            console.log("2:" + startDate);
            var timeStr = req.body.start_time.split(":");
            startDate.setHours(timeStr[0]);
            console.log("3:" + startDate);
            startDate.setMinutes(timeStr[1]);
            console.log("4:" + startDate);
            var endDate = new Date(req.body.end_date);
            endDate.setMinutes(req.body.offset);
            var timeStr = req.body.end_time.split(":");
            endDate.setHours(timeStr[0]);
            endDate.setMinutes(timeStr[1]);
            theEvent.startTime = startDate;
            theEvent.endTime = endDate;
            theEvent.save(function (err) {
                if(err) {
                    throw err;
                } else {
                    res.send({
                        success: true
                    });
                }
            });
        });
    });
});
app.put("/add_class", ensureAuthenticated, function (req, res) {
    var newClassIDs;
    var newClassNames;
    var newStudentIDs;
    var newStudentNames;
    Class.findOne({
        name: req.body.class
    }, function (err, theClass) {
        User.findOne({
            facebookID: req.user.facebookID
        }, function (err, theUser) {
            newClassIDs = theUser.classIDs;
            newClassNames = theUser.classNames;
            if(newClassIDs.indexOf(theClass._id) === -1) {
                newClassIDs.push(theClass._id);
                newClassNames.push(theClass.name);
            } else {
                res.send({
                    success: false,
                    alreadyInClass: true
                });
                return;
            }
            newStudentIDs = theClass.studentIDs;
            newStudentNames = theClass.studentNames;
            if(newStudentIDs.indexOf(theUser._id) === -1) {
                newStudentIDs.push(theUser._id);
                newStudentNames.push(theUser.fullName);
            }
            User.update({
                facebookID: req.user.facebookID
            }, {
                $set: {
                    classIDs: newClassIDs,
                    classNames: newClassNames
                }
            }, function (err) {
                if(err) {
                    throw err;
                }
                Class.update({
                    _id: theClass._id
                }, {
                    $set: {
                        studentIDs: newStudentIDs,
                        studentNames: newStudentNames
                    }
                }, function (err) {
                    if(err) {
                        throw err;
                    }
                    res.send({
                        success: true
                    });
                });
            });
        });
    });
});
app.post("/join_event", ensureAuthenticated, function (req, res) {
    AnEvent.findOne({
        _id: req.body.event_id
    }, function (err, theEvent) {
        var newAttendeeIDs = theEvent.attendeesIDs;
        var newAttendeeNames = theEvent.attendeesNames;
        var theObjectID = mongoose.Types.ObjectId(req.user._id.toString());
        if(theEvent.endTime < new Date()) {
            res.send({
                success: false,
                alreadyEnded: true
            });
        } else if(newAttendeeIDs.indexOf(theObjectID) != -1) {
            res.send({
                success: false,
                alreadyJoined: true
            });
        } else {
            newAttendeeIDs.push(theObjectID);
            newAttendeeNames.push(req.user.fullName);
            AnEvent.update({
                _id: req.body.event_id
            }, {
                $set: {
                    attendeesIDs: newAttendeeIDs,
                    attendeesNames: newAttendeeNames
                }
            }, function (err) {
                if(err) {
                    throw err;
                }
                res.send({
                    success: true
                });
            });
        }
    });
});
app.get("/static/:staticFilename", ensureAuthenticated, function (request, response) {
    response.sendfile("static/" + request.params.staticFilename);
});
app.listen(8889);
