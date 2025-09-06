const express = require("express");
const path = require("path");
const { connectDB } = require("./config/database");
const authRoutes = require("./routes/auth");
const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB on startup
connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
