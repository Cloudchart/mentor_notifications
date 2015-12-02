import NR from 'node-resque'
import schedule from 'node-schedule'
import workers from '../workers'

import { redisClient } from '../clients'


// Helpers
//
function stop() {
  queue.end(() => {
    scheduler.end(() => {
      worker.end(() => {
        process.exit(0)
      })
    })
  })
}


// Initializers
//
const worker = new NR.worker({ connection: { redis: redisClient }, queues: 'notifications' }, workers)
worker.connect(() => {
  worker.workerCleanup()
  worker.start()
})

const scheduler = new NR.scheduler({ connection: { redis: redisClient } })
scheduler.connect(() => {
  scheduler.start()
})

const queue = new NR.queue({ connection: { redis: redisClient } }, workers)


// Events
//
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
queue.on('error', (error) => { console.log('Queue error:', error) })


// Notifications queue simulation from WebApp
//
queue.connect(() => {
  schedule.scheduleJob('*/10 * * * *', () => {
    console.log('>>> enqueued scheduler')
    if (scheduler.master) { queue.enqueue('notifications', 'listener') }
  })
})


export default queue
