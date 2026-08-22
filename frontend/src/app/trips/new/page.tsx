'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function CreateTripPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]);
  const [estimatedBudget, setEstimatedBudget] = useState('30000');
  const [currency, setCurrency] = useState('INR');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80');
  const [loading, setLoading] = useState(false);

  const presetImages = [
    { title: 'Rajasthan Heritage', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Udaipur Lakes', url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Goa Beaches', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Tokyo Metropolis', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Paris City Lights', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) {
      toast.error('Please enter a trip name and valid travel dates');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{ id: string }>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          start_date: startDate,
          end_date: endDate,
          estimated_budget: Number(estimatedBudget) || 0,
          currency,
          cover_image: coverImage,
          initial_cities: ['city_amd', 'city_udaipur', 'city_jodhpur', 'city_jaipur']
        })
      });

      toast.success('Trip created successfully! Redirecting to Itinerary Builder ✈️');
      router.push(`/trips/${res.id}/builder`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Badge variant="default">Step 1 of 2: Trip Parameters</Badge>
      </div>

      <Card className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-500" /> Plan New Travel Journey
          </h1>
          <p className="text-xs text-slate-500">Set your trip dates, estimated budget, and initial parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Trip Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rajasthan Adventure, Goa Sun & Sand, Tokyo Trail"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Trip Description & Notes</label>
            <textarea
              rows={2}
              placeholder="Brief summary of your travel plans, companion details, or goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Total Budget</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  placeholder="30000"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 focus:outline-none font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none font-semibold"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AED">AED (AED)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Trip Cover Photo</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {presetImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setCoverImage(img.url)}
                  className={`h-20 rounded-2xl overflow-hidden cursor-pointer border-2 transition relative ${
                    coverImage === img.url ? 'border-sky-500 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-slate-900/80 text-white p-0.5 rounded text-center truncate font-semibold">
                    {img.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            size="lg"
            className="w-full gap-2 font-extrabold shadow-md"
          >
            <span>{loading ? 'Creating Trip...' : 'Proceed to Itinerary Builder'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

        </form>

      </Card>
    </div>
  );
}
