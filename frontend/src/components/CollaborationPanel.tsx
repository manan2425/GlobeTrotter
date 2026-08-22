'use client';

import React, { useState } from 'react';
import { Users, UserPlus, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-6 shadow-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-500" /> Trip Collaboration & Discussion
        </h3>
        <Badge variant="default">
          {members.length} Collaborator{members.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Members Avatars List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700">Trip Members</div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold"
            >
              <img
                src={m.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={m.email}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-slate-800">{m.full_name || m.email}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${m.role === 'Owner' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Form */}
      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          placeholder="Invite friend by email..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none font-semibold"
        >
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>
        <Button type="submit" disabled={loading || !inviteEmail.trim()} variant="default" size="sm" className="gap-1 shrink-0">
          <UserPlus className="w-3.5 h-3.5" /> Invite
        </Button>
      </form>

      {/* Discussion Thread */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Discussion Thread ({comments.length})
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs">No comments yet. Start the conversation!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.full_name}</span>
                  <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-700">{c.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment or question..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <Button type="submit" disabled={!commentText.trim()} variant="secondary" size="sm" className="gap-1">
            <Send className="w-3.5 h-3.5" /> Post
          </Button>
        </form>
      </div>

    </div>
  );
}
