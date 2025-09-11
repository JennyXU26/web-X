<<<<<<< HEAD
=======
const jwt = require("jsonwebtoken");
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df

// Centralized JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "6111-webx-secret";
const JWT_EXPIRES_IN = "24h";

function generateJWT(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

<<<<<<< HEAD
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


=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
}
<<<<<<< HEAD
const jwt = require("jsonwebtoken");


module.exports.issueTeamToken = issueTeamToken;
=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateJWT,
<<<<<<< HEAD
  issueTeamToken,
=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
  verifyJWT,
};
