const express = require("express");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const axios = require("axios");
const User = require("./models/user"); // Assume this is your User model

const app = express();

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://provider.com/oauth2/authorize",
      tokenURL: "https://provider.com/oauth2/token",
      clientID: "YOUR_CLIENT_ID",
      clientSecret: "YOUR_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
          user = await User.create({
            providerId: profile.id,
            accessToken,
            refreshToken,
          });
        } else {
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          await user.save();
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

async function refreshAccessToken(user) {
  try {
    const response = await axios.post("https://provider.com/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: user.refreshToken,
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
    });

    user.accessToken = response.data.access_token;
    if (response.data.refresh_token) {
      user.refreshToken = response.data.refresh_token;
    }
    await user.save();

    return user.accessToken;
  } catch (error) {
    console.error("Error refreshing access token", error);
  }
}

app.get("/api/protected", async (req, res) => {
  try {
    const user = await user.findById(req.user.id);
    let accessToken = user.accessToken;

    try {
      // Try to use the current access token
      const response = await axios.get("https://api.provider.com/data", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Acces Token expired, try to refresh
        accessToken = await refreshAccessToken(user);
        const response = await axios.get("https://api.provider.com/data", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        res.json(response.data);
      } else {
        throw error;
      }
    }
  } catch (err) {
    res.status(500).json({ err: "An error occurred" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${3000}`));
