import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      console.log("========== PROTECT ROUTE ==========");

      // Log full auth object
      console.log("AUTH:", req.auth());

      const clerkId = req.auth()?.userId;

      console.log("CLERK ID:", clerkId);

      if (!clerkId) {
        console.log("❌ No Clerk ID found");
        return res.status(401).json({
          message: "Unauthorized - invalid token",
        });
      }

      const user = await User.findOne({ clerkId });

      console.log("USER FOUND:", user);

      if (!user) {
        console.log("❌ User not found in MongoDB");
        return res.status(404).json({
          message: "User not found",
          clerkId,
        });
      }

      req.user = user;

      console.log("✅ req.user attached:", req.user._id);

      next();
    } catch (error) {
      console.error("❌ Error in protectRoute middleware:", error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
];