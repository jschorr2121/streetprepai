import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: "The rules for using Street Prep AI, including acceptable use and AI disclaimers.",
};

const EFFECTIVE_DATE = "July 20, 2026";
const CONTACT_EMAIL = "jacobschorr99@gmail.com";

export default function TermsOfServicePage() {
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
            <h1 className="font-display mt-3 text-4xl md:text-5xl">Terms of Service</h1>
            <p className="text-muted-foreground mt-4 font-mono text-xs">
              Effective {EFFECTIVE_DATE}
            </p>
          </div>
        </section>

        {/* ── Body ────────────────────────────────────────────────── */}
        <section>
          <div className="prose-guide mx-auto px-6 py-12 md:py-16">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of Street Prep AI (the
              &quot;Service&quot;). By creating an account or using the Service, you agree to these
              Terms. If you don&apos;t agree, don&apos;t use the Service.
            </p>

            <h2 id="the-service">1. The service</h2>
            <p>
              Street Prep AI is an AI-powered recruiting-prep product for investment banking
              candidates: a course spine, voice and video mock interviews with AI scoring, resume
              coaching, a networking memory tool, a technical question bank, and firm/sector
              reference content. It is a prototype under active development — some tools may change,
              be limited, or be unavailable at times.
            </p>

            <h2 id="eligibility">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. Street Prep AI is built for
              students and early-career candidates preparing for IB recruiting; it is not intended
              for general commercial use.
            </p>

            <h2 id="your-account">3. Your account</h2>
            <ul>
              <li>You&apos;re responsible for the accuracy of the information you provide.</li>
              <li>
                You&apos;re responsible for keeping your login credentials secure and for activity
                that happens under your account.
              </li>
              <li>
                One account per person. Don&apos;t share credentials or impersonate someone else.
              </li>
            </ul>

            <h2 id="acceptable-use">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Abuse, overload, or attempt to disrupt the Service.</li>
              <li>
                Scrape, crawl, or bulk-extract content or data from the Service outside normal use
                of the product.
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract the source code of the Service.
              </li>
              <li>
                Attempt to bypass rate limits, spend caps, or other technical controls, including by
                creating multiple accounts to get around per-user limits.
              </li>
              <li>
                Upload content you don&apos;t have the right to share, or content that is illegal,
                harassing, or infringing.
              </li>
              <li>Use the Service to build a competing product.</li>
            </ul>
            <p>We may suspend or terminate access for violating this section.</p>

            <h2 id="ai-disclaimer">5. AI-generated content disclaimer</h2>
            <p>
              Feedback, scores, transcripts, prep sheets, and explanations generated by the Service
              are produced by AI models and are <strong>practice aids only</strong>. They:
            </p>
            <ul>
              <li>
                May be inaccurate, incomplete, or reflect the AI model&apos;s limitations rather
                than reality.
              </li>
              <li>
                Are not career advice, financial advice, or a substitute for professional judgment.
              </li>
              <li>Do not guarantee any interview, offer, or job outcome.</li>
            </ul>
            <p>
              Use your own judgment, and treat AI feedback as one input among several — not the
              final word.
            </p>

            <h2 id="intellectual-property">6. Intellectual property</h2>
            <p>
              You retain ownership of the content you create or upload (resumes, notes, answers,
              recordings). By using the Service, you grant us a limited license to store, process,
              and transmit that content — including to the AI providers listed in our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              — solely to provide the Service to you.
            </p>
            <p>
              Everything else about the Service — the course content, product design, and underlying
              software — belongs to us or our licensors. These Terms don&apos;t grant you any rights
              to it beyond using the Service as intended.
            </p>

            <h2 id="termination">7. Termination</h2>
            <p>
              You can stop using the Service and delete your account at any time from Profile →
              Settings. We may suspend or terminate your access if you violate these Terms, or
              discontinue the Service (or parts of it) at our discretion, with notice where
              practical.
            </p>

            <h2 id="disclaimer">8. &quot;As is&quot; — no warranty</h2>
            <p>
              The Service is provided{" "}
              <strong>&quot;as is&quot; and &quot;as available,&quot;</strong> without warranties of
              any kind, express or implied — including that it will be uninterrupted, error-free, or
              that AI outputs will be accurate. As a working prototype, features may break, change,
              or be removed.
            </p>

            <h2 id="liability">9. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for any indirect,
              incidental, or consequential damages arising from your use of the Service — including
              any decision you make based on AI-generated feedback. Our total liability for any
              claim relating to the Service is limited to the amount you paid us in the twelve
              months before the claim arose (or $0 if you haven&apos;t paid us anything).
            </p>

            <h2 id="governing-law">10. Governing law</h2>
            <p>
              These Terms are governed by the laws of{" "}
              <strong>
                [Jake: choose governing law — e.g. the state where you&apos;re incorporated or
                based]
              </strong>
              , without regard to conflict-of-law principles.
            </p>

            <h2 id="changes">11. Changes to these terms</h2>
            <p>
              We may update these Terms as the product changes. If we make a material change,
              we&apos;ll update the effective date above. Continuing to use the Service after a
              change means you accept the updated Terms.
            </p>

            <h2 id="contact">12. Contact us</h2>
            <p>
              Questions about these Terms? Email{" "}
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
