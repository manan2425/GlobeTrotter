# GlobeTrotter - System Documentation & AI Agent Reference Guide

> **Note for AI Agents**: This file serves as the Single Source of Truth (SSOT) for the GlobeTrotter codebase. Read this document before making any changes, additions, or debugging. Update this document whenever new routes, pages, features, or database tables are added.

---

## 1. Executive Summary & Project Overview

**GlobeTrotter** is a modern, full-stack multi-city travel itinerary planner and travel management web application. It empowers travelers to plan multi-destination trips, construct day-by-day itineraries, track expenses against budget goals, leverage AI recommendations, collaborate with co-travelers, check weather forecasts, and discover curated travel templates.

---

## 2. Technology Stack & Architecture

### Frontend Architecture
- **Framework**: Next.js (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS, Custom Utility Classes (`globals.css`), Lucide React Icons (`lucide-react`)
- **State & Auth Management**: React Context (`AuthContext.tsx`), LocalStorage JWT persist
- **HTTP Client**: Centralized `apiRequest` helper function in `src/lib/api.ts` with automatic `Authorization: Bearer <token>` header injection.
- **Port**: Default `3000` (`http://localhost:3000`)

### Backend Architecture
- **Runtime & Server**: Node.js, Express.js, TypeScript (`ts-node-dev` for hot-reloading)
- **Database**: Cloud PostgreSQL hosted on **Neon DB** (`pg` connection pool)
- **Environment Configuration**: `backend/.env` (`DATABASE_URL=postgresql://...`, `PORT=5000`, `JWT_SECRET`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` for password hashing
- **Security Middleware**: `authenticateToken` & `requireAdmin` (`backend/src/middleware/auth.ts`)
- **Port**: Default `5000` (`http://localhost:5000`)
- **API Prefix**: `/api`

---

## 3. Directory & File Blueprint

```
hackthon/
├── system.md                          # [THIS FILE] AI Agent Reference & System Blueprint
├── backend/                           # Node.js + Express + PostgreSQL Backend
│   ├── .env                           # Environment variables (DATABASE_URL, PORT, JWT_SECRET)
│   ├── package.json                   # Backend dependencies (express, pg, jsonwebtoken, bcryptjs, etc.)
│   ├── tsconfig.json                  # TypeScript compiler settings
│   └── src/
│       ├── server.ts                  # Server entry point, route mounts & error handler
│       ├── db/
│         ├── db.ts                    # PostgreSQL connection pool, schema initialization & helper wrapper
│         └── seed.ts                  # Database seed script for dummy data
│       ├── middleware/
│         └── auth.ts                  # JWT token validation & admin check middleware
│       └── routes/
│           ├── auth.ts                # Auth & user profile endpoints (/api/auth)
│           ├── trips.ts               # Trip CRUD & duplication (/api/trips)
│           ├── stops.ts                # Trip stop management (/api/trips/:id/stops, /api/stops)
│           ├── activities.ts           # Activity listing & itinerary ordering (/api/activities)
│           ├── budget.ts              # Budget calculations & expense logging (/api/trips/:id/budget)
│           ├── ai.ts                  # AI travel assistant, route optimization & packing (/api/ai)
│           ├── sharing.ts             # Public trip links & trip copying (/api/public)
│           ├── collaboration.ts       # Trip members, comments & activity voting
│           ├── destinations.ts        # Cities, countries & saved destinations (/api/destinations)
│           ├── weather.ts             # Multi-stop weather forecast engine (/api/trips/:id/weather)
│           ├── templates.ts           # Pre-built trip templates (/api/templates)
│           ├── notifications.ts       # User notifications & read markers (/api/notifications)
│           └── admin.ts               # Admin dashboard KPIs & platform data (/api/admin)
├── frontend/                          # Next.js App Router Frontend
│   ├── package.json                   # Frontend dependencies (next, react, tailwindcss, lucide-react)
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── tsconfig.json                  # TypeScript settings & path aliases (@/* -> ./src/*)
│   └── src/
│       ├── app/                       # Next.js App Router Pages
│       │   ├── page.tsx               # Landing Page (Hero, Features, Popular Destinations)
│       │   ├── globals.css            # Custom CSS & Glassmorphism design tokens
│       │   ├── layout.tsx             # Main Root Layout (Auth Provider wrapper, Navbar)
│       │   ├── login/                 # Login Page
│       │   ├── signup/                # Signup Page
│       │   ├── dashboard/             # User Dashboard (Trip summary, Stats, Quick actions)
│       │   ├── trips/                 # Trips Listing & Filters (/trips)
│       │   │   ├── new/               # New Trip Creation Wizard (/trips/new)
│       │   │   └── [id]/              # Trip Overview Hub (/trips/[id])
│       │   │       ├── builder/       # Drag-and-Drop Itinerary Builder (/trips/[id]/builder)
│       │   │       ├── budget/        # Budget & Expense Tracker (/trips/[id]/budget)
│       │   │       └── optimize/      # AI Route & Packing List Optimizer (/trips/[id]/optimize)
│       │   ├── explore/               # Destination Explorer (/explore)
│       │   ├── templates/             # Curated Trip Templates (/templates)
│       │   ├── profile/               # User Profile & Achievements (/profile)
│       │   ├── public/                # Shared Public Trip View (/public/trips/[slug])
│       │   └── admin/                 # Admin Analytics & Platform Management (/admin)
│       ├── components/                # Reusable UI Components
│       │   ├── Navbar.tsx             # Top Navigation bar, Notifications menu & User Profile menu
│       │   ├── MobileNav.tsx          # Mobile bottom navigation bar
│       │   ├── AIAssistantModal.tsx   # Floating AI Chatbot Modal
│       │   ├── PackingListModal.tsx   # Dynamic AI Packing Checklist Modal
│       │   ├── ShareModal.tsx         # Trip Visibility & Collaborator Invite Modal
│       │   ├── CollaborationPanel.tsx # Co-travelers & Trip Discussion Board Drawer
│       │   ├── TripMap.tsx            # Interactive Visual Map Component for Trip Stops
│       │   └── WeatherWidget.tsx      # Multi-City Weather Forecast Card
│       ├── context/
│       │   └── AuthContext.tsx        # Global Authentication State & User Session
│       └── lib/
│           ├── api.ts                 # Base API Fetch Client & Token Management
│           └── utils.ts               # CSS Class utility helper (clsx/tailwind-merge)
```

---

## 4. Frontend Routes & Component Guide

| Route Path | Description | Key Features & Functionality | Associated Backend APIs |
| :--- | :--- | :--- | :--- |
| `/` | Landing Page | Hero section, featured multi-city routes, platform features showcase, call-to-action | `GET /api/destinations`, `GET /api/templates` |
| `/login` | Login Page | User login form with email & password | `POST /api/auth/login` |
| `/signup` | Signup Page | Account registration with full name, email & password | `POST /api/auth/signup` |
| `/dashboard` | User Dashboard | Overview of upcoming/ongoing trips, user quick stats, saved destinations, quick action cards | `GET /api/auth/me`, `GET /api/trips`, `GET /api/destinations/saved/me` |
| `/trips` | Trips Manager | Grid view of user's trips, status filters (*Upcoming, Ongoing, Completed, Draft*), search bar, budget sorting | `GET /api/trips`, `DELETE /api/trips/:id`, `POST /api/trips/:id/duplicate` |
| `/trips/new` | Create Trip Wizard | Multi-step form: trip title, start/end dates, estimated budget, currency, city multi-selector | `POST /api/trips`, `GET /api/destinations` |
| `/trips/[id]` | Trip Overview Hub | Central hub for a specific trip: stops preview, activity highlights, collaborator avatars, weather widget, map | `GET /api/trips/:id`, `POST /api/trips/:id/share` |
| `/trips/[id]/builder` | Itinerary Builder | Interactive day-by-day itinerary planner, stop reordering, activity selection modal, activity upvoting, custom activity creation | `GET /api/trips/:id`, `POST /api/trips/:id/activities`, `PUT /api/trip-activities/:id`, `DELETE /api/trip-activities/:id`, `PATCH /api/trips/:id/activities/reorder` |
| `/trips/[id]/budget` | Budget & Expense Tracker | Total estimated vs actual spent, category breakdowns (Transportation, Accommodation, Activities, Food, etc.), city expense distribution, actual expense logger | `GET /api/trips/:id/budget`, `POST /api/trips/:id/expenses`, `DELETE /api/expenses/:id` |
| `/trips/[id]/optimize` | AI Route & Packing Optimizer | AI-powered route sequence analysis, transit time savings, schedule conflict resolution, interactive packing list drawer | `POST /api/ai/optimize-itinerary`, `POST /api/ai/packing-list`, `GET /api/trips/:id/weather` |
| `/explore` | Destination Explorer | Search destinations across countries/regions, filter by maximum daily budget, view city details, save to wishlist | `GET /api/destinations`, `GET /api/destinations/:id`, `GET /api/countries`, `POST /api/destinations/:id/save` |
| `/templates` | Curated Trip Templates | Pre-packaged multi-city itineraries (e.g. Rajasthan Heritage, European Golden Triangle), category filters, instant 'Use Template' cloning | `GET /api/templates`, `POST /api/templates/:id/use` |
| `/profile` | User Profile Page | Edit user full name, bio, home city, default currency, view unlocked achievements and badges | `GET /api/auth/me`, `PUT /api/auth/profile` |
| `/public/trips/[slug]` | Shared Public Trip | Read-only view for shared public itineraries, 'Copy to My Trips' button for registered users | `GET /api/public/trips/:slug`, `POST /api/public/trips/:slug/copy` |
| `/admin` | Admin Analytics Dashboard | Platform KPIs (users count, total trips, avg trip budget), popular city destinations, activity breakdown, user table | `GET /api/admin/dashboard`, `GET /api/admin/users`, `GET /api/admin/trips` |

---

## 5. Database Schema Reference (`backend/src/db/db.ts`)

| Table Name | Primary Key | Key Columns & Foreign Keys | Description |
| :--- | :--- | :--- | :--- |
| `users` | `id` (VARCHAR) | `email` (UNIQUE), `password_hash`, `full_name`, `role` (`user` \| `admin`), `currency` | User account authentication & preferences |
| `profiles` | `id` (VARCHAR) | `user_id` (FK `users.id`), `bio`, `home_city`, `home_country`, `is_public` | Extended user bio & public preferences |
| `countries` | `id` (VARCHAR) | `name` (UNIQUE), `code` (UNIQUE), `currency`, `region` | Country reference catalog |
| `cities` | `id` (VARCHAR) | `country_id` (FK `countries.id`), `name`, `image_url`, `popularity_score`, `avg_daily_cost`, `latitude`, `longitude` | City destinations catalog |
| `activities` | `id` (VARCHAR) | `city_id` (FK `cities.id`), `name`, `category`, `duration_minutes`, `estimated_cost`, `rating` | Activity catalog per city |
| `trip_templates` | `id` (VARCHAR) | `title`, `category`, `cover_image`, `duration_days`, `estimated_budget`, `template_data_json` | Pre-built multi-city itinerary templates |
| `trips` | `id` (VARCHAR) | `user_id` (FK `users.id`), `title`, `start_date`, `end_date`, `estimated_budget`, `status`, `visibility`, `public_slug` | Core trip entities |
| `trip_stops` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `city_id` (FK `cities.id`), `stop_order`, `arrival_date`, `departure_date` | Multi-city stops within a trip |
| `trip_activities` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `trip_stop_id` (FK `trip_stops.id`), `activity_id` (FK `activities.id`), `day_number`, `custom_title`, `cost`, `activity_order`, `is_completed` | Scheduled itinerary items |
| `accommodations` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `trip_stop_id` (FK `trip_stops.id`), `name`, `check_in`, `check_out`, `total_cost` | Hotel / stay bookings per stop |
| `transportation` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `mode`, `departure_time`, `arrival_time`, `cost` | Inter-city or local transit entries |
| `expenses` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `user_id` (FK `users.id`), `category`, `amount`, `date`, `paid_by_name` | Actual logged expenses |
| `trip_members` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `user_id`, `email`, `role` (`Owner` \| `Editor` \| `Viewer`), `status` | Co-travelers & access permissions |
| `comments` | `id` (VARCHAR) | `trip_id` (FK `trips.id`), `user_id` (FK `users.id`), `activity_id`, `content` | Trip discussion board messages |
| `activity_votes` | `id` (VARCHAR) | `trip_activity_id` (FK `trip_activities.id`), `user_id` (FK `users.id`), `vote_type` (`up` \| `down`) | Upvoting/downvoting activities in group trips |
| `achievements` | `id` (VARCHAR) | `code` (UNIQUE), `title`, `description`, `icon`, `badge_color` | Gamification achievement badges |
| `user_achievements` | `id` (VARCHAR) | `user_id` (FK `users.id`), `achievement_id` (FK `achievements.id`) | Gamification user unlocks |
| `saved_destinations` | `id` (VARCHAR) | `user_id` (FK `users.id`), `city_id` (FK `cities.id`) | User saved city wishlist |
| `notifications` | `id` (VARCHAR) | `user_id` (FK `users.id`), `title`, `message`, `type`, `is_read`, `link_url` | System and trip alert notifications |

---

## 6. How to Run the Application Locally

### Step 1: Start Backend Server
```bash
cd backend
npm install        # Installs pg and backend dependencies
npm run db:seed    # Optional: Initial database seeding into Neon PostgreSQL
npm run dev        # Starts server on http://localhost:5000
```

### Step 2: Start Frontend Development Server
```bash
cd frontend
npm install        # Installs frontend dependencies
npm run dev        # Starts Next.js server on http://localhost:3000
```
