import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description:
    "What Street Prep AI collects, why, which AI and infrastructure vendors process it, how long it's kept, and how to delete your account.",
};

const EFFECTIVE_DATE = "July 20, 2026";
const CONTACT_EMAIL = "jacobschorr99@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-lg leading-none">Street Prep</span>
            <span className="text-primary font-mono text-[11px] font-medium tracking-[0.14em]">
              AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Title ───────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            <p className="eyebrow">Legal</p>
            <h1 className="font-display mt-3 text-4xl md:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground mt-4 font-mono text-xs">
              Effective {EFFECTIVE_DATE}
            </p>
          </div>
        </section>

        {/* ── Body ────────────────────────────────────────────────── */}
        <section>
          <div className="prose-guide mx-auto px-6 py-12 md:py-16">
            <p>
              Street Prep AI (&quot;we,&quot; &quot;us&quot;) is a recruiting-prep tool for
              investment banking candidates. This page explains, in plain language, what data we
              collect when you use it, why we collect it, which outside providers process it on our
              behalf, and what control you have over it.
            </p>
            <p>
              We built this policy directly from the code that runs the product — it does not
              describe anything we plan to do someday, only what actually happens today.
            </p>

            <h2 id="information-we-collect">Information we collect</h2>
            <p>We collect the information you give us directly and the content you create:</p>
            <ul>
              <li>
                <strong>Account information</strong> — the email address you sign up with, and, if
                you sign in with Google, the basic profile info Google shares (name, email, avatar)
                under OAuth.
              </li>
              <li>
                <strong>Onboarding profile</strong> — school, graduating class, current semester,
                and the firms you&apos;re targeting.
              </li>
              <li>
                <strong>Resumes</strong> — the PDF you upload, plus the structured data our AI
                extracts from it (roles, bullets, dates).
              </li>
              <li>
                <strong>Mock interview recordings</strong> — audio from voice mock interviews and
                video from HireVue-style practice, recorded directly in your browser, plus the text
                transcript and AI score generated from each answer.
              </li>
              <li>
                <strong>Networking notes</strong> — anything you log about coffee chats and contacts
                through the Relationship Manager. If you mention a real person or company in these
                notes, that information is stored as part of your account data.
              </li>
              <li>
                <strong>Question bank answers</strong> — your written or spoken responses to
                technical practice questions and the AI-generated scores for them.
              </li>
              <li>
                <strong>Usage and cost records</strong> — which routes and AI models you used, token
                counts, and cost, kept for abuse prevention and so we can keep the product
                affordable to run.
              </li>
            </ul>

            <h2 id="how-we-use-it">How we use your information</h2>
            <p>We use what you give us to run the product you signed up for:</p>
            <ul>
              <li>To create and secure your account, and remember your progress.</li>
              <li>
                To generate feedback, scores, transcripts, prep sheets, and chat replies — this
                requires sending relevant content to the AI providers listed below.
              </li>
              <li>To calibrate what the app shows you (which chapters, which weak areas).</li>
              <li>To enforce rate limits and per-user spend caps so the product stays usable.</li>
              <li>To debug errors and understand product usage in aggregate.</li>
            </ul>
            <p>
              We do not sell your personal information, and we do not use your content to train our
              own models.
            </p>

            <h2 id="ai-processing">AI processing and subprocessors</h2>
            <p>
              Delivering an AI-powered product means parts of your content are sent to third-party
              AI providers for processing. We use these providers today:
            </p>
            <ul>
              <li>
                <strong>Anthropic (Claude)</strong> — receives resume text, chat messages, mock
                interview answers, question bank responses, and profile context to generate chatbot
                replies, scoring, feedback, prep sheets, and study explanations.
              </li>
              <li>
                <strong>OpenAI</strong> — receives mock-interview audio/video for speech-to-text
                transcription, and text content (chats, firm data) to generate search embeddings
                that power semantic search.
              </li>
              <li>
                <strong>Supabase</strong> — hosts our database, handles authentication
                (email/password and Google sign-in), and stores uploaded files (resumes,
                mock-interview recordings) in per-user storage.
              </li>
              <li>
                <strong>Upstash</strong> — powers rate limiting on AI-calling routes. It sees
                request counts keyed to your account, not the content of your requests.
              </li>
              <li>
                <strong>Vercel</strong> — hosts the application and the serverless functions that
                run it.
              </li>
              <li>
                <strong>Sentry</strong> — receives error reports and performance data so we can fix
                bugs. Session replay is off for ordinary browsing and only turns on for the session
                that hit an error; personal data like cookies, form values, and full request bodies
                is stripped before it&apos;s sent, and only your account ID (not name or email) is
                attached.
              </li>
              <li>
                <strong>PostHog</strong> — optional product analytics (page views and feature
                usage), active only on deployments where it&apos;s configured. Our analytics code is
                built to send category-level events and your account ID — never message content,
                resumes, or recordings.
              </li>
            </ul>
            <p>
              AI providers process your content to return a response to that request. They are not
              used by us to train models on your data, and we do not permit them to use your content
              to train their models under our agreements with them.
            </p>

            <h2 id="sharing">Data sharing and disclosure</h2>
            <p>
              We do not sell your personal information. We share data only with the service
              providers above, each of which processes data solely to provide the service they
              perform for us, and as required by law (for example, a valid legal request).
            </p>

            <h2 id="retention">Data retention</h2>
            <p>We keep your account data for as long as your account is active. Some specifics:</p>
            <ul>
              <li>
                Raw mock-interview audio and video files are automatically deleted 30 days after
                they&apos;re recorded. The text transcript and AI scorecard from that session are
                kept as part of your account history.
              </li>
              <li>Resumes are kept until you delete them or delete your account.</li>
              <li>
                You can delete your account and everything tied to it at any time — go to{" "}
                <strong>Profile → Settings → Delete my account</strong>. Deletion removes your data
                from our database and file storage and is irreversible.
              </li>
            </ul>

            <h2 id="your-rights">Your rights</h2>
            <p>You have control over your data:</p>
            <ul>
              <li>
                <strong>Access</strong> — you can review the data associated with your account from
                within the app (profile, resumes, mock sessions, chat history, contacts).
              </li>
              <li>
                <strong>Deletion</strong> — delete your account at any time from{" "}
                <strong>Profile → Settings</strong>; this is immediate and irreversible.
              </li>
              <li>
                <strong>Portability</strong> — a self-serve export tool isn&apos;t built yet; in the
                meantime, email us and we&apos;ll get you a copy of your data.
              </li>
            </ul>

            <h2 id="security">Security</h2>
            <p>
              Access to your data is enforced at the database level — every row you own is scoped to
              your account, and files are served through short-lived signed links rather than public
              URLs. AI provider API keys are only ever used server-side and never reach your
              browser.
            </p>

            <h2 id="eligibility">Who this applies to</h2>
            <p>
              Street Prep AI is built for students preparing for investment banking recruiting and
              is intended for users age 13 and up. If you believe a child under 13 has created an
              account, contact us and we&apos;ll remove it.
            </p>

            <h2 id="changes">Changes to this policy</h2>
            <p>
              If we materially change how we collect or use data, we&apos;ll update this page and
              change the effective date above. Continued use of the product after a change means you
              accept the updated policy.
            </p>

            <h2 id="contact">Contact us</h2>
            <p>
              Questions about this policy or your data? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-4 px-6 py-10 text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-foreground text-base leading-none">Street Prep</span>
            <span className="text-primary font-mono text-[10px] font-medium tracking-[0.14em]">
              AI
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <nav className="flex items-center gap-4 font-mono text-xs" aria-label="Legal">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </nav>
            <p className="font-mono text-xs">Prototype · {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
