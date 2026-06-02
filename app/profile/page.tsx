"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/authContext";
import { db } from "@/lib/firebase";
import { IdentityProfile, ensureIdentityRecordsForAuthUser, getIdentityProfile } from "@/lib/identity";
import { useEffect, useState } from "react";

const provinces = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    address: "",
    province: "",
    country: "Nepal",
    dateOfBirth: "",
    gender: "",
    photoURL: "",
  });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const profile = await getIdentityProfile(db, user.uid, user);
      if (!alive) return;
      setIdentity(profile);
      setForm({
        displayName: profile.displayName || user.displayName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        province: profile.province || "",
        country: profile.country || "Nepal",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        photoURL: profile.photoURL || user.photoURL || "",
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await ensureIdentityRecordsForAuthUser(db, user, {
        ...identity,
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        province: form.province,
        country: form.country.trim() || "Nepal",
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        photoURL: form.photoURL.trim(),
        termsAccepted: true,
      });
      setIdentity(updated);
      setMessage("Profile saved successfully. Your identity dashboard is now updated.");
    } catch (error: any) {
      setMessage(error?.message || "Profile save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-36 lg:pt-28 pb-12 space-y-6">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200">WildSaura Profile</p>
          <h1 className="text-3xl font-black mt-2">Manage your ecosystem identity</h1>
          <p className="text-gray-300 mt-3 max-w-3xl">
            Keep this profile accurate because it is reused by WildSaura verification, connected apps, marketplace trust, and creator/community access.
          </p>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6">
          <GlassCard>
            <div className="flex flex-col items-center text-center">
              <img
                src={form.photoURL || "https://api.dicebear.com/8.x/initials/svg?seed=WildSaura"}
                alt="Profile preview"
                className="w-28 h-28 rounded-3xl border border-purple-300/40 object-cover bg-white/10"
              />
              <h2 className="text-2xl font-bold mt-4">{form.displayName || user?.email || "WildSaura User"}</h2>
              <p className="text-gray-400 text-sm mt-1">{identity?.username ? `@${identity.username}` : "Username is set during onboarding"}</p>
              <div className="mt-5 w-full rounded-xl bg-white/5 p-4 text-left text-sm space-y-3">
                <Info label="Email" value={identity?.email || user?.email || "—"} />
                <Info label="Verification" value={identity?.verificationStatus || "not_started"} />
                <Info label="Source" value={identity?.source || "auth"} />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-bold mb-5">Profile details</h2>
            {loading ? (
              <p className="text-gray-400">Loading profile...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <Field label="Full name" required>
                  <input className="input" value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} required />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Phone">
                    <input className="input" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+977-98XXXXXXXX" />
                  </Field>
                  <Field label="Gender">
                    <select className="input" value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Date of birth">
                    <input className="input" type="date" value={form.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} />
                  </Field>
                  <Field label="Province">
                    <select className="input" value={form.province} onChange={(event) => updateField("province", event.target.value)}>
                      <option value="">Select province</option>
                      {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Address">
                  <input className="input" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="City, district, or full address" />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Country">
                    <input className="input" value={form.country} onChange={(event) => updateField("country", event.target.value)} />
                  </Field>
                  <Field label="Avatar URL">
                    <input className="input" type="url" value={form.photoURL} onChange={(event) => updateField("photoURL", event.target.value)} placeholder="https://..." />
                  </Field>
                </div>
                {message && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200">{message}</div>}
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-5 py-3 font-semibold transition">
                  {saving ? "Saving profile..." : "Save WildSaura profile"}
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </main>
    </ProtectedRoute>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-100 text-right break-all">{value || "—"}</span>
    </div>
  );
}
