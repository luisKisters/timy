// Minimal Share stub — the create flow lands here after persisting. The full
// Share screen (invite link, Web Share, "fill out my availability") is Phase 8.
export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="timy-shell">
      <main className="stream center">
        <div className="center-col" style={{ gap: 10 }}>
          <div className="bigcheck" aria-hidden="true">
            ✓
          </div>
          <h2 className="h-lg">Your poll is ready</h2>
          <p className="sub" style={{ textAlign: "center" }}>
            Share it so the others can vote.
          </p>
          <a className="textlink" href={`/event/${id}`}>
            Open the poll →
          </a>
        </div>
      </main>
    </div>
  );
}
