import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">Page not found.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Go Home
      </Link>
    </main>
  );
}
