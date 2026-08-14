"use client";
import ForgePage, { FULLSCREEN } from "../../../components/forge/ForgePage";
import ProjectDrill from "../../../components/forge/sections/ProjectDrill";
export default function Page() {
  return <ForgePage section="foundry"><ProjectDrill/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
