# 03 — Auto-link synced events to contacts

Status: ready-for-agent
Blocked by: 02
PRD: ../PRD.md

## User-visible behavior

A synced event whose attendee matches one of the user's contacts is automatically linked: the event row in the Relationship Manager shows the contact's chip (click → contact detail), and the contact's detail page lists their upcoming/past linked events. Wrong links can be corrected (unlink / relink manually via a small picker).

## Scope

1. **Matching — pure functions in `web/lib/calendar/match.ts`:** `matchEventToContact(event, contacts)` with tiered confidence:
   - Tier 1: attendee email exactly matches a contact email. **Schema gap:** `contacts` has no email column — add `email text` to contacts in a small migration (`0009_contacts_email.sql`) + surface it on the contact form (it's a natural CRM field the spec implies).
   - Tier 2: contact full name appears in the event title (normalized, word-boundary).
   - Tier 3: first name + firm name both appear in title/description.
   - Return `{ contactId, confidence: high|medium } | null`; only auto-link high/medium, set `link_source = 'auto'`.
2. **Wire into sync:** `syncEvents` (issue 02) runs matching on upsert for events with no `contactId` or `link_source = 'auto'` (never overwrite a `manual` link).
3. **Manual override:** `linkEventToContactAction({ eventId, contactId | null })` — 7-step skeleton; sets `link_source = 'manual'` (null contactId = unlink). Cheap rate limit.
4. **Queries:** `getEventsForContact(db, userId, contactId)`, `updateEventLink`.
5. **UI:**
   - Event rows: contact chip when linked; subtle "Link contact" affordance opening a small contact picker (combobox of the user's contacts) when not.
   - Contact detail page (`tools/relationships/[contactId]`): "Meetings" section listing linked events (upcoming + recent past).
6. **Tests:** table-driven matcher tests (email hit, name-in-title, first-name+firm, ambiguous two-contact case → null, no false positive on common first names alone); PGlite for link queries + manual-beats-auto rule; action gates.

## Not in scope

Auto-creating contacts from unknown attendees (product call — leave for triage later); prep sheets.

## Verification

All six done-gates. Manual: add contact "Sarah Chen, Goldman Sachs" with her email → sync an event she's an attendee on → chip appears; event titled "Chat w/ Sarah Chen" (no attendee email) also links; manual unlink survives the next sync.
