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

      let user = await User.findOne({ clerkId });

      console.log("USER FOUND:", user);

      if (!user) {
        console.log("⚠️ User not found in MongoDB. Attempting auto-sync from Clerk...");
        try {
          const { clerkClient } = await import("@clerk/express");
          const { upsertStreamUser } = await import("../lib/stream.js");

          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email =
            clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)
              ?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "";
          const name =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email || "User";
          const profileImage = clerkUser.imageUrl || "";

          user = await User.create({
            clerkId,
            email,
            name,
            profileImage,
          });

          await upsertStreamUser({
            id: clerkId,
            name,
            image: profileImage,
          });

          console.log("✅ Auto-synced user to MongoDB and Stream:", user._id);
        } catch (syncError) {
          console.error("❌ Auto-sync failed:", syncError);
          return res.status(404).json({
            message: "User not found and auto-sync failed",
            clerkId,
          });
        }
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