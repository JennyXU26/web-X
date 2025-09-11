const { MongoClient } = require("mongodb");

const MONGODB_URI =
  "mongodb+srv://adam429lee_db_user:aF3f7RlclsRCwW4U@6111.qctxwvx.mongodb.net/?retryWrites=true&w=majority&appName=6111";
const DATABASE_NAME = "web-x-db";

let client;
let db;

const connectDB = async () => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log("[SUCCESS] MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("[ERROR] MongoDB connection failed:", error.message);
    return false;
  }
};

const disconnectDB = async () => {
  try {
    if (client) {
      await client.close();

      console.log("[INFO] MongoDB disconnected");
    }
  } catch (error) {
    console.error("[ERROR] Error disconnecting from MongoDB:", error.message);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return db;
};

module.exports = {
  connectDB,
  disconnectDB,
  getDB,
};
