const bcrypt = require("bcryptjs");
const { getDB } = require("../config/database");
const { generateJWT } = require("../config/auth");

const encryptionRounds = 10;

async function encryptPassword(password) {
  return await bcrypt.hash(password, encryptionRounds);
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

async function registerUser(email, password, displayName) {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    if (email.trim().length === 0 || password.length === 0) {
      return { success: false, error: "Email and password cannot be empty" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: "Invalid email format" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email: email.trim() });
    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await encryptPassword(password);

    // Create new user with new schema
    const newUser = {
      email: email.trim(),
      password: hashedPassword, // Store hashed password (not in spec but needed)
      ethAddresses: null,
      displayName: displayName || email.split("@")[0], // Default to email prefix if not provided
      posts: [], // Initialize empty posts array
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return {
      success: true,
      userID: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("[ERROR] Registration failed:", error);
    return { success: false, error: "Registration failed" };
  }
}

async function loginUser(email, password) {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Find user by email
    const user = await usersCollection.findOne({ email: email.trim() });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Invalid password" };
    }

    // Generate JWT token using centralized function
    const token = generateJWT(user._id.toString(), user.email);

    return {
      success: true,
      userID: user._id.toString(),
      displayName: user.displayName,
      posts: user.posts || [],
      token: token,
    };
  } catch (error) {
    console.error("[ERROR] Login failed:", error);
    return { success: false, error: "Login failed" };
  }
}

async function getUserById(userId) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        ethAddresses: user.ethAddresses,
        displayName: user.displayName,
        posts: user.posts || [],
      },
    };
  } catch (error) {
    console.error("[ERROR] Get user failed:", error);
    return { success: false, error: "Failed to get user" };
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
