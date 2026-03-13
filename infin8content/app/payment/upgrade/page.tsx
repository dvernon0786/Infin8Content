import Link from 'next/link'

export default function UpgradePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Trial has Expired
                </h1>
                <p className="text-gray-600 mb-8">
                    We hope you enjoyed your $1 trial! To continue generating articles and regain access to the dashboard, please upgrade to a full plan.
                </p>
                <Link
                    href="/payment"
                    className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View Plans & Upgrade
                </Link>
            </div>
        </div>
    )
}
