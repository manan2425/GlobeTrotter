'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, X, Sparkles, Luggage } from 'lucide-react';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from './ui/button';

export default function PackingListModal({
  tripId,
  destinationName,
  durationDays,
  isOpen,
  onClose
}: {
  tripId: string;
  destinationName?: string;
  durationDays?: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCat, setSelectedCat] = useState('Clothing & Footwear');

  useEffect(() => {
    if (isOpen) {
      fetchPackingList();
    }
  }, [isOpen]);

  const fetchPackingList = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ categories: any[] }>('/ai/packing-list', {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId, destination_name: destinationName, duration_days: durationDays })
      });
      setCategories(res.categories);
    } catch (err: any) {
      toast.error('Failed to load packing list');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleItem = (catIdx: number, itemIdx: number) => {
    setCategories(prev => {
      const copy = [...prev];
      copy[catIdx].items[itemIdx].checked = !copy[catIdx].items[itemIdx].checked;
      return copy;
    });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setCategories(prev => {
      const copy = [...prev];
      const target = copy.find(c => c.category === selectedCat) || copy[0];
      target.items.push({ name: newItemText.trim(), checked: false });
      return copy;
    });
    setNewItemText('');
    toast.success('Custom item added');
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    setCategories(prev => {
      const copy = [...prev];
      copy[catIdx].items.splice(itemIdx, 1);
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Packing Checklist</h3>
              <p className="text-xs text-slate-500">Tailored for {destinationName || 'Rajasthan'} ({durationDays || 6} Days)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" /> Generating packing checklist...
            </div>
          ) : (
            categories.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 flex items-center justify-between">
                  <span>{cat.category}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {cat.items.filter((i: any) => i.checked).length} / {cat.items.length} packed
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item: any, iIdx: number) => (
                    <div
                      key={iIdx}
                      onClick={() => toggleItem(cIdx, iIdx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        item.checked
                          ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          : 'bg-slate-50/80 border-slate-200 text-slate-800 hover:border-amber-400/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold">{item.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(cIdx, iIdx);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 opacity-0 hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Add custom item form */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            >
              {categories.map((c, i) => (
                <option key={i} value={c.category}>{c.category}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Add custom packing item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            />
            <Button onClick={addItem} variant="amber" size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
