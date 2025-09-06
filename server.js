const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const authRoutes = require("./routes/auth");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB on startup
connectDB();

// Routes
app.use("/auth", authRoutes);

app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
