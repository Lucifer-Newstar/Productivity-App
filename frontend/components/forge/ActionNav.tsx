"use client";
import { Hammer } from "lucide-react";
import { useTheme } from "../../lib/theme";

export default function ActionNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  const light = theme === "light";
  const color = light ? "#92400e" : "#f59e0b";
  const bg = light ? "rgba(146,64,14,0.08)" : "rgba(245,158,11,0.12)";
  return (
    <button onClick={onToggle}
      className="relative px-3 py-1.5 rounded-sm steel-plate flex items-center gap-2 text-[11px] tracking-[0.25em] font-black transition hover:scale-[1.03]"
      style={{
        color,
        background: bg,
        borderColor: color,
        boxShadow: open ? `0 0 18px ${color}88, inset 0 0 12px ${color}33` : "none",
      }}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <Hammer size={14}/>
      <span>STRIKE</span>
    </button>
  );
}
