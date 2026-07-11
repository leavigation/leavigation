import SignUpForm from "./SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <SignUpForm redirectReason={params.reason} redirectTo={params.redirect} />
    </main>
  );
}
