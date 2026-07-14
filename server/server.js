const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

// Custom .env loader to load from parent directory
const envPath = path.resolve(__dirname, "../.env");
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

const { resolveMongoSrv } = require("./lib/dns-resolver");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

resolveMongoSrv(process.env.DATABASE_URL).then((resolvedUrl) => {
  process.env.DATABASE_URL = resolvedUrl;

  const { authenticate } = require("./middleware/auth");
  const routes = require("./routes");

  // Global session hydration middleware
  app.use(authenticate);

  // API routes
  app.use(routes);

  app.get("/", (req, res) => {
    res.json({ message: "Formix Clinical API Server Running" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
