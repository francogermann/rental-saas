import { redirect } from 'next/navigation';

export default function Home() {
  // Simplest UX: redirect directly to the main storefront catalog
  redirect('/catalog');
}
