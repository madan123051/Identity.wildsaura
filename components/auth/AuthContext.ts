import { createContext, useContext } from 'react';
import type { AuthMode, SignupStep } from './AuthTypes';

export interface AuthCtxValue {
  // mode
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  signupStep: SignupStep;
  setSignupStep: (s: SignupStep) => void;
  // login fields
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  // signup fields
  fullName: string;
  setFullName: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  signupEmail: string;
  setSignupEmail: (v: string) => void;
  signupPassword: string;
  setSignupPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  // terms
  termsRead: boolean;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  ageConfirmed: boolean;
  setAgeConfirmed: (v: boolean) => void;
  termsRef: React.RefObject<HTMLDivElement>;
  // status
  error: string;
  setError: (v: string) => void;
  loading: boolean;
  googleLoading: boolean;
  usernameAvailable: boolean | null;
  usernameChecking: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  resetSent: string;
  googleUser: any;
  setGoogleUser: (v: any) => void;
  maxDobDate: string;
  onGuestLogin?: () => void;
  // handlers
  handleTermsScroll: () => void;
  handleNextToTerms: () => void;
  handleAcceptAndCreate: () => Promise<void>;
  handleGoogleSignup: () => Promise<void>;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
}

import React from 'react';
export const AuthCtx = createContext<AuthCtxValue | null>(null);

export function useAuthCtx(): AuthCtxValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuthCtx must be used inside AuthCtx.Provider');
  return ctx;
}
