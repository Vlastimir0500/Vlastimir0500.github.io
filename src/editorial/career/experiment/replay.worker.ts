import { runReplay } from './navigationModel'
import type { WorkerMessage } from './navigationModel'

function send(message: WorkerMessage) { self.postMessage(message) }
self.onmessage = (event: MessageEvent<number>) => {
  try { send({replay:runReplay(event.data,stage=>send({stage}))}) }
  catch (error) { send({error:error instanceof Error ? error.message : 'The replay could not finish.'}) }
}
