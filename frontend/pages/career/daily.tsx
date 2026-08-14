"use client";

/**
 * pages/career/daily — daily module.
 * Thin route wrapper mounting CareerPage HOC with the daily section.
 */
import CareerPage from "../../components/career/CareerPage";
import DailySection from "../../components/career/sections/DailySection";

export default function Page() {
  return (
    <CareerPage section="daily">
      <DailySection />
    </CareerPage>
  );
}
Page.fullScreen = true;
