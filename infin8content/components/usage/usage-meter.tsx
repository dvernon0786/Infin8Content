"use client";

import React from "react";
import { cn } from "@/lib/utils";

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
                    <span className="text-sm font-bold text-[#217CEB] uppercase tracking-wider text-[10px]">
                        Unlimited
                    </span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                    <div className="h-full w-full bg-gradient-to-r from-[#217CEB] to-[#4A42CC] opacity-20" />
                </div>
            </div>
        );
    }

    const percent = Math.min(100, Math.round((used / limit) * 100));
    const remaining = Math.max(0, limit - used);
    const isNearLimit = percent >= 80;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex justify-between items-end">
                <label className="text-sm font-medium text-neutral-900">{label}</label>
                <span className="text-sm font-bold text-neutral-500">
                    {used} / {limit} {unit}
                </span>
            </div>

            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        isNearLimit
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : "bg-gradient-to-r from-[#217CEB] to-[#4A42CC]"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{remaining} remaining</span>
                {isNearLimit && (
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">
                        Near Limit
                    </span>
                )}
            </div>

            {isNearLimit && (
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-[11px] text-orange-800 font-medium">
                        You&apos;re close to your monthly limit. {upgradeText}
                    </p>
                </div>
            )}
        </div>
    );
}
