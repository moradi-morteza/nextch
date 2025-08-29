import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center">
      <Link
        href="/chat"
        className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Open Chat
      </Link>
    </main>
  );
}
