"use client";
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/SmelterSection";
export default function Page() {
  return <ForgePage section="smelter"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
