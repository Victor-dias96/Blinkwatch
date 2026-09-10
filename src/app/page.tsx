import { HeroSection } from '@/features/landing/components/HeroSection';
import { PrivacySummary } from '@/features/landing/components/PrivacySummary';

export default function Home() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-x-hidden bg-zinc-950 px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.25_0.02_280)_0%,_transparent_60%)]"
      />

      <div className="relative flex w-full max-w-4xl flex-col items-center gap-16">
        <HeroSection />
        <PrivacySummary />
      </div>
    </main>
  );
}
