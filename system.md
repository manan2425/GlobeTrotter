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
- **Database**: SQLite powered by `better-sqlite3` (synchronous, high-performance SQLite binding)
- **Database File**: `backend/globetrotter.db` (auto-created if missing)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` for password hashing
- **Security Middleware**: `authenticateToken` & `requireAdmin` (`backend/src/middleware/auth.ts`)
- **Port**: Default `5000` (`http://localhost:5000`)
- **API Prefix**: `/api`

---

## 3. Directory & File Blueprint

```
hackthon/
├── system.md                          # [THIS FILE] AI Agent Reference & System Blueprint
├── backend/                           # Node.js + Express + SQLite Backend
│   ├── globetrotter.db                # SQLite Database file (Auto-generated)
│   ├── package.json                   # Backend dependencies (express, better-sqlite3, jsonwebtoken, etc.)
│   ├── tsconfig.json                  # TypeScript compiler settings
│   └── src/
│       ├── server.ts                  # Server entry point, route mounts & error handler
│       ├── db/
│         ├── db.ts                    # SQLite initialization, schema creation & indexes
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

## 5. Backend Route & API Endpoint Reference

### Auth & User Profile (`/api/auth`)
- **`POST /api/auth/signup`**
  - **Body**: `{ email, password, full_name, profile_photo? }`
  - **Action**: Creates new user, default profile, welcome notification, returns JWT token.
- **`POST /api/auth/login`**
  - **Body**: `{ email, password }`
  - **Action**: Validates credentials, returns JWT token and user info.
- **`POST /api/auth/forgot-password`**
  - **Body**: `{ email }`
  - **Action**: Simulates password reset link email dispatch.
- **`GET /api/auth/me`** *(Auth Required)*
  - **Action**: Returns current user details, profile info, stats, and unlocked achievements.
- **`PUT /api/auth/profile`** *(Auth Required)*
  - **Body**: `{ full_name, profile_photo, currency, bio, home_city, home_country, is_public }`
  - **Action**: Updates user and profile records.

### Trips Management (`/api/trips`)
- **`GET /api/trips`** *(Auth Required)*
  - **Query**: `status` (All, Upcoming, Ongoing, Completed, Draft), `search`, `sort` (newest, oldest, budget_high, budget_low)
  - **Action**: Retrieves all trips owned by user or shared with user.
- **`POST /api/trips`** *(Auth Required)*
  - **Body**: `{ title, description, cover_image, start_date, end_date, estimated_budget, currency, initial_cities: string[] }`
  - **Action**: Creates a new trip, attaches owner member, initializes optional city stops.
- **`GET /api/trips/:id`**
  - **Action**: Fetches complete trip object with stops, activities, accommodations, transportation, expenses, members, and comments.
- **`PUT /api/trips/:id`** *(Auth Required)*
  - **Body**: `{ title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility }`
  - **Action**: Updates trip settings.
- **`DELETE /api/trips/:id`** *(Auth Required)*
  - **Action**: Cascades deletion of trip and associated stops, activities, members, and expenses.
- **`POST /api/trips/:id/duplicate`** *(Auth Required)*
  - **Action**: Duplicates an existing trip (including stops and activities) as a new Draft trip for the current user.

### Stops Management (`/api/trips/:id/stops` & `/api/stops`)
- **`POST /api/trips/:id/stops`** *(Auth Required)*
  - **Body**: `{ city_id, arrival_date, departure_date, notes }`
  - **Action**: Adds a new city stop to the trip.
- **`PUT /api/stops/:id`** *(Auth Required)*
  - **Body**: `{ arrival_date, departure_date, notes, stop_order }`
  - **Action**: Updates stop details.
- **`DELETE /api/stops/:id`** *(Auth Required)*
  - **Action**: Removes a stop from the trip.
- **`PATCH /api/trips/:id/stops/reorder`** *(Auth Required)*
  - **Body**: `{ ordered_stop_ids: string[] }`
  - **Action**: Reorders the stop sequences for a trip.

### Activities & Itinerary (`/api/activities` & `/api/trip-activities`)
- **`GET /api/activities`**
  - **Query**: `city_id`, `category`, `search`
  - **Action**: Returns catalog of available activities.
- **`GET /api/cities/:id/activities`**
  - **Action**: Returns activity catalog for a specific city.
- **`POST /api/trips/:id/activities`** *(Auth Required)*
  - **Body**: `{ trip_stop_id, activity_id?, day_number, custom_title, category, time_slot, duration_minutes, cost, notes }`
  - **Action**: Adds catalog activity or custom user activity into trip itinerary.
- **`PUT /api/trip-activities/:id`** *(Auth Required)*
  - **Body**: `{ custom_title, category, time_slot, duration_minutes, cost, notes, day_number, is_completed }`
  - **Action**: Updates activity parameters or marks activity complete.
- **`DELETE /api/trip-activities/:id`** *(Auth Required)*
  - **Action**: Removes activity from trip itinerary.
- **`PATCH /api/trips/:id/activities/reorder`** *(Auth Required)*
  - **Body**: `{ ordered_activity_ids: string[] }`
  - **Action**: Updates activity order sequence.

### Budget & Expenses (`/api/trips/:id/budget` & `/api/expenses`)
- **`GET /api/trips/:id/budget`**
  - **Action**: Calculates planned budget vs estimated total cost, logged expenses, category breakdowns, per-city breakdown, and auto-generates smart budget alert messages.
- **`POST /api/trips/:id/expenses`** *(Auth Required)*
  - **Body**: `{ category, amount, date, description, paid_by_name, payment_method }`
  - **Action**: Logs a real expense transaction.
- **`DELETE /api/expenses/:id`** *(Auth Required)*
  - **Action**: Deletes an expense entry.

### AI Assistant & Optimization (`/api/ai`)
- **`POST /api/ai/travel-assistant`**
  - **Body**: `{ prompt: string, trip_id?: string }`
  - **Action**: Returns AI response, itinerary recommendations, and suggested actions.
- **`POST /api/ai/optimize-itinerary`**
  - **Body**: `{ trip_id: string }`
  - **Action**: Evaluates trip stops & activity order; generates route optimization, schedule buffer, and savings recommendations.
- **`POST /api/ai/packing-list`**
  - **Body**: `{ trip_id?, destination_name, duration_days }`
  - **Action**: Generates categorized interactive packing checklist based on destination and duration.

### Social Collaboration & Sharing (`/api/trips/:id/share`, `/api/public`, `/api/collaboration`)
- **`POST /api/trips/:id/share`** *(Auth Required)*
  - **Body**: `{ visibility: 'Private' | 'Friends' | 'Public' }`
  - **Action**: Toggles trip visibility and generates public slug / URL.
- **`GET /api/public/trips/:slug`**
  - **Action**: Public read-only endpoint for shared trips.
- **`POST /api/public/trips/:slug/copy`** *(Auth Required)*
  - **Action**: Clones a public trip into the logged-in user's account.
- **`POST /api/trips/:id/members`** *(Auth Required)*
  - **Body**: `{ email, role: 'Editor' | 'Viewer' }`
  - **Action**: Invites co-traveler member to trip; dispatches notification if user exists.
- **`DELETE /api/trips/:id/members/:userId`** *(Auth Required)*
  - **Action**: Removes co-traveler member from trip.
- **`GET /api/trips/:id/comments`**
  - **Action**: Fetches trip discussion comments.
- **`POST /api/trips/:id/comments`** *(Auth Required)*
  - **Body**: `{ content, activity_id? }`
  - **Action**: Posts a new comment on a trip or specific activity.
- **`POST /api/trip-activities/:id/vote`** *(Auth Required)*
  - **Body**: `{ vote_type: 'up' | 'down' }`
  - **Action**: Casts or toggles an upvote/downvote for a co-planned activity.

### Destinations & Catalog (`/api/destinations` & `/api/countries`)
- **`GET /api/destinations`**
  - **Query**: `search`, `region`, `country_id`, `max_budget`
  - **Action**: Returns filtered cities catalog with popularity scores and avg daily costs.
- **`GET /api/destinations/:id`**
  - **Action**: Returns detailed city profile with top rated activities.
- **`GET /api/countries`**
  - **Action**: Lists all available countries.
- **`POST /api/destinations/:id/save`** *(Auth Required)*
  - **Action**: Toggles destination in user's saved wishlist (`saved_destinations`).
- **`GET /api/destinations/saved/me`** *(Auth Required)*
  - **Action**: Returns all saved cities for logged in user.

### Weather Intelligence (`/api/weather`)
- **`GET /api/trips/:id/weather`**
  - **Action**: Computes multi-stop weather forecast, temperature, rain probability, and weather warning alerts for the trip.

### Templates (`/api/templates`)
- **`GET /api/templates`**
  - **Action**: Returns curated trip templates.
- **`POST /api/templates/:id/use`** *(Auth Required)*
  - **Action**: Instantly instantiates a new trip from template data.

### Notifications (`/api/notifications`)
- **`GET /api/notifications`** *(Auth Required)*
  - **Action**: Returns latest 20 notifications and unread count.
- **`PATCH /api/notifications/:id/read`** *(Auth Required)*
  - **Action**: Marks specific notification or all notifications (`id='all'`) as read.

### Admin Dashboard (`/api/admin`)
- **`GET /api/admin/dashboard`** *(Auth + Admin Required)*
  - **Action**: Returns platform KPIs, top destinations breakdown, and trip creation trends.
- **`GET /api/admin/users`** *(Auth + Admin Required)*
  - **Action**: Returns full user list with trip count stats.
- **`GET /api/admin/trips`** *(Auth + Admin Required)*
  - **Action**: Returns all trips in system with author details.

---

## 6. Database Schema Reference (`backend/src/db/db.ts`)

| Table Name | Primary Key | Key Columns & Foreign Keys | Description |
| :--- | :--- | :--- | :--- |
| `users` | `id` (TEXT) | `email` (UNIQUE), `password_hash`, `full_name`, `role` (`user` \| `admin`), `currency` | User account authentication & preferences |
| `profiles` | `id` (TEXT) | `user_id` (FK `users.id`), `bio`, `home_city`, `home_country`, `is_public` | Extended user bio & public preferences |
| `countries` | `id` (TEXT) | `name` (UNIQUE), `code` (UNIQUE), `currency`, `region` | Country reference catalog |
| `cities` | `id` (TEXT) | `country_id` (FK `countries.id`), `name`, `image_url`, `popularity_score`, `avg_daily_cost`, `latitude`, `longitude` | City destinations catalog |
| `activities` | `id` (TEXT) | `city_id` (FK `cities.id`), `name`, `category`, `duration_minutes`, `estimated_cost`, `rating` | Activity catalog per city |
| `trip_templates` | `id` (TEXT) | `title`, `category`, `cover_image`, `duration_days`, `estimated_budget`, `template_data_json` | Pre-built multi-city itinerary templates |
| `trips` | `id` (TEXT) | `user_id` (FK `users.id`), `title`, `start_date`, `end_date`, `estimated_budget`, `status`, `visibility`, `public_slug` | Core trip entities |
| `trip_stops` | `id` (TEXT) | `trip_id` (FK `trips.id`), `city_id` (FK `cities.id`), `stop_order`, `arrival_date`, `departure_date` | Multi-city stops within a trip |
| `trip_activities` | `id` (TEXT) | `trip_id` (FK `trips.id`), `trip_stop_id` (FK `trip_stops.id`), `activity_id` (FK `activities.id`), `day_number`, `custom_title`, `cost`, `activity_order`, `is_completed` | Scheduled itinerary items |
| `accommodations` | `id` (TEXT) | `trip_id` (FK `trips.id`), `trip_stop_id` (FK `trip_stops.id`), `name`, `check_in`, `check_out`, `total_cost` | Hotel / stay bookings per stop |
| `transportation` | `id` (TEXT) | `trip_id` (FK `trips.id`), `mode`, `departure_time`, `arrival_time`, `cost` | Inter-city or local transit entries |
| `expenses` | `id` (TEXT) | `trip_id` (FK `trips.id`), `user_id` (FK `users.id`), `category`, `amount`, `date`, `paid_by_name` | Actual logged expenses |
| `trip_members` | `id` (TEXT) | `trip_id` (FK `trips.id`), `user_id`, `email`, `role` (`Owner` \| `Editor` \| `Viewer`), `status` | Co-travelers & access permissions |
| `comments` | `id` (TEXT) | `trip_id` (FK `trips.id`), `user_id` (FK `users.id`), `activity_id`, `content` | Trip discussion board messages |
| `activity_votes` | `id` (TEXT) | `trip_activity_id` (FK `trip_activities.id`), `user_id` (FK `users.id`), `vote_type` (`up` \| `down`) | Upvoting/downvoting activities in group trips |
| `achievements` | `id` (TEXT) | `code` (UNIQUE), `title`, `description`, `icon`, `badge_color` | Gamification achievement badges |
| `user_achievements` | `id` (TEXT) | `user_id` (FK `users.id`), `achievement_id` (FK `achievements.id`) | Gamification user unlocks |
| `saved_destinations` | `id` (TEXT) | `user_id` (FK `users.id`), `city_id` (FK `cities.id`) | User saved city wishlist |
| `notifications` | `id` (TEXT) | `user_id` (FK `users.id`), `title`, `message`, `type`, `is_read`, `link_url` | System and trip alert notifications |

---

## 7. How to Run the Application Locally

### Prerequisites
- Node.js (v18 or higher) & `npm`

### Step 1: Start Backend Server
```bash
cd backend
npm install        # Install backend packages if needed
npm run dev        # Starts TypeScript server on http://localhost:5000
```
*Note: Upon startup, `initDatabase()` auto-checks database schema and initializes seed data if required.*

### Step 2: Start Frontend Development Server
```bash
cd frontend
npm install        # Install frontend packages if needed
npm run dev        # Starts Next.js server on http://localhost:3000
```

---

## 8. Guidelines for AI Agents

1. **Context Inspection**: When modifying any feature, check this document to trace the exact **Page Route** $\rightarrow$ **API Endpoint** $\rightarrow$ **Database Table** relationship.
2. **Schema Integrity**: Any SQL queries modified in `backend/src/routes/` MUST conform to the schema defined in `backend/src/db/db.ts`.
3. **Authentication**: All protected backend routes expect the `Authorization: Bearer <token>` header, handled by `authenticateToken` in `backend/src/middleware/auth.ts`.
4. **Updating `system.md`**: Whenever a new endpoint, database column, or frontend page is created, immediately update this `system.md` file to keep context synchronized for all future AI agent sessions.
