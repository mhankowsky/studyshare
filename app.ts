//facebook login code adapted from https://github.com/jaredhanson/passport-facebook/blob/master/examples/login/app.js

// RESTful Express server.

// Declares require function to make TSC happy when compiling
declare function require(name:string);
declare var __dirname;

var express = require("express"); // imports express
var app = express();        // create a new instance of express

var request = require("request");

// imports the fs module (reading and writing to a text file)
var fs = require("fs");

/*******************************************************************************************/
//Global variables
var FACEBOOK_APP_ID : String;
var FACEBOOK_APP_SECRET : String;

var otherClassID;

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var mongoose = require('mongoose/');
var db = mongoose.connect('mongodb://localhost/studyshareDb');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/*******************************************************************************************/
//Mongoose Schemas

var UserSchema = new Schema({
  facebookID: String,
  facebookAccessToken: String,
  fullName: String,
  profilePicture: String,
  name: {
          familyName : String,
          givenName : String,
          middleName : String
        },
  classNames: [String],
  classNums: [String],
  classIDs: [ObjectId],
  activeEvents: [ObjectId]
}, {strict: false});

var ClassSchema = new Schema({
  name: String,
  num: String,
  deptNum: String,
  classNum: String,
  ownerName: String,
  ownerID: ObjectId,
  studentNames : [String],
  studentIDs: [ObjectId]
}, {strict: false});

var BuildingSchema = new Schema({
  name: String,
  lat: Number,
  long: Number,
});

var EventSchema = new Schema({
  clsName : String,
  clsNum : Number,
  clsID: ObjectId,
  buildingName: String,
  buildingID: ObjectId,
  lat: Number,
  long: Number,
  startTime: {type: Date, default: Date.now},
  endTime: {type: Date, default: Date.now},
  ownerName: String,
  ownerID: ObjectId,
  info: String,
  attendeesNames: [String],
  attendeesIDs: [ObjectId]
});

//Mongoose collections
var User = mongoose.model('User', UserSchema, 'users');
var Building = mongoose.model('Building', BuildingSchema, 'buildings');
var AnEvent = mongoose.model('Event', EventSchema, 'events');
var Class = mongoose.model('Class', ClassSchema, 'classes');

// the bodyParser middleware allows us to parse the
// body of a request
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname));

/*******************************************************************************************/
//Passport setup

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  User.findOne({facebookID: user.facebookID}, function (err, user) {
    done(err, user);
  });
});

// Facebook strategy setup, wrapped in a function so that we do not start
//    before we read facebook app ID / secret from file.
function startPassport() {
  passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      profileFields: ['photos', 'id', 'displayName', 'name'],
      callbackURL: "http://localhost:8889/auth/facebook/callback",
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
      User.findOne({facebookID : profile.id}, function(err, user) {
        if(err) {
          throw err;
        }
        if(user === null) {
          //User not found.  Register a new user with default values
          var user = new User();
          user.facebookID = profile.id;
          user.fullName = profile.displayName;
          user.name = profile.name;
          user.profilePicture = profile.photos[0].value;
          user.facebookAccessToken = accessToken;
          //Every user starts with "other" class
          user.classNames = ["Other"];
          user.classNums = ["00000"];
          user.classIDs = [otherClassID];
          user.activeEvents = [];
          user.save(function(err1) {
            if(err1) {
              throw err1; 
            }
            done(null, user);
          });
        } else {
          //reset access token in case it changed
          user.facebookAccessToken = accessToken;
          done(null, user);
        }
      });
    }
  ));
}

/*******************************************************************************************/
//RESTful stuff


//boring Passport stuff.

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook', passport.authorize('facebook', { scope: [] }));

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: '/static/login.html',
  }),
  function(request, response) {
    response.redirect('/static/index.html');
  }
);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    return next();
  }
  res.redirect('/auth/facebook');
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/static/login.html');
});

//send user own account info
app.get('/account', ensureAuthenticated, function(req, res){
  res.send({user : req.user});
});

//If a user requests someone else's account info, send non-private information (DON'T SEND FACEBOOK TOKEN)
app.get('/user/:id', ensureAuthenticated, function(req, res) {
  User.findOne({ _id: req.params.id}, function(err, rec) {
    if (err) {
     throw err;
    }
    
    res.send({
      fullName : rec.fullName,
      profilePicture : rec.profilePicture,
      facebookID : rec.facebookID,
      classIDs : rec.classIDs,
      classNames : rec.classNames,
      classNums : rec.classNums
    });
  });
});

//Returns all facebook friends of certain user
app.get('/facebook_friends/:id', ensureAuthenticated, function(req, res) {
  var fbAccessToken;
  
  User.findOne({facebookID: req.params.id}, function(err, rec) {
    if (err) {
      throw err;
    }
    
    fbAccessToken = rec.facebookAccessToken;
    
    var theUrl = "https://graph.facebook.com/" + req.params.id + "/friends" + "?access_token=" + fbAccessToken;
    request.get(
      {url: theUrl},
      function(e, r, response) {
        response = JSON.parse(response);
        if(e != null) {
          console.log("error :(?");
          r.send(response);
        } else {
          var idArray = response.data.map(function(val, i) {
            return val.id;
          });

          //finds intersection of all facebook friends of user, and all users who have registered with our application.
          User.find({}, {facebookAccessToken : 0}).where("facebookID").in(idArray).exec(function(err, records) {
            res.send(records);
          });
        }
      }
    );
  });
});

//simply returns all buildings in database
app.get('/buildings', function(req, res) {
  Building.find({}).sort({name : 1}).exec(function(err, buildings) {
    res.send(buildings);
  });
});

//returns specific building from database
app.get('/building/:name', function(req, res) {
  Building.findOne({name: req.params.name}, function(err, building) {
    if(err) {
      throw err;
    } else {
      res.send(building);
    }
  });
});

//returns all classes in database
app.get('/classes', function(req, res) {
  Class.find({}).sort({num: 1}).exec(function(err, classes) {
    res.send(classes);
  });
});

//returns specific class from database
app.get('/classes/:id', function(req, res) {
  Class.findOne({ _id: req.params.id}, function(err, rec) {
    if (err) {
     throw err;
    }
    res.send({
      name : rec.name,
      num : rec.num,
      deptNum : rec.deptNum,
      classNum : rec.classNum,
      ownerName : rec.ownerName,
      ownerID: rec.ownerID,
  	  studentNames : rec.studentNames,
  	  studentIDs: rec.studentIDs,
  	  _id: rec._id
    });
  });
});


//wow I feel bad for making this function...but I need a way to substitute the value of "duration" variable with the actual value,
//which is them passed in to a javascript function in mongo.  Since mongo can't use the "duration" variable, this is the best solution.
function soHacky(duration) {
  return new Function("return ((new Date(this.endTime)).getTime() - (new Date(this.startTime)).getTime()) > (" + duration * 1000 * 60 + ");");
}

//Returns all events that match the given query.
//Events involving facebook friends and classes you are in are automatically added to the query for privacy reasons
app.get('/events/:query', ensureAuthenticated, function(req, res) {
  var theUrl = "https://graph.facebook.com/" + req.user.facebookID + "/friends" + "?access_token=" + req.user.facebookAccessToken;
  var friends;
  var classes = req.user.classIDs;
  var events : any = {};
  var query : any = {};
  var JSONQuery = JSON.parse(req.params.query);
  if(JSONQuery.class != undefined) {
    query.clsID = mongoose.Types.ObjectId(JSONQuery.class.toString());
  }
  if(JSONQuery.building != undefined) {
    query.buildingID = mongoose.Types.ObjectId(JSONQuery.building.toString());
  }

  query.clsID = {$in : classes};

  //Find events of length more than "duration" and also have more than "duration" time remaining if they have already started
  if(JSONQuery.duration != undefined) {
    query["$where"] = soHacky(JSONQuery.duration);
    var timeRemaining = new Date();
    timeRemaining.setTime(timeRemaining.getTime() + JSONQuery.duration * 1000 * 60);
    query.endTime = {"$gt" : timeRemaining};
  }

  //First, get facebook friends of user
  request.get(
    {url: theUrl},
    function(e, r, response) {
      response = JSON.parse(response);
      if(e != null) {
        r.send(response);
      } else {
        var idArray = response.data.map(function(val, i) {
          return val.id;
        });

        User.find({}, {facebookAccessToken : 0}).where("facebookID").in(idArray).exec(function(err, records) {
          friends = records;
          for(var i = 0; i < friends.length; i++) {
            //Add events from facebook friends
            for(var j = 0; j < friends[i].activeEvents; j++) {
              events[friends[i].activeEvents[j]] = friends[i].activeEvents[j];;
            }
          }

          //Delete old events that have already ended
          AnEvent.remove({endTime : {$lt : new Date()}}, function(err) {
            if(err) {
              throw err;
            }

            //Add events that match query
            AnEvent.find(query, function(err, moreEvents) {
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
    }
  );
});

//Addint a new event
app.post("/submit_event", ensureAuthenticated, function(req, res) {
  var theEvent = new AnEvent();
  Building.findOne({name : req.body.building}, function(err, theBuilding) {
    theEvent.buildingName = theBuilding.name;
    theEvent.buildingID = theBuilding._id;

    Class.findOne({_id : mongoose.Types.ObjectId(req.body.class)}, function(err, theClass) {
      theEvent.clsName = theClass.name;
      theEvent.clsNum = theClass.num;
      theEvent.clsID = theClass._id;
      theEvent.ownerName = req.user.fullName;
      theEvent.ownerID = req.user._id;
      theEvent.attendeesNames = [req.user.fullName];
      theEvent.attendeesIDs = [req.user._id];
      theEvent.info = req.body.info;
      theEvent.lat = req.body.lat;
      theEvent.long = req.body.long;
      
      theEvent.startTime = req.body.startTime;
      theEvent.endTime = req.body.endTime;

      User.update({_id : req.user._id}, {$addToSet : {activeEvents : theEvent._id}}, function(err) {
        if(err) {
          throw err;
        }
      });

      theEvent.save(function(err) {
        if(err) {
          throw err;
        } else {
          res.send({success: true});
        }
      });
    });
  });
});

//Join an event
app.post("/join_event", ensureAuthenticated, function(req, res) {
  AnEvent.findOne({_id : req.body.event_id}, function(err, theEvent) {
    var newAttendeeIDs = theEvent.attendeesIDs;
    var newAttendeeNames = theEvent.attendeesNames;
    var theObjectID = mongoose.Types.ObjectId(req.user._id.toString());
    //cannot join an event that has already ended
    if(theEvent.endTime < new Date()) {
      res.send({
        success: false,
        alreadyEnded: true
      });
    //Cannot join an event that you have previously joined
    } else if(newAttendeeIDs.indexOf(theObjectID) != -1) {
      res.send({
        success: false,
        alreadyJoined: true
      });
    } else {
      //update mongo and send success
      newAttendeeIDs.push(theObjectID);
      newAttendeeNames.push(req.user.fullName);

      User.update({_id : req.user._id}, {$addToSet : {activeEvents : theEvent._id}}, function(err) {
        if(err) {
          throw err;
        }
      });

      AnEvent.update({_id : req.body.event_id}, {$set : {attendeesIDs : newAttendeeIDs, attendeesNames : newAttendeeNames}}, function(err) {
        if(err) {
          throw err;
        }
        res.send({success : true});
      });
    }
  });
});

//Leave an event
app.put("/leave_event", ensureAuthenticated, function(req, res) {
  AnEvent.findOne({_id : req.body.event_id}, function(err, theEvent) {
    var newAttendeeIDs = theEvent.attendeesIDs;
    var newAttendeeNames = theEvent.attendeesNames;
    var theObjectID = mongoose.Types.ObjectId(req.user._id.toString());
    
    var index = newAttendeeIDs.indexOf(theObjectID);
    
    if (index !== -1) {
      newAttendeeIDs.splice(index, 1);
      newAttendeeNames.splice(index, 1);
    }

    User.update({_id : req.user._id}, {$pull : {activeEvents : theEvent._id}}, function(err) {
      if(err) {
        throw err;
      }
    });
    
    if (newAttendeeIDs.length === 0) {
      AnEvent.remove({_id : theEvent.id}, function(err) {
        res.send({success : true});
      });
    } else {
      AnEvent.update({_id : req.body.event_id}, {$set : {attendeesIDs : newAttendeeIDs, attendeesNames : newAttendeeNames}}, function(err) {
        if(err) {
          throw err;
        }
        res.send({success : true});
      });
    }
  });
});


//Add a class
app.put("/add_class", ensureAuthenticated, function(req, res) {
  var newClassIDs;
  var newClassNames;
  var newClassNums;
  var newStudentIDs;
  var newStudentNames;

  var theObjectID = mongoose.Types.ObjectId(req.body._id);

  Class.findOne({_id : theObjectID}, function(err, theClass) {
    if(err) {
      throw err;
    }
    User.findOne({facebookID : req.user.facebookID}, function(err, theUser) {
      newClassIDs = theUser.classIDs;
      newClassNames = theUser.classNames;
      newClassNums = theUser.classNums;
      if (newClassIDs.indexOf(theClass._id) === -1) {
        newClassIDs.push(theClass._id);
        newClassNames.push(theClass.name);
        newClassNums.push(theClass.num);
      } else {
        res.send({success: false, alreadyInClass : true});
        return;
      }
      
      newStudentIDs = theClass.studentIDs;
      newStudentNames = theClass.studentNames;
      if (newStudentIDs.indexOf(theUser._id) === -1) {
        newStudentIDs.push(theUser._id);
        newStudentNames.push(theUser.fullName);
      }
      
      User.update({facebookID : req.user.facebookID}, { $set: {classIDs : newClassIDs, classNames : newClassNames, classNums : newClassNums}}, function(err) {
        if (err) {
          throw err;
        }
        Class.update({_id : theClass._id}, { $set: {studentIDs : newStudentIDs, studentNames : newStudentNames}}, function(err) {
          if (err) {
            throw err;
          }
          
          res.send({success:true});
        });
      });
    });
  });
});

//Remove a class
app.put("/leave_class", ensureAuthenticated, function(req, res) {
  var newClassIDs;
  var newClassNames;
  var newClassNums;
  var newStudentIDs;
  var newStudentNames;

  var theObjectID = mongoose.Types.ObjectId(req.body._id);

  Class.findOne({_id : theObjectID}, function(err, theClass) {
    if(err) {
      throw err;
    }
    User.findOne({facebookID : req.user.facebookID}, function(err, theUser) {
      newClassIDs = theUser.classIDs;
      newClassNames = theUser.classNames;
      newClassNums = theUser.classNums;
      var index = newClassIDs.indexOf(theClass._id);
      if (!(index === -1)) {
        newClassIDs.splice(index, 1);
        newClassNames.splice(index, 1);
        newClassNums.splice(index, 1);
      } else {
        res.send({success: false, alreadyInClass : true});
        return;
      }
      
      newStudentIDs = theClass.studentIDs;
      newStudentNames = theClass.studentNames;
      index = newStudentIDs.indexOf(theUser._id);
      if (!(index === -1)) {
        newStudentIDs.splice(index, 1);
        newStudentNames.splice(index, 1);
      }
      
      User.update({facebookID : req.user.facebookID}, { $set: {classIDs : newClassIDs, classNames : newClassNames, classNums : newClassNums}}, function(err) {
        if (err) {
          throw err;
        }
        Class.update({_id : theClass._id}, { $set: {studentIDs : newStudentIDs, studentNames : newStudentNames}}, function(err) {
          if (err) {
            throw err;
          }
          res.send({success:true});
        });
      });
    });
  });
});

//*****************************************************//

// This is for serving files in the static directory
app.get("/static/:staticFilename", ensureAuthenticated, function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});

//redirect / to homepage
app.get("/", ensureAuthenticated, function (request, response) {
  response.sendfile("static/index.html");
});

// Finally, activate the server at port 8889
app.listen(8889);

//Read properties file containing app secret / ID.  Then start passport.
fs.readFile("facebook_properties.txt", function(err, data) {
  //use default values if file doesn't exist
  if (err) {
    console.log("Error reading facebook_properties.txt")
    FACEBOOK_APP_ID = "585448871465575";
    FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";
  } else {
    var JSONdata = JSON.parse(data);
    FACEBOOK_APP_ID = JSONdata.FACEBOOK_APP_ID;
    FACEBOOK_APP_SECRET = JSONdata.FACEBOOK_APP_SECRET;
  }
  Class.findOne({"name" : "Other"}, function(err, theClass) {
    if(err) {
      throw err;
    }
    otherClassID = theClass._id;
    startPassport();
  });  
});
