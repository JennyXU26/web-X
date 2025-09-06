const express = require('express');
const { registerUser, loginUser } = require('../services/auth');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log("[INFO] Registration attempt for:", req.body.username);

    const { username, password } = req.body;

    const result = await registerUser(username, password);

    if (result.success) {
      console.log("[SUCCESS] User registered:", username);
      res.status(201).json({
        success: true,
        message: result.message,
        userId: result.userId
      });
    } else {
      console.log("[FAILED] Registration failed for:", username, "Error:", result.error);
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error("[ERROR] Registration endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log("[INFO] Login attempt for:", req.body.username);

    const { username, password } = req.body;

    const result = await loginUser(username, password);

    if (result.success) {
      console.log("[SUCCESS] User logged in:", username);
      res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user
      });
    } else {
      console.log("[FAILED] Login failed for:", username, "Error:", result.error);

      // Return appropriate status codes for different error types
      if (result.error === "User not found") {
        res.status(404).json({
          success: false,
          error: result.error
        });
      } else if (result.error === "Invalid password") {
        res.status(401).json({
          success: false,
          error: result.error
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    }

  } catch (error) {
    console.error("[ERROR] Login endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;
