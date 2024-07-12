// Implementing Role-Based Access Control(RBAC) WITH OAuth
// After authenticating a user with OAuth, you might want to implement role-based access control
const express = require("express");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const User = require("./models/user"); // Assume this includes roles

const app = express();

passport.use(
  new OAuth2Strategy(
    {
      // ...OAth configuration...
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            accessToken,
            refreshToken,
            roles: ["user"], // Default role
          });
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasRole = roles.some((role) => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

app.get("/admin", checkRole(["admin"]), (req, res) => {
  res.json({ message: "Welcome to the admin panel" });
});

app.get("/user", checkRole(["user", "admin"]), (req, res) => {
  res.json({ message: "Welcome, user!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
