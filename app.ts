//facebook login code adapted from https://github.com/jaredhanson/passport-facebook/blob/master/examples/login/app.js

// RESTful Express server.

// Declares require function to make TSC happy when compiling
declare function require(name:string);

var express = require("express"); // imports express
var app = express();        // create a new instance of express

// imports the fs module (reading and writing to a text file)
var fs = require("fs");

// imports the database module
var mongo = require('mongodb');
var host = 'localhost';
var port = mongo.Connection.DEFAULT_PORT;

// allows database writes
var optionsWithEnableWriteAccess = { w: 1 };
var dbName = 'studyshareDb';

var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var FACEBOOK_APP_ID = "585448871465575";
var FACEBOOK_APP_SECRET = "b7653eeff6e478fbacc8f46fb4a422e7";

// the bodyParser middleware allows us to parse the
// body of a request
app.use(express.bodyParser());
app.use(passport.initialize());
//app.use(passport.session());

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

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:8889/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));


app.get('/account', ensureAuthenticated, function(req, res){
  res.send({ 
    user: req.user 
  });
});

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(request, response){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

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
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/static/login.html')
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/static/login.html');
});

//******************Database Code**********************//
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
