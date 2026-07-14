const fs = require("fs");
const path = require("path");

// Custom .env loader
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { resolveMongoSrv } = require("../lib/dns-resolver");

resolveMongoSrv(process.env.DATABASE_URL).then(async (resolvedUrl) => {
  process.env.DATABASE_URL = resolvedUrl;

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const rawForms = await prisma.form.findRaw();
  console.log("RAW Forms from MongoDB:", JSON.stringify(rawForms, null, 2));

  await prisma.$disconnect();
});
