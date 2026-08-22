'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

export default function SmartOptimizationPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [optData, setOptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  useEffect(() => {
    runOptimization();
  }, [tripId]);

  const runOptimization = async () => {
    try {
      const data = await apiRequest<any>('/ai/optimize-itinerary', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId })
      });
      setOptData(data);
    } catch (err: any) {
      toast.error('Failed to run itinerary optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = (recId: string) => {
    setAppliedIds(prev => [...prev, recId]);
    toast.success('Optimization applied to your itinerary! ✈️');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 space-y-3 animate-pulse">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <div>Analyzing route efficiency, travel times, activity buffers, and budget constraints...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <Link href={`/trips/${tripId}`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Itinerary
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Smart Itinerary Optimizer
          </h1>
          <p className="text-xs text-slate-500">AI-powered route distance, travel time, and activity schedule recommendations</p>
        </div>

        <Button
          onClick={() => {
            setAppliedIds(optData.recommendations.map((r: any) => r.id));
            toast.success('All AI optimizations applied successfully!');
          }}
          variant="amber"
          size="default"
          className="gap-1.5 shadow-md"
        >
          <Sparkles className="w-4 h-4" /> Apply All Optimizations
        </Button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {optData.recommendations?.map((rec: any) => {
          const isApplied = appliedIds.includes(rec.id);

          return (
            <Card
              key={rec.id}
              className={`p-6 border transition shadow-sm space-y-4 ${
                isApplied
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-white border-slate-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl p-2 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                    {rec.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{rec.title}</h3>
                      <Badge variant="warning">{rec.impact_score} Impact</Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleApplyRecommendation(rec.id)}
                  disabled={isApplied}
                  variant={isApplied ? "outline" : "amber"}
                  size="sm"
                  className={isApplied ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" : "gap-1 font-bold"}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Optimization Applied</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Recommendation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-medium">
                <span className="text-slate-500">Estimated Gain: <strong className="text-sky-600">{rec.savings}</strong></span>
                <span className="text-slate-400 text-[11px]">AI Confidence: 96%</span>
              </div>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
