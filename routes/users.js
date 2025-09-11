const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const router = express.Router();

// GET /users/:id - Get user details by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("[INFO] Fetching user details for ID:", id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Find user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log("[SUCCESS] User details retrieved for ID:", id);

    // Return user details (only safe fields)
    res.status(200).json({
      displayName: user.displayName,
      email: user.email,
      ethAddresses: user.ethAddresses,
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch user details:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
