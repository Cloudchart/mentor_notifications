import NR from 'node-resque'
import Redis from 'ioredis'
import schedule from 'node-schedule'
import workers from '../workers'


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
const connectionDetails = { redis: new Redis(process.env.REDIS_URL) }

const worker = new NR.worker({ connection: connectionDetails, queues: 'notifications' }, workers)
worker.connect(() => {
  worker.workerCleanup()
  worker.start()
})

const scheduler = new NR.scheduler({ connection: connectionDetails })
scheduler.connect(() => {
  scheduler.start()
})

const queue = new NR.queue({ connection: connectionDetails }, workers)


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
