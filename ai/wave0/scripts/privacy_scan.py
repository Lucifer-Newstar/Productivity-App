#!/usr/bin/env python3
"""Fail closed when staged/tracked public files resemble secrets or LOCAL-ONLY artifacts."""
from __future__ import annotations
import argparse, pathlib, re, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[3]
SKIP_CONTENT={"ai/wave0/scripts/privacy_scan.py","ai/wave0/scripts/sanitize_results.py","ai/wave0/scripts/capture_hardware.py","ai/wave0/scripts/qa_wave0.py","ai/wave0/prototypes/pairing_server.py","ai/wave0/prototypes/revision-coordinator.mjs"}
FORBIDDEN_PATH_PARTS=("ai/wave0/results-local/","ai/wave0/results/","ai/wave0/models/")
FORBIDDEN_SUFFIXES=(".gguf",".sqlite",".sqlite3",".db",".thermal.csv",".server.log",".hardware.json",".benchmark.json")
PATTERNS={
 "private key":r"-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----",
 "cloud/API token":r"\b(?:sk-[A-Za-z0-9_-]{20,}|hf_[A-Za-z0-9]{20,}|gh[oprsu]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b",
 "assigned secret":r"(?i)\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|client[_-]?secret)\b\s*[:=]\s*[\"'][^<\s][^\"']{7,}[\"']",
 "email address":r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
 "Windows home path":r"(?i)\b[A-Z]:[\\/]Users[\\/][^<>\s\\/]+",
 "Unix home path":r"(?<![A-Za-z0-9_])/home/[^/<>{}\s]+",
 "MAC address":r"(?i)\b(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}\b",
 "GPU UUID":r"\bGPU-[0-9a-fA-F-]{20,}\b",
 "machine identifier field":r"(?i)[\"'](?:serial(?:number)?|bios[_-]?id|product[_-]?key|machine[_-]?guid|hostname)[\"']\s*:",
}
def git_files(mode):
    cmd=["git","diff","--cached","--name-only","--diff-filter=ACMR"] if mode=="staged" else ["git","ls-files"]
    p=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True,check=True);return [x for x in p.stdout.splitlines() if x]
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--mode",choices=["staged","tracked"],default="staged");args=ap.parse_args();problems=[]
    for rel in git_files(args.mode):
        norm=rel.replace("\\","/")
        if any(x in norm for x in FORBIDDEN_PATH_PARTS) or norm.endswith(FORBIDDEN_SUFFIXES):problems.append((rel,"forbidden LOCAL-ONLY path/type"));continue
        if "/config/" in norm and ".local." in norm and not norm.endswith(".local.example.json"):problems.append((rel,"machine-specific local configuration"));continue
        path=ROOT/rel
        if rel in SKIP_CONTENT or not path.is_file() or path.stat().st_size>2_000_000:continue
        try:text=path.read_text(encoding="utf-8")
        except UnicodeDecodeError:continue
        if path.suffix.lower()==".json" and re.search(r'"classification"\s*:\s*"LOCAL-ONLY-RAW"',text):problems.append((rel,"raw LOCAL-ONLY JSON"))
        for label,pattern in PATTERNS.items():
            if re.search(pattern,text):problems.append((rel,label))
    if problems:
        print("PUBLIC-REPO PRIVACY SCAN FAILED",file=sys.stderr)
        for rel,label in problems:print(f"  {rel}: {label}",file=sys.stderr)
        print("Keep doubtful files under ignored ai/wave0/results-local/.",file=sys.stderr);raise SystemExit(1)
    print(f"Privacy scan passed for {len(git_files(args.mode))} {args.mode} files.")
if __name__=="__main__":main()
