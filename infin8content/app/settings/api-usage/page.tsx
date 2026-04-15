/**
 * app/settings/api-usage/page.tsx
 * Epic 11, Story 11.6 — API usage analytics dashboard
 *
 * Server component — queries api_usage_logs for the current org
 * and renders per-key, per-month usage breakdown.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'API Usage — Infin8Content',
}

function formatMonth(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function ApiUsagePage() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.org_id) redirect('/login')

  const supabase = await createClient()

  // Fetch usage logs joined with api_keys for this org, current + last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: usageLogs } = await (supabase
    .from('api_usage_logs')
    .select('api_key_id, org_id, period_start, call_count, last_endpoint')
    .eq('org_id', currentUser.org_id)
    .gte('period_start', threeMonthsAgo.toISOString())
    .order('period_start', { ascending: false }) as any)

  const { data: apiKeys } = await (supabase
    .from('api_keys')
    .select('id, name, key_prefix, status')
    .eq('org_id', currentUser.org_id) as any)

  const keyMap = new Map((apiKeys ?? []).map((k: any) => [k.id, k]))

  const totalCallsThisMonth = (usageLogs ?? [])
    .filter((log: any) => {
      const logMonth = new Date(log.period_start).getMonth()
      const thisMonth = new Date().getMonth()
      return logMonth === thisMonth
    })
    .reduce((sum: number, log: any) => sum + (log.call_count ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Usage</h2>
        <p className="text-muted-foreground mt-1">
          Monthly API call counts per key over the last 3 months.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Calls This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCallsThisMonth.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(apiKeys ?? []).filter((k: any) => k.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(apiKeys ?? []).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Key (Last 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {!usageLogs?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No API calls recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead>Last Endpoint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(usageLogs ?? []).map((log: any, i: number) => {
                  const key = keyMap.get(log.api_key_id)
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key?.name ?? 'Deleted key'}</span>
                          {key?.key_prefix && (
                            <code className="font-mono text-xs bg-muted px-1 rounded">
                              {key.key_prefix}…
                            </code>
                          )}
                          {key && (
                            <Badge
                              variant={key.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs capitalize"
                            >
                              {key.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatMonth(log.period_start)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {(log.call_count ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.last_endpoint ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
