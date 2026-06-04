import { cn } from "@/lib/utils";

export interface AppShellProps {
  /** Optional header row (e.g. <Topbar />). */
  topbar?: React.ReactNode;
  /** Docked actions, secondary first → primary last (primary sits at bottom). */
  dock?: React.ReactNode;
  children: React.ReactNode;
  /** Vertically center the stream (empty/hero states). */
  center?: boolean;
  className?: string;
}

export function AppShell({ topbar, dock, children, center, className }: AppShellProps) {
  return (
    <div className={cn("timy-shell", className)}>
      {topbar}
      <main className={cn("stream", center && "center")}>{children}</main>
      {dock && (
        <div className="dock">
          <div className="dock-stack">{dock}</div>
        </div>
      )}
    </div>
  );
}

export interface TopbarProps {
  onBack?: () => void;
  title?: string;
  meta?: string;
  trailing?: React.ReactNode;
  /** Custom center content (e.g. a brandmark) — used when `title` is absent. */
  children?: React.ReactNode;
  className?: string;
}

export function Topbar({
  onBack,
  title,
  meta,
  trailing,
  children,
  className,
}: TopbarProps) {
  return (
    <header className={cn("topbar", className)}>
      {onBack && (
        <button type="button" className="back" aria-label="Back" onClick={onBack}>
          ←
        </button>
      )}
      {title ? (
        <div className="ttl">
          <h3>{title}</h3>
          {meta && <div className="meta">{meta}</div>}
        </div>
      ) : (
        children
      )}
      <div className="spacer" />
      {trailing}
    </header>
  );
}
