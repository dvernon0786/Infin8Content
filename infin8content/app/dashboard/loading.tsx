import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[125px] rounded-xl" />
                <Skeleton className="h-[125px] rounded-xl" />
                <Skeleton className="h-[125px] rounded-xl" />
            </div>
        </div>
    )
}
