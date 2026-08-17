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
- Settings/setup schema migration defaults
- Priority setup candidates for all five sections + Global
- Setup relevance after explicit confirmation
- Route-to-section mapping
- Cross-section visibility isolation
- Global visibility across every context

## Manual checklist

- [ ] Data Setup lists all five sections and current readiness
- [ ] Health requires explicit confirmation even when seeded defaults are present
- [ ] Entertainment supports provider-ready or manual-only confirmation
- [ ] Confirm/reset immediately hides/restores setup alerts
- [x] NotificationButton is mounted in Home and all five full-screen navigation bars
- [ ] Home shows Global notifications only
- [ ] Each space shows its own section plus Global, never another section
- [ ] Unread badge and mark-all-read are scoped to visible context
- [ ] Browser delivery is scoped to visible context
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
