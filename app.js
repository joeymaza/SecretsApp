//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password:String,
    googleId: String,
    facebookId:String,
    secret:[String]
});
// add google ID to store and identify users logging in using Google

userSchema.plugin(passportLocalMongoose);

// encrypt specific field "password", and not the entire doc
userSchema.plugin(findOrCreate);
// using findOrcreate method plugin

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        name: user.name
      });
    });
  });
  // serialization (cookie) revised from local to open up for third party authentication

  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// google authentication strategy 

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
   
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


//TODO
app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
     res.redirect("/secrets");
  });

  app.get("/auth/facebook", 
  passport.authenticate('facebook')
);

app.get("/auth/facebook/secrets", 
passport.authenticate('facebook', { failureRedirect: '/login' }),
function(req, res) {
   res.redirect("/secrets");
});

app.get("/login", function (req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

// we don't add the secrets page for app.get because we want the user to login
app.get("/secrets", function(req,res){
   User.find({"secret": {$ne:null}})
   .then(function(foundUsers){
    
        res.render("secrets", {usersWithSecrets:foundUsers});
    })
   .catch(function(err){
    console.log(err);
   });
});

app.get("/submit", function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    const submittedSecret= req.body.secret;
    
    

    User.findById(req.user.id)
    .then (function(foundUser){
            if (foundUser){
                foundUser.secret.push(submittedSecret);
                foundUser.save()
            }else{
                console.log("User not found");
            }
        })

        .then(function(){
                    res.redirect("/secrets");
                })
                
        .catch(function(err){
                    console.log(err);
                });
            
        });
        



app.get("/logout", function(req,res,next){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      })
    });
app.post("/register", function(req,res){

    User.register({username:req.body.username}, req.body.password, function(err,user){
        if (err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    });
   

    

    
});
//user register email and password to begin access to secrets page
app.post("/login", function(req,res){

    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");

        });    

    }

    });
    

});
//user log ins to secrets page, check to see if it matches what is on databse for user profile


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
