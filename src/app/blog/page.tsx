import WaitlistButton from "@/app/components/WaitlistButton";
import { pageBackgrounds } from "@/lib/pageBackgrounds";

export const metadata = {
  title: "Blog | Leavigation",
  description:
    "Stay in the loop with feature releases, important leave legislation updates, and more from Leavigation.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: pageBackgrounds.lightPurple }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-200">
          Blog
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Coming soon!
        </h1>
        <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
          Get notified when blog posts are published to stay in the loop with feature releases,
          important leave legislation updates, and more.
        </p>
        <WaitlistButton
          className="mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: "#F2B8CB" }}
        >
          Get notified
        </WaitlistButton>
      </div>
    </main>
  );
}
