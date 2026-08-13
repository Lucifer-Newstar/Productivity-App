"use client";

/**
 * pages/career/network — network module.
 * Thin route wrapper mounting CareerPage HOC with the network section.
 */
import CareerPage from "../../components/career/CareerPage";
import NetworkSection from "../../components/career/sections/NetworkSection";

export default function Page() {
  return (
    <CareerPage section="network">
      <NetworkSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
