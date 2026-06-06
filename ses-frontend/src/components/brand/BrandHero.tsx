import { Logo } from './Logo';

interface BrandHeroProps {
  title?: string;
  subtitle?: string;
}

export function BrandHero({
  title = 'SynergyEventSphere',
  subtitle = 'Where events come together.',
}: BrandHeroProps) {
  return (
    <div className="relative isolate hidden h-full overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#16204a] to-[#0f172a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-12 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <Logo size={44} />
        <span className="text-xl font-semibold tracking-tight">{title}</span>
      </div>
      <div className="relative space-y-6">
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight">
          Discover, organize, and book events.
        </h1>
        <p className="max-w-md text-lg text-white/80">{subtitle}</p>
        <ul className="space-y-2 text-sm text-white/80">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Curated event catalog with smart filters
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> One-tap booking with capacity safety
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Organizer & admin dashboards
          </li>
        </ul>
      </div>
      <p className="relative text-xs text-white/60">
        © {new Date().getFullYear()} SynergyEventSphere
      </p>
    </div>
  );
}
