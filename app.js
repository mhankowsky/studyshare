var express = require("express");
var app = express();
var request = require("request");
var fs = require("fs");
var FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET;
var otherClassID;
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose/');
var db = mongoose.connect('mongodb://localhost/studyshareDb');
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
    classNums: [
        String
    ],
    classIDs: [
        ObjectId
    ],
    activeEvents: [
        ObjectId
    ]
}, {
    strict: false
});
var ClassSchema = new Schema({
    name: String,
    num: String,
    deptNum: String,
    classNum: String,
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
    clsName: String,
    clsNum: Number,
    clsID: ObjectId,
    buildingName: String,
    buildingID: ObjectId,
    lat: Number,
    long: Number,
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
function startPassport() {
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
                throw err;
            }
            if(user === null) {
                var user = new User();
                user.facebookID = profile.id;
                user.fullName = profile.displayName;
                user.name = profile.name;
                user.profilePicture = profile.photos[0].value;
                user.facebookAccessToken = accessToken;
                user.classNames = [
                    "Other"
                ];
                user.classNums = [
                    "00000"
                ];
                user.classIDs = [
                    otherClassID
                ];
                user.activeEvents = [];
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
}
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
            throw err;
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
app.get('/facebook_friends/:id', ensureAuthenticated, function (req, res) {
    var fbAccessToken;
    User.findOne({
        facebookID: req.params.id
    }, function (err, rec) {
        if(err) {
            throw err;
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
app.get('/buildings', function (req, res) {
    Building.find({
    }).sort({
        name: 1
    }).exec(function (err, buildings) {
        res.send(buildings);
    });
});
app.get('/building/:name', function (req, res) {
    Building.findOne({
        name: req.params.name
    }, function (err, building) {
        if(err) {
            throw err;
        } else {
            res.send(building);
        }
    });
});
app.get('/classes', function (req, res) {
    Class.find({
    }).sort({
        num: 1
    }).exec(function (err, classes) {
        res.send(classes);
    });
});
app.get('/classes/:id', function (req, res) {
    Class.findOne({
        _id: req.params.id
    }, function (err, rec) {
        if(err) {
            throw err;
        }
        res.send({
            name: rec.name,
            num: rec.num,
            deptNum: rec.deptNum,
            classNum: rec.classNum,
            ownerName: rec.ownerName,
            ownerID: rec.ownerID,
            studentNames: rec.studentNames,
            studentIDs: rec.studentIDs,
            _id: rec._id
        });
    });
});
function soHacky(duration) {
    return new Function("return ((new Date(this.endTime)).getTime() - (new Date(this.startTime)).getTime()) > (" + duration * 1000 * 60 + ");");
}
app.get('/events/:query', ensureAuthenticated, function (req, res) {
    var theUrl = "https://graph.facebook.com/" + req.user.facebookID + "/friends" + "?access_token=" + req.user.facebookAccessToken;
    var friends;
    var classes = req.user.classIDs;
    var events = {
    };
    var query = {
    };
    var JSONQuery = JSON.parse(req.params.query);
    if(JSONQuery.class != undefined) {
        query.clsID = mongoose.Types.ObjectId(JSONQuery.class.toString());
    }
    if(JSONQuery.building != undefined) {
        query.buildingID = mongoose.Types.ObjectId(JSONQuery.building.toString());
    }
    query.clsID = {
        $in: classes
    };
    if(JSONQuery.duration != undefined) {
        query["$where"] = soHacky(JSONQuery.duration);
        var timeRemaining = new Date();
        timeRemaining.setTime(timeRemaining.getTime() + JSONQuery.duration * 1000 * 60);
        query.endTime = {
            "$gt": timeRemaining
        };
    }
    request.get({
        url: theUrl
    }, function (e, r, response) {
        response = JSON.parse(response);
        if(e != null) {
            r.send(response);
        } else {
            var idArray = response.data.map(function (val, i) {
                return val.id;
            });
            User.find({
            }, {
                facebookAccessToken: 0
            }).where("facebookID").in(idArray).exec(function (err, records) {
                friends = records;
                for(var i = 0; i < friends.length; i++) {
                    for(var j = 0; j < friends[i].activeEvents; j++) {
                        events[friends[i].activeEvents[j]] = friends[i].activeEvents[j];
                        ;
                    }
                }
                AnEvent.remove({
                    endTime: {
                        $lt: new Date()
                    }
                }, function (err) {
                    if(err) {
                        throw err;
                    }
                    AnEvent.find(query, function (err, moreEvents) {
                        if(err) {
                            throw err;
                        }
                        for(var i = 0; i < moreEvents.length; i++) {
                            events[moreEvents[i]] = moreEvents[i];
                        }
                        var eventsArray = [];
                        for(var key in events) {
                            eventsArray.push(events[key]);
                        }
                        res.send(eventsArray);
                    });
                });
            });
        }
    });
});
app.post("/submit_event", ensureAuthenticated, function (req, res) {
    var theEvent = new AnEvent();
    Building.findOne({
        name: req.body.building
    }, function (err, theBuilding) {
        theEvent.buildingName = theBuilding.name;
        theEvent.buildingID = theBuilding._id;
        Class.findOne({
            _id: mongoose.Types.ObjectId(req.body.class)
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
            theEvent.lat = req.body.lat;
            theEvent.long = req.body.long;
            theEvent.startTime = req.body.startTime;
            theEvent.endTime = req.body.endTime;
            User.update({
                _id: req.user._id
            }, {
                $addToSet: {
                    activeEvents: theEvent._id
                }
            }, function (err) {
                if(err) {
                    throw err;
                }
            });
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
            User.update({
                _id: req.user._id
            }, {
                $addToSet: {
                    activeEvents: theEvent._id
                }
            }, function (err) {
                if(err) {
                    throw err;
                }
            });
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
app.put("/leave_event", ensureAuthenticated, function (req, res) {
    AnEvent.findOne({
        _id: req.body.event_id
    }, function (err, theEvent) {
        var newAttendeeIDs = theEvent.attendeesIDs;
        var newAttendeeNames = theEvent.attendeesNames;
        var theObjectID = mongoose.Types.ObjectId(req.user._id.toString());
        var index = newAttendeeIDs.indexOf(theObjectID);
        if(index !== -1) {
            newAttendeeIDs.splice(index, 1);
            newAttendeeNames.splice(index, 1);
        }
        User.update({
            _id: req.user._id
        }, {
            $pull: {
                activeEvents: theEvent._id
            }
        }, function (err) {
            if(err) {
                throw err;
            }
        });
        if(newAttendeeIDs.length === 0) {
            AnEvent.remove({
                _id: theEvent.id
            }, function (err) {
                res.send({
                    success: true
                });
            });
        } else {
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
app.put("/add_class", ensureAuthenticated, function (req, res) {
    var newClassIDs;
    var newClassNames;
    var newClassNums;
    var newStudentIDs;
    var newStudentNames;
    var theObjectID = mongoose.Types.ObjectId(req.body._id);
    Class.findOne({
        _id: theObjectID
    }, function (err, theClass) {
        if(err) {
            throw err;
        }
        User.findOne({
            facebookID: req.user.facebookID
        }, function (err, theUser) {
            newClassIDs = theUser.classIDs;
            newClassNames = theUser.classNames;
            newClassNums = theUser.classNums;
            if(newClassIDs.indexOf(theClass._id) === -1) {
                newClassIDs.push(theClass._id);
                newClassNames.push(theClass.name);
                newClassNums.push(theClass.num);
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
                    classNames: newClassNames,
                    classNums: newClassNums
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
app.put("/leave_class", ensureAuthenticated, function (req, res) {
    var newClassIDs;
    var newClassNames;
    var newClassNums;
    var newStudentIDs;
    var newStudentNames;
    var theObjectID = mongoose.Types.ObjectId(req.body._id);
    Class.findOne({
        _id: theObjectID
    }, function (err, theClass) {
        if(err) {
            throw err;
        }
        User.findOne({
            facebookID: req.user.facebookID
        }, function (err, theUser) {
            newClassIDs = theUser.classIDs;
            newClassNames = theUser.classNames;
            newClassNums = theUser.classNums;
            var index = newClassIDs.indexOf(theClass._id);
            if(!(index === -1)) {
                newClassIDs.splice(index, 1);
                newClassNames.splice(index, 1);
                newClassNums.splice(index, 1);
            } else {
                res.send({
                    success: false,
                    alreadyInClass: true
                });
                return;
            }
            newStudentIDs = theClass.studentIDs;
            newStudentNames = theClass.studentNames;
            index = newStudentIDs.indexOf(theUser._id);
            if(!(index === -1)) {
                newStudentIDs.splice(index, 1);
                newStudentNames.splice(index, 1);
            }
            User.update({
                facebookID: req.user.facebookID
            }, {
                $set: {
                    classIDs: newClassIDs,
                    classNames: newClassNames,
                    classNums: newClassNums
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
app.get("/static/:staticFilename", ensureAuthenticated, function (request, response) {
    response.sendfile("static/" + request.params.staticFilename);
});
app.get("/", ensureAuthenticated, function (request, response) {
    response.sendfile("static/index.html");
});
app.listen(8889);
fs.readFile("facebook_properties.txt", function (err, data) {
    if(err) {
        console.log("Error reading facebook_properties.txt");
        FACEBOOK_APP_ID = "585448871465575";
        FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";
    } else {
        var JSONdata = JSON.parse(data);
        FACEBOOK_APP_ID = JSONdata.FACEBOOK_APP_ID;
        FACEBOOK_APP_SECRET = JSONdata.FACEBOOK_APP_SECRET;
    }
    Class.findOne({
        "name": "Other"
    }, function (err, theClass) {
        if(err) {
            throw err;
        }
        otherClassID = theClass._id;
        startPassport();
    });
});
