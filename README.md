# Formix Clinical (MERN Stack Edition)

A dynamic, JSON-driven healthcare form builder featuring a drag-and-drop canvas, clinical conditional logic matching engine, schema versioning, audit logs compliance ledger, role-based access controls (RBAC), and email dispatching via Nodemailer.

This codebase has been migrated into a decoupled **MERN Stack Architecture** using **Pure JavaScript (.js, .jsx)**.

---

## 1. Stack & Architecture

- **Frontend (`/client`)**: React 19, Vite, Tailwind CSS, Zustand, @dnd-kit, Framer Motion, and React Router 7.
- **Backend (`/server`)**: Node.js, Express.js, and Prisma ORM.
- **Database**: MongoDB (via Prisma's native MongoDB driver).
- **Email Delivery**: SMTP via **Nodemailer** (replacing Resend).
- **File Storage**: **Cloudinary** (storing attachments, inline patient signature pads, etc.).
- **AI Engine**: **Groq** (`llama-3.3-70b-versatile`) — used to generate structured form schemas from text prompts inside the builder.
- **Authentication**: JWT access + refresh tokens, secure `httpOnly` cookie storage, and bcrypt password hashing.

---

## 2. Quick Start (Run in 3 Steps)

### Step 1: Copy Environment Variables
Duplicate the `.env.example` file in the root directory and rename it to `.env`:

```bash
cp .env.example .env
```

### Step 2: Configure `.env`
Open the `.env` file and insert your configuration parameters:
- `DATABASE_URL`: Set to your MongoDB connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/formix`).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Your Cloudinary credentials.
- `GROQ_API_KEY`: Your Groq API key (optional, for AI form generation).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Your mail server credentials (Nodemailer).

### Step 3: Run the Application
From the root directory, run the following setup commands:

```bash
# 1. Install all dependencies across Root, Client, and Server
npm run install:all

# 2. Build the database client targeting MongoDB
npm run prisma:generate

# 3. Seed default roles, users, and clinical templates into MongoDB
npm run prisma:seed

# 4. Launch both Vite Frontend and Express Backend concurrently
npm run dev
```

The application is now running:
* **Frontend**: `http://localhost:5173`
* **API Backend**: `http://localhost:5000` (automatically proxied via Vite config)

---

## 3. Seeded Accounts (Password: `Passw0rd!` for all)

| Role | Email |
|---|---|
| Super Admin | `super@formix.dev` |
| Hospital Admin | `admin@sunrise.dev` |
| Doctor | `doctor@sunrise.dev` |
| Nurse | `nurse@sunrise.dev` |
| Receptionist | `reception@sunrise.dev` |

---

## 4. Key Project Modules

### Client (`/client/src`)
- **`components/builder`**: Drag-and-drop designer canvas with nested container physics (sections, cards, and grid rows) and property config sidebars.
- **`components/renderer`**: Evaluates active schemas, builds Zod rules dynamically, and renders input controls.
- **`lib/form-engine`**: Holds the conditional logic evaluation routines, property state engine (Zustand), and the 40+ clinical field definitions registry.
- **`context/AuthContext.jsx`**: Manages global user sessions and handles silent token refresh checks.
- **`App.jsx`**: Defines React Router routes matching all layout views.

### Server (`/server`)
- **`prisma/schema.prisma`**: The single source of truth for database models, optimized with mapped collection primary keys (`@map("_id")`) for MongoDB.
- **`lib/auth/jwt.js`**: Houses bcrypt hashing functions and generates JWT tokens.
- **`lib/resend.js`**: Contains Nodemailer transporter mappings and builds the HTML patient notification mail layouts.
- **`middleware/auth.js`**: Intercepts request headers/cookies to validate active JSON Web Tokens.
- **`routes.js`**: Exposes Express REST routing endpoints including patient intake pipelines and compliance audit log retrievals.
