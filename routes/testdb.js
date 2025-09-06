const express = require('express');
const { getDB } = require('../config/database');
const router = express.Router();

// MongoDB Test Page - Counter KV operations using native driver
router.get('/', async (req, res) => {
  try {
    console.log("[INFO] Testing MongoDB read/write operations...");

    const db = getDB();
    const collection = db.collection('counters');
    const key = 'page_counter';

    // 1. Try to read existing counter (KV read)
    let counter = await collection.findOne({ key: key });
    console.log("[READ] Current counter from DB:", counter);

    if (!counter) {
      // 2. Create new counter if doesn't exist (KV write)
      console.log("[CREATE] Creating new counter...");
      counter = {
        key: key,
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await collection.insertOne(counter);
      console.log("[SUCCESS] New counter created:", counter);
    } else {
      // 3. Update existing counter (KV update)
      console.log("[UPDATE] Updating existing counter...");
      const newValue = counter.value + 1;
      const result = await collection.updateOne(
        { key: key },
        {
          $set: {
            value: newValue,
            updatedAt: new Date()
          }
        }
      );
      counter.value = newValue;
      counter.updatedAt = new Date();
      console.log("[SUCCESS] Counter updated:", counter);
      console.log("[DEBUG] Update result:", result);
    }

    // 4. Read all records for verification
    const allRecords = await collection.find({}).toArray();
    console.log("[LIST] All records in DB:", allRecords);

    res.json({
      success: true,
      counter: counter.value,
      message: `Page visited ${counter.value} times`,
      totalRecords: allRecords.length,
      lastUpdated: counter.updatedAt || counter.createdAt
    });

  } catch (error) {
    console.error("[ERROR] Database operation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Database operation failed"
    });
  }
});

module.exports = router;
