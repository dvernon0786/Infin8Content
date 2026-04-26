import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KeywordSettingsForm from './keyword-settings-form'

export default async function KeywordSettingsPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/create-organization')
  }

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('keyword_settings')
    .eq('id', currentUser.org_id)
    .single() as any

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-poppins text-h2-desktop font-bold text-neutral-900">Keyword Settings</h1>
          <Link
            href="/settings/organization"
            className="font-lato text-small font-medium text-blue-600 hover:text-blue-700"
          >
            ← Organization Settings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="font-lato text-small text-neutral-600 mb-6">
            These settings control the geographic region and language used when extracting
            keywords from competitor sites. Changes take effect on the next competitor analysis run.
          </p>
          <KeywordSettingsForm keywordSettings={org?.keyword_settings ?? null} />
        </div>
      </div>
    </div>
  )
}
