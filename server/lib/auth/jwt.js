const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(userId) {
  const jti = nanoid(21);
  const token = jwt.sign({ sub: userId, jti }, REFRESH_SECRET, { expiresIn: "30d" });
  return { token, jti };
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
};
