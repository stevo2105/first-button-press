import { PrismaClient } from "@prisma/client";

// Declare a global variable to hold the PrismaClient instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize PrismaClient, reusing the instance in development
const prisma = global.prisma || new PrismaClient();

// In development, store the instance on the global object
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}

export default prisma;
