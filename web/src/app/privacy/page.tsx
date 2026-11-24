import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-950 antialiased">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Top Brand & Back Navigation */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 64 64"
              className="h-8 w-8 shrink-0 fill-[#126b47]"
            >
              <ellipse cx="11" cy="28" rx="6" ry="9" transform="rotate(-25 11 28)" />
              <ellipse cx="23" cy="14" rx="7" ry="10" transform="rotate(-14 23 14)" />
              <ellipse cx="41" cy="14" rx="7" ry="10" transform="rotate(14 41 14)" />
              <ellipse cx="53" cy="28" rx="6" ry="9" transform="rotate(25 53 28)" />
              <path
                fillRule="evenodd"
                d="M32 25c-9 0-21 15-21 24 0 7 6 10 12 8 4-1 6-3 9-3s5 2 9 3c6 2 12-1 12-8 0-9-12-24-21-24Zm0 24-7-7a4.5 4.5 0 0 1 7-5 4.5 4.5 0 0 1 7 5l-7 7Z"
              />
            </svg>
            <span>
              KibblePer<span className="text-[#126b47]">Pound</span>
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-[#126b47] hover:text-[#126b47]"
          >
            ← Back to Price Comparison
          </Link>
        </header>

        {/* Main Policy Card */}
        <main className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy &amp; Disclosure
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Last updated: November 2026
          </p>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-gray-700">
            <p>
              <strong className="font-semibold text-slate-900">KibblePerPound</strong>{' '}
              (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates{' '}
              <span className="font-medium text-slate-900">kibbleperpound.com</span> to
              help pet owners compare true pet food unit prices ($/lb) across major
              retailers.
            </p>

            <section className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Affiliate Disclosure
              </h2>
              <p>
                <strong className="font-semibold text-slate-900">
                  As an Amazon Associate I earn from qualifying purchases.
                </strong>{' '}
                KibblePerPound also participates in affiliate marketing programs through
                Impact partner networks (such as Chewy, Petco, Walmart, and Target).
                When you click on retailer links on our site and make a qualifying
                purchase, we may earn a commission at no additional cost to you.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Pricing Accuracy
              </h2>
              <p>
                Product weights, regular prices, and Auto-Ship discounts are verified
                regularly from retailer feeds, but prices and availability can change at
                any time. Always confirm the final price and bag size on the merchant&apos;s
                checkout page before purchasing.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Cookies &amp; Analytics
              </h2>
              <p>
                We do not sell, rent, or trade your personal information. Standard web
                analytics and third-party retailer affiliate cookies may be used to
                measure site traffic and attribute qualifying referrals when you visit
                partner stores.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, pricing data, or
                affiliate partnerships, contact us at{' '}
                <a
                  href="mailto:contact@kibbleperpound.com"
                  className="font-medium text-[#126b47] hover:underline"
                >
                  contact@kibbleperpound.com
                </a>
                .
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
