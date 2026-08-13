"use client";

/**
 * pages/career/skills — skills module.
 * Thin route wrapper mounting CareerPage HOC with the skills section.
 */
import CareerPage from "../../components/career/CareerPage";
import SkillsSection from "../../components/career/sections/SkillsSection";

export default function Page() {
  return (
    <CareerPage section="skills">
      <SkillsSection />
    </CareerPage>
  );
}
Page.fullScreen = true;
