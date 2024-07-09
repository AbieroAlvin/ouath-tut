// For a more complex real-world application, we'll implement multiple OAuth providers and integrate with a database (using MongoDB in this example):

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

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await user.findOne({
          providerId: profile.id,
          provider: "google",
        });
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            provider: "google",
            name: profile.displayName,
            email: profile.emails[0].value,
          });
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: "YOUR_FACEBOOK_APP_ID",
      clientSecret: "YOUR_FACEBOOK_APP_SECRET",
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ["id", "displayName", "email"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({
          providerId: profile.id,
          provider: "facebook",
        });
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            provider: "facebook",
            name: profile.displayName,
            email: profile.emails[0].value,
          });
        }
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

// Protected route
app.get("/profile", ensureAuthenticated, (req, res) => {
  res.json(req.user);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Logout route
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(3000, () => console.log("Server running on port 3000"));
