import React from 'react';
import { Metadata } from 'next';
import PolicyPageView from '@/components/public/PolicyPageView';

export const metadata: Metadata = {
  title: 'Polisi Privasi | SFV APPAREL',
  description: 'Dasar privasi dan perlindungan data peribadi pelanggan SFV Apparel.',
};

export default function PrivacyPolicyPage() {
  return <PolicyPageView policyKey="privacy" />;
}
