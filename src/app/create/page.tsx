import { EventForm } from "@/components/event-form";

export default function CreatePage() {
  return (
    <main className="min-h-[100svh] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-lg">
        <EventForm />
      </div>
    </main>
  );
}
