// For SaaS applications that need to support multiple tenants (organizations) with their own OAuth configurations:
const express = require("express");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const Tenant = require("./models/tenant"); // Assume this is your Tenant model
const User = require("./models/user"); // Assume this is your User model

const app = express();

async function configureOAuthForTenant(tenant) {
  passport.use(
    `oauth2-${tenant.id}`,
    new OAuth2Strategy(
      {
        authorizationURL: tenant.authorizationURL,
        tokenURL: tenant.tokenURL,
        clientID: tenant.clientID,
        clientSecret: tenant.clientSecret,
        callbackURL: `http://localhost:3000/auth/${tenant.id}/callback`,
      },
      async function (accessToken, refreshToken, profile, cb) {
        try {
          let user = await User.findOne({
            providerId: profile.id,
            tenantId: tenant.id,
          });
          if (!user) {
            user = await User.create({
              providerId: profile.id,
              tenantId: tenant.id,
              accessToken,
              refreshToken,
            });
          } else {
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;
            await user.save();
          }
          return cb(null, user);
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
}

// Configure OAuth for all tenants on startup
async function configureTenants() {
  const tenants = await Tenant.find();
  for (let tenant of tenants) {
    await configureOAuthForTenant(tenant);
  }
}
configureTenants();

app.get("/auth/:tenantId", (req, res, next) => {
  passport.authenticate(`oauth2-${req.params.tenantId}`)(req, res, next);
});

app.get(
  "/auth/:tenantId/callback",
  (req, res, next) => {
    passport.authenticate(`oauth2-${req.params.tenantId}`, {
      failureRedirect: "/login",
    })(req, res, next);
  },
  (req, res) => {
    res.redirect("/");
  }
);

app.listen(3000, () => console.log("Server running on port 3000"));
