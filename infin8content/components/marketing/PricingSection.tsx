"use client"

import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'agency'>('starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  const plans = {
    starter: {
      name: "Starter",
      tagline: "GREAT FOR SMALL TEAMS LAUNCHING THEIR FIRST WORKFLOWS.",
      subtitle: "Launch fast, learn faster.",
      monthlyPrice: 89,
      annualPrice: 59,
      savingsPercent: 34,
      features: [
        "UP TO 5 PROJECTS",
        "BASIC AUTOMATIONS",
        "30-DAY RUN HISTORY",
        "EMAIL SUPPORT"
      ]
    },
    pro: {
      name: "Pro",
      tagline: "PERFECT FOR GROWING TEAMS SCALING THEIR OPERATIONS.",
      subtitle: "Grow with confidence.",
      monthlyPrice: 220,
      annualPrice: 175,
      savingsPercent: 20,
      features: [
        "UP TO 20 PROJECTS",
        "ADVANCED AUTOMATIONS",
        "90-DAY RUN HISTORY",
        "PRIORITY EMAIL SUPPORT",
        "CUSTOM INTEGRATIONS",
        "TEAM COLLABORATION"
      ]
    },
    agency: {
      name: "Enterprise",
      tagline: "BUILT FOR ENTERPRISES REQUIRING SCALE & SECURITY.",
      subtitle: "Tailored for scale & security.",
      monthlyPrice: 399,
      annualPrice: 299,
      savingsPercent: 25,
      features: [
        "UNLIMITED PROJECTS",
        "ENTERPRISE AUTOMATIONS",
        "UNLIMITED RUN HISTORY",
        "24/7 PHONE SUPPORT",
        "DEDICATED ACCOUNT MANAGER",
        "SSO & ADVANCED SECURITY",
        "SLA GUARANTEES",
        "CUSTOM TRAINING"
      ]
    }
  };

  const currentPlan = plans[selectedPlan];
  const price = billingCycle === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualPrice;
  const displayPrice = billingCycle === 'annually' ? price * 12 : price;

  return (
    <section className="min-h-screen bg-gradient-mesh section-padding-mobile md:section-padding" id="pricing">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">

          {/* LEFT COLUMN - Plan Selection (40%) */}
          <div className="md:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
                Simple pricing<br />that grows with you
              </h2>
              <p className="text-lg text-neutral-600">
                Pick a plan today and switch anytime. Clear value across Starter, Pro, and Enterprise.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="inline-flex bg-white rounded-xl shadow-sm p-1 border border-neutral-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  billingCycle === 'annually'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                ANNUALLY
              </button>
            </div>

            {/* Plan Cards */}
            <div className="space-y-3">
              {Object.entries(plans).map(([key, plan]) => {
                const isActive = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key as any)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-white shadow-lg border-2 border-blue-500'
                        : 'bg-white/60 hover:bg-white border border-neutral-200 hover:shadow-md'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-lg text-neutral-900">{plan.name}</p>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">
                        {plan.subtitle}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      <ArrowRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN - Plan Details (60%) */}
          <div className="md:col-span-3">
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-10 shadow-2xl text-white">
              {/* Plan Name */}
              <h3 className="text-3xl font-bold mb-2">{currentPlan.name}</h3>

              {/* Price */}
              <div className="flex items-end gap-2 mb-4">
                <span className="text-6xl font-bold">
                  ${displayPrice.toLocaleString()}
                </span>
                <span className="text-neutral-400 text-lg mb-2">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              {/* Savings Badge */}
              {billingCycle === 'annually' && (
                <div className="inline-block mb-6">
                  <span className="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold border border-blue-500/30">
                    Save {currentPlan.savingsPercent}%
                  </span>
                </div>
              )}

              {/* Tagline */}
              <p className="text-xs uppercase tracking-wider text-neutral-400 mb-8 font-semibold">
                {currentPlan.tagline}
              </p>

              {/* Features List */}
              <ul className="space-y-4 mb-10">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Check size={20} className="text-blue-400" strokeWidth={3} />
                    </div>
                    <span className="text-neutral-200 text-base leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="pt-6 border-t border-neutral-700">
                <p className="text-sm text-neutral-400 mb-4">
                  Have special requirements?{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                    Talk to sales
                  </a>
                  .
                </p>

                {/* CTA Button */}
                <button className="w-full bg-white text-neutral-900 font-bold py-4 px-6 rounded-xl hover:bg-neutral-100 transition-all hover:scale-[1.02] shadow-xl">
                  Get Started
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PricingSection;
