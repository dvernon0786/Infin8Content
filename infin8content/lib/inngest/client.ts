import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'infin8content',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

