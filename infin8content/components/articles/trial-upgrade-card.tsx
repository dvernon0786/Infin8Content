import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TrialUpgradeCardProps {
    lockedCount: number
    lockedTitles: string[]
}

export function TrialUpgradeCard({ lockedCount, lockedTitles }: TrialUpgradeCardProps) {
    if (lockedCount === 0) return null

    return (
        <Card className="border-[--brand-electric-blue]/20 bg-gradient-to-br from-[--brand-electric-blue]/5 to-white shadow-md overflow-hidden">
            <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-[--brand-electric-blue]">
                            <Crown className="h-5 w-5 fill-current" />
                            <span className="font-poppins font-bold text-sm uppercase tracking-wider">Your article is ready!</span>
                        </div>

                        <h3 className="font-poppins text-neutral-900 text-h3-desktop">
                            Your keyword cluster contains <span className="text-[--brand-electric-blue]">{lockedCount} more</span> article opportunities.
                        </h3>

                        <p className="font-lato text-neutral-600 text-body">
                            You've reached the limit of your $1 trial. Upgrade your plan to unlock the rest of your content strategy and start publishing.
                        </p>

                        {lockedTitles.length > 0 && (
                            <div className="space-y-2 py-2">
                                <p className="font-lato text-xs font-bold text-neutral-400 uppercase tracking-widest">Locked Articles</p>
                                <div className="space-y-1.5">
                                    {lockedTitles.map((title, i) => (
                                        <div key={i} className="flex items-center gap-2 text-neutral-500 text-sm italic">
                                            <Lock className="h-3 w-3" />
                                            <span>{title}</span>
                                        </div>
                                    ))}
                                    {lockedCount > lockedTitles.length && (
                                        <p className="font-lato text-xs text-[--brand-electric-blue] font-bold mt-2">
                                            + {lockedCount - lockedTitles.length} more articles in this cluster
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
                        <Button size="lg" className="bg-[--brand-electric-blue] hover:bg-[--brand-electric-blue]/90 text-white font-bold h-12" asChild>
                            <Link href="/dashboard/settings/billing">
                                Unlock All Articles
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <p className="text-center font-lato text-xs text-neutral-400 mt-1">
                            Upgrade takes less than 10 seconds
                        </p>
                        <p className="text-center font-lato text-xs text-neutral-400 mt-0.5">
                            Your $1 trial credit will be applied
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
