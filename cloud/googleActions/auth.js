const jwt = require("jsonwebtoken");

const CLIENT_ID = process.env.CLIENT_ID;
const PROJECT_ID = process.env.PROJECT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const USER_ID = process.env.USER_ID

const generateCodeToken = (redirect_uri) =>
  jwt.sign(
    { client_id: CLIENT_ID, user_id: USER_ID, redirect_uri },
    JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );

exports.generateCodeToken = generateCodeToken;

const generateRefreshToken = (user_id) =>
  jwt.sign(
    {
      user_id,
      client_id: CLIENT_ID,
    },
    JWT_SECRET
  );
exports.generateRefreshToken = generateRefreshToken;

const generateAccessToken = (user_id) =>
  jwt.sign(
    {
      user_id,
      client_id: CLIENT_ID,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
exports.generateAccessToken = generateAccessToken;

const verifyAuthRedirect = ({ client_id, redirect_uri, state }) => {
  const expectedRedirectURIs = [
    `https://oauth-redirect.googleusercontent.com/r/${PROJECT_ID}`,
    `https://oauth-redirect-sandbox.googleusercontent.com/r/${PROJECT_ID}`,
  ];

  if (client_id !== client_id) {
    throw new Error("Unexpected client_id");
  }

  if (!expectedRedirectURIs.includes(redirect_uri)) {
    throw new Error("Unexpected redirect_uri");
  }

  return true;
};
exports.verifyAuthRedirect = verifyAuthRedirect;

const verifyCodeToken = ({ client_id, client_secret, code, redirect_uri }) =>
  new Promise((resolve, reject) => {
    console.log({ client_id, client_secret, code, redirect_uri });
    if (client_id !== CLIENT_ID) {
      return reject(new Error("Invalid client_id"));
    }

    if (client_secret !== CLIENT_SECRET) {
      return reject(new Error("Invalid client_secret"));
    }

    jwt.verify(code, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid code"));
      }

      if (decoded.client_id !== CLIENT_ID) {
        return reject(new Error("Invalid client_id"));
      }

      if (decoded.redirect_uri !== redirect_uri) {
        return reject(new Error("Invalid redirect_url"));
      }

      resolve(decoded);
    });
  });
exports.verifyCodeToken = verifyCodeToken;

const verifyRefreshToken = ({ client_id, client_secret, refresh_token }) =>
  new Promise((resolve, reject) => {
    if (client_id !== CLIENT_ID) {
      return reject(new Error("Invalid client_id"));
    }

    if (client_secret !== CLIENT_SECRET) {
      return reject(new Error("Invalid client_secret"));
    }

    jwt.verify(refresh_token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid refresh_token"));
      }

      if (decoded.client_id !== CLIENT_ID) {
        return reject(new Error("Invalid client_id"));
      }

      resolve(decoded);
    });
  });
exports.verifyRefreshToken = verifyRefreshToken;

const verifyAccessToken = (authorizarion = "") =>
  new Promise((resolve, reject) => {
    const accessToken = authorizarion.split(" ")[1];
    jwt.verify(accessToken, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid token"));
      }
      resolve(decoded);
    });
  });
exports.verifyAccessToken = verifyAccessToken;
