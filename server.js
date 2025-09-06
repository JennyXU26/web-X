const express = require("express");
const { connectDB } = require("./config/database");
const testdbRoutes = require("./routes/testdb");
const app = express();
const PORT = 3000;

app.use(express.json());

// Connect to MongoDB on startup
connectDB();

app.get("/", (req, res) => {
  res.json({ message: "Hello World! Server is running on localhost:3000" });
});

// Routes
app.use("/test_db", testdbRoutes);

app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
