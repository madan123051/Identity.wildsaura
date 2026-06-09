import { redirect } from 'next/navigation';

// Directly go to login — no landing page needed
export default function HomePage() {
  redirect('/login');
}
