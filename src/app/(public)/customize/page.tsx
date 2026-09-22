'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';
import { Loader2 } from 'lucide-react';

export default function CustomizeIndexPage() {
  const router = useRouter();
  const { designs } = useAppStore();

  useEffect(() => {
    const targetId = designs && designs.length > 0 ? designs[0].id : 'des-1';
    router.replace(`/customize/${targetId}`);
  }, [designs, router]);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-[#F2F2F7]">
      <Loader2 className="w-8 h-8 text-[#00BDFF] animate-spin" />
      <p className="text-xs text-slate-500 font-medium">Membuka Studio 3D Customizer...</p>
    </div>
  );
}
