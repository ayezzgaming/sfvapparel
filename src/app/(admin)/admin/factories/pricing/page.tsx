import { redirect } from 'next/navigation';

export default function FactoryPricingRedirect() {
  redirect('/admin/factories?tab=pricing');
}
