import { CreateWorkflowForm } from "@/components/workflows/CreateWorkflowForm"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { redirect } from "next/navigation"

export default async function NewWorkflowPage() {
    const user = await getCurrentUser()

    if (!user?.org_id) {
        redirect('/login')
    }

    const isTrial = (user.organizations?.plan_type || user.organizations?.plan)?.toLowerCase() === 'trial'

    return (
        <div className="mx-auto max-w-xl py-20">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold">
                    {isTrial ? "Generate your first article" : "Create a new workflow"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {isTrial
                        ? "Name your workflow and we'll start generating a full-length article for you."
                        : "Give your workflow a name to get started."}
                </p>
            </div>
            <CreateWorkflowForm isTrial={isTrial} />
        </div>
    )
}
