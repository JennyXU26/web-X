
// Centralized JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "6111-webx-secret";
const JWT_EXPIRES_IN = "24h";

function generateJWT(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

//Compatible normalJWT with SIWEJWT
function issueTeamToken({ userID, displayName, email, ethAddresses }) {
  const payload = {
    userID,
    displayName,
    userId: userID,
    email: email ?? null,
    ethAddresses: ethAddresses ?? null
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
}
const jwt = require("jsonwebtoken");


module.exports.issueTeamToken = issueTeamToken;

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateJWT,
  issueTeamToken,
  verifyJWT,
};
