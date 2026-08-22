import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../globetrotter.db');

// Ensure db directory exists if path includes subfolder
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      profile_photo TEXT,
      role TEXT DEFAULT 'user', -- 'user' or 'admin'
      currency TEXT DEFAULT 'INR',
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      bio TEXT,
      home_city TEXT,
      home_country TEXT,
      is_public INTEGER DEFAULT 1,
      public_trips INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS countries (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      currency TEXT DEFAULT 'INR',
      region TEXT
    );

    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country_id TEXT NOT NULL,
      country_name TEXT NOT NULL,
      region TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      popularity_score REAL DEFAULT 4.5,
      avg_daily_cost REAL DEFAULT 2500,
      best_time_to_visit TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- Sightseeing, Food, Adventure, Nature, Culture, Shopping, Nightlife, Family, Museums
      description TEXT,
      image_url TEXT,
      location_name TEXT,
      latitude REAL,
      longitude REAL,
      duration_minutes INTEGER DEFAULT 90,
      estimated_cost REAL DEFAULT 0,
      rating REAL DEFAULT 4.5,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL, -- Weekend Getaway, Backpacking, Family, Couple, Adventure, Food Tour, Heritage
      cover_image TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      estimated_budget REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      template_data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      estimated_budget REAL DEFAULT 0,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'Upcoming', -- Draft, Upcoming, Ongoing, Completed
      visibility TEXT DEFAULT 'Private', -- Private, Friends, Public
      public_slug TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_stops (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      stop_order INTEGER NOT NULL,
      arrival_date TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_activities (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      trip_stop_id TEXT NOT NULL,
      activity_id TEXT,
      day_number INTEGER NOT NULL,
      custom_title TEXT,
      category TEXT,
      time_slot TEXT DEFAULT '10:00',
      duration_minutes INTEGER DEFAULT 60,
      cost REAL DEFAULT 0,
      notes TEXT,
      activity_order INTEGER DEFAULT 1,
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_stop_id) REFERENCES trip_stops(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS accommodations (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      trip_stop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      cost_per_night REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      booking_reference TEXT,
      address TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_stop_id) REFERENCES trip_stops(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transportation (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      from_stop_id TEXT,
      to_stop_id TEXT,
      mode TEXT NOT NULL, -- Train, Flight, Bus, Car, Taxi, Ferry
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      cost REAL DEFAULT 0,
      booking_reference TEXT,
      notes TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL, -- Transportation, Accommodation, Activities, Food, Shopping, Miscellaneous
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      paid_by_name TEXT,
      payment_method TEXT DEFAULT 'Card',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'Editor', -- Owner, Editor, Viewer
      status TEXT DEFAULT 'Accepted', -- Pending, Accepted
      invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      activity_id TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_votes (
      id TEXT PRIMARY KEY,
      trip_activity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      vote_type TEXT NOT NULL, -- 'up' or 'down'
      UNIQUE(trip_activity_id, user_id),
      FOREIGN KEY (trip_activity_id) REFERENCES trip_activities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      badge_color TEXT DEFAULT 'purple'
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_destinations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, city_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'budget', 'weather', 'invite', 'reminder', 'system'
      is_read INTEGER DEFAULT 0,
      link_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create helpful indexes for speed
    CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
    CREATE INDEX IF NOT EXISTS idx_stops_trip ON trip_stops(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_act_stop ON trip_activities(trip_stop_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
    CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_id);
    CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city_id);
  `);

  console.log('✅ Database schema initialized successfully.');
}
