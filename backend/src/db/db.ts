import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let connectionString = process.env.DATABASE_URL || '';
if (connectionString.startsWith('db:')) {
  connectionString = connectionString.replace(/^db:/, '');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

function adaptSql(sql: string): string {
  let s = sql.trim();
  s = s.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO');
  s = s.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');

  if (/^INSERT\s+INTO/i.test(s) && !/ON\s+CONFLICT/i.test(s)) {
    s += ' ON CONFLICT DO NOTHING';
  }

  let paramIdx = 1;
  s = s.replace(/\?/g, () => `$${paramIdx++}`);
  return s;
}

function parseRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const parsed: any = {};
  for (const key of Object.keys(row)) {
    const val = row[key];
    if (typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val)) {
      if (
        key.includes('count') || key.includes('cnt') || key.includes('cost') ||
        key.includes('budget') || key.includes('amount') || key.includes('score') ||
        key.includes('latitude') || key.includes('longitude') || key.includes('order') ||
        key.includes('day') || key.includes('minutes') || key.includes('read') ||
        key.includes('completed') || key.includes('public') || key.includes('votes') ||
        key.includes('days') || key.includes('total') || key.includes('avg') || key.includes('max')
      ) {
        parsed[key] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
        continue;
      }
    }
    parsed[key] = val;
  }
  return parsed;
}

export const db = {
  prepare: (sql: string) => {
    const adaptedSql = adaptSql(sql);
    return {
      all: async (...params: any[]) => {
        const flatParams = params.flat();
        const res = await pool.query(adaptedSql, flatParams);
        return res.rows.map(parseRow);
      },
      get: async (...params: any[]) => {
        const flatParams = params.flat();
        const res = await pool.query(adaptedSql, flatParams);
        return res.rows.length > 0 ? parseRow(res.rows[0]) : undefined;
      },
      run: async (...params: any[]) => {
        const flatParams = params.flat();
        const res = await pool.query(adaptedSql, flatParams);
        return { changes: res.rowCount || 0 };
      }
    };
  },
  exec: async (sql: string) => {
    return pool.query(sql);
  }
};

export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        profile_photo TEXT,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'Active',
        currency VARCHAR(10) DEFAULT 'INR',
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        home_city VARCHAR(255),
        home_country VARCHAR(255),
        is_public INTEGER DEFAULT 1,
        public_trips INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS countries (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        region VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS cities (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country_id VARCHAR(255) NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        country_name VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        popularity_score DOUBLE PRECISION DEFAULT 4.5,
        avg_daily_cost DOUBLE PRECISION DEFAULT 2500,
        best_time_to_visit VARCHAR(255),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(255) PRIMARY KEY,
        city_id VARCHAR(255) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        location_name VARCHAR(255),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        duration_minutes INTEGER DEFAULT 90,
        estimated_cost DOUBLE PRECISION DEFAULT 0,
        rating DOUBLE PRECISION DEFAULT 4.5
      );

      CREATE TABLE IF NOT EXISTS trip_templates (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        cover_image TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        estimated_budget DOUBLE PRECISION NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        template_data_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image TEXT,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        estimated_budget DOUBLE PRECISION DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'Upcoming',
        visibility VARCHAR(50) DEFAULT 'Private',
        public_slug VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trip_stops (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        city_id VARCHAR(255) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        stop_order INTEGER NOT NULL,
        arrival_date VARCHAR(50) NOT NULL,
        departure_date VARCHAR(50) NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS trip_activities (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        trip_stop_id VARCHAR(255) NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
        activity_id VARCHAR(255) REFERENCES activities(id) ON DELETE SET NULL,
        day_number INTEGER NOT NULL,
        custom_title VARCHAR(255),
        category VARCHAR(255),
        time_slot VARCHAR(50) DEFAULT '10:00',
        duration_minutes INTEGER DEFAULT 60,
        cost DOUBLE PRECISION DEFAULT 0,
        notes TEXT,
        activity_order INTEGER DEFAULT 1,
        is_completed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS accommodations (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        trip_stop_id VARCHAR(255) NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        check_in VARCHAR(50) NOT NULL,
        check_out VARCHAR(50) NOT NULL,
        cost_per_night DOUBLE PRECISION DEFAULT 0,
        total_cost DOUBLE PRECISION DEFAULT 0,
        booking_reference VARCHAR(255),
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS transportation (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        from_stop_id VARCHAR(255),
        to_stop_id VARCHAR(255),
        mode VARCHAR(50) NOT NULL,
        departure_time VARCHAR(50) NOT NULL,
        arrival_time VARCHAR(50) NOT NULL,
        cost DOUBLE PRECISION DEFAULT 0,
        booking_reference VARCHAR(255),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        date VARCHAR(50) NOT NULL,
        description TEXT,
        paid_by_name VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'Card',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trip_members (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Editor',
        status VARCHAR(50) DEFAULT 'Accepted',
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_id VARCHAR(255),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_votes (
        id VARCHAR(255) PRIMARY KEY,
        trip_activity_id VARCHAR(255) NOT NULL REFERENCES trip_activities(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote_type VARCHAR(50) NOT NULL,
        UNIQUE(trip_activity_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(255) NOT NULL,
        badge_color VARCHAR(50) DEFAULT 'purple'
      );

      CREATE TABLE IF NOT EXISTS user_achievements (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(255) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      );

      CREATE TABLE IF NOT EXISTS saved_destinations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        city_id VARCHAR(255) NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, city_id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read INTEGER DEFAULT 0,
        link_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(255) NOT NULL,
        purpose VARCHAR(50) DEFAULT 'forgot_password',
        attempts_count INTEGER DEFAULT 0,
        expires_at VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_stops_trip ON trip_stops(trip_id);
      CREATE INDEX IF NOT EXISTS idx_trip_act_stop ON trip_activities(trip_stop_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
      CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_id);
      CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city_id);
      CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
    `);

    // Migration fallback for existing Neon DB instances
    try {
      await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active'");
      await pool.query('ALTER TABLE otps ALTER COLUMN expires_at TYPE VARCHAR(255) USING expires_at::text');
    } catch (e) {
      // Columns already exist
    }

    console.log('✅ Neon PostgreSQL Database schema initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}
