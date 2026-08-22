'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await apiRequest<any[]>('/templates');
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string, title: string) => {
    try {
      const res = await apiRequest<{ tripId: string }>(`/templates/${templateId}/use`, { method: 'POST' });
      toast.success(`Created new trip from ${title}!`);
      router.push(`/trips/${res.tripId}/builder`);
    } catch (err: any) {
      toast.error('Failed to create trip from template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-500" /> Curated Trip Templates
        </h1>
        <p className="text-xs text-slate-500">Pre-built travel packages with optimized city routes, activities, and budget targets</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-slate-100 border border-slate-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:border-amber-400 transition duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={tpl.cover_image} alt={tpl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-amber-700 font-bold border border-slate-200 px-3 py-1 rounded-full text-xs shadow-sm">
                  {tpl.category}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-xl">{tpl.title}</h3>
                  <div className="text-xs text-slate-200">{tpl.duration_days} Days • Target Budget: ₹{tpl.estimated_budget?.toLocaleString()}</div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>

                {tpl.template_data?.highlights && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Key Highlights</div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.template_data.highlights.map((hl: string, hIdx: number) => (
                        <span key={hIdx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                          {hl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleUseTemplate(tpl.id, tpl.title)}
                  variant="amber"
                  size="default"
                  className="w-full gap-2 font-extrabold shadow-md"
                >
                  <span>Use Template & Build Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
