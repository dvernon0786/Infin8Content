"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageMeter } from "@/components/usage/usage-meter";
import { PLAN_LIMITS } from "@/lib/config/plan-limits";
import { BarChart3 } from "lucide-react";

interface UsageCardProps {
    usage: {
        articles: number;
        keywords: number;
    };
    plan: keyof typeof PLAN_LIMITS.article_generation;
}

export function UsageCard({ usage, plan }: UsageCardProps) {
    const articleLimit = PLAN_LIMITS.article_generation[plan];
    const keywordLimit = PLAN_LIMITS.keyword_research[plan];

    return (
        <Card className="border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-neutral-900">
                    <BarChart3 className="w-4 h-4 text-[#217CEB]" />
                    Monthly Usage
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                <UsageMeter
                    label="Articles"
                    used={usage.articles}
                    limit={articleLimit}
                    unit="articles"
                    upgradeText={plan === "starter" ? "Upgrade to Pro for 50 articles" : plan === "pro" ? "Upgrade to Agency for 150 articles" : ""}
                />

                <UsageMeter
                    label="Keyword Research"
                    used={usage.keywords}
                    limit={keywordLimit}
                    unit="researches"
                    upgradeText={plan === "starter" ? "Upgrade to Pro for 200 keywords" : ""}
                />
            </CardContent>
        </Card>
    );
}
