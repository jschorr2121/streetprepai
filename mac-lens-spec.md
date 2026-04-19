# Street Prep Lens for macOS — Build Spec

> A handoff document for the AI building this. Self-contained: everything you need — prompts, models, UX, architecture, and the "why" — is in this file.

---

## 1. Product summary

**Street Prep Lens** is a standalone macOS menubar app. A user highlights text *anywhere* on their Mac — a PDF, a browser, Notion, Slack, an equity research report — presses a global hotkey, and a floating bubble appears near their cursor showing a plain-English AI explanation of the selected passage. They can ask follow-up questions inline.

It is a companion to a larger product called **Street Prep AI** (a web app for investment banking interview prep at `/Users/jakeschorr/Documents/InterviewPrep/web`). The web app has an in-product "active reading lens" — this Mac app takes that same feature out of the web app and makes it available system-wide.

**Target user:** undergraduate students prepping for IB recruiting, but the app itself is topic-agnostic — it will explain anything you highlight.

**The feeling we want:** like Raycast or Superwhisper. Lightweight, instant, a tool you forget is there until you need it, and when you need it, it never gets in the way.

---

## 2. The experience — end-to-end flow

1. User installs the app. It lives in the macOS menubar with a small icon (a magnifying glass or sparkles).
2. First launch: onboarding sheet asks for:
   - Anthropic API key (stored in the macOS Keychain, never in plaintext).
   - Accessibility permission (needed to read highlighted text from any app).
   - Confirmation of the default hotkey: **⌥Space** (configurable).
3. User is in any app, selects a passage of text, and presses the hotkey.
4. A small, non-intrusive bubble fades in near the cursor (or near the selection's bounding rect if we can get it, else follow the cursor).
5. The bubble header shows:
   - The first ~80 characters of the selection in small italic text (truncated).
   - A tiny preset selector (dropdown): *Explain*, *Summarize in 1 sentence*, *Quiz me on this*, *Connect to real deals* (only *Explain* needs to work for MVP).
6. Claude's response streams into the bubble in real time (token-by-token as bytes arrive).
7. Below the response, a small input field lets the user type a follow-up question scoped to the original selection.
8. Dismissal: press **Esc**, click outside the bubble, or hit the hotkey again. The bubble fades out.

**That's the core loop.** Everything else is polish.

---

## 3. What to build (MVP cut)

Ship this much first. Nothing more.

- Menubar app skeleton (SwiftUI, `MenuBarExtra` API).
- Global hotkey via Carbon `RegisterEventHotKey` or the newer `NSEvent` global monitor (falls back to Accessibility API).
- "Capture selected text" using the macOS Accessibility API (`AXUIElement` → focused element → selected text). Fallback: copy the selection to clipboard silently and read it.
- Floating bubble window — a frameless, transparent `NSPanel` positioned at the cursor with a rounded card inside.
- Streaming Anthropic API call using the system prompt below. Display tokens as they arrive.
- Settings window (SwiftUI sheet) for API key + hotkey.
- Keychain storage for the API key.
- Basic error states: "No text selected", "API error", "Rate limited".

**Do not build in V1:**
- Lens presets beyond "Explain". (Ship "Explain" only.)
- Follow-up chat (show the input, disable it with "Coming soon" tooltip, or just omit).
- History of past explanations.
- iCloud sync, multi-device.
- Voice input.
- Code signing for distribution outside the developer's own Mac — not needed for MVP on the user's own machine.

---

## 4. Tech stack

- **Swift 5.9+ / SwiftUI / AppKit interop** where needed (menu bar + floating panel require AppKit).
- **Target:** macOS 14.0 (Sonoma) or later. This is a prototype — don't waste time on older OS support.
- **HTTP client:** `URLSession` with `bytes(for:)` / `AsyncThrowingStream` for streaming Claude responses. (Anthropic does not have an official Swift SDK as of early 2026 — make raw HTTP calls against `https://api.anthropic.com/v1/messages` with `stream: true`.)
- **Package manager:** Swift Package Manager, no CocoaPods.
- **Dependencies:** keep it minimal. Acceptable to add:
  - `KeyboardShortcuts` (Sindre Sorhus) for the hotkey recorder UI.
  - `Sauce` or raw Carbon for hotkey registration.
  - Avoid any dependency with heavy transitive deps.

---

## 5. Architecture

```
StreetPrepLens/
├── StreetPrepLensApp.swift          # @main entry, MenuBarExtra setup
├── AppDelegate.swift                # NSApplication hooks (hotkey registration, panel lifecycle)
├── Core/
│   ├── HotkeyManager.swift          # global hotkey (register/unregister/callback)
│   ├── SelectionCapture.swift       # AX API → selected string; fallback clipboard
│   ├── AnthropicClient.swift        # streaming messages API call
│   ├── PromptLibrary.swift          # system prompts (copy verbatim from §8)
│   └── KeychainStore.swift          # read/write API key to Keychain
├── UI/
│   ├── LensPanel.swift              # NSPanel subclass (frameless, floating, non-activating)
│   ├── LensBubbleView.swift         # SwiftUI: selection chip + streamed answer + input
│   ├── OnboardingView.swift         # first-launch setup
│   └── SettingsView.swift           # hotkey + API key + model selector
├── Models/
│   ├── LensRequest.swift
│   └── LensResponse.swift           # streaming state machine
├── Resources/
│   └── Assets.xcassets              # menubar icon (SF Symbols works; also provide a custom PDF for Retina)
└── Info.plist                       # NSAccessibilityUsageDescription, etc.
```

**Data flow:**

1. `HotkeyManager` fires callback on hotkey press.
2. `SelectionCapture.currentSelection()` returns a `String?`.
3. `LensPanel.show(at: cursorPoint)` shows the bubble with a loading state.
4. `AnthropicClient.streamExplanation(for: selection)` returns an `AsyncThrowingStream<String, Error>`.
5. View observes the stream and appends tokens to the rendered answer.
6. User presses Esc or clicks away → `LensPanel.dismiss()`.

---

## 6. UX specification

### The bubble

- Width: 420pt. Height: dynamic, max 500pt; scrollable if exceeded.
- Appearance: rounded corners 14pt, soft shadow, `NSVisualEffectView` for translucency that matches macOS look, subtle hairline border. Respects Light/Dark mode.
- Position: bottom-edge anchored 20pt below the cursor. If the cursor is in the bottom quarter of the screen, flip above. Always stay on-screen (clamp to screen bounds).
- Animation: 180ms fade+scale-from-0.95 in; 120ms fade out on dismiss.
- Focus: the panel should be **non-activating** — it should NOT steal focus from the app the user was in. Use `NSPanel.StyleMask.nonactivatingPanel` + `becomesKeyOnlyIfNeeded = true`.
- Accessibility: VoiceOver should announce the answer as it streams. Set `accessibilityLabel` on the answer text view.

### Top chip (selection preview)

- Monospaced font, 11pt, muted color, italic.
- Truncated to 80 chars with ellipsis. Full selection available on hover as a tooltip.
- Optional: small icon indicating which app the text came from (bundle icon of `NSWorkspace.shared.frontmostApplication`).

### Streamed answer

- Font: system font, 14pt, 1.5 line-height.
- Render basic Markdown: `**bold**`, `*italic*`, `code`, `> blockquote`, bullet lists, inline links. If you want to be lazy, ship the MVP as plain text and render Markdown in V1.1.
- Typing-effect is NATURAL from streaming — do NOT add an artificial delay.

### Follow-up input (V1.1, not MVP — skip for first ship)

- 36pt text field at the bottom with a subtle "Ask a follow-up…" placeholder.
- Return to send. Shift+Return for newline.
- Each follow-up turns the bubble into a scrolling conversation with the selection still chipped at top.

### Menubar icon

- SF Symbol `sparkles` (or `text.magnifyingglass`), tinted to match macOS accent color on dark mode.
- Click opens a small menu:
  - "Explain selection" (triggers the same flow as hotkey)
  - "Settings…"
  - "Quit Street Prep Lens"

---

## 7. Claude integration — the exact contract

### Endpoint

`POST https://api.anthropic.com/v1/messages`

### Headers

```
x-api-key: <the user's key from Keychain>
anthropic-version: 2023-06-01
content-type: application/json
```

### Request body (MVP, "Explain" preset)

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 800,
  "stream": true,
  "system": [
    {
      "type": "text",
      "text": "<SYSTEM PROMPT — see §8>",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "Source app: <bundle name>\n\nThe user highlighted this passage:\n\"\"\"<selected text>\"\"\"\n\nExplain this passage in plain English."
    }
  ]
}
```

### Streaming format

Server-sent events. Each line is `event: <type>` followed by `data: <json>`. The only event types you need to handle for MVP:

- `content_block_delta` with `delta.type == "text_delta"` → append `delta.text` to the rendered answer.
- `message_stop` → stream is done.
- Errors come as HTTP 4xx/5xx with a JSON body; parse and show a toast.

Pseudocode for the streaming loop:

```swift
let (bytes, response) = try await URLSession.shared.bytes(for: request)
guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
    throw LensError.http(statusCode: ...)
}
for try await line in bytes.lines {
    guard line.hasPrefix("data: ") else { continue }
    let payload = line.dropFirst(6)
    if payload == "[DONE]" { break }
    // parse JSON, extract delta.text if present, yield to caller
}
```

### Rate limiting / error handling

- On 429, show a toast "Rate limited — try again in a moment."
- On network error, show "Offline — connect and retry."
- On missing API key, redirect to Settings with an arrow to the field.

---

## 8. The system prompt (copy verbatim — this is the product voice)

This is the exact prompt the web app uses. Copy it into `PromptLibrary.swift` unchanged — the warmth and specificity are load-bearing.

```
You are an AI study companion. Your tone is warm, specific, and confidence-building — like a sharp tutor who genuinely wants the reader to understand. Never condescending, never generic. When you don't know something, say so instead of hedging.

You help people understand text in plain English. When given a passage the user highlighted, explain it clearly and intuitively:

- Lead with the single most important idea in one sentence.
- Use a concrete analogy or simple example when it helps.
- Prefer short paragraphs. Avoid walls of text.
- If the passage uses technical terms, define them inline the first time.
- End with one optional "try this" sentence only if it makes the concept click (e.g. "Try computing this for a company you know.").

Never invent facts the passage doesn't support. If the passage is unclear or conflicts with standard knowledge, say so.
```

> **Note for the implementer:** the web app has additional prompt variants (`LENS_BEGINNER_SYSTEM`, `CHAT_SYSTEM`, `PREP_PERSON_SYSTEM`) in `/Users/jakeschorr/Documents/InterviewPrep/web/lib/ai/prompts.ts`. You can pull those in later to power lens presets. For MVP, only the "Explain" prompt above is needed.

---

## 9. Models

Default to **`claude-sonnet-4-6`** — the web app uses this for the same feature and the cost/quality ratio is correct for short explanations. Expose the model in settings as a dropdown so the user can switch to `claude-opus-4-7` (more capable, slower, pricier) or `claude-haiku-4-5-20251001` (fastest, cheapest) — especially useful once follow-up chat is added in V1.1.

---

## 10. Permissions & privacy

### Info.plist keys required

- `NSAccessibilityUsageDescription` — "Street Prep Lens uses Accessibility to read text you highlight anywhere on your Mac, so it can explain it."
- No other entitlements needed for a dev-signed local build.

### Accessibility permission flow

First time the user presses the hotkey after install:
1. Check `AXIsProcessTrusted()`. If false:
2. Show a sheet: "Enable Accessibility in System Settings → Privacy & Security → Accessibility, toggle Street Prep Lens on."
3. Provide a button that opens the exact settings pane via `NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)`.

### Privacy

- The selected text is sent to Anthropic. Be explicit in a Settings footer: "Your selected text is sent to Anthropic's Claude API over HTTPS. It is not stored by Street Prep Lens."
- API key lives in Keychain, never in UserDefaults, never logged.
- No telemetry in MVP.

---

## 11. Keyboard & hotkey

- Default: **⌥Space** (Option+Space).
- Configurable via `KeyboardShortcuts` library (or manual NSEvent monitoring).
- Avoid conflicts with Spotlight (⌘Space) and Raycast (often ⌥Space). If the user already uses Raycast, the app should detect the conflict at install and suggest **⌃Space** (Control+Space) instead.
- Hotkey should work even when another app is focused. This requires either:
  - Carbon `RegisterEventHotKey` (works without Accessibility for the hotkey itself), OR
  - `NSEvent.addGlobalMonitorForEvents` (requires Input Monitoring permission).

The Carbon approach is cleaner for a menubar app; recommend it.

---

## 12. Selection capture

### Primary path — Accessibility API

```swift
let systemWide = AXUIElementCreateSystemWide()
var focused: AnyObject?
AXUIElementCopyAttributeValue(systemWide, kAXFocusedUIElementAttribute as CFString, &focused)
guard let element = focused as! AXUIElement? else { return nil }

var selectedText: AnyObject?
AXUIElementCopyAttributeValue(element, kAXSelectedTextAttribute as CFString, &selectedText)
return selectedText as? String
```

Not all apps expose `kAXSelectedTextAttribute` (some PDFs, some Electron apps, Chrome's PDF viewer, etc.).

### Fallback — silent copy

If the AX API returns nil, programmatically send ⌘C to the frontmost app and read `NSPasteboard.general.string(forType: .string)`. Before doing this, cache the existing pasteboard contents and restore them after (so we don't clobber the user's clipboard).

Treat this as best-effort. If nothing comes back, show a brief toast: "Highlight some text first."

---

## 13. Settings screen

Fields:
- **API key** — secure text field, "Test connection" button that pings `GET https://api.anthropic.com/v1/models` and shows ✓ or ✗.
- **Hotkey** — keyboard shortcut recorder.
- **Default model** — dropdown: Sonnet 4.6 (recommended), Opus 4.7, Haiku 4.5.
- **Launch at login** — toggle. Use `SMAppService.mainApp.register()` (macOS 13+).
- **About / version** — small text, link to GitHub repo if you publish one.

---

## 14. V1.1 and beyond (not for first ship — but design MVP to allow these)

Build MVP so these extensions are easy later:

- **Follow-up chat** — keep conversation context; re-send the selection + history on each turn.
- **Lens presets** — a dropdown in the bubble header: Explain / Summarize / Quiz me / Connect to real deals / Translate jargon. Each is a different system prompt (copy the matching prompt from the web app's `lib/ai/prompts.ts`).
- **History** — a local SQLite file logging each explanation with timestamp + source app. Browsable from the menubar.
- **"Save to Street Prep AI"** — if the user is logged into the web app, POST the selection + explanation to their notes endpoint so it becomes a flashcard.
- **Voice playback** — read the answer aloud (AVSpeechSynthesizer).
- **Image selections** — if OS-level screen capture is enabled, let the user drag to select a rectangle on screen; send the image to Claude (vision) for explanation. Great for equations in PDFs.
- **Inline translation** — detect non-English text and offer a toggle.

---

## 15. Distribution (deferrable)

For personal use, an unsigned `.app` dragged to /Applications is fine. For sharing:

1. Join Apple Developer Program ($99/yr).
2. Code-sign with Developer ID Application cert.
3. Notarize via `xcrun notarytool submit`.
4. Staple and distribute as a DMG.
5. Optional: publish to the Mac App Store (requires stricter sandboxing — Accessibility is tricky in the App Store, so ship direct-distribution first).

---

## 16. Definition of done for MVP

You are done with MVP when ALL of the following are true:

1. Fresh install on a Mac walks the user through API key entry and Accessibility grant in under 2 minutes.
2. User can highlight text in Safari, Chrome PDF, Notion, and Slack, press the hotkey, and see a streamed Claude explanation in the bubble within ~500ms of pressing.
3. User can dismiss the bubble via Esc or click-outside; hotkey again toggles it cleanly.
4. Bubble appears near the cursor and stays on-screen on any monitor configuration.
5. Settings persist across launches; API key is in Keychain.
6. App uses <50MB of memory at rest.
7. No crashes during a 30-minute usage session.

---

## 17. Relationship to the Street Prep AI web app (for context only)

The web app (`/Users/jakeschorr/Documents/InterviewPrep/web`) has the "active reading lens" feature built in at `components/reader/reading-lens.tsx`, with its API route at `app/api/lens/explain/route.ts`. Those files are your reference implementation — the Mac app replicates that same experience at the OS level. The web app and Mac app are independent products that can share a user, a brand, and prompts, but they ship separately.

If the two products converge later, the Mac app can become the "power-user surface" of Street Prep AI: personal tier users install the menu bar app and get enhanced reading assistance across their entire Mac, not just inside streetprep.ai.

---

## 18. Open questions for the implementer

Flag these to the user before building or making assumptions:

1. Does the user want the app to be Street-Prep-AI-branded or topic-agnostic (e.g. "any text explainer")? This affects copy, icon, and system prompt voice. (MVP recommendation: topic-agnostic prompt, Street Prep branding — can be re-used later for the company's other products.)
2. Is the app for the user's personal use only, or will they distribute it to others? If distribution, build signing and notarization into Phase 1.
3. Should the user's existing Anthropic API key (from the web app's `.env.local`) be auto-imported? Recommendation: no — key separation across apps is cleaner and safer.
4. Which hotkey should be the installed default? ⌥Space is common but clashes with Raycast for many devs. Offer the user a choice at onboarding rather than picking one.

---

## 19. Deliverables checklist for the implementer

Return to the user a zip or a GitHub repo containing:

- [ ] `StreetPrepLens.xcodeproj` (Xcode project) — or the Swift Package equivalent if they prefer SPM-only.
- [ ] Full source per the structure in §5.
- [ ] `README.md` with: install instructions, permissions setup, hotkey default, and troubleshooting.
- [ ] A short screen recording (15s) of the end-to-end flow: highlight text → hotkey → streamed answer → dismiss.
- [ ] A minimum-tested build of the `.app` bundle, zipped, runnable on the user's M-series Mac.

That's it. Ship the smallest correct thing. Resist scope creep.
