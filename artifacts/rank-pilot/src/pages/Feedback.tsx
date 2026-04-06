import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageSquare, CheckCircle, ArrowLeft, Loader2, Send, User, Reply } from "lucide-react";

interface PublicFeedback {
  id: number;
  name: string;
  message: string;
  reply: string | null;
  status: string;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function Feedback() {
  const [, navigate] = useLocation();

  /* ── Public feed ── */
  const [feedItems, setFeedItems] = useState<PublicFeedback[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  /* ── Submission form ── */
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/feedback/public`.replace(/\/\//g, "/"))
      .then(r => r.json())
      .then(data => { setFeedItems(data); setFeedLoading(false); })
      .catch(() => setFeedLoading(false));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 5) e.message = "Message must be at least 5 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/feedback`.replace(/\/\//g, "/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ form: data.error ?? "Submission failed. Try again." });
        return;
      }
      /* Optimistically prepend to feed */
      setFeedItems(prev => [{
        id: Date.now(),
        name: form.name,
        message: form.message,
        reply: null,
        status: "pending",
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Rankora AI" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900">Rankora <span className="text-[#4d44e3]">AI</span></span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#4d44e3]/10 text-[#4d44e3] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            Community Feedback
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What people are saying</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Share your experience, suggestions, or ideas. We read every message and reply personally.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Submission form (left) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sticky top-24">
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">Thanks for your feedback!</h3>
                  <p className="text-sm text-gray-500 mb-5">Your message is now visible to the community.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-semibold text-[#4d44e3] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#4d44e3]" />
                    Leave your feedback
                  </h2>

                  {errors.form && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {errors.form}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal ml-1">(not shown publicly)</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 ${errors.email ? "border-red-400" : "border-gray-200"}`}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Share your thoughts, suggestions, or issues..."
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 resize-none ${errors.message ? "border-red-400" : "border-gray-200"}`}
                      />
                      {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#4d44e3] hover:bg-[#3d35c3] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Submit Feedback</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* ── Community feed (right) ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900">
                Community Wall
                {!feedLoading && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({feedItems.length})</span>
                )}
              </h2>
            </div>

            {feedLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 text-[#4d44e3] animate-spin" />
              </div>
            ) : feedItems.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No feedback yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              feedItems.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Feedback */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4d44e3]/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#4d44e3]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-gray-900">{item.name}</span>
                          <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin reply */}
                  {item.reply && (
                    <div className="mx-4 mb-4 p-4 bg-[#4d44e3]/5 border border-[#4d44e3]/15 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="w-3.5 h-3.5 text-[#4d44e3]" />
                        <span className="text-xs font-bold text-[#4d44e3] uppercase tracking-wider">Rankora Team</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
