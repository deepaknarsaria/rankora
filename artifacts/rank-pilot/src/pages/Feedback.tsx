import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function Feedback() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          {submitted ? (
            /* ── Success state ── */
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanks for your feedback!</h2>
              <p className="text-gray-500 mb-6">
                We've received your message and will get back to you if needed.
              </p>
              <button
                onClick={() => { setSubmitted(false); navigate("/"); }}
                className="px-6 py-2.5 bg-[#4d44e3] hover:bg-[#3d35c3] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Back to Home
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#4d44e3]/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-[#4d44e3]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">💬 We value your feedback</h1>
              </div>
              <p className="text-gray-500 text-sm mb-8">
                Share your thoughts, suggestions, or issues. We read everything.
              </p>

              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 ${errors.name ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 ${errors.email ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us what's on your mind..."
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm outline-none transition-colors focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/10 resize-none ${errors.message ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#4d44e3] hover:bg-[#3d35c3] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
