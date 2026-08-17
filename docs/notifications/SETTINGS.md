# Notification settings

## Context behavior

A space sees only its own notifications plus Global entries. Home sees Global entries only. This applies to the inbox badge, list, mark-all-read and browser delivery.

## Global

- Enable/disable all notifications
- Frequency: Real-time, Daily Digest, Weekly Digest, Smart
- Quiet start/end hour
- Do Not Disturb
- Snooze 30 minutes / 4 hours / 24 hours

## Per section

Workout, Career, Projects, Health and Entertainment each support:

- Section enabled
- Reminder notifications
- Progress notifications
- Alert notifications
- Celebration notifications

System digest notifications are controlled globally.

## Channels

### In-app inbox

Always available when notifications are enabled. It works across all routes and full-screen shells.

### Browser

Requires explicit browser permission. Current delivery occurs while Kaizen is open.

### Sound

Optional short WebAudio beep on browser delivery. Disabled by default.

### Not currently exposed

- Vibration
- App-icon badge count
- OS push while closed

These require PWA/service-worker support and were removed rather than presenting controls that do not work.

## Frequency semantics

- **Real-time:** eligible new notifications can deliver immediately.
- **Smart:** suppresses low-priority immediate browser delivery; all entries still appear in the inbox.
- **Daily/Weekly:** ordinary rules collect in the inbox; browser delivery is reserved for digest candidates.

Digest aggregation is the next notification wave; the settings/data contract already supports it.

## Quiet hours

Quiet hours may cross midnight. If start and end match, quiet-hours suppression is disabled. DND and snooze override browser delivery but do not delete inbox entries.
