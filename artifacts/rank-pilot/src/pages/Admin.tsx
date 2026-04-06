import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare, Send, Loader2, ArrowLeft, RefreshCw, Inbox,
  ShieldOff, Users, LayoutDashboard, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
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

interface UserItem {
  id: number;
  email: string;
  plan: string;
  credits: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalFeedback: number;
}

type Tab = "overview" | "users" | "feedback";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  premium: "bg-purple-100 text-purple-700",
};

export default function Admin() {
  const { authFetch, user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<Tab>("overview");
  const [accessDenied, setAccessDenied] = useState(false);

  /* ── Stats ── */
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* ── Users ── */
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  /* ── Feedback ── */
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  /* ── Load stats on mount ── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await authFetch("/api/admin/stats");
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 403) { setAccessDenied(true); return; }
      if (res.ok) setStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }, [authFetch, navigate]);

  useEffect(() => {
    if (!authLoading && user) fetchStats();
  }, [authLoading, user, fetchStats]);

  /* ── Load users ── */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await authFetch("/api/admin/users");
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 403) { setAccessDenied(true); return; }
      if (res.ok) setUsers(await res.json());
    } finally {
      setUsersLoading(false);
    }
  }, [authFetch, navigate]);

  /* ── Load feedback ── */
  const fetchFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/feedback");
      if (res.status === 401) { navigate("/login"); return; }
      if (res.status === 403) { setAccessDenied(true); return; }
      if (res.ok) setFeedback(await res.json());
      else setError("Failed to load feedback.");
    } catch {
      setError("Network error loading feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }, [authFetch, navigate]);

  /* ── Tab switching triggers load ── */
  useEffect(() => {
    if (accessDenied) return;
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "feedback" && feedback.length === 0) fetchFeedback();
  }, [tab, accessDenied]); // eslint-disable-line

  /* ── Delete user ── */
  async function deleteUser(id: number) {
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        setStats(prev => prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : prev);
      } else {
        alert("Failed to delete user.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  /* ── Send reply ── */
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
      setFeedback(prev => prev.map(item =>
        item.id === id ? { ...item, reply, status: "replied" } : item
      ));
      setReplies(prev => ({ ...prev, [id]: "" }));
    } catch {
      alert("Network error sending reply.");
    } finally {
      setSending(null);
    }
  }

  /* ── Access denied screen ── */
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-10 text-center max-w-md w-full">
          <div className="flex justify-center mb-4">
            <ShieldOff className="w-14 h-14 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6">
            You don't have permission to view this page. Admin access is restricted.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const pendingFeedback = feedback.filter(i => i.status === "pending");
  const repliedFeedback = feedback.filter(i => i.status === "replied");

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Header ── */}
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
            <ShieldOff className="w-5 h-5 text-[#4d44e3]" style={{ transform: "scaleX(-1)" }} />
            <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <button
            onClick={() => {
              fetchStats();
              if (tab === "users") fetchUsers();
              if (tab === "feedback") fetchFeedback();
            }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Always-visible Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Users</p>
            {statsLoading
              ? <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-lg mt-1" />
              : <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
            }
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Feedback</p>
            {statsLoading
              ? <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-lg mt-1" />
              : <p className="text-3xl font-bold text-amber-600">{stats?.totalFeedback ?? 0}</p>
            }
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Replies</p>
            {feedbackLoading && tab !== "feedback"
              ? <div className="h-9 w-16 bg-gray-100 animate-pulse rounded-lg mt-1" />
              : <p className="text-3xl font-bold text-red-500">{pendingFeedback.length}</p>
            }
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([
            { key: "overview", label: "Overview", icon: LayoutDashboard },
            { key: "users", label: "Users", icon: Users },
            { key: "feedback", label: "Feedback", icon: MessageSquare },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════ OVERVIEW TAB ══════════════════════ */}
        {tab === "overview" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <LayoutDashboard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Welcome to the Admin Dashboard</h2>
            <p className="text-sm text-gray-400">
              Use the tabs above to manage users and view/reply to feedback.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
              <button
                onClick={() => setTab("users")}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#4d44e3]/40 hover:bg-[#4d44e3]/5 transition-colors"
              >
                <Users className="w-5 h-5 text-[#4d44e3] mb-2" />
                <p className="text-sm font-semibold text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-400 mt-0.5">{stats?.totalUsers ?? "—"} registered</p>
              </button>
              <button
                onClick={() => setTab("feedback")}
                className="p-4 border border-gray-200 rounded-xl hover:border-[#4d44e3]/40 hover:bg-[#4d44e3]/5 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-[#4d44e3] mb-2" />
                <p className="text-sm font-semibold text-gray-900">Feedback</p>
                <p className="text-xs text-gray-400 mt-0.5">{stats?.totalFeedback ?? "—"} submissions</p>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════ USERS TAB ══════════════════════ */}
        {tab === "users" && (
          <div>
            {usersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#4d44e3] animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Users className="w-14 h-14 text-gray-300 mb-4" />
                <p className="text-lg font-semibold text-gray-400">No users yet</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-5 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4 text-gray-400 font-mono text-xs">#{u.id}</td>
                        <td className="px-5 py-4 font-medium text-gray-900">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{u.credits}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          {confirmDelete === u.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 font-medium">Delete?</span>
                              <button
                                onClick={() => deleteUser(u.id)}
                                disabled={deletingId === u.id}
                                className="text-xs px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                              >
                                {deletingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-xs px-2.5 py-1 border border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-gray-600 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ FEEDBACK TAB ══════════════════════ */}
        {tab === "feedback" && (
          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}
            {feedbackLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#4d44e3] animate-spin" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Inbox className="w-14 h-14 text-gray-300 mb-4" />
                <p className="text-lg font-semibold text-gray-400">No feedback yet</p>
                <p className="text-sm text-gray-400 mt-1">Feedback from users will appear here.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {[...pendingFeedback, ...repliedFeedback].map(item => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                      item.status === "pending" ? "border-amber-200" : "border-gray-200"
                    }`}
                  >
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
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">Message</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.message}</p>
                      </div>
                      {item.reply && (
                        <div className="p-4 bg-[#4d44e3]/5 border border-[#4d44e3]/15 rounded-xl">
                          <p className="text-xs font-medium text-[#4d44e3] uppercase tracking-widest mb-1.5">Your reply</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.reply}</p>
                        </div>
                      )}
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
        )}
      </div>
    </div>
  );
}
