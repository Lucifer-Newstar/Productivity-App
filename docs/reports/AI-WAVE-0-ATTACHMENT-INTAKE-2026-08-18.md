# Wave 0 attachment intake — duplicate pre-fix run

## Intake result

The attachment batch included raw LOCAL-ONLY hardware/model/score/soak/lifecycle JSON and server logs, plus one file marked `PUBLIC-SANITIZED-AGGREGATE`.

The public aggregate passed classification, JSON and sensitive-pattern checks. Comparison showed it was the same pre-fix Qwen AC-balanced run already tracked in `results-public/`: same capture timestamp and measurements, with only padded CPU text/line-ending differences. It had no corrected preflight and retained the same 0% structured / 85.71% tool results.

## Privacy action

- No raw attachment was committed or copied into the repository.
- Raw logs were not used for public analysis.
- The duplicate aggregate was not committed as new evidence.
- All uploaded raw/duplicate files were deleted from the public Arena workspace after the minimum validation.

## Milestone effect

No status change. The current configuration remains rejected and the corrected validation has not occurred.

## Required next artifact

After pulling the corrected harness commits, run:

```powershell
python scripts\preflight_candidate.py `
  --config config\candidates.local.json `
  --output results-local\qwen3-fixed-preflight.json
```

Only if it passes, run the corrected AC-balanced target pipeline and share the newly generated sanitized aggregate and review bundle. Do not upload `results-local/` or server logs.
