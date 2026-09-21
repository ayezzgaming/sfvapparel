import React from 'react';
import { Metadata } from 'next';
import PolicyPageView from '@/components/public/PolicyPageView';

export const metadata: Metadata = {
  title: 'Polisi Jaminan & Pemulangan | SFV APPAREL',
  description: 'Jaminan kualiti dan polisi penggantian 1-to-1 bagi tempahan jersi kustom SFV Apparel.',
};

export default function RefundPolicyPage() {
  return <PolicyPageView policyKey="warranty" />;
}
