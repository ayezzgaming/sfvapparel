import React from 'react';
import { 
  Building2,
  PackageCheck,
  Clock,
  ShieldCheck,
  Truck,
  Zap,
  CheckCircle2,
  Star,
  Sparkles,
  Award,
  ThumbsUp
} from 'lucide-react';

export const BADGE_THEMES: Record<string, {
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  pillStyle: string;
  dotActive: string;
}> = {
  sky: {
    gradient: 'from-white via-slate-50/50 to-sky-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-[#00BDFF]/10 text-[#00BDFF]',
    iconColor: 'text-[#00BDFF]',
    pillStyle: 'bg-sky-50 text-[#00BDFF] border-sky-100',
    dotActive: 'bg-[#00BDFF]',
  },
  indigo: {
    gradient: 'from-white via-slate-50/50 to-indigo-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
    iconColor: 'text-indigo-600',
    pillStyle: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    dotActive: 'bg-indigo-600',
  },
  emerald: {
    gradient: 'from-white via-slate-50/50 to-emerald-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    iconColor: 'text-emerald-600',
    pillStyle: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dotActive: 'bg-emerald-600',
  },
  amber: {
    gradient: 'from-white via-slate-50/50 to-amber-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-amber-500/10 text-amber-600',
    iconColor: 'text-amber-600',
    pillStyle: 'bg-amber-50 text-amber-700 border-amber-100',
    dotActive: 'bg-amber-600',
  },
  blue: {
    gradient: 'from-white via-slate-50/50 to-blue-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-blue-500/10 text-blue-600',
    iconColor: 'text-blue-600',
    pillStyle: 'bg-blue-50 text-blue-700 border-blue-100',
    dotActive: 'bg-blue-600',
  },
  rose: {
    gradient: 'from-white via-slate-50/50 to-rose-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-rose-500/10 text-rose-600',
    iconColor: 'text-rose-600',
    pillStyle: 'bg-rose-50 text-rose-700 border-rose-100',
    dotActive: 'bg-rose-600',
  },
  purple: {
    gradient: 'from-white via-slate-50/50 to-purple-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-purple-500/10 text-purple-600',
    iconColor: 'text-purple-600',
    pillStyle: 'bg-purple-50 text-purple-700 border-purple-100',
    dotActive: 'bg-purple-600',
  },
};

export function getTrustIconComponent(iconName?: string): React.ElementType {
  switch (iconName) {
    case 'Building2': return Building2;
    case 'PackageCheck': return PackageCheck;
    case 'Clock': return Clock;
    case 'ShieldCheck': return ShieldCheck;
    case 'Truck': return Truck;
    case 'Zap': return Zap;
    case 'CheckCircle2': return CheckCircle2;
    case 'Star': return Star;
    case 'Sparkles': return Sparkles;
    case 'Award': return Award;
    case 'ThumbsUp': return ThumbsUp;
    default: return Building2;
  }
}
