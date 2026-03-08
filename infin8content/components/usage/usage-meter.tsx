"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/custom/progress-bar";

interface UsageMeterProps {
    label: string;
    used: number;
    limit: number | null;
    unit?: string;
    className?: string;
    upgradeText?: string;
    planName?: string;
}

export function UsageMeter({
    label,
    used,
    limit,
    unit = "articles",
    className,
    upgradeText = "Upgrade to Pro for 50 articles",
    planName = "Starter",
}: UsageMeterProps) {
    if (limit === null) {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="flex justify-between items-end">
                    <label className="text-sm font-medium text-neutral-900">{label}</label>
                    <span className="text-sm font-bold text-[--color-primary-blue] uppercase tracking-wider text-[10px]">
                        Unlimited
                    </span>
                </div>
                <ProgressBar value={100} variant="brand" className="opacity-20" />
            </div>
        );
    }

    const percent = Math.min(100, Math.round((used / limit) * 100));
    const remaining = Math.max(0, limit - used);
    const isNearLimit = percent >= 80;
    const isOverLimit = percent >= 100;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex justify-between items-end">
                <label className="text-sm font-medium text-neutral-900">{label}</label>
                <span className="text-sm font-bold text-neutral-500">
                    {used} / {limit} {unit}
                </span>
            </div>

            <ProgressBar
                value={percent}
                variant={isOverLimit ? "error" : isNearLimit ? "warning" : "brand"}
                animated
            />


            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{remaining} remaining</span>
                {isNearLimit && (
                    <span className="text-[10px] font-bold text-[--color-warning] uppercase tracking-tight">
                        Near Limit
                    </span>
                )}
            </div>

            {isNearLimit && (
                <div className="p-3 bg-[--color-warning]/10 border border-[--color-warning]/20 rounded-lg">
                    <p className="text-[11px] text-[--color-warning] font-medium">
                        You&apos;re close to your monthly limit. {upgradeText}
                    </p>
                </div>
            )}
        </div>
    );
}
