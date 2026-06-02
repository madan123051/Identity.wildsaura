"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { db } from "@/lib/firebase";
import { getIdentityProfile, IdentityProfile, VerificationStatus, formatFirebaseDate } from "@/lib/identity";
import { submitVerificationRequest } from "@/lib/verification";
import { validateReturnUrl } from "@/lib/redirect";

const steps = ["Profile", "Document", "Review"];

const statusStyles: Record<VerificationStatus, string> = {
  not_started: "bg-gray-500/15 border-gray-400/30 text-gray-200",
  pending: "bg-amber-500/15 border-amber-400/30 text-amber-200",
  verified: "bg-emerald-500/15 border-emerald-400/30 text-emerald-200",
  rejected: "bg-red-500/15 border-red-400/30 text-red-200",
};

function VerifyContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/dashboard";

  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    country: "Nepal",
    phone: "",
    documentType: "citizenship",
    documentNumber: "",
    documentUrl: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const profile = await getIdentityProfile(db, user.uid, user);
      if (!alive) return;
      setIdentity(profile);
      setForm((current) => ({
        ...current,
        fullName: profile.displayName || user.displayName || "",
        country: profile.country || "Nepal",
        phone: profile.phone || "",
        documentUrl: profile.documentUrl || "",
      }));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName.trim()) return "Please enter your full legal name.";
      if (!form.country.trim()) return "Please enter your country.";
      if (!form.phone.trim()) return "Please enter your phone number for review contact.";
    }
    if (step === 1) {
      if (!form.documentType) return "Please select a document type.";
      if (!form.documentNumber.trim()) return "Please enter your document or reference number.";
      if (!form.documentUrl.trim()) return "Please provide a secure document URL for review.";
    }
    return "";
  };

  const handleNext = () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitVerificationRequest(db, user.uid, {
        fullName: form.fullName.trim(),
        country: form.country.trim(),
        phone: form.phone.trim(),
        documentType: form.documentType,
        documentNumber: form.documentNumber.trim(),
        documentUrl: form.documentUrl.trim(),
        notes: form.notes.trim(),
        email: user.email,
      });
      router.push(validateReturnUrl(returnUrl));
    } catch (err: any) {
      setError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = identity?.verificationStatus || "not_started";

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-36 lg:pt-28 pb-12 space-y-6">
        <GlassCard>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Verification Zone</p>
              <h1 className="text-3xl font-black mt-2">WildSaura identity verification</h1>
              <p className="text-gray-300 mt-3 max-w-3xl">
                Submit one verification request for the WildSaura ecosystem junction. This request syncs to user, profile, and verification records for admin review.
              </p>
            </div>
            <div className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${statusStyles[status]}`}>
              {status.replace("_", " ")}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-6">
          <GlassCard>
            <h2 className="text-xl font-bold mb-4">Review timeline</h2>
            <div className="space-y-4 text-sm">
              <Info label="Submitted" value={formatFirebaseDate(identity?.submittedAt)} />
              <Info label="Reviewed" value={formatFirebaseDate(identity?.reviewedAt)} />
              <Info label="Email" value={identity?.email || user?.email || "—"} />
              <Info label="UID" value={user?.uid || "—"} />
            </div>
            <div className="mt-6 rounded-xl bg-white/5 p-4 text-sm text-gray-300">
              Use a private, viewable document URL from your trusted storage. Do not submit public posts or unrelated files.
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-8">
              <div className="flex gap-2 mb-3">
                {steps.map((label, index) => (
                  <div key={label} className="flex-1">
                    <div className={`h-2 rounded-full ${index <= step ? "bg-purple-500" : "bg-white/10"}`} />
                    <p className={`text-xs mt-2 ${index === step ? "text-purple-200" : "text-gray-500"}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading your profile...</p>
            ) : (
              <div className="space-y-5">
                {step === 0 && (
                  <div className="space-y-4">
                    <Field label="Full legal name" required>
                      <input className="input" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} required />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Country" required>
                        <input className="input" value={form.country} onChange={(event) => updateField("country", event.target.value)} required />
                      </Field>
                      <Field label="Phone" required>
                        <input className="input" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+977-98XXXXXXXX" required />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <Field label="Document type" required>
                      <select className="input" value={form.documentType} onChange={(event) => updateField("documentType", event.target.value)} required>
                        <option value="citizenship">Citizenship</option>
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driving_license">Driving license</option>
                        <option value="business_registration">Business registration</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Document or reference number" required>
                      <input className="input" value={form.documentNumber} onChange={(event) => updateField("documentNumber", event.target.value)} required />
                    </Field>
                    <Field label="Secure document URL" required>
                      <input className="input" type="url" value={form.documentUrl} onChange={(event) => updateField("documentUrl", event.target.value)} placeholder="https://drive.google.com/..." required />
                    </Field>
                    <Field label="Reviewer notes">
                      <textarea className="input min-h-[110px]" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Optional context for the verification reviewer." />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3 rounded-2xl bg-white/5 p-5 text-sm">
                    <Info label="Full name" value={form.fullName} />
                    <Info label="Country" value={form.country} />
                    <Info label="Phone" value={form.phone} />
                    <Info label="Document type" value={form.documentType.replace("_", " ")} />
                    <Info label="Document number" value={form.documentNumber} />
                    <Info label="Document URL" value={form.documentUrl} />
                    {form.notes && <Info label="Notes" value={form.notes} />}
                  </div>
                )}

                {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

                <div className="flex justify-between gap-3 pt-3">
                  <button onClick={() => { setError(""); setStep((current) => Math.max(current - 1, 0)); }} disabled={step === 0 || submitting} className="rounded-xl bg-white/10 px-5 py-3 font-semibold disabled:opacity-50">
                    Back
                  </button>
                  {step < steps.length - 1 ? (
                    <button onClick={handleNext} className="rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-3 font-semibold transition">
                      Continue
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-3 font-semibold transition">
                      {submitting ? "Submitting..." : "Submit for review"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading verification...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-300">{label}{required ? " *" : ""}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100 font-medium break-all sm:text-right">{value || "—"}</span>
    </div>
  );
}
