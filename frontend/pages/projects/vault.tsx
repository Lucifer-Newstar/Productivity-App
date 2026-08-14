"use client";
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/VaultSection";
export default function Page() {
  return <ForgePage section="vault"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
