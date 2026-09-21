import React from 'react';
import { Metadata } from 'next';
import PolicyPageView from '@/components/public/PolicyPageView';

export const metadata: Metadata = {
  title: 'Polisi Penghantaran | SFV APPAREL',
  description: 'Tempoh siap pengeluaran kilang dan polisi penghantaran kurier SFV Apparel.',
};

export default function ShipingPolicyPage() {
  return <PolicyPageView policyKey="shipping" />;
}
