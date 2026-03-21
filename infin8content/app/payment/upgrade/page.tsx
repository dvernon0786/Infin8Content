import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import PaymentForm from '../payment-form'

export default async function UpgradePage() {
    const currentUser = await getCurrentUser()
    if (!currentUser) redirect('/login')

    const hasUsedTrial = (currentUser?.organizations as any)?.has_used_trial ?? true

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-16 px-4 pb-20">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center mb-12 border-2 border-red-500">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Trial has Expired
                </h1>
                <p className="text-gray-600">
                    We hope you enjoyed your $1 trial! To continue generating articles and regain access to the dashboard, please upgrade to a full plan below.
                </p>
            </div>

            <PaymentForm hasUsedTrial={hasUsedTrial} redirectTo="/dashboard" />
        </div>
    )
}
