"use client";

/**
 * pages/career/command — global/cmd module (timeline, satisfaction, burnout, vision, sabbatical, retirement).
 */
import CareerPage from "../../components/career/CareerPage";
import GlobalSection from "../../components/career/sections/GlobalSection";

export default function Page() {
  return (
    <CareerPage section="global">
      <GlobalSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
