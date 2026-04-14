"use client";

import React from "react";
import { Check } from "lucide-react";

export default function FeatureValueSection() {
    const features = [
        "AI research agents",
        "Keyword clustering",
        "Brand voice training",
        "Internal link automation",
        "SEO metadata generation",
        "Image generation",
        "CMS publishing",
    ];

    return (
        <section className="bg-white py-24 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl font-poppins">
                        Everything you need to scale SEO
                    </h2>
                    <p className="mt-4 text-lg text-neutral-600 font-lato">
                        Built by SEO pros for high-performance content teams.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                    {features.map((feature) => (
                        <div key={feature} className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                <Check className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-neutral-900">
                                    {feature}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
