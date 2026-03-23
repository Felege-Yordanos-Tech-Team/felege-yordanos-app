import { redirect } from 'next/navigation';

export default function LandingPage() {
  // Unauthenticated users see the songbook.
  // Authenticated users will be handled by middleware.
  redirect('/songbook');
}
