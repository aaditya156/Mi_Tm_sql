import { requireAuth, clerkClient } from "@clerk/express";
import prisma from "../lib/db.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await prisma.user.findUnique({
        where: { clerkId },
      });

      // Fallback: If user is not in PostgreSQL yet, fetch from Clerk and create on-the-fly
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
          const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
          const profileImage = clerkUser.imageUrl || "";

          user = await prisma.user.upsert({
            where: { clerkId },
            update: {
              email,
              name,
              profileImage,
            },
            create: {
              clerkId,
              email,
              name,
              profileImage,
            },
          });

          await upsertStreamUser({
            id: clerkId.toString(),
            name,
            image: profileImage,
          });
        } catch (syncError) {
          console.error("Error auto-syncing Clerk user in protectRoute:", syncError.message);
          return res.status(404).json({ message: "User not found" });
        }
      }

      // attach user to req with _id compatibility for frontend & existing controllers
      req.user = {
        ...user,
        _id: user.id,
      };

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
