import NR from 'node-resque'
import Redis from 'ioredis'
import schedule from 'node-schedule'

import workers from '../workers'

let connectionDetails = { redis: new Redis(process.env.REDIS_URL) }


// Initializers
//
let worker = new NR.worker({ connection: connectionDetails, queues: 'notifications' }, workers)
worker.connect(() => {
  worker.workerCleanup()
  worker.start()
})

let scheduler = new NR.scheduler({ connection: connectionDetails })
scheduler.connect(() => {
  scheduler.start()
})

let queue = new NR.queue({ connection: connectionDetails }, workers)


// Hooks
//
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
