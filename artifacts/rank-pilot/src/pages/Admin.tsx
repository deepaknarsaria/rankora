import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { MessageSquare, Send, Loader2, ArrowLeft, RefreshCw, Inbox } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackItem {
  id: number;
  name: string;
  email: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
}

export default function Admin() {
  const { authFetch, user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/feedback");
      if (!res.ok) { setError("Failed to load feedback."); return; }
      const data = await res.json();
      setItems(data);
    } catch {
      setError("Network error loading feedback.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
    if (!authLoading && user) fetchFeedback();
  }, [authLoading, user, navigate, fetchFeedback]);

  async function sendReply(id: number) {
    const reply = replies[id]?.trim();
    if (!reply) return;
    setSending(id);
    try {
      const res = await authFetch("/api/feedback/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply }),
      });
      if (!res.ok) { alert("Failed to send reply."); return; }
      setSent(prev => new Set(prev).add(id));
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, reply, status: "replied" } : item
      ));
      setReplies(prev => ({ ...prev, [id]: "" }));
    } catch {
      alert("Network error sending reply.");
    } finally {
      setSending(null);
    }
  }

  const pending = items.filter(i => i.status === "pending");
  const replied = items.filter(i => i.status === "replied");

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#4d44e3]" />
            <h1 className="font-bold text-gray-900">Feedback Admin</h1>
          </div>
          <button
            onClick={fetchFeedback}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: items.length, color: "text-gray-900" },
            { label: "Pending", value: pending.length, color: "text-amber-600" },
            { label: "Replied", value: replied.length, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4d44e3] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="w-14 h-14 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-400">No feedback yet</p>
            <p className="text-sm text-gray-400 mt-1">Feedback from users will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Pending first */}
            {[...pending, ...replied].map(item => (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                  item.status === "pending" ? "border-amber-200" : "border-gray-200"
                }`}
              >
                {/* Item header */}
                <div className={`px-6 py-4 flex items-start justify-between gap-4 ${
                  item.status === "pending" ? "bg-amber-50/60" : "bg-gray-50/60"
                }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-500">{item.email}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {item.status === "pending" ? "Pending" : "Replied"}
                  </span>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Message */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">Message</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.message}</p>
                  </div>

                  {/* Existing reply */}
                  {item.reply && (
                    <div className="p-4 bg-[#4d44e3]/5 border border-[#4d44e3]/15 rounded-xl">
                      <p className="text-xs font-medium text-[#4d44e3] uppercase tracking-widest mb-1.5">Your reply</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.reply}</p>
                    </div>
                  )}

                  {/* Reply box */}
                  {sent.has(item.id) ? (
                    <p className="text-sm text-green-600 font-medium">✓ Reply sent successfully</p>
                  ) : (
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={replies[item.id] ?? ""}
                        onChange={e => setReplies(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder={item.reply ? "Send another reply..." : "Write a reply..."}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 resize-none transition-colors"
                      />
                      <button
                        onClick={() => sendReply(item.id)}
                        disabled={!replies[item.id]?.trim() || sending === item.id}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#4d44e3] hover:bg-[#3d35c3] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors self-end"
                      >
                        {sending === item.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Send className="w-4 h-4" />
                        }
                        {sending === item.id ? "" : "Reply"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
