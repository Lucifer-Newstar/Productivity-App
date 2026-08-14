"use client";
/**
 * /projects/vault (the.vault) — ARCHIVE / SHIPPED / DEAD + BACKUPS.
 *
 * Wraps VaultSection in ForgePage. Three tabs:
 *   · SHIPPED - completed projects with completion date
 *   · DEAD    - killed projects with obituary (why/learned/restart?)
 *   · COLD    - archived non-dead/non-shipped projects
 * Plus JSON backup/restore, CSV import/export of both tasks and projects.
 *
 * Page.fullScreen = FULLSCREEN for edge-to-edge ForgeShell.
 */
import ForgePage, { FULLSCREEN } from "../../components/forge/ForgePage";
import COMP from "../../components/forge/sections/VaultSection";

export default function Page() {
  // Route §04: Vault — cold storage.
  return <ForgePage section="vault"><COMP/></ForgePage>;
}
Page.fullScreen = FULLSCREEN;
