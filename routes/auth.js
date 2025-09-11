const express = require("express");
const { registerUser, loginUser } = require("../services/auth");
const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    console.log("[INFO] Registration attempt for:", req.body.email);

    const { email, password, displayName } = req.body;

    const result = await registerUser(email, password, displayName);

    if (result.success) {
      console.log("[SUCCESS] User registered:", email);
      // Return only userID as per specification
      res.status(201).json({
        userID: result.userID,
      });
    } else {
      console.log(
        "[FAILED] Registration failed for:",
        email,
        "Error:",
        result.error,
      );
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[ERROR] Registration endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    console.log("[INFO] Login attempt for:", req.body.email);

    const { email, password } = req.body;

    const result = await loginUser(email, password);

    if (result.success) {
      console.log("[SUCCESS] User logged in:", email);

      // Set JWT token in HttpOnly cookie for security
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return user data as per specification
      res.status(200).json({
        userID: result.userID,
        displayName: result.displayName,
        posts: result.posts,
      });
    } else {
      console.log("[FAILED] Login failed for:", email, "Error:", result.error);

      // Return appropriate status codes for different error types
      if (result.error === "User not found") {
        res.status(404).json({
          success: false,
          error: result.error,
        });
      } else if (result.error === "Invalid password") {
        res.status(401).json({
          success: false,
          error: result.error,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    }
  } catch (error) {
    console.error("[ERROR] Login endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// token verification
router.get("/verify", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const { verifyJWT } = require("../config/auth");

    try {
      const decoded = verifyJWT(token);
      res.status(200).json({
        success: true,
        userId: decoded.userId,
        email: decoded.email,
      });
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  } catch (error) {
    console.error("[ERROR] Token verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
