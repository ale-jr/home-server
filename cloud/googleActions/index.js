const { Router } = require("express");
const router = Router();
const {
  generateAccessToken,
  generateCodeToken,
  generateRefreshToken,
  verifyAuthRedirect,
  verifyRefreshToken,
  verifyCodeToken,
  verifyAccessToken,
} = require("./auth");

const { app } = require("./smarthome");

router.get("/auth", (req, resp) => {
  try {
    verifyAuthRedirect(req.query);
    const code = generateCodeToken(req.query.redirect_uri);
    const redirectUrl = `${req.query.redirect_uri}?code=${code}&state=${req.query.state}`;
    resp.redirect(redirectUrl);
  } catch (e) {
    console.error(e, req.query);
    resp.sendStatus(404);
  }
});

router.post("/token", async (req, resp) => {
  try {
    const { grant_type } = req.body;
    if (grant_type == "authorization_code") {
      const decoded = await verifyCodeToken(req.body);
      const refreshToken = generateRefreshToken(decoded.user_id);
      const accessToken = generateAccessToken(decoded.user_id);
      resp.json({
        token_type: "Bearer",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3000,
      });
    } else {
      const decoded = await verifyRefreshToken(req.body);
      const accessToken = generateAccessToken(decoded.user_id);
      resp.json({
        token_type: "Bearer",
        access_token: accessToken,
        expires_in: 3000,
      });
    }
  } catch (e) {
    console.error(e);
    resp.status(404).json({ error: "invalid_grant" });
  }
});

router.post("/fulfillment", [
  async (req, resp) => {
    try {
      const decoded = await verifyAccessToken(req.headers.authorization);
      req.headers.decoded = decoded;
      app(req, resp);
    } catch (e) {
      console.error(e);
      resp.sendStatus(400);
    }
  },
]);

exports.googleActionsRouter = router;
