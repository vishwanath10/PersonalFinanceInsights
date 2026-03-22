import { useEffect, useState } from "react";
import CreditCardAnalysisPage from "./App";
import { AnalysisLandingPage } from "./features/home/AnalysisLandingPage";
import { UpiAnalysisPage } from "./features/upi/UpiAnalysisPage";

type AnalysisRoute = "home" | "credit-card" | "upi";

function getRouteFromHash(hash: string): AnalysisRoute {
  const normalized = hash.replace(/^#\/?/, "").trim().toLowerCase();
  if (normalized === "credit-card") {
    return "credit-card";
  }
  if (normalized === "upi") {
    return "upi";
  }
  return "home";
}

function setRouteHash(route: AnalysisRoute): void {
  window.location.hash = route === "home" ? "#/" : `#/${route}`;
}

export default function RootApp(): JSX.Element {
  const [route, setRoute] = useState<AnalysisRoute>(() => {
    if (typeof window === "undefined") {
      return "home";
    }
    return getRouteFromHash(window.location.hash);
  });

  useEffect(() => {
    function onHashChange(): void {
      setRoute(getRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "credit-card") {
    return (
      <>
        <section className="mx-auto flex w-full max-w-7xl justify-start p-4 pb-0">
          <button type="button" className="btn-secondary" onClick={() => setRouteHash("home")}>
            Back to analysis modes
          </button>
        </section>
        <CreditCardAnalysisPage />
      </>
    );
  }

  if (route === "upi") {
    return <UpiAnalysisPage onBack={() => setRouteHash("home")} />;
  }

  return <AnalysisLandingPage onSelect={(mode) => setRouteHash(mode)} />;
}
