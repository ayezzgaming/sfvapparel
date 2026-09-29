import { redirect } from 'next/navigation';

export default function FactoryDetailRedirect() {
  redirect('/admin/factories');
}
