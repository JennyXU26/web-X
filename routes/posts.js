const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { verifyJWT } = require("../config/auth");
const router = express.Router();

// GET /posts?page=n - Get paginated posts for homepage
router.get("/", async (req, res) => {
  try {
    const { page } = req.query;
    
    // Parse page parameter, default to 0 if not provided or invalid
    let pageNumber = 0;
    if (page !== undefined && page !== null) {
      const parsedPage = parseInt(page, 10);
      if (!isNaN(parsedPage) && parsedPage >= 0) {
        pageNumber = parsedPage;
      }
    }

    console.log("[INFO] Fetching posts for page:", pageNumber);

    const db = getDB();
    const postsCollection = db.collection("posts");

    // Configuration
    const postsPerPage = 10;
    const skip = pageNumber * postsPerPage;

    // Get total count of posts for pagination calculation
    const totalPosts = await postsCollection.countDocuments({});
    
    // Calculate total pages
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // Query posts with pagination and sorting by createdAt (newest first)
    const posts = await postsCollection
      .find({})
      .sort({ createdAt: -1 }) // Sort by creation time, newest first
      .skip(skip)
      .limit(postsPerPage)
      .toArray();

    // Extract post IDs as strings
    const postIds = posts.map(post => post._id.toString());

    console.log("[SUCCESS] Retrieved", postIds.length, "posts for page:", pageNumber, "Total pages:", totalPages);

    // Return posts array and page info
    res.status(200).json({
      posts: postIds,
      pageNum: totalPages,
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch posts:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    try {
      const decoded = verifyJWT(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  } catch (error) {
    console.error("[ERROR] Token authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// POST /posts - Create a new post (requires authentication)
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("[INFO] Post creation attempt by user:", req.user.userId);

    const { text } = req.body;

    // Input validation
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Text is required and must be a string",
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Post text cannot be empty",
      });
    }

    if (text.length > 280) {
      return res.status(400).json({
        success: false,
        error: "Post text cannot exceed 280 characters",
      });
    }

    const db = getDB();
    const postsCollection = db.collection("posts");
    const usersCollection = db.collection("users");

    // Create new post
    const newPost = {
      author: req.user.userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await postsCollection.insertOne(newPost);
    const postID = result.insertedId.toString();

    // Update user's posts array
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $push: { posts: postID } }
    );

    console.log("[SUCCESS] Post created:", postID, "by user:", req.user.userId);

    res.status(201).json({
      postID: postID,
    });
  } catch (error) {
    console.error("[ERROR] Post creation failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /posts/:id - Get post details by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("[INFO] Fetching post details for ID:", id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid post ID format",
      });
    }

    const db = getDB();
    const postsCollection = db.collection("posts");

    // Find post by ID
    const post = await postsCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    console.log("[SUCCESS] Post details retrieved for ID:", id);

    // Return post details as per specification
    res.status(200).json({
      text: post.text,
      author: post.author,
      createdAt: post.createdAt,
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch post details:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
