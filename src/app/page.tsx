import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">Timy</h1>
          <p className="text-muted-foreground">AI-assisted scheduling made simple</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a poll, share it with your group, and let AI find the perfect time.
        </p>
        <Button size="lg" className="w-full" render={<Link href="/create" />}>
          Create Event
          <span className="ml-2 text-xs opacity-40">↵</span>
        </Button>
      </div>
    </main>
  );
}
