"use client";

/**
 * pages/career/roadmaps — roadmaps module.
 * Thin route wrapper mounting CareerPage HOC with the roadmaps section.
 */
import CareerPage from "../../components/career/CareerPage";
import RoadmapsSection from "../../components/career/sections/RoadmapsSection";

export default function Page() {
  return (
    <CareerPage section="roadmaps">
      <RoadmapsSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
