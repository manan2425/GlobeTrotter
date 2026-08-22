'use client';

import React, { useState } from 'react';
import { Share2, Globe, Lock, Users, Copy, Check, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from './ui/button';

export default function ShareModal({
  tripId,
  currentVisibility,
  publicSlug,
  isOpen,
  onClose
}: {
  tripId: string;
  currentVisibility: string;
  publicSlug?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [visibility, setVisibility] = useState(currentVisibility || 'Private');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `http://localhost:3000/public/trips/${publicSlug || 'rajasthan-adventure'}`;

  const handleSaveVisibility = async (newVis: string) => {
    setVisibility(newVis);
    setLoading(true);
    try {
      await apiRequest(`/trips/${tripId}/share`, {
        method: 'POST',
        body: JSON.stringify({ visibility: newVis })
      });
      toast.success(`Trip updated to ${newVis}`);
    } catch (err: any) {
      toast.error('Failed to update trip sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Public trip link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Share2 className="w-5 h-5 text-sky-500" /> Share & Privacy Settings
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Selector Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSaveVisibility('Private')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
              visibility === 'Private'
                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Private</span>
          </button>

          <button
            onClick={() => handleSaveVisibility('Friends')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
              visibility === 'Friends'
                ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </button>

          <button
            onClick={() => handleSaveVisibility('Public')}
            className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
              visibility === 'Public'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Public</span>
          </button>
        </div>

        {/* Public Link Box */}
        {visibility === 'Public' ? (
          <div className="space-y-2">
            <label className="text-xs text-slate-500 font-semibold">Public Itinerary URL</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-transparent text-xs text-slate-800 outline-none truncate"
              />
              <Button onClick={handleCopy} variant="default" size="sm" className="gap-1 shrink-0">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Anyone with this link can view your itinerary and copy it to their account.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
            Trip is currently {visibility.toLowerCase()}. Change to Public to generate a shareable link.
          </div>
        )}

      </div>
    </div>
  );
}
