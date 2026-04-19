"use client"

/**
 * app/dashboard/llm-visibility/new/page.tsx
 *
 * 3-step wizard: Brand info → Competitors → Review & activate
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Plus, X, Sparkles, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

const AVAILABLE_MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'ChatGPT', color: '#10A37F' },
  { id: 'perplexity/sonar', label: 'Perplexity', color: '#3FAFF5' },
  { id: 'anthropic/claude-3-5-haiku', label: 'Claude', color: '#D97706' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini', color: '#4285F4' },
]

interface StepProps { onNext: (data: any) => void; onBack?: () => void; data: any }

function Step1Brand({ onNext, data }: StepProps) {
  const [brandName, setBrandName] = useState(data.brandName ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(data.websiteUrl ?? '')
  const [aliases, setAliases] = useState<string[]>(data.brandAliases ?? [])
  const [aliasInput, setAliasInput] = useState('')
  const [desc, setDesc] = useState(data.businessDescription ?? '')
  const [selectedModels, setSelectedModels] = useState<string[]>(
    data.models ?? ['openai/gpt-4o-mini', 'perplexity/sonar', 'anthropic/claude-3-5-haiku']
  )

  const addAlias = () => {
    if (aliasInput.trim() && !aliases.includes(aliasInput.trim())) {
      setAliases(prev => [...prev, aliasInput.trim()])
      setAliasInput('')
    }
  }

  const toggleModel = (id: string) => {
    setSelectedModels(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(m => m !== id) : prev
        : [...prev, id]
    )
  }

  const isValid = brandName.trim().length > 0 && websiteUrl.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Brand name *</label>
        <input
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          placeholder="Infin8Content"
          value={brandName}
          onChange={e => setBrandName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Website URL *</label>
        <div className="relative">
          <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            placeholder="https://infin8content.com"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
          />
        </div>
        <p className="text-xs text-neutral-400 mt-1.5">We'll crawl this to understand your product and auto-generate prompts.</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Brand aliases</label>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Alternate name or abbreviation"
            value={aliasInput}
            onChange={e => setAliasInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAlias()}
          />
          <button onClick={addAlias} className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {aliases.map(a => (
            <span key={a} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              {a}
              <button onClick={() => setAliases(prev => prev.filter(x => x !== a))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Business description</label>
        <textarea
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-400"
          rows={3}
          placeholder="AI-powered content platform for marketing teams..."
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2 block">Track across</label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => toggleModel(m.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selectedModels.includes(m.id)
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
              {m.label}
              {selectedModels.includes(m.id) && <CheckCircle2 size={14} className="ml-auto text-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onNext({ brandName, websiteUrl, brandAliases: aliases, businessDescription: desc, models: selectedModels })}
        disabled={!isValid}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
      >
        Continue <ArrowRight size={14} />
      </button>
    </div>
  )
}

function Step2Competitors({ onNext, onBack, data }: StepProps) {
  const [competitors, setCompetitors] = useState<Array<{ name: string; domain: string }>>(data.competitors ?? [])
  const [nameInput, setNameInput] = useState('')
  const [domainInput, setDomainInput] = useState('')

  const addComp = () => {
    if (nameInput.trim()) {
      setCompetitors(prev => [...prev, { name: nameInput.trim(), domain: domainInput.trim() }])
      setNameInput('')
      setDomainInput('')
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        Add competitors to benchmark your brand's share of voice against theirs in AI responses.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Competitor name</label>
          <input
            className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Jasper"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addComp()}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Domain (optional)</label>
          <input
            className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            placeholder="jasper.ai"
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
          />
        </div>
      </div>
      <button onClick={addComp} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-800">
        <Plus size={14} />Add competitor
      </button>

      {competitors.length > 0 && (
        <div className="space-y-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3">
              <div>
                <div className="text-sm font-medium text-neutral-800">{c.name}</div>
                {c.domain && <div className="text-xs text-neutral-400">{c.domain}</div>}
              </div>
              <button onClick={() => setCompetitors(prev => prev.filter((_, j) => j !== i))}>
                <X size={14} className="text-neutral-400 hover:text-neutral-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
          Back
        </button>
        <button
          onClick={() => onNext({ competitors })}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
        >
          Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

function Step3Confirm({ onNext, onBack, data }: StepProps) {
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    setLoading(true)
    // POST /api/llm-visibility/projects with full data
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    onNext({})
  }

  return (
    <div className="space-y-6">
      <div className="bg-neutral-50 rounded-2xl p-5 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-neutral-400">Brand</span><span className="font-semibold text-neutral-800">{data.brandName}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Website</span><span className="font-medium text-blue-600">{data.websiteUrl}</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Models</span><span className="font-medium text-neutral-700">{data.models?.length ?? 0} selected</span></div>
        <div className="flex justify-between"><span className="text-neutral-400">Competitors</span><span className="font-medium text-neutral-700">{data.competitors?.length ?? 0} added</span></div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
        <Sparkles size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          We'll crawl your website and automatically generate tracking prompts. Your first visibility report will be ready within minutes.
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
          Back
        </button>
        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" />Activating…</> : <>Activate tracking <ArrowRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}

export default function NewVisibilityProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<any>({})

  const steps = ['Brand info', 'Competitors', 'Activate']

  const handleNext = (stepData: any) => {
    const merged = { ...formData, ...stepData }
    setFormData(merged)
    if (step < 2) { setStep(s => s + 1) }
    else { router.push('/dashboard/llm-visibility') }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i <= step ? 'text-white' : 'bg-neutral-200 text-neutral-400'
                  }`}
                  style={i <= step ? { background: 'linear-gradient(to right, #217CEB, #4A42CC)' } : {}}
                >
                  {i < step ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-neutral-900' : 'text-neutral-400'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-neutral-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          <h2 className="text-lg font-bold text-neutral-900 font-poppins mb-6">
            {step === 0 && 'Tell us about your brand'}
            {step === 1 && 'Add competitors to track'}
            {step === 2 && 'Review and activate'}
          </h2>

          {step === 0 && <Step1Brand onNext={handleNext} data={formData} />}
          {step === 1 && <Step2Competitors onNext={handleNext} onBack={() => setStep(0)} data={formData} />}
          {step === 2 && <Step3Confirm onNext={handleNext} onBack={() => setStep(1)} data={formData} />}
        </div>
      </div>
    </div>
  )
}
