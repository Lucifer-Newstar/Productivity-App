/**
 * Pages Router custom App — wraps every `/pages/*` route (the five Spaces) in the
 * same providers + top nav the main App Router shell uses, so visiting
 * `/career`, `/workout`, etc. standalone looks identical to navigating within
 * the SPA.
 */
import type { AppProps } from "next/app";
import { StoreProvider } from "../lib/store";
import { ThemeProvider } from "../lib/theme";
import TopNav from "../components/TopNav";
import "../app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <StoreProvider>
        <div className="min-h-screen flex flex-col">
          <TopNav />
          <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-up">
            <Component {...pageProps} />
          </main>
        </div>
      </StoreProvider>
    </ThemeProvider>
  );
}
