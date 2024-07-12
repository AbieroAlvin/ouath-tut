//  Implementing PKCE(ProofKey for Code Exchange)
// PKCE is an extension to OAuth 2.o that prevents certain attacks and is required by some OAuth providers.

const express = require("express");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const crypto = require("crypto");
const base64url = require("base64url");

const app = express();

function generateCodeVerifier() {
  return base64url(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  const base64Digest = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64");
  return base64url.fromBase64(base64Digest);
}

app.get("/auth", (req, res, next) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  req.session.codeVerifier = codeVerifier;

  passport.authenticate("oauth2", {
    state: codeChallenge,
    codeChallenge: codeChallenge,
    codeChallengeMethod: "S256",
  })(req, res, next);
});

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://provider.com/oauth2/authorize",
      tokenURL: "https://provider.com/oauth2/token",
      clientID: "YOUR_CLIENT_ID",
      clientSecret: "YOUR_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/callback",
      pkce: true,
      state: true,
    },
    function (accessToken, refreshToken, profile, cb) {
      // User creation/retrieval logic here
    }
  )
);

app.get(
  "/auth/callback",
  (req, res, next) => {
    const codeVerifier = req.session.codeVerifier;
    delete req.session.codeVerifier;

    passport.authenticate("oauth2", {
      codeVerifier: codeVerifier,
      failureRedirect: "/login",
    })(req, res, next);
  },
  (req, res) => {
    res.redirect("/");
  }
);

app.listen(3000, () => console.log("Server running on port 3000"));
