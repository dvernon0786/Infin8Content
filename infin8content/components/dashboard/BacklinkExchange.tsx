"use client"
import { useState } from "react"

export default function BacklinkExchange() {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center mb-12">
        <h1 className="font-poppins text-h2-desktop font-bold text-neutral-900 leading-tight mb-3">Exchange Backlinks with Sites<br/>in Your Niche</h1>
        <p className="font-lato text-body text-neutral-600 max-w-xl mx-auto mb-6">You link to them, they link to you. We match you with relevant, high-quality sites at a similar domain rating — so both sides grow their authority together.</p>
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold">JK</div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">MS</div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">AR</div>
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">TL</div>
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">PW</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mb-2">
          <div className="text-amber-400 flex gap-1">★★★★★</div>
        </div>
        <div className="text-xs text-slate-400">Trusted by 23,000+ Marketers &amp; Agencies</div>
      </div>

      <section className="mb-12">
        <div className="text-center mb-6">
          <h2 className="font-poppins text-h3-desktop font-bold text-neutral-900">How it works</h2>
          <p className="font-lato text-body text-neutral-600">Three simple steps to start exchanging backlinks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-28 bg-gray-50 border-b border-gray-200 flex items-center justify-center"></div>
            <div className="p-4">
              <div className="text-xs font-bold text-blue-600 uppercase mb-1">Step 1</div>
              <div className="font-semibold mb-1">Join the Network</div>
              <div className="text-sm text-slate-500">We analyse your site's niche and domain rating to find the best exchange partners for you.</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-28 bg-gray-50 border-b border-gray-200 flex items-center justify-center"></div>
            <div className="p-4">
              <div className="text-xs font-bold text-blue-600 uppercase mb-1">Step 2</div>
              <div className="font-semibold mb-1">Get Matched</div>
              <div className="text-sm text-slate-500">Our algorithm pairs you with sites at a similar DR in complementary niches — so the exchange benefits both sides.</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="h-28 bg-gray-50 border-b border-gray-200 flex items-center justify-center"></div>
            <div className="p-4">
              <div className="text-xs font-bold text-blue-600 uppercase mb-1">Step 3</div>
              <div className="font-semibold mb-1">Exchange &amp; Grow</div>
              <div className="text-sm text-slate-500">You place their link, they place yours. Both sites gain authority from natural, contextual backlinks.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="text-center mb-6">
          <h2 className="font-poppins text-h3-desktop font-bold text-neutral-900">What you get</h2>
          <p className="font-lato text-body text-neutral-600">Everything you need for effortless link building</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold mb-1">AI-Powered Niche Matching</div>
            <div className="text-sm text-slate-500">Our algorithm analyses your content topics and audience to find the most relevant exchange partners.</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold mb-1">Quality Sites Only</div>
            <div className="text-sm text-slate-500">Every site is vetted for quality. We exclude PBNs, link farms, and low-authority domains.</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="font-semibold mb-1">Contextual Link Placement</div>
            <div className="text-sm text-slate-500">Links are placed naturally within relevant content — not in footers, sidebars, or author bios.</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-2xl p-8 items-start">
        <div>
          <h3 className="font-poppins text-h3-desktop font-bold text-neutral-900 mb-2">Ready to start exchanging backlinks?</h3>
          <p className="font-lato text-body text-neutral-600 mb-6">Get matched with quality sites and grow your domain authority every month.</p>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-extrabold">$70</span>
            <span className="text-sm text-slate-500">USD / mo</span>
          </div>
          <div className="text-xs text-slate-400 mb-4">Billed monthly</div>
          <div className="flex gap-3 items-center">
            <button className="bg-blue-600 text-white rounded-md px-5 py-2 font-semibold" onClick={() => alert('Add to plan')}>Add to My Plan</button>
            <button className="text-blue-600 font-medium" onClick={() => setOpen(true)}>Backlink Quality Guarantee</button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</div>
            Unlimited backlink exchanges per month
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</div>
            AI-powered niche &amp; DR matching
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</div>
            Quality-vetted sites only — no PBNs or link farms
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</div>
            Contextual, in-content link placements
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">✓</div>
            Dedicated exchange dashboard &amp; tracking
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${open ? "" : "pointer-events-none opacity-0"}`} aria-hidden={!open}>
        <div role="dialog" aria-modal="true" className={`bg-white rounded-lg w-96 max-w-[95vw] p-6 shadow-lg transform transition-all ${open ? "scale-100" : "scale-95"}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold">Backlink Quality Guarantee</h4>
              <p className="text-sm text-slate-500">We guarantee the quality of our backlinks to help you achieve better search engine rankings.</p>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className="text-slate-400">✕</button>
          </div>
          <div className="h-40 bg-gray-900 rounded mb-4 flex items-center justify-center text-white">Video placeholder</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-semibold">Ahrefs DR40+ Guaranteed</div>
              <div className="text-sm text-slate-500">Metrics will range from 40 up to 70</div>
            </div>
            <div>
              <div className="font-semibold">1000+ Monthly Organic Traffic</div>
              <div className="text-sm text-slate-500">Link placement in websites with at least 1000 monthly organic visitors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
