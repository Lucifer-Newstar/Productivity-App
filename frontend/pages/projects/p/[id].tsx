"use client";
import ForgePage from "../../../components/forge/ForgePage";
import ProjectDrill from "../../../components/forge/sections/ProjectDrill";
export default function Page() {
  // Drilldown is technically within Foundry sector (we don't have a separate nav item)
  return <ForgePage section="foundry"><ProjectDrill/></ForgePage>;
}
