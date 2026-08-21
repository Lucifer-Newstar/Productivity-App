"use client";
/** Global avatar control that opens the Kaizen profile page at `/profile`. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "../lib/store";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProfileTrigger({ className = "" }: { className?: string }) {
  const { profile } = useStore();
  const pathname = usePathname() || "/";
  const active = pathname === "/profile" || pathname.startsWith("/profile/");
  return (
    <Link
      href="/profile"
      className={`profile-trigger ${active ? "is-active" : ""} ${className}`}
      aria-label="Open Kaizen profile"
      aria-current={active ? "page" : undefined}
    >
      {profile.avatarDataUrl
        ? <img src={profile.avatarDataUrl} alt="" className="profile-avatar-img" />
        : <span>{initials(profile.displayName)}</span>}
    </Link>
  );
}

export default function ProfileDock({ floating = false }: { floating?: boolean }) {
  if (!floating) return null;
  return <ProfileTrigger className="profile-dock-float" />;
}
