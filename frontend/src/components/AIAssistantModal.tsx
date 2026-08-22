'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Bot, User, X, ArrowRight } from 'lucide-react';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from './ui/button';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  suggested_actions?: any[];
}

export default function AIAssistantModal({ tripId, isOpen, onClose }: { tripId?: string; isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your GlobeTrotter AI Travel Assistant ✈️. How can I help you plan, optimize, or customize your journey today?'
    }
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Plan a 5-day trip to Rajasthan under ₹25,000.',
    'Suggest top activities in Jaipur.',
    'Make my itinerary less expensive.',
    'Add more adventure activities.',
    'Which city should I visit next?'
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || promptInput;
    if (!text.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setPromptInput('');
    setLoading(true);

    try {
      const res = await apiRequest<{ reply: string; suggested_actions?: any[] }>('/ai/travel-assistant', {
        method: 'POST',
        body: JSON.stringify({ prompt: text, trip_id: tripId })
      });

      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: res.reply, suggested_actions: res.suggested_actions }
      ]);
    } catch (err: any) {
      toast.error(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (act: any) => {
    if (act.action === 'create_trip') {
      try {
        const res = await apiRequest<{ id: string }>('/trips', {
          method: 'POST',
          body: JSON.stringify({
            title: act.data.title || 'AI Recommended Trip',
            description: 'AI Generated multi-city itinerary package.',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            estimated_budget: act.data.budget || 25000,
            initial_cities: act.data.cities || ['city_udaipur', 'city_jodhpur', 'city_jaipur']
          })
        });
        toast.success(`Created trip: ${act.data.title}! Redirecting...`);
        onClose();
        router.push(`/trips/${res.id}/builder`);
      } catch (err: any) {
        toast.error('Failed to create trip from AI recommendation');
      }
    } else {
      toast.success('AI recommendation applied to itinerary!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">GlobeTrotter AI Assistant</h3>
              <p className="text-xs text-sky-600 font-semibold">Smart Context-Aware Travel Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-500 text-white rounded-br-none shadow-md'
                    : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-none whitespace-pre-line'
                }`}
              >
                {m.text}

                {m.suggested_actions && m.suggested_actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200 flex flex-col gap-2">
                    {m.suggested_actions.map((act, aIdx) => (
                      <Button
                        key={aIdx}
                        onClick={() => handleExecuteAction(act)}
                        variant="default"
                        size="sm"
                        className="justify-between text-xs font-bold"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-sky-600 font-semibold animate-pulse py-2">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Analyzing travel context & generating recommendations...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-4 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSend(qp)}
              className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] px-3 py-1.5 rounded-full border border-slate-200 transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI anything about your trip..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="flex-1 bg-slate-100 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !promptInput.trim()}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
