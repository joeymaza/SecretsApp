//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password:String
});



// encrypt specific field "password", and not the entire doc

const User = new mongoose.model("User", userSchema);

//TODO
app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function (req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});
// we don't add the secrets page for app.get because we want the user to login

app.post("/register", function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.

        const newUser = new User({
            email:req.body.username,
            password:hash
            //using hash from "salting" bcrypt function to encrypt password
        });
    
        newUser.save()
        .then(function(){
            res.render("secrets");
        })
        .catch(function(err){
            console.log(err);
        })
    });

    
});
//user register email and password to begin access to secrets page
app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
    .then(function(foundUser){
        bcrypt.compare(password, foundUser.password, function(err, result) {
            // result == true

        if (result===true){
            res.render("secrets");
        }
        });
        
         })
    
    .catch (function(err){
        console.log(err);
    })
});
//user log ins to secrets page, check to see if it matches what is on databse for user profile


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
