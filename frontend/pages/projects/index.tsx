"use client";
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/FoundrySection";
export default function Page() {
  return <ForgePage section="foundry"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
