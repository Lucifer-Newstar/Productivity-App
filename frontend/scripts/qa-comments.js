#!/usr/bin/env node
/** Enforces one meaningful file-level or inline comment in every maintained code file. */
const fs=require("fs"),path=require("path"),repo=path.resolve(__dirname,"../.."),roots=["frontend","backend","ai","packaging"],extensions=new Set([".ts",".tsx",".js",".mjs",".cjs",".py",".ps1",".css",".sh",".cmd",".iss"]),ignored=new Set(["node_modules",".next","dist","build","__pycache__"]),files=[];
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){if(ignored.has(entry.name))continue;const target=path.join(directory,entry.name);if(entry.isDirectory())walk(target);else if(extensions.has(path.extname(entry.name)))files.push(target)}}
for(const root of roots)walk(path.join(repo,root));
const pattern=/(^|\n)\s*(?:\/\/|\/\*|#(?!\!)|"""|'''|<\#|REM\s|;\s)/i,missing=files.filter(file=>!pattern.test(fs.readFileSync(file,"utf8")));
console.log(`\n── Source commentary coverage ──`);console.log(`  ${files.length-missing.length}/${files.length} maintained code files include comments.`);if(missing.length){for(const file of missing)console.error(`  ✗ ${path.relative(repo,file)}`);process.exit(1)}console.log("  ✓ no uncommented maintained code files");
