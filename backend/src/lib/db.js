import { PrismaClient } from "@prisma/client";

// Global Prisma Client singleton instance
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL database via Prisma");
  } catch (error) {
    console.error("❌ Error connecting to PostgreSQL database:", error.message);
  }
};

export default prisma;
