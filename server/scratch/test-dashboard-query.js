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

  // Test target:
  const isBuilderRole = true;
  const role = "SUPER_ADMIN";
  const hospitalId = null;
  const hospitalWhere = role === "SUPER_ADMIN" ? {} : { hospitalId: hospitalId || undefined };

  const nonDeletedFormWhere = {
    OR: [
      { deletedAt: null },
      { deletedAt: { isSet: false } }
    ]
  };

  try {
    const formCount = await prisma.form.count({ where: { ...nonDeletedFormWhere, ...hospitalWhere } });
    console.log("formCount success:", formCount);
    
    const publishedCount = await prisma.form.count({ where: { ...nonDeletedFormWhere, status: "PUBLISHED", ...hospitalWhere } });
    console.log("publishedCount success:", publishedCount);

    const submissionCount = await prisma.submission.count({ where: hospitalWhere });
    console.log("submissionCount success:", submissionCount);

    const hospitalCount = await prisma.hospital.count();
    console.log("hospitalCount success:", hospitalCount);

    const recentForms = await prisma.form.findMany({
      where: { ...nonDeletedFormWhere, ...hospitalWhere },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    console.log("recentForms success:", recentForms.length);
  } catch (err) {
    console.error("DASHBOARD_QUERY_ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
});
