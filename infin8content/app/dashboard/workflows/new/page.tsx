import { CreateWorkflowForm } from "@/components/workflows/CreateWorkflowForm"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { redirect } from "next/navigation"

export default async function NewWorkflowPage() {
    const user = await getCurrentUser()

    if (!user?.org_id) {
        redirect('/login')
    }

    const isTrial = (user.organizations?.plan || user.organizations?.plan_type)?.toLowerCase() === 'trial'

    return (
        <div className="mx-auto max-w-xl py-20">
            <div className="text-center mb-8">
                <h1 className="font-poppins text-h2-desktop font-bold text-neutral-900">
                    {isTrial ? "Generate your first article" : "Create a new workflow"}
                </h1>
                <p className="mt-2 font-lato text-body text-neutral-600">
                    {isTrial
                        ? "Name your workflow and we'll start generating a full-length article for you."
                        : "Give your workflow a name to get started."}
                </p>
            </div>
            <CreateWorkflowForm isTrial={isTrial} />
        </div>
    )
}
