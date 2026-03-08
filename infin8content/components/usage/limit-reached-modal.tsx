"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/config/plan-limits";
import { Zap, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: keyof typeof PLAN_LIMITS.article_generation;
}

export function LimitReachedModal({
    isOpen,
    onClose,
    plan,
}: LimitReachedModalProps) {
    const currentLimit = PLAN_LIMITS.article_generation[plan];
    const nextPlan = plan === "trial" ? "starter" : plan === "starter" ? "pro" : "agency";
    const nextLimit = PLAN_LIMITS.article_generation[nextPlan as keyof typeof PLAN_LIMITS.article_generation];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] border-neutral-200">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-[--color-warning]/10 flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-[--color-warning]" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-neutral-900">
                        You&apos;ve reached your monthly article limit
                    </DialogTitle>
                    <DialogDescription className="text-neutral-600 pt-2">
                        Your current {plan} plan includes {currentLimit} articles per month.
                        Upgrade to {nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)} for {nextLimit} articles.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Single Add-on</p>
                            <p className="text-sm font-semibold text-neutral-900">Buy 1 extra article</p>
                        </div>
                        <p className="text-lg font-bold text-neutral-900">$3</p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="sm:flex-1">
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        className="sm:flex-1 flex items-center gap-2"
                        onClick={() => {
                            // TODO: Implement Stripe Checkout for single article add-on
                            alert("Single article purchases are coming soon! Please upgrade your plan for immediate access.");
                        }}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Buy extra
                    </Button>
                    <Button asChild className="sm:flex-1 bg-[--gradient-brand] border-none">
                        <Link href="/dashboard/settings/billing">Upgrade Plan</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
