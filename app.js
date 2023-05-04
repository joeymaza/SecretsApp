//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

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


userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields:["password"]});
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
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });

    newUser.save()
    .then(function(){
        res.render("secrets");
    })
    .catch(function(err){
        console.log(err);
    })
});
//user register email and password to begin access to secrets page
app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
    .then(function(foundUser){
        if (foundUser.password === password){
            res.render("secrets");
        }
    })
    .catch (function(err){
        console.log(err);
    })
});
//user log ins to secrets page, check to see if it matches what is on databse for user profile


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
