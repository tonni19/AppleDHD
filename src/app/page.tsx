import { AppShell } from '@/components/AppShell';

export default function Page() {
  return (
    // Fixed rather than 100dvh: dynamic viewport units jump around inside a
    // webview when the URL bar or keyboard animates, which made the tab bar drift.
    <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', background: '#2a1712' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100%', overflow: 'hidden' }}>
        <AppShell />
      </div>
    </div>
  );
}
