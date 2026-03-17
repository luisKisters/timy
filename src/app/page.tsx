import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold tracking-tight">
            Timy
          </CardTitle>
          <p className="text-muted-foreground">
            AI-assisted scheduling made simple
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a poll, share it with your group, and let AI help find the
            perfect time.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button size="lg" render={<Link href="/create" />}>
            Create Event
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
