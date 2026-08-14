"use client";

/**
 * pages/career/projects — unified projects hub.
 * Mission control cross-cutting roadmaps, pipeline, portfolio, network, skills.
 */
import CareerPage from "../../components/career/CareerPage";
import ProjectsHub from "../../components/career/sections/ProjectsHub";

export default function Page() {
  return (
    <CareerPage section="projects">
      <ProjectsHub />
    </CareerPage>
  );
}
Page.fullScreen = true;
