"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="section">
      <div className="container empty-state">
        <div className="eyebrow">Something went wrong</div>
        <h1>We could not load this page.</h1>
        <p>Please try again. If the problem continues, contact the TechJest team.</p>
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
