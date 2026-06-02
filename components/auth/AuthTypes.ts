export interface AuthPageProps {
  onAuthSuccess: () => void;
  onGuestLogin?: () => void;
}

export type AuthMode = 'login' | 'signup' | 'forgot';
export type SignupStep = 1 | 2 | 3;
