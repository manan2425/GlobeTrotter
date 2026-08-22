'use client';

import React, { useState } from 'react';
import { Users, UserPlus, MessageSquare, Send, Crown, Shield, Eye } from 'lucide-react';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function CollaborationPanel({
  tripId,
  members = [],
  comments = [],
  onRefresh
}: {
  tripId: string;
  members: any[];
  comments: any[];
  onRefresh: () => void;
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      await apiRequest(`/trips/${tripId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail('');
      setShowInviteForm(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await apiRequest(`/trips/${tripId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() })
      });
      setCommentText('');
      onRefresh();
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-5 shadow-sm overflow-hidden min-w-0 w-full">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="truncate">Trip Members & Discussion</span>
        </h3>
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          {members.length} {members.length === 1 ? 'Collaborator' : 'Collaborators'}
        </Badge>
      </div>

      {/* Trip Members Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
            Trip Co-Travelers ({members.length})
          </div>
          <button
            type="button"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="text-xs text-sky-600 hover:text-sky-700 font-extrabold flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-full transition shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showInviteForm ? 'Cancel' : '+ Invite Member'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs max-w-full"
            >
              <img
                src={m.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={m.email}
                className="w-4 h-4 rounded-full object-cover ring-1 ring-white shrink-0"
              />
              <span className="text-slate-800 text-[11px] truncate font-bold">{m.full_name || m.email}</span>
              
              {m.role === 'Owner' ? (
                <span className="inline-flex items-center gap-0.5 bg-amber-100/90 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                  <Crown className="w-2.5 h-2.5 text-amber-600" /> OWNER
                </span>
              ) : m.role === 'Editor' ? (
                <span className="inline-flex items-center gap-0.5 bg-sky-100/90 text-sky-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-sky-200 shrink-0">
                  <Shield className="w-2.5 h-2.5 text-sky-600" /> EDITOR
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 bg-slate-200/80 text-slate-700 text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                  <Eye className="w-2.5 h-2.5 text-slate-500" /> VIEWER
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conditionally Rendered Invite Form Input Box */}
      {showInviteForm && (
        <form onSubmit={handleInvite} className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5 min-w-0 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Invite Co-Traveler by Email</span>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
            >
              ✕ Cancel
            </button>
          </div>

          <input
            type="email"
            required
            placeholder="Enter friend's email address..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none font-medium transition"
          />

          <div className="flex items-center gap-2">
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none font-bold focus:border-sky-500 cursor-pointer min-w-0"
            >
              <option value="Editor">Editor (Can edit)</option>
              <option value="Viewer">Viewer (Read-only)</option>
            </select>
            <Button
              type="submit"
              disabled={loading || !inviteEmail.trim()}
              variant="default"
              size="sm"
              className="px-4 py-2 gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" /> Send Invite
            </Button>
          </div>
        </form>
      )}

      {/* Discussion Thread */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 min-w-0">
        <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 truncate">
            <MessageSquare className="w-3.5 h-3.5 text-sky-500 shrink-0" /> Discussion Thread ({comments.length})
          </span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <div className="text-center py-5 px-3 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs text-slate-400 font-medium">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1 hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{c.full_name || 'Traveler'}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Post Form */}
        <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-1 min-w-0">
          <input
            type="text"
            placeholder="Write a comment or question..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none font-medium transition"
          />
          <Button
            type="submit"
            disabled={!commentText.trim()}
            variant="default"
            size="sm"
            className="px-3.5 py-2 gap-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </Button>
        </form>
      </div>

    </div>
  );
}


