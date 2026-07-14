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

  const user = await prisma.user.findUnique({
    where: { email: "super@formix.dev" },
    include: { role: true }
  });

  console.log("SUPER_ADMIN role key check:", user.role.name);

  // Mocking the route logic:
  const where = { deletedAt: null };
  const roleName = user.role.name;
  if (roleName !== "SUPER_ADMIN") {
    if (!user.hospitalId) {
      console.log("Empty forms list triggered due to missing hospitalId on non-SUPER_ADMIN");
      return;
    }
    where.hospitalId = user.hospitalId;
  }

  const forms = await prisma.form.findMany({
    where,
    include: {
      hospital: { select: { name: true } }
    }
  });

  console.log("MOCKED GET forms:", forms.length);
  forms.forEach(f => {
    console.log(`- ${f.name} (Hospital: ${f.hospital?.name})`);
  });

  await prisma.$disconnect();
});
