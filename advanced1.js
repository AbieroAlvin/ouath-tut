const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://localhost/your_database", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    provider: String,
    providerId: String,
    name: String,
    email: String,
  })
);

// Configure session with MongoDB store
app.use(
  session({
    secret: "YOUR_SESSION_SECRET",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost/your_database" }),
  })
);
