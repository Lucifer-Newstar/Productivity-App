"use client";
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/QuarrySection";
export default function Page() {
  return <ForgePage section="quarry"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
