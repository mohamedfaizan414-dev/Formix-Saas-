const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function withDbRetry(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && err.code === "P1001") {
      await new Promise((r) => setTimeout(r, 1500));
      return withDbRetry(fn, retries - 1);
    }
    throw err;
  }
}

module.exports = {
  prisma,
  withDbRetry,
};
