type Article = {
  id: string
  status: 'queued' | 'generating' | 'completed' | 'failed'
  generation_started_at?: string
  organization_id?: string
}

type Section = {
  id: string
  section_order: number
  section_header: string
  status: 'pending' | 'researching' | 'completed' | 'failed' | 'writing'
  updated_at?: string
}

export function calculateArticleProgress(input: { article: Article; sections: Section[] }) {
  const { article, sections } = input

  const totalSections = sections.length
  const completedSections = sections.filter((s) => s.status === 'completed').length
  const percentage = totalSections === 0 ? 0 : Math.floor((completedSections / totalSections) * 100)

  // currentSection should be a simplified object matching test expectations
  const rawCurrent = sections.find((s) => s.status !== 'completed' && s.status !== 'failed')
  const currentSection = rawCurrent
    ? {
        id: rawCurrent.id,
        section_order: rawCurrent.section_order,
        section_header: rawCurrent.section_header,
        status: rawCurrent.status
      }
    : undefined

  let timing: { averageSectionDurationSeconds?: number; estimatedCompletionAt?: Date | undefined } = {}

  if (article.status !== 'completed' && article.status !== 'failed' && completedSections > 0) {
    const genStarted = article.generation_started_at ? new Date(article.generation_started_at) : new Date()

    // use the most recent section updated_at as the reference 'now' for ETA calculations
    const latestUpdated = sections.reduce((acc: string | undefined, s) => {
      if (!s.updated_at) return acc
      if (!acc) return s.updated_at
      return new Date(s.updated_at) > new Date(acc) ? s.updated_at : acc
    }, article.generation_started_at)

    const reference = latestUpdated ? new Date(latestUpdated) : new Date()
    const elapsedSeconds = Math.max(0, Math.floor((reference.getTime() - genStarted.getTime()) / 1000))

    if (completedSections > 0) {
      const avg = Math.floor(elapsedSeconds / completedSections)
      timing.averageSectionDurationSeconds = avg
      const remaining = Math.max(0, totalSections - completedSections)
      timing.estimatedCompletionAt = new Date(reference.getTime() + avg * 1000 * remaining)
    }
  }

  let status: Article['status'] = article.status
  let error: { failedSectionOrder?: number } | undefined
  const failed = sections.find((s) => s.status === 'failed')
  if (failed) {
    status = 'failed'
    error = { failedSectionOrder: failed.section_order }
  }

  return {
    progress: {
      completedSections,
      totalSections,
      percentage,
      currentSection
    },
    timing,
    status,
    error
  }
}
