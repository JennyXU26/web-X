const jwt = require("jsonwebtoken");

// Centralized JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "6111-webx-secret";
const JWT_EXPIRES_IN = "24h";

function generateJWT(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateJWT,
  verifyJWT,
};
