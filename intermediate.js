const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const session = require("express-session");

const app = express();

// Configure session
app.use(
  session({
    secret: "YOUR_SESSION_SECRET",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      //   Here you would find or create a user in your database
      return cb(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// google OAuth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

// Protected route
app.get("/profile", ensureAuthenticated, (req, res) => {
  res, send(`Hello, ${req.user.displayName}`);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
