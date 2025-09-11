const express = require("express");
const { registerUser, loginUser } = require("../services/auth");
const router = express.Router();
<<<<<<< HEAD
const {
  siweIssueNonce,
  siweVerifyAndMaybeNeedBinding,
  bindSiweToAccount
} = require("../services/auth");
=======

>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
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
<<<<<<< HEAD
        ethAddresses: decoded.ethAddresses
=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
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
<<<<<<< HEAD

//GET /auth/siwe/nonce
router.get("/siwe/nonce", async (req, res) => {
  try {
    const { ethAddress, chainId } = req.query;
    if (!ethAddress || !chainId) {
      return res.status(400).json({ error: "Missing ethAddress or chainId" });
    }
    const meta = await siweIssueNonce({ ethAddress, chainId, req });
    return res.status(200).json(meta);
  } catch (err) {
    console.error("[SIWE NONCE ERROR]", err);
    if (err && err.httpStatus) {
      return res.status(err.httpStatus).json({ error: err.message });
    }
    return res.status(500).json({ error: "server_error", detail: "Failed to create nonce" });
  }
});

//POST /auth/siwe/verify
router.post("/siwe/verify", async (req, res) => {
  try {
    const { message, signature } = req.body || {};
    if (!message || !signature) {
      return res.status(400).json({ error: "invalid_request", detail: "Missing message or signature" });
    }

    const out = await siweVerifyAndMaybeNeedBinding({ message, signature, req });

    if (out?.status === "ok") {
      res.cookie("token", out.payload.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        userId: out.payload.userID,
        email: out.payload.email ?? null,
        displayName: out.payload.displayName ?? null,
        ethAddresses: out.payload.ethAddresses ?? null,
      });
    }

    if (out?.status === "needsBinding") {
      return res.status(409).json({
        needsBinding: true,
        bindingToken: out.payload.bindingToken,
        suggestedDisplayName: out.payload.suggestedDisplayName,
      });
    }

    return res.status(400).json({ error: "invalid_siwe_message" });
  } catch (err) {
    console.error("[SIWE VERIFY ERROR]", err);
    if (err && err.httpStatus) {
      return res.status(err.httpStatus).json({ error: err.message });
    }
    return res.status(400).json({ error: "invalid_siwe_message", detail: err?.message || "Unknown" });
  }
});

//GET /auth/siwe/verify
router.get("/siwe/verify", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, error: "No token" });

    const { verifyJWT } = require("../config/auth");
    const decoded = verifyJWT(token);
    const { getDB } = require("../config/database");
    const { ObjectId } = require("mongodb");
    let userDoc = null;
    try {
      const db = getDB();
      if (decoded.userId && ObjectId.isValid(decoded.userId)) {
        userDoc = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });
      } else if (decoded.email) {
        userDoc = await db.collection("users").findOne({ email: decoded.email });
      }
    } catch { }

    return res.status(200).json({
      success: true,
      userId: decoded.userId,
      email: decoded.email ?? null,
      displayName: userDoc?.displayName ?? decoded.displayName ?? null,
      ethAddresses: userDoc?.ethAddresses ?? decoded.ethAddresses ?? null,
    });
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
});


//POST /auth/siwe/bind
router.post("/siwe/bind", async (req, res) => {
  try {
    const { bindingToken, email, password, displayName } = req.body || {};
    if (!bindingToken || !email || !password) {
      return res.status(400).json({ error: "invalid_request", detail: "bindingToken/email/password required" });
    }
    const out = await bindSiweToAccount({ bindingToken, email, password, displayName });
    if (out?.success) return res.status(200).json(out.payload);
    if (out?.success) {

      res.cookie("token", out.payload.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json(out.payload);
    }

    return res.status(400).json({ error: "binding_failed", detail: out?.error || "unknown" });
  } catch (err) {
    console.error("[SIWE BIND ERROR]", err);
    if (err && err.httpStatus) {
      return res.status(err.httpStatus).json({ error: err.message });
    }
    return res.status(500).json({ error: "server_error" });
  }
});
=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
