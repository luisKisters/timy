import { cn } from "@/lib/utils";

export interface AvatarPerson {
  name: string;
  /** 1–6 colour tone; derived from index when omitted. */
  tone?: number;
}

export interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  className?: string;
}

function initial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export function AvatarStack({ people, max = 4, className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div
      className={cn("avstack", className)}
      role="group"
      aria-label={`${people.length} ${people.length === 1 ? "person" : "people"}`}
    >
      {shown.map((p, i) => (
        <div key={i} className={cn("av", `a${(((p.tone ?? i + 1) - 1) % 6) + 1}`)} aria-hidden="true">
          {initial(p.name)}
        </div>
      ))}
      {extra > 0 && (
        <div className="av more" aria-hidden="true">
          +{extra}
        </div>
      )}
    </div>
  );
}
