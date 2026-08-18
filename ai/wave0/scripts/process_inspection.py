#!/usr/bin/env python3
"""LOCAL-ONLY cross-platform process identity/tree inspection for Wave 0."""
from __future__ import annotations
import json, pathlib, shutil, subprocess, sys

def process_table():
    rows={}
    if sys.platform.startswith("win"):
        ps=shutil.which("powershell") or shutil.which("pwsh")
        if not ps:return rows
        script="Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath | ConvertTo-Json -Compress"
        try:
            p=subprocess.run([ps,"-NoProfile","-Command",script],capture_output=True,text=True,timeout=10);data=json.loads(p.stdout or "[]");data=[data] if isinstance(data,dict) else data
            for x in data:rows[int(x["ProcessId"])]={"ppid":int(x.get("ParentProcessId") or 0),"name":str(x.get("Name") or ""),"exe":str(x.get("ExecutablePath") or "")}
        except Exception:return {}
        return rows
    proc=pathlib.Path("/proc")
    if not proc.is_dir():return rows
    for entry in proc.iterdir():
        if not entry.name.isdigit():continue
        try:
            pid=int(entry.name);stat=(entry/"stat").read_text();left,rest=stat.rsplit(") ",1);name=left.split("(",1)[1];parts=rest.split();ppid=int(parts[1]);exe=str((entry/"exe").resolve());rows[pid]={"ppid":ppid,"name":name,"exe":exe}
        except Exception:continue
    return rows

def tree_for(root_pid,table=None):
    table=table or process_table();found={root_pid} if root_pid in table else set();changed=True
    while changed:
        changed=False
        for pid,row in table.items():
            if pid not in found and row["ppid"] in found:found.add(pid);changed=True
    return found

def identity_for(pid,table=None):
    table=table or process_table();row=table.get(pid)
    return None if not row else {"name":row.get("name"),"exe":row.get("exe")}

def verify_running_tree(root_pid,before_tree,before_identity):
    table=process_table();after_tree=tree_for(root_pid,table);after_identity=identity_for(root_pid,table);unexpected=after_tree-before_tree
    return {"rootAlive":root_pid in table,"rootIdentityStable":bool(before_identity and after_identity==before_identity),"unexpectedProcessCount":len(unexpected),"processTreeStable":root_pid in table and after_identity==before_identity and not unexpected}

def verify_exited_tree(expected_tree):
    table=process_table();remaining=expected_tree & set(table)
    return {"remainingProcessCount":len(remaining),"processTreeExited":not remaining}
