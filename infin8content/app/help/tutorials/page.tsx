// Epic 12: Story 12-11 — Video Tutorials static page

import { TUTORIAL_VIDEOS } from '@/lib/config/help-content'

export const metadata = {
  title: 'Tutorials | Infin8Content Help',
}

export default function TutorialsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="font-poppins text-2xl font-bold text-neutral-900 mb-2">
        Video Tutorials
      </h1>
      <p className="font-lato text-neutral-500 mb-8">
        Learn how to get the most out of Infin8Content.
      </p>
      <div className="grid gap-8 sm:grid-cols-2">
        {TUTORIAL_VIDEOS.map((video) => (
          <div key={video.title} className="rounded-xl overflow-hidden border border-neutral-100 shadow-sm">
            <div className="relative aspect-video bg-neutral-900">
              <iframe
                src={video.embedUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <p className="font-poppins font-semibold text-sm text-neutral-900">{video.title}</p>
              <p className="font-lato text-xs text-neutral-400 mt-0.5">{video.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
