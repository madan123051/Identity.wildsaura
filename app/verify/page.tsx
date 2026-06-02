"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { validateReturnUrl } from "@/lib/redirect";

const STEPS = ["Personal Details", "Country", "Upload Document", "Review"];

function VerifyContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/dashboard";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "",
    country: "",
    documentUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: form.fullName,
        verificationStatus: "pending",
        verified: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const verifRef = doc(db, "verifications", user.uid);
      await setDoc(verifRef, {
        uid: user.uid,
        fullName: form.fullName,
        country: form.country,
        documentUrl: form.documentUrl,
        status: "pending",
        submittedAt: serverTimestamp(),
        reviewedAt: null,
      });

      const safeUrl = validateReturnUrl(returnUrl);
      window.location.href = safeUrl;
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-2xl mx-auto p-4 pt-24">
        <GlassCard>
          <h1 className="text-2xl font-bold mb-4">Verification</h1>
          <div className="flex gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  i <= step ? "bg-purple-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-300">Full Name</span>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mt-1 outline-none focus:border-purple-500"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </label>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-300">Country</span>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mt-1 outline-none focus:border-purple-500"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-300">Document URL (ID/Passport)</span>
                <input
                  type="url"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 mt-1 outline-none focus:border-purple-500"
                  value={form.documentUrl}
                  onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </label>
            </div>
          )}
          {step === 3 && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p><span className="text-gray-400">Name:</span> {form.fullName}</p>
              <p><span className="text-gray-400">Country:</span> {form.country}</p>
              <p>
                <span className="text-gray-400">Document:</span>{" "}
                <a href={form.documentUrl} className="text-purple-400 underline" target="_blank">
                  View Upload
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg bg-gray-800 disabled:opacity-50"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Verification"}
              </button>
            )}
          </div>
        </GlassCard>
      </main>
    </ProtectedRoute>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
