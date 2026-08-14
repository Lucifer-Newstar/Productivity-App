"use client";

/**
 * pages/career/jobs — jobs module.
 * Thin route wrapper mounting CareerPage HOC with the jobs section.
 */
import CareerPage from "../../components/career/CareerPage";
import JobsSection from "../../components/career/sections/JobsSection";

export default function Page() {
  return (
    <CareerPage section="jobs">
      <JobsSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
