// OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service. It works by delegating user authentication to the service that hosts the user account and authorizing third-party applications to access that user account.

const express = require("express");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

const app = express();

// Configure OAuth2strategy
passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://provider.com/oauth2/authorize",
      tokenURL: "https://provider.com/oauth2/token",
      clientID: "YOUR_CLIENT_ID",
      clientSecret: "YOUR_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      //   here nyou would find or create a user in your database
      return cb(null, profile);
    }
  )
);

// Initialize Passport
app.use(passport.initialize());

// OAuth2 authentication route
app.get("/auth", passport.authenticate("oauth2"));

// Callback route
app.get(
  "/auth/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function (req, res) {
    // Successfull authentication, redirect home.
    res.redirect("/");
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server runningon port ${PORT}`));
