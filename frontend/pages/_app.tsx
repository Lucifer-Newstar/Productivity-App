import type { AppProps } from "next/app";
import { StoreProvider } from "../lib/store";
import "../app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-bg/60">
        <div className="p-8">
          <Component {...pageProps} />
        </div>
      </div>
    </StoreProvider>
  );
}
