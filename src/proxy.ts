import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/product(.*)",
  "/states(.*)",
  "/blog(.*)",
  "/plan(.*)",
  "/parental-leave-101(.*)",
  "/legal(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/chat(.*)",
  "/api/save-plan(.*)",
  "/api/update-plan(.*)",
  "/api/get-plan(.*)",
  "/api/create-checkout(.*)",
  "/api/stripe-webhook(.*)",
  "/api/get-user-tier(.*)",
  "/api/accept-legal(.*)",
  "/api/legal-agreement-status(.*)",
  "/api/keep-alive(.*)",
  "/pricing(.*)",
  "/why-leavigation(.*)",
  "/about(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
