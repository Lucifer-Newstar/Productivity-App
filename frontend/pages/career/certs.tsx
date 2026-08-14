"use client";

/**
 * pages/career/certs — certs module.
 * Thin route wrapper mounting CareerPage HOC with the certs section.
 */
import CareerPage from "../../components/career/CareerPage";
import CertsSection from "../../components/career/sections/CertsSection";

export default function Page() {
  return (
    <CareerPage section="certs">
      <CertsSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
