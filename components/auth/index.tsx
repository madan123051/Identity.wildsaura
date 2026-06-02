import React from 'react';
import { AuthCtx } from './AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginView } from './LoginView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetSentView } from './ResetSentView';
import { SignupFormView } from './SignupFormView';
import { TermsView } from './TermsView';
import { CreatingAccountView } from './CreatingAccountView';
import type { AuthPageProps } from './AuthTypes';

export function AuthPage(props: AuthPageProps) {
  const auth = useAuth(props);

  return (
    <AuthCtx.Provider value={auth}>
      {auth.resetSent ? (
        <ResetSentView />
      ) : auth.mode === 'forgot' ? (
        <ForgotPasswordView />
      ) : auth.mode === 'signup' && auth.signupStep === 3 ? (
        <CreatingAccountView />
      ) : auth.mode === 'signup' && auth.signupStep === 2 ? (
        <TermsView />
      ) : auth.mode === 'signup' ? (
        <SignupFormView />
      ) : (
        <LoginView />
      )}
    </AuthCtx.Provider>
  );
}
