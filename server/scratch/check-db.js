const fs = require("fs");
const path = require("path");

// Custom .env loader to load from parent directory
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

  try {
    const forms = await prisma.form.findMany({
      include: { hospital: true }
    });
    console.log("DB_CHECK: Found", forms.length, "forms in database:");
    forms.forEach(f => {
      console.log(`- ID: ${f.id}, Name: "${f.name}", Hospital: "${f.hospital?.name}", Status: ${f.status}, Deleted: ${f.deletedAt}`);
    });

    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log("\nDB_CHECK: Found", users.length, "users in database:");
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role?.name}, HospitalId: ${u.hospitalId}`);
    });
  } catch (err) {
    console.error("DB_CHECK_ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
});
