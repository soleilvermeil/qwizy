# Open Duolingo

A self-hosted, open-source spaced repetition learning app inspired by Duolingo. Build and manage your own flashcard decks with configurable question types, track your progress, and learn efficiently using the FSRS algorithm.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT in httpOnly cookies (jose) with bcryptjs password hashing
- **Spaced Repetition:** ts-fsrs

## Features

- Deck management with custom fields (e.g. front/back, word/translation/example)
- Configurable question types (show/ask field pairs)
- Spaced repetition scheduling via FSRS
- Optional text-to-speech per field
- CSV import for bulk card creation
- Admin and user roles
- User progress tracking and stats
- Data export

## Prerequisites

- Node.js (v20 or later recommended)
- npm
- PostgreSQL (v14 or later recommended)

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Copy the example below into a `.env` file at the project root:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/open_duolingo"
   JWT_SECRET="change-this-to-a-secure-random-string-in-production"

   # Optional: Legal pages (Legal Notice, Privacy Policy). Fall back to placeholders if unset.
   # LEGAL_PUBLISHER_NAME="Your Name or Organization"
   # LEGAL_PUBLISHER_ADDRESS="Your Postal Address"
   # LEGAL_PUBLISHER_EMAIL="your.email@example.com"
   # LEGAL_PUBLISHER_PHONE="Your Phone Number"
   # LEGAL_PUBLISHER_DIRECTOR="Full Name of Director"
   # LEGAL_HOST_NAME="Hosting Provider Name"
   # LEGAL_HOST_ADDRESS="Hosting Provider Postal Address"
   # LEGAL_HOST_WEBSITE="https://hosting-provider.example.com"
   # LEGAL_LAST_UPDATED="February 2026"
   ```

3. **Generate the Prisma client:**

   ```bash
   npx prisma generate
   ```

4. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

5. **Seed the database** (creates a default `admin` user):

   ```bash
   npm run db:seed
   ```

6. **Start the development server:**

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start the development server |
| `npm run build` | `next build` | Create a production build |
| `npm run start` | `next start` | Run the production server |
| `npm run lint` | `eslint` | Run the linter |
| `npm run db:migrate` | `prisma migrate dev` | Run database migrations |
| `npm run db:seed` | `prisma db seed` | Seed the database |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio (DB GUI) |

## Project Structure

```
app/            # Next.js App Router (pages, API routes, layouts)
components/     # React components (admin, auth, layout, ui, user)
lib/            # Shared logic (auth, db, FSRS, session, CSV parser)
prisma/         # Prisma schema, migrations, and seed script
public/         # Static assets
middleware.ts   # Auth and route protection middleware
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | Must be set |
| `JWT_SECRET` | Secret key for signing JWT tokens | Must be set for production |
| `NODE_ENV` | Node environment (`development` / `production`) | `development` |
| `LEGAL_PUBLISHER_NAME` | Publisher / data controller name. Used in Legal Notice & Privacy Policy. | `[Your Name or Organization]` |
| `LEGAL_PUBLISHER_ADDRESS` | Publisher postal address | `[Your Postal Address]` |
| `LEGAL_PUBLISHER_EMAIL` | Contact email | `[your.email@example.com]` |
| `LEGAL_PUBLISHER_PHONE` | Contact phone (Legal Notice only) | `[Your Phone Number]` |
| `LEGAL_PUBLISHER_DIRECTOR` | Publication director name (Legal Notice only) | `[Full Name of Director]` |
| `LEGAL_HOST_NAME` | Hosting provider name (Legal Notice only) | `[Hosting Provider Name]` |
| `LEGAL_HOST_ADDRESS` | Hosting provider address (Legal Notice only) | `[Hosting Provider Postal Address]` |
| `LEGAL_HOST_WEBSITE` | Hosting provider website (Legal Notice only) | `[https://hosting-provider.example.com]` |
| `LEGAL_LAST_UPDATED` | Last updated date shown on legal pages | `February 2026` |
