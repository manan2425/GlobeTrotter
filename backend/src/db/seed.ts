import { db, initDatabase } from './db';
import bcrypt from 'bcryptjs';

export async function seedData() {
  await initDatabase();

  console.log('🌱 Seeding extensive sample data into Neon PostgreSQL database...');

  // 1. Create Achievements
  const achievements = [
    { id: 'ach_1', code: 'FIRST_TRIP', title: 'First Trip', description: 'Created your first travel itinerary on GlobeTrotter', icon: '🏆', badge_color: 'amber' },
    { id: 'ach_2', code: 'WORLD_EXPLORER', title: 'World Explorer', description: 'Explored destinations across multiple countries', icon: '🌎', badge_color: 'blue' },
    { id: 'ach_3', code: 'ADVENTURE_SEEKER', title: 'Adventure Seeker', description: 'Added 5+ high-energy adventure activities', icon: '🏔️', badge_color: 'emerald' },
    { id: 'ach_4', code: 'FOOD_EXPLORER', title: 'Food Explorer', description: 'Added local culinary tours and authentic food experiences', icon: '🍜', badge_color: 'orange' },
    { id: 'ach_5', code: 'CITIES_10', title: '10 Cities Visited', description: 'Planned trips spanning 10 distinct global cities', icon: '🗺️', badge_color: 'purple' },
    { id: 'ach_6', code: 'COMMUNITY_STAR', title: 'Community Star', description: 'Shared public itineraries with 100+ views', icon: '⭐', badge_color: 'sky' }
  ];

  const stmtAch = db.prepare(`INSERT INTO achievements (id, code, title, description, icon, badge_color) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const ach of achievements) {
    await stmtAch.run(ach.id, ach.code, ach.title, ach.description, ach.icon, ach.badge_color);
  }

  // 2. Create 10 Users
  const passwordHash = bcrypt.hashSync('demo123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users = [
    { id: 'u_manan', email: 'manan@globetrotter.com', pass: passwordHash, name: 'Manan Patel', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_admin', email: 'admin@globetrotter.com', pass: adminPasswordHash, name: 'Admin GlobeTrotter', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', role: 'admin' },
    { id: 'u_jenil', email: 'jenil@globetrotter.com', pass: passwordHash, name: 'Jenil Goswami', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_priya', email: 'priya@globetrotter.com', pass: passwordHash, name: 'Priya Sharma', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_aarav', email: 'aarav@globetrotter.com', pass: passwordHash, name: 'Aarav Mehta', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_ananya', email: 'ananya@globetrotter.com', pass: passwordHash, name: 'Ananya Verma', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_sophia', email: 'sophia@globetrotter.com', pass: passwordHash, name: 'Sophia Chen', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_kabir', email: 'kabir@globetrotter.com', pass: passwordHash, name: 'Kabir Singhania', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_meera', email: 'meera@globetrotter.com', pass: passwordHash, name: 'Meera Nair', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_arjun', email: 'arjun@globetrotter.com', pass: passwordHash, name: 'Arjun Kapoor', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', role: 'user' }
  ];

  const stmtUser = db.prepare(`INSERT INTO users (id, email, password_hash, full_name, profile_photo, role, currency, language, status) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'en', 'Active') ON CONFLICT DO NOTHING`);
  for (const u of users) {
    await stmtUser.run(u.id, u.email, u.pass, u.name, u.photo, u.role);
  }

  // Profiles
  const stmtProfile = db.prepare(`INSERT INTO profiles (id, user_id, bio, home_city, home_country, is_public, public_trips) VALUES (?, ?, ?, ?, ?, 1, 1) ON CONFLICT DO NOTHING`);
  for (const u of users) {
    await stmtProfile.run(`prof_${u.id}`, u.id, `Travel enthusiast & GlobeTrotter member!`, 'Mumbai', 'India');
  }

  // 3. Create 10 Countries & 15 Cities
  const countries = [
    { id: 'c_in', name: 'India', code: 'IN', currency: 'INR', region: 'Asia' },
    { id: 'c_ae', name: 'United Arab Emirates', code: 'AE', currency: 'AED', region: 'Middle East' },
    { id: 'c_sg', name: 'Singapore', code: 'SG', currency: 'SGD', region: 'Asia' },
    { id: 'c_fr', name: 'France', code: 'FR', currency: 'EUR', region: 'Europe' },
    { id: 'c_jp', name: 'Japan', code: 'JP', currency: 'JPY', region: 'Asia' },
    { id: 'c_th', name: 'Thailand', code: 'TH', currency: 'THB', region: 'Southeast Asia' },
    { id: 'c_id', name: 'Indonesia', code: 'ID', currency: 'IDR', region: 'Southeast Asia' },
    { id: 'c_uk', name: 'United Kingdom', code: 'GB', currency: 'GBP', region: 'Europe' },
    { id: 'c_us', name: 'United States', code: 'US', currency: 'USD', region: 'North America' },
    { id: 'c_it', name: 'Italy', code: 'IT', currency: 'EUR', region: 'Europe' }
  ];

  const stmtCountry = db.prepare(`INSERT INTO countries (id, name, code, currency, region) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const c of countries) {
    await stmtCountry.run(c.id, c.name, c.code, c.currency, c.region);
  }

  const cities = [
    { id: 'city_amd', name: 'Ahmedabad', country_id: 'c_in', country_name: 'India', region: 'West India', description: 'UNESCO World Heritage City known for Sabarmati Ashram, heritage walks, street food, and textile history.', image_url: 'https://images.unsplash.com/photo-1609828913664-8848d7990476?auto=format&fit=crop&w=800&q=80', popularity_score: 4.6, avg_daily_cost: 2200, best_time_to_visit: 'Oct - Mar', latitude: 23.0225, longitude: 72.5714 },
    { id: 'city_udaipur', name: 'Udaipur', country_id: 'c_in', country_name: 'India', region: 'North India', description: 'The City of Lakes, romantic palaces, stunning sunsets, and rich Rajput architecture.', image_url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 3500, best_time_to_visit: 'Sep - Mar', latitude: 24.5854, longitude: 73.7125 },
    { id: 'city_jodhpur', name: 'Jodhpur', country_id: 'c_in', country_name: 'India', region: 'North India', description: 'The Blue City dominated by the mighty Mehrangarh Fort and vibrant indigo houses.', image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80', popularity_score: 4.8, avg_daily_cost: 3000, best_time_to_visit: 'Oct - Mar', latitude: 26.2389, longitude: 73.0243 },
    { id: 'city_jaipur', name: 'Jaipur', country_id: 'c_in', country_name: 'India', region: 'North India', description: 'The Pink City famous for Hawa Mahal, Amber Fort, royal bazaars, and heritage hotels.', image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 3800, best_time_to_visit: 'Oct - Mar', latitude: 26.9124, longitude: 75.7873 },
    { id: 'city_mumbai', name: 'Mumbai', country_id: 'c_in', country_name: 'India', region: 'West India', description: 'The Financial Capital of India, Gateway of India, Bollywood, Marine Drive sunsets & street food.', image_url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80', popularity_score: 4.7, avg_daily_cost: 4500, best_time_to_visit: 'Nov - Feb', latitude: 19.0760, longitude: 72.8777 },
    { id: 'city_delhi', name: 'Delhi', country_id: 'c_in', country_name: 'India', region: 'North India', description: 'India capital blending ancient monuments like Qutub Minar with bustling Chandni Chowk food stalls.', image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', popularity_score: 4.6, avg_daily_cost: 3200, best_time_to_visit: 'Oct - Mar', latitude: 28.7041, longitude: 77.1025 },
    { id: 'city_goa', name: 'Goa', country_id: 'c_in', country_name: 'India', region: 'West India', description: 'Tropical paradise featuring golden beaches, Portuguese heritage churches, night markets and water sports.', image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 4000, best_time_to_visit: 'Nov - Feb', latitude: 15.2993, longitude: 74.1240 },
    { id: 'city_blr', name: 'Bengaluru', country_id: 'c_in', country_name: 'India', region: 'South India', description: 'India Silicon Valley famous for pleasant weather, craft breweries, gardens, and tech culture.', image_url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', popularity_score: 4.5, avg_daily_cost: 3500, best_time_to_visit: 'Sep - Mar', latitude: 12.9716, longitude: 77.5946 },
    { id: 'city_dubai', name: 'Dubai', country_id: 'c_ae', country_name: 'United Arab Emirates', region: 'Middle East', description: 'Ultra-modern luxury hub featuring Burj Khalifa, desert safaris, world-class malls and futuristic architecture.', image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 15000, best_time_to_visit: 'Nov - Apr', latitude: 25.2048, longitude: 55.2708 },
    { id: 'city_sg', name: 'Singapore', country_id: 'c_sg', country_name: 'Singapore', region: 'Southeast Asia', description: 'Garden city with Gardens by the Bay, Marina Bay Sands, Hawker food centers, and Sentosa Island.', image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 12000, best_time_to_visit: 'Year-round', latitude: 1.3521, longitude: 103.8198 },
    { id: 'city_paris', name: 'Paris', country_id: 'c_fr', country_name: 'France', region: 'Europe', description: 'The City of Lights, Eiffel Tower, Louvre Museum, romantic cafes, and haute cuisine.', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 18000, best_time_to_visit: 'Apr - Oct', latitude: 48.8566, longitude: 2.3522 },
    { id: 'city_tokyo', name: 'Tokyo', country_id: 'c_jp', country_name: 'Japan', region: 'East Asia', description: 'Dynamic metropolis blending historic temples, futuristic Shibuya crossing, ramen bars, and anime culture.', image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', popularity_score: 5.0, avg_daily_cost: 14000, best_time_to_visit: 'Mar - May & Oct - Nov', latitude: 35.6762, longitude: 139.6503 },
    { id: 'city_bangkok', name: 'Bangkok', country_id: 'c_th', country_name: 'Thailand', region: 'Southeast Asia', description: 'Vibrant street life, ornate shrines, Grand Palace, floating markets, and famous nightlife.', image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', popularity_score: 4.8, avg_daily_cost: 3800, best_time_to_visit: 'Nov - Feb', latitude: 13.7563, longitude: 100.5018 },
    { id: 'city_bali', name: 'Bali', country_id: 'c_id', country_name: 'Indonesia', region: 'Southeast Asia', description: 'Island of the Gods, sacred rice terraces, beach clubs, volcanos, and spiritual retreats.', image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', popularity_score: 4.9, avg_daily_cost: 4500, best_time_to_visit: 'Apr - Oct', latitude: -8.4095, longitude: 115.1889 },
    { id: 'city_varanasi', name: 'Varanasi', country_id: 'c_in', country_name: 'India', region: 'North India', description: 'Spiritual capital of India on the banks of the sacred Ganges river with mesmerizing Ganga Aarti.', image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', popularity_score: 4.8, avg_daily_cost: 2000, best_time_to_visit: 'Oct - Mar', latitude: 25.3176, longitude: 82.9739 }
  ];

  const stmtCity = db.prepare(`INSERT INTO cities (id, name, country_id, country_name, region, description, image_url, popularity_score, avg_daily_cost, best_time_to_visit, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const c of cities) {
    await stmtCity.run(c.id, c.name, c.country_id, c.country_name, c.region, c.description, c.image_url, c.popularity_score, c.avg_daily_cost, c.best_time_to_visit, c.latitude, c.longitude);
  }

  // 4. Create 6 Trip Templates
  const templates = [
    { id: 'tpl_1', title: 'Rajasthan Royal Circuit', description: 'Classic 6-day heritage tour covering Ahmedabad, Udaipur, Jodhpur, and Jaipur forts, palaces, and street food.', category: 'Heritage Tour', cover_image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80', duration_days: 6, estimated_budget: 28000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_amd', 'city_udaipur', 'city_jodhpur', 'city_jaipur'] }) },
    { id: 'tpl_2', title: 'Goa Coastal Getaway', description: '4 days of sun, sand, water sports, beach shacks, and Portuguese heritage in North & South Goa.', category: 'Weekend Getaway', cover_image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', duration_days: 4, estimated_budget: 18000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_goa'] }) },
    { id: 'tpl_3', title: 'Tokyo & Kyoto Cultural Trail', description: '7-day immersion into Japanese cuisine, temples, Shibuya crossing, and bullet train journeys.', category: 'Culture', cover_image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', duration_days: 7, estimated_budget: 110000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_tokyo'] }) },
    { id: 'tpl_4', title: 'Dubai Luxury & Desert Safari', description: '5 days of ultra-modern skyscrapers, luxury malls, dune bashing, and Marina cruises.', category: 'Luxury Escape', cover_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', duration_days: 5, estimated_budget: 75000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_dubai'] }) },
    { id: 'tpl_5', title: 'Paris Romantic Escape', description: '5 days exploring Eiffel Tower, Louvre museum, Montmartre artists, and Seine river boat cruise.', category: 'Romance', cover_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', duration_days: 5, estimated_budget: 95000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_paris'] }) },
    { id: 'tpl_6', title: 'Bali Island Paradise', description: '6 days of Sacred Monkey Sanctuary, Ubud rice terraces, Uluwatu cliff temples, and beach clubs.', category: 'Adventure', cover_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', duration_days: 6, estimated_budget: 45000, currency: 'INR', template_data_json: JSON.stringify({ cities: ['city_bali'] }) }
  ];

  const stmtTpl = db.prepare(`INSERT INTO trip_templates (id, title, description, category, cover_image, duration_days, estimated_budget, currency, template_data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const t of templates) {
    await stmtTpl.run(t.id, t.title, t.description, t.category, t.cover_image, t.duration_days, t.estimated_budget, t.currency, t.template_data_json);
  }

  // 5. Create 10 Platform Trips
  const stmtTrip = db.prepare(`INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);

  const trips = [
    { id: 'trip_1', user_id: 'u_manan', title: 'Rajasthan Royal Expedition', desc: '6-day royal exploration starting from Ahmedabad through Udaipur, Jodhpur, and Jaipur.', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80', start: '2026-09-10', end: '2026-09-16', budget: 32000, vis: 'Public', slug: 'rajasthan-royal-expedition' },
    { id: 'trip_2', user_id: 'u_jenil', title: 'Goa Beach & Nightlife Getaway', desc: '4 days of sun, sand, water sports, and beachside dining in North Goa.', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', start: '2026-10-01', end: '2026-10-05', budget: 22000, vis: 'Public', slug: 'goa-beach-getaway' },
    { id: 'trip_3', user_id: 'u_ananya', title: 'Tokyo Tech & Cherry Blossom Trail', desc: 'Exploring digital art museums, ramen spots, and Shibuya crossing in Tokyo.', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', start: '2026-11-15', end: '2026-11-22', budget: 120000, vis: 'Public', slug: 'tokyo-cherry-blossom-trail' },
    { id: 'trip_4', user_id: 'u_sophia', title: 'Dubai Luxury & Desert Safari', desc: 'Burj Khalifa views, luxury shopping, and red dune safari experience.', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', start: '2026-12-05', end: '2026-12-10', budget: 85000, vis: 'Public', slug: 'dubai-luxury-desert-safari' },
    { id: 'trip_5', user_id: 'u_priya', title: 'Paris Art & Culture Immersion', desc: 'Louvre museum tours, Eiffel tower views, and French pastry tasting.', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', start: '2026-10-12', end: '2026-10-18', budget: 98000, vis: 'Public', slug: 'paris-art-culture-immersion' },
    { id: 'trip_6', user_id: 'u_aarav', title: 'Bali Tropical Island Escape', desc: 'Rice terraces, Ubud monkey forest, and Uluwatu temple sunsets.', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80', start: '2026-11-01', end: '2026-11-07', budget: 48000, vis: 'Public', slug: 'bali-tropical-island-escape' },
    { id: 'trip_7', user_id: 'u_kabir', title: 'Singapore City of Gardens Tour', desc: 'Gardens by the Bay, Marina Bay Sands skyline, and Sentosa island.', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80', start: '2026-12-20', end: '2026-12-26', budget: 65000, vis: 'Public', slug: 'singapore-city-of-gardens' },
    { id: 'trip_8', user_id: 'u_meera', title: 'Varanasi Spiritual & Ghats Journey', desc: 'Evening Ganga Aarti ceremony, morning boat ride, and old city food tour.', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80', start: '2026-11-20', end: '2026-11-24', budget: 15000, vis: 'Public', slug: 'varanasi-spiritual-ghats' },
    { id: 'trip_9', user_id: 'u_arjun', title: 'Mumbai Financial Hub & Heritage Trail', desc: 'Gateway of India, Marine Drive sunset, Elephanta caves, and street food.', img: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=80', start: '2026-10-25', end: '2026-10-28', budget: 20000, vis: 'Public', slug: 'mumbai-heritage-trail' },
    { id: 'trip_10', user_id: 'u_manan', title: 'Bangkok Street Food & Temple Odyssey', desc: 'Grand Palace, Floating Markets, Tuk Tuk tours, and Pad Thai tasting.', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80', start: '2027-01-10', end: '2027-01-16', budget: 42000, vis: 'Public', slug: 'bangkok-street-food-odyssey' }
  ];

  for (const t of trips) {
    await stmtTrip.run(t.id, t.user_id, t.title, t.desc, t.img, t.start, t.end, t.budget, 'INR', 'Upcoming', t.vis, t.slug);
  }

  // Trip Stops for Trip 1
  const stmtStop = db.prepare(`INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtStop.run('stop_1', 'trip_1', 'city_amd', 1, '2026-09-10', '2026-09-11', 'Starting point');
  await stmtStop.run('stop_2', 'trip_1', 'city_udaipur', 2, '2026-09-11', '2026-09-13', 'City of Lakes');
  await stmtStop.run('stop_3', 'trip_1', 'city_jodhpur', 3, '2026-09-13', '2026-09-14', 'Blue city fort');
  await stmtStop.run('stop_4', 'trip_1', 'city_jaipur', 4, '2026-09-14', '2026-09-16', 'Pink city heritage');

  // Also add stops for all other 9 trips so they show up on maps & builder!
  await stmtStop.run('stop_t2', 'trip_2', 'city_goa', 1, '2026-10-01', '2026-10-05', 'Beach stay');
  await stmtStop.run('stop_t3', 'trip_3', 'city_tokyo', 1, '2026-11-15', '2026-11-22', 'Tokyo exploration');
  await stmtStop.run('stop_t4', 'trip_4', 'city_dubai', 1, '2026-12-05', '2026-12-10', 'Dubai luxury');
  await stmtStop.run('stop_t5', 'trip_5', 'city_paris', 1, '2026-10-12', '2026-10-18', 'Paris romance');
  await stmtStop.run('stop_t6', 'trip_6', 'city_bali', 1, '2026-11-01', '2026-11-07', 'Bali getaway');
  await stmtStop.run('stop_t7', 'trip_7', 'city_sg', 1, '2026-12-20', '2026-12-26', 'Singapore tour');
  await stmtStop.run('stop_t8', 'trip_8', 'city_varanasi', 1, '2026-11-20', '2026-11-24', 'Spiritual ghats');
  await stmtStop.run('stop_t9', 'trip_9', 'city_mumbai', 1, '2026-10-25', '2026-10-28', 'Financial hub');
  await stmtStop.run('stop_t10', 'trip_10', 'city_bangkok', 1, '2027-01-10', '2027-01-16', 'Bangkok street food');

  console.log('✅ Neon PostgreSQL database populated with 10 Users, 10 Trips, 15 Cities, 6 Templates, and 10 Countries!');
}

if (require.main === module) {
  seedData().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}
