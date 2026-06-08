"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { db } from "@/lib/firebase";
import { getIdentityProfile, IdentityProfile, VerificationStatus, formatFirebaseDate } from "@/lib/identity";
import { submitVerificationRequest } from "@/lib/verification";
import { uploadDocumentPhoto } from "@/lib/storage";
import { validateReturnUrl } from "@/lib/redirect";

const steps = ["Profile", "Document", "Review"];

const statusStyles: Record<VerificationStatus, string> = {
  not_started: "bg-gray-500/15 border-gray-400/30 text-gray-200",
  pending: "bg-amber-500/15 border-amber-400/30 text-amber-200",
  verified: "bg-emerald-500/15 border-emerald-400/30 text-emerald-200",
  rejected: "bg-red-500/15 border-red-400/30 text-red-200",
};

// Document types that require both front and back photos
const NEEDS_BACK = new Set(["citizenship", "national_id", "driving_license"]);

const DOC_LABELS: Record<string, string> = {
  citizenship: "Citizenship",
  passport: "Passport",
  national_id: "National ID",
  driving_license: "Driving License",
  business_registration: "Business Registration",
  other: "Document",
};

function VerifyContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/dashboard";

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    country: "Nepal",
    phone: "",
    documentType: "citizenship",
    documentNumber: "",
    documentFrontUrl: "",
    documentBackUrl: "",
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
      }));
      setLoading(false);
      // Auto-redirect verified users back to the calling app.
      // Use window.location.href instead of router.push so that a full
      // cross-domain page load is triggered — Next.js router.push is
      // designed for in-app navigation and may not fully reload the
      // destination when the URL points to a different origin.
      if (profile.verificationStatus === "verified") {
        const safeUrl = validateReturnUrl(returnUrl);
        window.location.href = safeUrl;
        return;
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFrontFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setFrontPreview(URL.createObjectURL(file));
    setUploadingFront(true);
    setError("");
    try {
      const url = await uploadDocumentPhoto(user.uid, "front", file);
      updateField("documentFrontUrl", url);
    } catch {
      setError("Failed to upload front photo. Please try again.");
    } finally {
      setUploadingFront(false);
    }
  };

  const handleBackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBackPreview(URL.createObjectURL(file));
    setUploadingBack(true);
    setError("");
    try {
      const url = await uploadDocumentPhoto(user.uid, "back", file);
      updateField("documentBackUrl", url);
    } catch {
      setError("Failed to upload back photo. Please try again.");
    } finally {
      setUploadingBack(false);
    }
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
      if (uploadingFront || uploadingBack) return "Please wait — photos are still uploading.";
      if (!form.documentFrontUrl) return "Please upload the front photo of your document.";
      if (NEEDS_BACK.has(form.documentType) && !form.documentBackUrl)
        return "Please upload the back photo of your document.";
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
        documentFrontUrl: form.documentFrontUrl,
        documentBackUrl: form.documentBackUrl,
        notes: form.notes.trim(),
        email: user.email,
      });
      // After submission the status is "pending" — use window.location.href
      // so the return app gets a full fresh page load and reads the updated
      // Firestore document rather than any stale in-memory state.
      const safeUrl = validateReturnUrl(returnUrl);
      window.location.href = safeUrl;
    } catch (err: any) {
      setError(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = identity?.verificationStatus || "not_started";
  const docLabel = DOC_LABELS[form.documentType] || "Document";
  const needsBack = NEEDS_BACK.has(form.documentType);

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
              Upload clear, well-lit photos of your document. Photos are stored securely and only seen by WildSaura reviewers.
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
                      <input className="input" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Country" required>
                        <input className="input" value={form.country} onChange={(e) => updateField("country", e.target.value)} required />
                      </Field>
                      <Field label="Phone" required>
                        <input className="input" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+977-98XXXXXXXX" required />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <Field label="Document type" required>
                      <select
                        className="input"
                        value={form.documentType}
                        onChange={(e) => {
                          updateField("documentType", e.target.value);
                          // Reset photos if type changes
                          updateField("documentFrontUrl", "");
                          updateField("documentBackUrl", "");
                          setFrontPreview("");
                          setBackPreview("");
                        }}
                        required
                      >
                        <option value="citizenship">Citizenship</option>
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driving_license">Driving license</option>
                        <option value="business_registration">Business registration</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>

                    <Field label="Document or reference number" required>
                      <input className="input" value={form.documentNumber} onChange={(e) => updateField("documentNumber", e.target.value)} required />
                    </Field>

                    {/* Front photo upload */}
                    <div>
                      <p className="text-sm text-gray-300 mb-2">
                        Front of {docLabel} <span className="text-red-400">*</span>
                      </p>
                      <input
                        ref={frontInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFrontFileChange}
                      />
                      {frontPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <img src={frontPreview} alt="Front document preview" className="w-full max-h-48 object-contain" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold"
                            >
                              Change photo
                            </button>
                          </div>
                          {uploadingFront && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <span className="text-sm text-white animate-pulse">Uploading…</span>
                            </div>
                          )}
                          {!uploadingFront && form.documentFrontUrl && (
                            <div className="absolute top-2 right-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-xs text-white font-semibold">
                              ✓ Uploaded
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => frontInputRef.current?.click()}
                          className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 p-8 transition"
                        >
                          <span className="text-3xl">📷</span>
                          <div className="text-left">
                            <p className="font-semibold text-sm">Upload front of {docLabel}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Take a photo or choose from your gallery</p>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Back photo upload (only for applicable document types) */}
                    {needsBack && (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">
                          Back of {docLabel} <span className="text-red-400">*</span>
                        </p>
                        <input
                          ref={backInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleBackFileChange}
                        />
                        {backPreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                            <img src={backPreview} alt="Back document preview" className="w-full max-h-48 object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => backInputRef.current?.click()}
                                className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold"
                              >
                                Change photo
                              </button>
                            </div>
                            {uploadingBack && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="text-sm text-white animate-pulse">Uploading…</span>
                              </div>
                            )}
                            {!uploadingBack && form.documentBackUrl && (
                              <div className="absolute top-2 right-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-xs text-white font-semibold">
                                ✓ Uploaded
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => backInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 p-8 transition"
                          >
                            <span className="text-3xl">📷</span>
                            <div className="text-left">
                              <p className="font-semibold text-sm">Upload back of {docLabel}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Take a photo or choose from your gallery</p>
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    <Field label="Reviewer notes">
                      <textarea
                        className="input min-h-[90px]"
                        value={form.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        placeholder="Optional context for the verification reviewer."
                      />
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 rounded-2xl bg-white/5 p-5 text-sm">
                    <Info label="Full name" value={form.fullName} />
                    <Info label="Country" value={form.country} />
                    <Info label="Phone" value={form.phone} />
                    <Info label="Document type" value={DOC_LABELS[form.documentType] || form.documentType} />
                    <Info label="Document number" value={form.documentNumber} />
                    {form.notes && <Info label="Notes" value={form.notes} />}
                    <div className="pt-2 space-y-3">
                      <p className="text-gray-400">Document photos</p>
                      <div className={`grid gap-3 ${needsBack ? "grid-cols-2" : "grid-cols-1"}`}>
                        {frontPreview && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Front</p>
                            <img src={frontPreview} alt="Front" className="rounded-lg border border-white/10 w-full max-h-32 object-contain bg-white/5" />
                          </div>
                        )}
                        {needsBack && backPreview && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Back</p>
                            <img src={backPreview} alt="Back" className="rounded-lg border border-white/10 w-full max-h-32 object-contain bg-white/5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

                <div className="flex justify-between gap-3 pt-3">
                  <button
                    onClick={() => { setError(""); setStep((current) => Math.max(current - 1, 0)); }}
                    disabled={step === 0 || submitting}
                    className="rounded-xl bg-white/10 px-5 py-3 font-semibold disabled:opacity-50"
                  >
                    Back
                  </button>
                  {step < steps.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={uploadingFront || uploadingBack}
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 font-semibold transition"
                    >
                      {uploadingFront || uploadingBack ? "Uploading…" : "Continue"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-3 font-semibold transition"
                    >
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
