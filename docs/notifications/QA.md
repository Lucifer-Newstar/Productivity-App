# Notification QA

## Current automated coverage

```bash
cd frontend
npm run qa:notifications
```

The executable suite verifies:

- Scheduled workout and PR candidates
- Career certification/contact/application aging
- Forge health/deadline/budget/task rules
- Health meal/caffeine/stress rules
- Entertainment rating reminder
- Evening daily pulse
- Unique source keys
- Critical stress priority
- Settings migration/defaults

## Manual checklist

- [ ] Bell is visible on Home and every full-screen space
- [ ] Unread count updates
- [ ] Hover/read and dismiss work
- [ ] Mark-all-read works
- [ ] Action links navigate correctly
- [ ] Global enable, DND, snooze and quiet hours suppress browser delivery
- [ ] Section/kind toggles suppress eligible browser delivery
- [ ] Browser permission denial leaves in-app inbox working
- [ ] Smart mode suppresses low-priority browser delivery
- [ ] Daily/weekly modes do not pretend to deliver unscheduled ordinary alerts
- [ ] No duplicate source key is stored
- [ ] Inbox remains capped at 2,000 rows
- [ ] Settings survive refresh under `kaizen.notifications`

## Security/privacy

- Notification bodies must not include API keys or full sensitive journal text.
- Browser notifications may be visible on a lock screen; browser channel is opt-in and disabled by default.
- Health messages must remain non-diagnostic.
- The notification backend mirror is protected by the same Express API key/CORS/rate controls as other data routes.
