import { NextResponse } from 'next/server';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_POLICIES, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_FABRIC_MATERIALS 
} from '@/lib/store/seed-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      company: INITIAL_CMS_COMPANY_SETTINGS,
      policies: INITIAL_CMS_POLICIES,
      services: INITIAL_CMS_SERVICES.filter((s) => s.is_active),
      pricingTiers: INITIAL_QUANTITY_TIERS,
      fabrics: INITIAL_FABRIC_MATERIALS.filter((f) => f.is_active),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal memuatkan konteks AI';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
