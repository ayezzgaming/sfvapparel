import PublicAppShell from '@/components/public/PublicAppShell';
import { UIProvider } from '@/lib/store/ui-context';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <PublicAppShell>{children}</PublicAppShell>
    </UIProvider>
  );
}
