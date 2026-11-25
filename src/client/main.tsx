import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router";
import "./styles.css";
import { AppProvider, applyTheme, readTheme } from "./lib";
applyTheme(readTheme());
import { Footer, LoadingPage, MarketingNav } from "./components/ui";
import { Assistant } from "./components/Assistant";
import Home from "./pages/Home";
import { Contact, HowItWorks, NotFound, Pricing, Templates } from "./pages/Marketing";
import { Privacy, Refunds, Terms } from "./pages/Legal";
import { Forgot, Login, Reset, Signup } from "./pages/Auth";
import { Account, AppShell, Dashboard, Leads, NewProject, Publish, RequireAuth, StorePage } from "./app/App";

const Editor = lazy(() => import("./app/Editor"));
const Wizard = lazy(() => import("./app/Wizard"));
const Admin = lazy(() => import("./app/Admin"));

const TITLES: Record<string, string> = {
  "/": "ImprintSites AI — Describe your website. Make it beautiful. Publish it.",
  "/pricing": "Pricing — ImprintSites AI", "/templates": "Templates — ImprintSites AI",
  "/how-it-works": "How it works — ImprintSites AI", "/contact": "Contact & support — ImprintSites AI", "/terms": "Terms of Service — ImprintSites AI",
  "/privacy": "Privacy Policy — ImprintSites AI", "/refunds": "Refund & Cancellation Policy — ImprintSites AI", "/login": "Sign in — ImprintSites AI", "/signup": "Create account — ImprintSites AI",
};

function Chrome({ marketing }: { marketing: boolean }) {
  const loc = useLocation();
  useEffect(() => { document.title = TITLES[loc.pathname] ?? "ImprintSites AI"; window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      {marketing && <MarketingNav />}
      <Suspense fallback={<LoadingPage />}><Outlet /></Suspense>
      {marketing && <Footer />}
      <Assistant />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Chrome marketing />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/pricing", element: <Pricing /> },
      { path: "/templates", element: <Templates /> },
      { path: "/examples", element: <Navigate to="/#made" replace /> }, // examples now live on the landing page only
      { path: "/how-it-works", element: <HowItWorks /> },
      { path: "/contact", element: <Contact /> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/refunds", element: <Refunds /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/forgot-password", element: <Forgot /> },
      { path: "/reset-password", element: <Reset /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <Chrome marketing={false} />,
    children: [{
      element: <RequireAuth />,
      children: [{
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/dashboard/new", element: <NewProject /> },
          { path: "/projects/:id/setup", element: <Wizard /> },
          { path: "/projects/:id/editor", element: <Editor /> },
          { path: "/projects/:id/publish", element: <Publish /> },
          { path: "/projects/:id/leads", element: <Leads /> },
          { path: "/projects/:id/store", element: <StorePage /> },
          { path: "/account", element: <Account /> },
          { path: "/admin", element: <Admin /> },
        ],
      }],
    }],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider><RouterProvider router={router} /></AppProvider>
  </StrictMode>,
);
