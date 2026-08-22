import { db, initDatabase } from './db';
import bcrypt from 'bcryptjs';

export async function seedData() {
  await initDatabase();

  console.log('🌱 Seeding sample data into Neon PostgreSQL database...');

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

  // 2. Create Sample Users
  const passwordHash = bcrypt.hashSync('demo123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users = [
    { id: 'u_manan', email: 'manan@globetrotter.com', pass: passwordHash, name: 'Manan Patel', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_admin', email: 'admin@globetrotter.com', pass: adminPasswordHash, name: 'Admin GlobeTrotter', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', role: 'admin' },
    { id: 'u_jenil', email: 'jenil@globetrotter.com', pass: passwordHash, name: 'Jenil Goswami', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_priya', email: 'priya@globetrotter.com', pass: passwordHash, name: 'Priya Sharma', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_aarav', email: 'aarav@globetrotter.com', pass: passwordHash, name: 'Aarav Mehta', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_ananya', email: 'ananya@globetrotter.com', pass: passwordHash, name: 'Ananya Verma', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', role: 'user' },
    { id: 'u_sophia', email: 'sophia@globetrotter.com', pass: passwordHash, name: 'Sophia Chen', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', role: 'user' }
  ];

  const stmtUser = db.prepare(`INSERT INTO users (id, email, password_hash, full_name, profile_photo, role, currency, language, status) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'en', 'Active') ON CONFLICT DO NOTHING`);
  for (const u of users) {
    await stmtUser.run(u.id, u.email, u.pass, u.name, u.photo, u.role);
  }

  // Profiles
  const stmtProfile = db.prepare(`INSERT INTO profiles (id, user_id, bio, home_city, home_country, is_public, public_trips) VALUES (?, ?, ?, ?, ?, 1, 1) ON CONFLICT DO NOTHING`);
  await stmtProfile.run('prof_manan', 'u_manan', 'Passionate explorer, backpacker & food enthusiast! 🌍✈️', 'Ahmedabad', 'India');
  await stmtProfile.run('prof_admin', 'u_admin', 'GlobeTrotter Platform Admin & Community Lead', 'Mumbai', 'India');
  await stmtProfile.run('prof_jenil', 'u_jenil', 'Software developer & road trip junkie 🏎️', 'Surat', 'India');
  await stmtProfile.run('prof_priya', 'u_priya', 'Culture lover, museum enthusiast & photographer 📸', 'Delhi', 'India');
  await stmtProfile.run('prof_aarav', 'u_aarav', 'Trekking guide & mountain lover 🏔️', 'Bengaluru', 'India');

  // User Achievements
  const stmtUserAch = db.prepare(`INSERT INTO user_achievements (id, user_id, achievement_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtUserAch.run('ua_1', 'u_manan', 'ach_1');
  await stmtUserAch.run('ua_2', 'u_manan', 'ach_3');
  await stmtUserAch.run('ua_3', 'u_manan', 'ach_4');
  await stmtUserAch.run('ua_4', 'u_jenil', 'ach_1');
  await stmtUserAch.run('ua_5', 'u_priya', 'ach_2');

  // 3. Create Countries & Cities
  const countries = [
    { id: 'c_in', name: 'India', code: 'IN', currency: 'INR', region: 'Asia' },
    { id: 'c_ae', name: 'United Arab Emirates', code: 'AE', currency: 'AED', region: 'Middle East' },
    { id: 'c_sg', name: 'Singapore', code: 'SG', currency: 'SGD', region: 'Asia' },
    { id: 'c_fr', name: 'France', code: 'FR', currency: 'EUR', region: 'Europe' },
    { id: 'c_jp', name: 'Japan', code: 'JP', currency: 'JPY', region: 'Asia' },
    { id: 'c_th', name: 'Thailand', code: 'TH', currency: 'THB', region: 'Southeast Asia' },
    { id: 'c_id', name: 'Indonesia', code: 'ID', currency: 'IDR', region: 'Southeast Asia' }
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
    { id: 'city_tokyo', name: 'Tokyo', country_id: 'c_jp', country_name: 'Japan', region: 'East Asia', description: 'Dynamic metropolis blending historic temples, futuristic Shibuya crossing, ramen bars, and anime culture.', image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', popularity_score: 5.0, avg_daily_cost: 14000, best_time_to_visit: 'Mar - May & Oct - Nov', latitude: 35.6762, longitude: 139.6503 }
  ];

  const stmtCity = db.prepare(`INSERT INTO cities (id, name, country_id, country_name, region, description, image_url, popularity_score, avg_daily_cost, best_time_to_visit, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const c of cities) {
    await stmtCity.run(c.id, c.name, c.country_id, c.country_name, c.region, c.description, c.image_url, c.popularity_score, c.avg_daily_cost, c.best_time_to_visit, c.latitude, c.longitude);
  }

  // 4. Create Activities per City
  const activities = [
    { id: 'act_amd_1', city_id: 'city_amd', name: 'Sabarmati Ashram Walk', category: 'Culture', description: 'Visit Mahatma Gandhi historic residence on the banks of Sabarmati river.', image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=600&q=80', location_name: 'Ashram Road, Ahmedabad', latitude: 23.0601, longitude: 72.5806, duration_minutes: 90, estimated_cost: 0, rating: 4.8 },
    { id: 'act_amd_2', city_id: 'city_amd', name: 'Manek Chowk Street Food Tour', category: 'Food', description: 'Experience legendary nighttime street food market featuring Gwalior Dosa & Chocolate Sandwich.', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', location_name: 'Old City, Ahmedabad', latitude: 23.0248, longitude: 72.5873, duration_minutes: 120, estimated_cost: 400, rating: 4.7 },
    { id: 'act_amd_3', city_id: 'city_amd', name: 'Adalaj Stepwell Heritage Visit', category: 'Sightseeing', description: 'Marvel at 5th-century intricate Solanki architectural stepwell.', image_url: 'https://images.unsplash.com/photo-1609828913664-8848d7990476?auto=format&fit=crop&w=600&q=80', location_name: 'Adalaj, Gandhinagar border', latitude: 23.1667, longitude: 72.5802, duration_minutes: 90, estimated_cost: 50, rating: 4.6 },

    { id: 'act_udr_1', city_id: 'city_udaipur', name: 'City Palace Tour', category: 'Sightseeing', description: 'Explore the grandest palace complex in Rajasthan overlooking Lake Pichola.', image_url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80', location_name: 'City Palace Complex, Udaipur', latitude: 24.5764, longitude: 73.6835, duration_minutes: 150, estimated_cost: 400, rating: 4.9 },
    { id: 'act_udr_2', city_id: 'city_udaipur', name: 'Lake Pichola Sunset Boat Cruise', category: 'Adventure', description: 'Scenic boat ride around Jag Mandir Island during golden sunset hour.', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80', location_name: 'Rameshwar Ghat, Udaipur', latitude: 24.5750, longitude: 73.6800, duration_minutes: 60, estimated_cost: 800, rating: 4.9 },
    { id: 'act_udr_3', city_id: 'city_udaipur', name: 'Sajjangarh Monsoon Palace Visit', category: 'Nature', description: 'Hilltop palace with panoramic views of the Aravalli hills and lakes.', image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80', location_name: 'Monsoon Palace, Udaipur', latitude: 24.5939, longitude: 73.6331, duration_minutes: 120, estimated_cost: 250, rating: 4.7 },

    { id: 'act_jdh_1', city_id: 'city_jodhpur', name: 'Mehrangarh Fort Zipline & Tour', category: 'Adventure', description: 'Fly over battlements and blue city rooftops on Flying Fox zipline.', image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80', location_name: 'Mehrangarh Fort, Jodhpur', latitude: 26.2978, longitude: 73.0185, duration_minutes: 180, estimated_cost: 1800, rating: 4.9 },
    { id: 'act_jdh_2', city_id: 'city_jodhpur', name: 'Blue City Heritage Walk', category: 'Culture', description: 'Stroll through vibrant blue lanes of Navchokiya and taste local Makhaniya Lassi.', image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80', location_name: 'Clock Tower Market, Jodhpur', latitude: 26.2950, longitude: 73.0220, duration_minutes: 120, estimated_cost: 300, rating: 4.8 },

    { id: 'act_jpr_1', city_id: 'city_jaipur', name: 'Amber Fort Elephant / Jeep Safari', category: 'Sightseeing', description: 'Ascend the majestic hilltop fortress of Amer with Sheesh Mahal mirrors.', image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80', location_name: 'Amer, Jaipur', latitude: 26.9855, longitude: 75.8513, duration_minutes: 180, estimated_cost: 500, rating: 4.9 },
    { id: 'act_jpr_2', city_id: 'city_jaipur', name: 'Hawa Mahal Photo & Rooftop Cafe', category: 'Culture', description: 'Admire the 953 pink sandstone casement windows while enjoying Rajasthani tea.', image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80', location_name: 'Badi Choupad, Jaipur', latitude: 26.9239, longitude: 75.8267, duration_minutes: 60, estimated_cost: 200, rating: 4.8 },
    { id: 'act_jpr_3', city_id: 'city_jaipur', name: 'Chokhi Dhani Cultural Dinner', category: 'Food', description: 'Ethnic village resort experience with folk music, puppet shows & traditional Thali.', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80', location_name: 'Tonk Road, Jaipur', latitude: 26.7725, longitude: 75.8344, duration_minutes: 180, estimated_cost: 1100, rating: 4.7 },

    { id: 'act_goa_1', city_id: 'city_goa', name: 'Calangute Water Sports Package', category: 'Adventure', description: 'Parasailing, jet ski, banana boat ride and speed boating.', image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', location_name: 'Calangute Beach, Goa', latitude: 15.5438, longitude: 73.7554, duration_minutes: 150, estimated_cost: 2200, rating: 4.8 },
    { id: 'act_goa_2', city_id: 'city_goa', name: 'Fontainhas Latin Quarter Walk', category: 'Culture', description: 'Wander pastel Portuguese heritage houses and art galleries in Panjim.', image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', location_name: 'Panaji, Goa', latitude: 15.4989, longitude: 73.8278, duration_minutes: 90, estimated_cost: 0, rating: 4.7 },

    { id: 'act_dubai_1', city_id: 'city_dubai', name: 'Burj Khalifa At The Top (124th Floor)', category: 'Sightseeing', description: 'Panoramic observation deck views of Dubai skyline.', image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80', location_name: 'Downtown Dubai', latitude: 25.1972, longitude: 55.2744, duration_minutes: 120, estimated_cost: 4500, rating: 4.9 },
    { id: 'act_dubai_2', city_id: 'city_dubai', name: 'Red Dune Desert Safari & BBQ Dinner', category: 'Adventure', description: 'Dune bashing, camel riding, quad biking, and belly dance dinner show.', image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', location_name: 'Lahbab Desert, Dubai', latitude: 24.9650, longitude: 55.6020, duration_minutes: 360, estimated_cost: 3200, rating: 4.9 },

    { id: 'act_tokyo_1', city_id: 'city_tokyo', name: 'Shibuya Crossing & Hachiko Statue Walk', category: 'Sightseeing', description: 'World busiest pedestrian crossing experience.', image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80', location_name: 'Shibuya Station, Tokyo', latitude: 35.6595, longitude: 139.7004, duration_minutes: 60, estimated_cost: 0, rating: 4.9 },
    { id: 'act_tokyo_2', city_id: 'city_tokyo', name: 'TeamLab Planets Immersive Digital Art', category: 'Culture', description: 'Body immersive water museum with giant digital artwork.', image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', location_name: 'Toyosu, Tokyo', latitude: 35.6465, longitude: 139.7963, duration_minutes: 120, estimated_cost: 2400, rating: 4.9 }
  ];

  const stmtAct = db.prepare(`INSERT INTO activities (id, city_id, name, category, description, image_url, location_name, latitude, longitude, duration_minutes, estimated_cost, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const a of activities) {
    await stmtAct.run(a.id, a.city_id, a.name, a.category, a.description, a.image_url, a.location_name, a.latitude, a.longitude, a.duration_minutes, a.estimated_cost, a.rating);
  }

  // 5. Create Templates
  const templates = [
    {
      id: 'tpl_1',
      title: 'Rajasthan Royal Circuit',
      description: 'Classic 6-day heritage tour covering Ahmedabad, Udaipur, Jodhpur, and Jaipur forts, palaces, and street food.',
      category: 'Heritage Tour',
      cover_image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
      duration_days: 6,
      estimated_budget: 28000,
      currency: 'INR',
      template_data_json: JSON.stringify({
        cities: ['city_amd', 'city_udaipur', 'city_jodhpur', 'city_jaipur'],
        highlights: ['Sabarmati Ashram', 'City Palace Udaipur', 'Mehrangarh Fort Zipline', 'Amber Fort Jaipur']
      })
    },
    {
      id: 'tpl_2',
      title: 'Goa Coastal Getaway',
      description: '4 days of sun, sand, water sports, beach shacks, and Portuguese heritage in North & South Goa.',
      category: 'Weekend Getaway',
      cover_image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      duration_days: 4,
      estimated_budget: 18000,
      currency: 'INR',
      template_data_json: JSON.stringify({
        cities: ['city_goa'],
        highlights: ['Calangute Water Sports', 'Fontainhas Latin Quarter', 'Anjuna Beach Sunset']
      })
    },
    {
      id: 'tpl_3',
      title: 'Tokyo & Kyoto Cultural Trail',
      description: '7-day immersion into Japanese cuisine, temples, Shibuya crossing, and bullet train journeys.',
      category: 'Culture',
      cover_image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      duration_days: 7,
      estimated_budget: 110000,
      currency: 'INR',
      template_data_json: JSON.stringify({
        cities: ['city_tokyo'],
        highlights: ['Shibuya Crossing', 'Sensō-ji Temple', 'Ramen Tasting Tour']
      })
    },
    {
      id: 'tpl_4',
      title: 'Dubai Luxury & Desert Safari',
      description: '5 days of ultra-modern skyscrapers, luxury malls, dune bashing, and Marina cruises.',
      category: 'Luxury Escape',
      cover_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
      duration_days: 5,
      estimated_budget: 75000,
      currency: 'INR',
      template_data_json: JSON.stringify({
        cities: ['city_dubai'],
        highlights: ['Burj Khalifa 124th Floor', 'Red Dune Desert Safari', 'Dubai Mall Fountain Show']
      })
    }
  ];

  const stmtTpl = db.prepare(`INSERT INTO trip_templates (id, title, description, category, cover_image, duration_days, estimated_budget, currency, template_data_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  for (const t of templates) {
    await stmtTpl.run(t.id, t.title, t.description, t.category, t.cover_image, t.duration_days, t.estimated_budget, t.currency, t.template_data_json);
  }

  // 6. Create Multiple Sample Trips
  const stmtTrip = db.prepare(`INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);

  // Trip 1: Manan's Rajasthan Trip
  await stmtTrip.run('trip_rajasthan_demo', 'u_manan', 'Rajasthan Adventure', 'A 6-day royal exploration starting from Ahmedabad through Udaipur, Jodhpur, and Jaipur.', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80', '2026-09-10', '2026-09-16', 30000, 'INR', 'Upcoming', 'Public', 'rajasthan-adventure');

  // Trip 2: Jenil's Goa Trip
  await stmtTrip.run('trip_goa_demo', 'u_jenil', 'Goa Sun & Beach Escapade', '4 days of relaxation, water sports, and beachside dining in North Goa.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', '2026-10-01', '2026-10-05', 22000, 'INR', 'Upcoming', 'Public', 'goa-sun-and-beach');

  // Trip 3: Ananya's Tokyo Discovery
  await stmtTrip.run('trip_tokyo_demo', 'u_ananya', 'Tokyo Cherry Blossom & Tech Discovery', 'Exploring digital art museums, ramen spots, and Shibuya crossing.', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', '2026-11-15', '2026-11-22', 120000, 'INR', 'Upcoming', 'Public', 'tokyo-cherry-blossom');

  // Trip Stops for Manan's Trip
  const stmtStop = db.prepare(`INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtStop.run('stop_1', 'trip_rajasthan_demo', 'city_amd', 1, '2026-09-10', '2026-09-11', 'Starting point');
  await stmtStop.run('stop_2', 'trip_rajasthan_demo', 'city_udaipur', 2, '2026-09-11', '2026-09-13', 'City of Lakes');
  await stmtStop.run('stop_3', 'trip_rajasthan_demo', 'city_jodhpur', 3, '2026-09-13', '2026-09-14', 'Blue city fort');
  await stmtStop.run('stop_4', 'trip_rajasthan_demo', 'city_jaipur', 4, '2026-09-14', '2026-09-16', 'Pink city heritage');

  await stmtStop.run('stop_g1', 'trip_goa_demo', 'city_goa', 1, '2026-10-01', '2026-10-05', 'Beach relaxation');
  await stmtStop.run('stop_t1', 'trip_tokyo_demo', 'city_tokyo', 1, '2026-11-15', '2026-11-22', 'Metropolis tour');

  // Trip Activities for Manan's Trip
  const stmtTripAct = db.prepare(`INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order, is_completed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtTripAct.run('tact_1', 'trip_rajasthan_demo', 'stop_1', 'act_amd_1', 1, 'Sabarmati Ashram Walk', 'Culture', '09:00', 90, 0, 'Morning peaceful walk', 1, 1);
  await stmtTripAct.run('tact_2', 'trip_rajasthan_demo', 'stop_1', 'act_amd_2', 1, 'Manek Chowk Night Food Tour', 'Food', '20:00', 120, 400, 'Try the butter cheese dosa', 2, 0);
  await stmtTripAct.run('tact_3', 'trip_rajasthan_demo', 'stop_2', 'act_udr_1', 2, 'City Palace Tour', 'Sightseeing', '10:00', 150, 400, 'Audio guide recommended', 1, 0);
  await stmtTripAct.run('tact_4', 'trip_rajasthan_demo', 'stop_2', 'act_udr_2', 2, 'Lake Pichola Sunset Boat Cruise', 'Adventure', '17:30', 60, 800, 'Reach ghat 20 mins early', 2, 0);

  await stmtTripAct.run('tact_g1', 'trip_goa_demo', 'stop_g1', 'act_goa_1', 1, 'Calangute Water Sports Package', 'Adventure', '10:00', 150, 2200, 'Parasailing & Jet Ski', 1, 0);
  await stmtTripAct.run('tact_g2', 'trip_goa_demo', 'stop_g1', 'act_goa_2', 2, 'Fontainhas Heritage Walk', 'Culture', '16:00', 90, 0, 'Portuguese Architecture photos', 1, 0);

  // Accommodations
  const stmtAcc = db.prepare(`INSERT INTO accommodations (id, trip_id, trip_stop_id, name, check_in, check_out, cost_per_night, total_cost, booking_reference, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtAcc.run('acc_1', 'trip_rajasthan_demo', 'stop_1', 'Lemon Tree Hotel Ahmedabad', '2026-09-10', '2026-09-11', 3200, 3200, 'BK-88492', 'Mithakhali Six Roads');
  await stmtAcc.run('acc_2', 'trip_rajasthan_demo', 'stop_2', 'Jagat Niwas Palace Hotel Udaipur', '2026-09-11', '2026-09-13', 4500, 9000, 'BK-99301', 'Lal Ghat, Lake Pichola');

  // Expenses
  const stmtExp = db.prepare(`INSERT INTO expenses (id, trip_id, user_id, category, amount, date, description, paid_by_name, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtExp.run('exp_1', 'trip_rajasthan_demo', 'u_manan', 'Transportation', 2500, '2026-09-10', 'Vande Bharat Express train', 'Manan Patel', 'UPI');
  await stmtExp.run('exp_2', 'trip_rajasthan_demo', 'u_manan', 'Accommodation', 3200, '2026-09-10', 'Hotel stay Ahmedabad', 'Manan Patel', 'Card');
  await stmtExp.run('exp_3', 'trip_rajasthan_demo', 'u_manan', 'Activities', 400, '2026-09-10', 'Manek Chowk Street Food Dinner', 'Priya Sharma', 'Cash');

  // Trip Members
  const stmtMem = db.prepare(`INSERT INTO trip_members (id, trip_id, user_id, email, role, status) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtMem.run('mem_1', 'trip_rajasthan_demo', 'u_manan', 'manan@globetrotter.com', 'Owner', 'Accepted');
  await stmtMem.run('mem_2', 'trip_rajasthan_demo', 'u_priya', 'priya@globetrotter.com', 'Editor', 'Accepted');

  // Comments
  const stmtComm = db.prepare(`INSERT INTO comments (id, trip_id, user_id, activity_id, content) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtComm.run('comm_1', 'trip_rajasthan_demo', 'u_priya', 'act_udr_2', 'Should we book the private sunset boat or group cruise? Sunset views are magical!');
  await stmtComm.run('comm_2', 'trip_rajasthan_demo', 'u_manan', 'act_jdh_1', 'Ziplining over Mehrangarh fort looks epic! Reserved the 09:30 AM slot.');

  // Activity Votes
  const stmtVote = db.prepare(`INSERT INTO activity_votes (id, trip_activity_id, user_id, vote_type) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtVote.run('vote_1', 'tact_4', 'u_manan', 'up');
  await stmtVote.run('vote_2', 'tact_4', 'u_priya', 'up');

  // Notifications
  const stmtNotif = db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  await stmtNotif.run('notif_1', 'u_manan', 'Trip Reminder ✈️', 'Your Rajasthan Adventure starts in 18 days! Complete your packing list.', 'reminder', 0, '/trips/trip_rajasthan_demo');
  await stmtNotif.run('notif_2', 'u_manan', 'Weather Update ☀️', 'Sunny weather expected in Udaipur (28°C - 32°C). High UV index.', 'weather', 0, '/trips/trip_rajasthan_demo');

  console.log('✅ Neon PostgreSQL database successfully populated with rich temporary seed data!');
}

if (require.main === module) {
  seedData().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}
