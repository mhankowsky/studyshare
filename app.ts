//facebook login code adapted from https://github.com/jaredhanson/passport-facebook/blob/master/examples/login/app.js

// RESTful Express server.

// Declares require function to make TSC happy when compiling
declare function require(name:string);

var express = require("express"); // imports express
var app = express();        // create a new instance of express

var $ = require("jquery");

// imports the fs module (reading and writing to a text file)
var fs = require("fs");

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var FACEBOOK_APP_ID = "585448871465575";
var FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";

//TODO switch to using mongoose
// imports the database module
var mongo = require('mongodb');
var host = 'localhost';
var port = mongo.Connection.DEFAULT_PORT;

// allows database writes
var optionsWithEnableWriteAccess = { w: 1 };
var dbName = 'studyshareDb';

var mongoose = require('mongoose/'),
    db = mongoose.connect('mongodb://localhost/studyshareDb');
    //userCollection = mongoose.noSchema('users',db); // collection name

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

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
  classIDs: [ObjectId]
}, {strict: false});

var ClassSchema = new Schema({
  name: String,
  num: Number,
  deptNum: Number,
  classNum: Number,
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
  name: String,
  clsName : String,
  clsNum : Number,
  clsID: ObjectId,
  buildingName: String,
  buildingID: ObjectId, //TODO change to location (drill down)
  startTime: {type: Date, default: Date.now},
  endTime: {type: Date, default: Date.now},
  ownerName: String,
  ownerID: ObjectId,
  info: String,
  attendeesNames: [String],
  attendeesIDs: [ObjectId]
});

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

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  User.findOne({facebookID: user.facebookID}, function (err, user) {
    done(err, user);
  });
});

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
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
        //TODO do something useful here...
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
        user.save(function(err1) {
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
  }
));

app.get('/account', ensureAuthenticated, function(req, res){
  res.send({user : req.user});
});

app.get('/user/:id', ensureAuthenticated, function(req, res) {
  User.findOne({ _id: req.params.id}, function(err, rec) {
    if (err) {
     //TODO do something useful here...
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

app.get('/facebook_friends', ensureAuthenticated, function(req, res) {
  var theUrl = "https://graph.facebook.com/" + req.user.facebookID + "/friends" + "?access_token=" + req.user.facebookAccessToken;
  $.ajax({
    type: "get",
    url: theUrl,
    success: function(response) {
      //TODO account for "paging" in the response
      var idArray = $.map(response.data, function(val, i) {
        return val.id;
      });
      User.find({}, {facebookAccessToken : 0}).where("facebookID").in(idArray).exec(function(err, records) {
        res.send(records);
      });
    },
    error: function(response) {
      console.log("error :(?");
      res.send(response);
    }
  });
});

app.get('/facebook_friends/:id', ensureAuthenticated, function(req, res) {
  var theUrl = "https://graph.facebook.com/" + req.params.id + "/friends" + "?access_token=" + req.user.facebookAccessToken;
  $.ajax({
    type: "get",
    url: theUrl,
    success: function(response) {
      //TODO account for "paging" in the response
      var idArray = $.map(response.data, function(val, i) {
        return val.id;
      });
      User.find({}, {facebookAccessToken : 0}).where("facebookID").in(idArray).exec(function(err, records) {
        res.send(records);
      });
    },
    error: function(response) {
      console.log("error :(?");
      res.send(response);
    }
  });
});

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

app.get('/buildings', function(req, res) {
  Building.find({}, function(err, buildings) {
    res.send(buildings);
  });
});

app.get('/classes', function(req, res) {
  Class.find({}, {name : 1, num : 1}, function(err, classes) {
    res.send(classes);
  });
});

app.get('/events', function(req, res) {
  AnEvent.find({}, function(err, events) {
    res.send(events);
  });
});

app.post("/submit_event", ensureAuthenticated, function(req, res) {
  //TODO error checking
  var theEvent = new AnEvent();
  theEvent.name = "Placeholder name";
  Building.findOne({name : req.body.building}, function(err, theBuilding) {
    theEvent.buildingName = theBuilding.name;
    theEvent.buildingID = theBuilding._id;
    Class.findOne({name : req.body.class}, function(err, theClass) {
      theEvent.clsName = theClass.name;
      theEvent.clsNum = theClass.num;
      theEvent.clsID = theClass._id;
      theEvent.ownerName = req.user.fullName;
      theEvent.ownerID = req.user._id;
      theEvent.attendeesNames = [req.user.fullName];
      theEvent.attendeesIDs = [req.user._id];
      theEvent.info = req.body.info;
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

//*****************************************************//

// This is for serving files in the static directory
app.get("/static/:staticFilename", ensureAuthenticated, function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});

// Finally, activate the server at port 8889
app.listen(8889);
