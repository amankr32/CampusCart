# CampusCart

CampusCart is a campus-first marketplace built for students to buy, sell, and swap everyday campus essentials safely and quickly. The platform helps students discover textbooks, electronics, hostel gear, cycles, stationery, and other semester necessities from verified peers on campus.

Built with Next.js, Drizzle ORM, PostgreSQL, and NextAuth, CampusCart focuses on trust, speed, and convenience for student-to-student commerce.

## Features

- Student-only marketplace for buying and selling campus items
- Categories for books, hostel essentials, transport, electronics, stationery, and sports gear
- Fast listing workflow for posting new items
- Student verification flow with trust and verification status
- Email OTP / verification messaging support
- Secure authentication using NextAuth with credentials-based login
- Product browsing and category-based discovery
- Database persistence with PostgreSQL and Drizzle ORM
- Cloud image uploads via Vercel Blob
- Built for a clean, mobile-responsive campus commerce experience

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- NextAuth
- Vercel Blob
- Resend / Brevo email integration
- Vitest for testing

## Project Structure

```bash
.
├── .env.example
├── AGENTS.md
├── CLAUDE.md
├── drizzle/
├── drizzle.config.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── public/
├── scripts/
├── src/
│   ├── app/
│   ├── auth.ts
│   ├── components/
│   ├── db/
│   ├── lib/
│   ├── scratch/
│   ├── types/
│   └── ...
├── tests/
├── tsconfig.json
├── vitest.config.mts
└── README.md
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+ installed
- npm, pnpm, yarn, or bun
- A PostgreSQL database (for example Neon)
- A Vercel Blob token for image storage
- A Brevo or SMTP-compatible email provider for OTP and verification emails

## Environment Setup

Copy the example environment file and configure your values:

```bash
cp .env.example .env.local
```

Then update the variables in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
AUTH_SECRET="your-auth-secret"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BREVO_API_KEY="your-brevo-api-key"
BREVO_SENDER_EMAIL="noreply@campuscart.com"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

## Installation

```bash
npm install
```

## Database

Generate and push the database schema:

```bash
npm run db:generate
npm run db:push
```

You can also run the database studio for inspection:

```bash
npm run db:studio
```

## Run the App

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev          # Start the Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed demo data
npm run test         # Run Vitest suite
npm run test:watch   # Watch mode for tests
```

## Main App Flow

CampusCart follows a marketplace flow centered around student trust and frictionless campus exchanges:

1. Students sign up and verify their email
2. They can post listings for items they want to sell
3. Buyers browse by category or search for specific items
4. Verified student identity improves trust and posting limits
5. Users connect and complete transactions on campus in person

## Notes

This project is tailored to a university environment and is designed around campus commerce, student verification, and safe local transactions. The current implementation is built as a modern full-stack marketplace using the App Router pattern in Next.js.

## Contributing

Contributions are welcome. If you want to improve CampusCart:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and validation
5. Open a pull request with a clear description

## Support

For environment issues or setup questions, verify that your PostgreSQL connection, authentication secrets, and storage tokens are correctly configured before running the app.
