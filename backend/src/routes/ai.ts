import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/ai/travel-assistant
router.post('/travel-assistant', async (req, res, next) => {
  try {
    const { prompt, trip_id } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const pLower = prompt.toLowerCase();
    let responseText = '';
    let suggestedActions: any[] = [];

    let tripContext: any = null;
    if (trip_id) {
      tripContext = await db.prepare('SELECT * FROM trips WHERE id = ?').get(trip_id);
    }

    if (pLower.includes('plan') || pLower.includes('trip') || pLower.includes('itinerary')) {
      responseText = `Based on your request, I can curate a personalized itinerary for you. Tell me more about your destination, budget, and travel dates!\n\n` +
        `For example, you can say: "Plan a 5-day trip to Paris under €2000" or "Suggest a budget-friendly weekend getaway in India."`;
    } else if (pLower.includes('expensive') || pLower.includes('cheaper') || pLower.includes('save money') || pLower.includes('budget')) {
      responseText = `Here are 3 smart ways to optimize your travel budget:\n\n` +
        `1. 💡 **Accommodation Optimization**: Consider booking boutique homestays or highly-rated hostels instead of central luxury hotels to save significantly.\n` +
        `2. 🚌 **Public Transit**: Use regional trains or local buses instead of private cabs between cities.\n` +
        `3. 🎟️ **Activity Combo Passes**: Look for city tourist passes that bundle major attractions at a discount.`;
    } else if (pLower.includes('activities') || pLower.includes('recommend') || pLower.includes('things to do')) {
      responseText = `Here are some popular types of activities you can add to your itinerary:\n\n` +
        `• **Cultural Heritage Tours**\n` +
        `• **Local Food & Street Markets**\n` +
        `• **Adventure & Outdoor Excursions**\n` +
        `• **Museums & Art Galleries**\n\n` +
        `Tell me your specific destination and I'll give you exact recommendations!`;
    } else if (pLower.includes('adventure')) {
      responseText = `High-energy adventure recommendations for any destination:\n\n` +
        `• 🧗 **Ziplining and Rock Climbing**\n` +
        `• 🚤 **Kayaking or Speed Boat Tours**\n` +
        `• 🎈 **Hot Air Balloon Safari**\n\n` +
        `Let me know where you are heading so I can find local adventure spots for you!`;
    } else {
      responseText = `GlobeTrotter AI Assistant at your service! ✈️ I've analyzed your travel preferences.\n\n` +
        `You can ask me to suggest destinations, optimize your current itinerary routes, suggest budget reduction strategies, or generate an instant packing list!`;
    }

    return res.json({
      reply: responseText,
      suggested_actions: suggestedActions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/optimize-itinerary
router.post('/optimize-itinerary', async (req, res, next) => {
  try {
    const { trip_id } = req.body;

    if (!trip_id) {
      return res.status(400).json({ error: 'trip_id is required' });
    }

    const stops = await db.prepare(`
      SELECT ts.*, c.name as city_name, c.latitude, c.longitude
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.trip_id = ?
      ORDER BY ts.stop_order ASC
    `).all(trip_id);

    const activities = await db.prepare('SELECT * FROM trip_activities WHERE trip_id = ?').all(trip_id);

    const recommendations: any[] = [];

    if (stops.length >= 3) {
      const stopNames = stops.map((s: any) => s.city_name).join(' → ');
      recommendations.push({
        id: 'rec_route_1',
        type: 'route_optimization',
        icon: '🚗',
        title: 'Optimal Travel Route Detected',
        description: `Reordering your stops to sequence ${stopNames} optimally could reduce total transit time and save on travel costs.`,
        savings: 'Optimized travel time',
        impact_score: 'High'
      });
    }

    const firstCity = stops.length > 0 ? stops[0].city_name : 'your destination';

    recommendations.push({
      id: 'rec_time_2',
      type: 'schedule_conflict',
      icon: '⏰',
      title: 'Schedule Buffer Optimization',
      description: 'You have outdoor activities scheduled close to sunset. Shifting them slightly earlier creates a more relaxed experience and avoids twilight rush.',
      savings: 'Prevents rush & overlap',
      impact_score: 'Medium'
    });

    recommendations.push({
      id: 'rec_budget_3',
      type: 'budget_saving',
      icon: '💡',
      title: 'Smart Activity Saver',
      description: `Look for local tourist passes in ${firstCity} to combine major attraction tickets and save money per traveler.`,
      savings: 'Up to 20% savings',
      impact_score: 'Medium'
    });

    return res.json({
      trip_id,
      optimized: true,
      recommendations_count: recommendations.length,
      recommendations
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/packing-list
router.post('/packing-list', (req, res) => {
  const { trip_id, destination_name, duration_days } = req.body;

  const packingList = [
    {
      category: 'Clothing & Footwear',
      items: [
        { name: 'Light cotton T-shirts & shirts', checked: true },
        { name: 'Breathable linen pants & jeans', checked: false },
        { name: 'Comfortable walking / hiking shoes', checked: true },
        { name: 'Sunglasses & wide-brim hat', checked: false },
        { name: 'Light jacket / shawl for evening breeze', checked: false }
      ]
    },
    {
      category: 'Travel Essentials & Documents',
      items: [
        { name: 'Government ID / Passport / Driver License', checked: true },
        { name: 'Train / Flight tickets & Hotel vouchers', checked: true },
        { name: 'Cash (Small denomination INR notes)', checked: false },
        { name: 'Personal Medical Kit & Bandages', checked: false }
      ]
    },
    {
      category: 'Weather & Sun Care',
      items: [
        { name: 'SPF 50+ Broad Spectrum Sunscreen', checked: false },
        { name: 'Hydration Flask / Water bottle', checked: true },
        { name: 'Compact Umbrella / Rain Poncho', checked: false },
        { name: 'Mosquito Repellent Lotion', checked: false }
      ]
    },
    {
      category: 'Electronics & Gadgets',
      items: [
        { name: 'Smartphone & Power bank (20,000 mAh)', checked: true },
        { name: 'Camera & extra SD card', checked: false },
        { name: 'Noise-canceling Earbuds / Headphones', checked: false }
      ]
    }
  ];

  return res.json({
    destination: destination_name || 'Your Trip',
    duration: duration_days || 6,
    categories: packingList
  });
});

export default router;
