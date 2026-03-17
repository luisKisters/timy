import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface EventHeaderProps {
  title: string;
  description: string;
}

export function EventHeader({ title, description }: EventHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
    </Card>
  );
}
