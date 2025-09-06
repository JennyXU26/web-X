const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/database");

const encryptionRounds = 10;
const JWT_SECRET = "6111-webx-secret";

async function encryptPassword(password) {
  return await bcrypt.hash(password, encryptionRounds);
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

function generateJWT(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "24h" });
}

async function registerUser(username, password) {
  try {
    // Input validation
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    if (username.trim().length === 0 || password.length === 0) {
      return { success: false, error: "Username and password cannot be empty" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Check if username already exists
    const existingUser = await usersCollection.findOne({
      username: username.trim(),
    });
    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const hashedPassword = await encryptPassword(password);

    // Create new user
    const newUser = {
      username: username.trim(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return {
      success: true,
      message: "User registered successfully",
      userId: result.insertedId,
    };
  } catch (error) {
    console.error("[ERROR] Registration failed:", error);
    return { success: false, error: "Registration failed" };
  }
}

async function loginUser(username, password) {
  try {
    // Input validation
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Find user by username
    const user = await usersCollection.findOne({ username: username.trim() });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Invalid password" };
    }

    // Generate JWT token
    const token = generateJWT(user._id.toString(), user.username);

    return {
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        username: user.username,
      },
    };
  } catch (error) {
    console.error("[ERROR] Login failed:", error);
    return { success: false, error: "Login failed" };
  }
}

module.exports = {
  registerUser,
  loginUser,
};
