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
  id: ObjectId,
  facebookId: String,
  facebookAccessToken: String,
  fullName: String,
  profilePicture: String,
  name: {
          familyName : String,
          givenName : String,
          middleName : String
        },
  classes: [{
              name : String,
              deptNum : Number,
              classNum : Number,
              owner : String,
              students : [String]
  		   }]
});

mongoose.model('User', UserSchema);
var User = mongoose.model('User');


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
  User.findOne({facebookId: user.facebookId}, function (err, user) {
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
    User.findOne({facebookId : profile.id}, function(err, user) {
      if(err) {
        //TODO do something useful here...
      }
      if(user === null) {
        var user = new User();
        user.facebookId = profile.id;
        user.fullName = profile.displayName;
        user.name = profile.name;
        user.profilePicture = profile.photos[0].value;
        user.facebookAccessToken = accessToken;
        user.classes = [];
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
  res.send({ 
    user: req.user 
  });
});

app.get('/facebook_friends', ensureAuthenticated, function(req, res) {
  var theUrl = "https://graph.facebook.com/" + req.user.facebookId + "/friends" + "?access_token=" + req.user.facebookAccessToken;
  $.ajax({
    type: "get",
    url: theUrl,
    success: function(response) {
      var idArray = $.map(response.data, function(val, i) {
        return val.id;
      });
      User.find({}, {facebookAccessToken : 0}).where("facebookId").in(idArray).exec(function(err, records) {
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
  });


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    return next();
  }
  res.redirect('/static/login.html');
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/static/login.html');
});

//******************Database Code**********************//
//TODO SWTICH TO MONGOOSE

var client = new mongo.Db(
    dbName,
    new mongo.Server(host, port),
    optionsWithEnableWriteAccess
);

// Simple function to open the database
function openDb(collection : string, onOpen){
    client.open(onDbReady);

  function onDbReady(error){
    if (error) {
      throw error;
    }
    
    client.collection(collection, onCollectionReady)
  }

  function onCollectionReady(error, sscollection) {
    if (error) {
      throw error;
    }

    onOpen(sscollection);
  }
}

// Simple function to close access to the database
function closeDb(){
  client.close();
}

function insert(dbName, document) {
  function onDbOpen(collection) {
    collection.insert(document, onInsert);
  }
  openDb(dbName, onDbOpen);
}

function onInsert(err){
  if (err) {
    throw err;
  }
  console.log('documents inserted!');
  closeDb();
}
//*****************************************************//

function getClasses(query) {
  var classesArray;
  openDb("classesCollection", findClasses);
  
  function findClasses(collection) {
    classesArray = collection.find({}).toArray(callback);
    
    function callback(error, doc) {
      if (error) {
        throw error;
      }
      
      console.log(doc);
      closeDb();
    }
  }
  
  return classesArray;
}

// get all classes
app.get("/classes", function(request, response) {
  var classesArray = getClasses({});
  
  response.send({
    classes: classesArray,
    success: true
  });
});

// This is for serving files in the static directory
app.get("/static/:staticFilename", function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});

// Finally, activate the server at port 8889
app.listen(8889);
