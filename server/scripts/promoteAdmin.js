const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/venseven";

async function promoteToAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Error: Please provide a valid user email address.");
    console.log("Usage: node scripts/promoteAdmin.js <user-email>");
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[Database]: Connected to MongoDB`);

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      console.error(`Error: User with email "${cleanEmail}" was not found.`);
      console.log("Please register the user first via the VENSEVEN account page or API, then run this script.");
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`Notice: User "${user.name}" (${cleanEmail}) is already an administrator.`);
      process.exit(0);
    }

    user.role = "admin";
    await user.save();

    console.log(`✓ Success: User "${user.name}" (${cleanEmail}) has been promoted to administrator (role: "admin").`);
  } catch (error) {
    console.error("[Promote Admin Error]:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

promoteToAdmin();
