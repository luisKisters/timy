import { EventForm } from "@/components/event-form";

export default function CreatePage() {
  return (
    <main className="min-h-[100svh] p-6 pb-8">
      <div className="mx-auto w-full max-w-lg pt-8">
        <EventForm />
      </div>
    </main>
  );
}
