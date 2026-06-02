import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, getDb } from '../../../lib/firebaseClient';
import { claimReferral } from '../../../lib/referral';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { isValidUsername, calculateAge, getMaxDobDate } from '../authUtils';
import type { AuthPageProps, AuthMode, SignupStep } from '../AuthTypes';

export function useAuth({ onAuthSuccess, onGuestLogin }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>(1);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');

  const [pendingReferralCode, setPendingReferralCode] = useState('');
  const [termsRead, setTermsRead] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState('');
  const [googleUser, setGoogleUser] = useState<any>(null);

  const maxDobDate = getMaxDobDate();

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('code') || '';
    if (refCode) localStorage.setItem('drishya_pending_ref', refCode.toUpperCase());
    setPendingReferralCode(localStorage.getItem('drishya_pending_ref') || '');
  }, []);

  // Check username availability (debounced)
  useEffect(() => {
    if (!username || !isValidUsername(username)) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const db = getDb();
        if (!db) return;
        const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        setUsernameAvailable(!snap.exists());
      } catch { setUsernameAvailable(null); }
      finally { setUsernameChecking(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Auto-suggest username from name
  useEffect(() => {
    if (fullName && !username) {
      const suggested = fullName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').slice(0, 15);
      if (suggested.length >= 3) setUsername(suggested);
    }
  }, [fullName]);

  const handleTermsScroll = useCallback(() => {
    if (!termsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) setTermsRead(true);
  }, []);

  const prefillFromProfile = (profileData: any, user: any) => {
    if (profileData.display_name) setFullName(profileData.display_name);
    if (profileData.username) setUsername(profileData.username);
    if (profileData.phone) setPhone(profileData.phone);
    if (profileData.address) setAddress(profileData.address);
    if (profileData.province) setProvince(profileData.province);
    if (profileData.date_of_birth) setDateOfBirth(profileData.date_of_birth);
    if (profileData.gender) setGender(profileData.gender);
    if (profileData.email) setSignupEmail(profileData.email);
    setGoogleUser(user);
    setMode('signup');
    setSignupStep(1);
  };

  const createProfile = async (uid: string, data: {
    email: string; displayName: string; username: string; phone: string;
    address: string; province: string; dateOfBirth: string; gender: string; photoURL?: string;
  }) => {
    const db = getDb();
    if (!db) return;
    const age = calculateAge(data.dateOfBirth);
    await setDoc(doc(db, 'usernames', data.username.toLowerCase()), { uid, created_at: serverTimestamp() });
    const profileRef = doc(db, 'profiles', uid);
    const existingSnap = await getDoc(profileRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    await setDoc(profileRef, {
      ...existingData,
      id: uid,
      username: data.username.toLowerCase(),
      display_name: data.displayName,
      avatar_url: data.photoURL || existingData.avatar_url || '',
      bio: existingData.bio || '',
      title: existingData.title || '',
      website: existingData.website || '',
      country: 'Nepal',
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      province: data.province,
      date_of_birth: data.dateOfBirth,
      age,
      role: existingData.role || 'user',
      guardian_points: existingData.guardian_points || 0,
      guardian_level: existingData.guardian_level || 'explorer',
      eco_tags_count: existingData.eco_tags_count || 0,
      cleanup_posts_count: existingData.cleanup_posts_count || 0,
      portfolio_track_url: existingData.portfolio_track_url || '',
      portfolio_track_name: existingData.portfolio_track_name || '',
      is_verified: existingData.is_verified || false,
      verified_at: existingData.verified_at || null,
      verification_badge: existingData.verification_badge || 'none',
      verification_status: existingData.verification_status || 'none',
      id_proof_url: existingData.id_proof_url || null,
      wallet_balance: existingData.wallet_balance || 0,
      esewa_number: existingData.esewa_number || null,
      total_photos_sold: existingData.total_photos_sold || 0,
      seller_rating: existingData.seller_rating || null,
      total_sales: existingData.total_sales || 0,
      total_reviews: existingData.total_reviews || 0,
      market_mode: existingData.market_mode || false,
      terms_accepted: true,
      terms_accepted_at: serverTimestamp(),
      created_at: existingData.created_at || serverTimestamp(),
    });
  };

  const validateSignupForm = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2) return 'कृपया आफ्नो पूरा नाम लेख्नुहोस् (Please enter your full name)';
    if (!dateOfBirth) return 'कृपया जन्म मिति चयन गर्नुहोस् (Please select your date of birth)';
    const age = calculateAge(dateOfBirth);
    if (age < 16) return 'तपाईं कम्तीमा १६ वर्षको हुनुपर्छ (You must be at least 16 years old)';
    if (age > 120) return 'कृपया सही जन्म मिति हाल्नुहोस् (Please enter a valid date of birth)';
    if (!phone.trim() || phone.trim().length < 10) return 'कृपया आफ्नो फोन नम्बर लेख्नुहोस् (Please enter a valid phone number)';
    if (!address.trim()) return 'कृपया आफ्नो ठेगाना लेख्नुहोस् (Please enter your address)';
    if (!province) return 'कृपया प्रदेश चयन गर्नुहोस् (Please select your province)';
    if (!username || !isValidUsername(username)) return 'Username must be 3-20 characters (lowercase letters, numbers, underscore only)';
    if (usernameAvailable === false) return 'यो username पहिले नै लिइसकेको छ (This username is already taken)';
    if (!gender) return 'कृपया लिंग चयन गर्नुहोस् (Please select your gender)';
    if (!googleUser) {
      if (!signupEmail.trim()) return 'कृपया Gmail/Email लेख्नुहोस् (Please enter your email)';
      if (!signupPassword || signupPassword.length < 6) return 'Password कम्तीमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)';
      if (signupPassword !== confirmPassword) return 'Password मेल खाएन (Passwords do not match)';
    }
    return null;
  };

  const handleNextToTerms = () => {
    const err = validateSignupForm();
    if (err) { setError(err); return; }
    setError('');
    setSignupStep(2);
  };

  const handleAcceptAndCreate = async () => {
    if (!termsAccepted || !ageConfirmed) {
      setError('कृपया सबै सर्तहरू स्वीकार गर्नुहोस् (Please accept all terms)');
      return;
    }
    setError('');
    setLoading(true);
    setSignupStep(3);
    try {
      const auth = getAuth();
      const db = getDb();
      if (!auth || !db) throw new Error('Firebase connecting... Please try again.');
      let uid: string;
      let email: string;
      let photoURL = '';
      if (googleUser) {
        uid = googleUser.uid;
        email = googleUser.email || signupEmail;
        photoURL = googleUser.photoURL || '';
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
        uid = user.uid;
        email = signupEmail;
      }
      await createProfile(uid, {
        email, displayName: fullName.trim(), username: username.toLowerCase(),
        phone: phone.trim(), address: address.trim(), province, dateOfBirth, gender, photoURL,
      });
      try {
        const db2 = getDb();
        const refCode = localStorage.getItem('drishya_pending_ref') || pendingReferralCode;
        if (refCode && db2) {
          await claimReferral(refCode, uid, db2);
          localStorage.removeItem('drishya_pending_ref');
        }
      } catch { /* non-fatal */ }
      onAuthSuccess();
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      if (msg.includes('email-already-in-use')) {
        setError('यो email मा पहिले नै खाता छ (An account with this email already exists)');
      } else {
        setError(msg);
      }
      setSignupStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const auth = getAuth();
    if (!auth) { setError('Firebase connecting...'); return; }
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const db = getDb();
      if (db) {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          if (profileData.terms_accepted === true) { onAuthSuccess(); return; }
          prefillFromProfile(profileData, user);
          setError('कृपया पहिले दर्ता फारम पूरा गर्नुहोस् (Please complete registration first)');
          return;
        }
      }
      setGoogleUser(user);
      setSignupEmail(user.email || '');
      if (user.displayName) setFullName(user.displayName);
      setMode('signup');
      setSignupStep(1);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    if (!auth) { setError('Firebase connecting...'); return; }
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const db = getDb();
      if (db) {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          if (profileData.terms_accepted !== true) {
            prefillFromProfile(profileData, user);
            setSignupEmail(loginEmail);
            setError('कृपया पहिले दर्ता फारम पूरा गर्नुहोस् (Please complete registration first)');
            setLoading(false);
            return;
          }
        } else {
          setGoogleUser({ uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL });
          setSignupEmail(loginEmail);
          if (user.displayName) setFullName(user.displayName);
          setMode('signup');
          setSignupStep(1);
          setError('कृपया पहिले दर्ता फारम भर्नुहोस् (Please complete the registration form)');
          setLoading(false);
          return;
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('गलत email वा password (Invalid email or password)');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    if (!auth) { setError('Firebase connecting...'); return; }
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setGoogleUser(user);
      setSignupEmail(user.email || '');
      if (user.displayName) setFullName(user.displayName);
      onAuthSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    if (!auth) { setError('Firebase connecting...'); return; }
    if (!loginEmail.trim()) { setError('Please enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setResetSent(loginEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return {
    mode, setMode,
    signupStep, setSignupStep,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    fullName, setFullName,
    dateOfBirth, setDateOfBirth,
    phone, setPhone,
    address, setAddress,
    province, setProvince,
    signupEmail, setSignupEmail,
    signupPassword, setSignupPassword,
    confirmPassword, setConfirmPassword,
    username, setUsername,
    gender, setGender,
    termsRead,
    termsAccepted, setTermsAccepted,
    ageConfirmed, setAgeConfirmed,
    termsRef,
    error, setError,
    loading,
    googleLoading,
    usernameAvailable,
    usernameChecking,
    showPassword, setShowPassword,
    resetSent,
    googleUser, setGoogleUser,
    maxDobDate,
    onGuestLogin,
    handleTermsScroll,
    handleNextToTerms,
    handleAcceptAndCreate,
    handleGoogleSignup,
    handleLogin,
    handleGoogleLogin,
    handleForgotPassword,
  };
}
