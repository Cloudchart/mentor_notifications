require('dotenv').load()

import schedule from 'node-schedule'
import NR from 'node-resque'
import workers from '../workers'
import { redisClient, queue } from '../clients'

const worker = new NR.multiWorker({
  connection: { redis: redisClient },
  queues: 'notifications',
  minTaskProcessors: 1,
  maxTaskProcessors: 20,
}, workers)

const scheduler = new NR.scheduler({ connection: { redis: redisClient } })


function stop() {
  scheduler.end(() => {
    worker.end(() => {
      console.log('>>> stopped all workers')
      return process.exit(0)
    })
  })
}

function start() {
  scheduler.connect(() => {
    scheduler.start()
    console.log('>>> started scheduler')

    worker.start()
    console.log('>>> started worker')
  })

  queue.connect(() => {
    schedule.scheduleJob('*/10 * * * *', () => {
      if (scheduler.master) {
        queue.enqueue('notifications', 'listener')
        console.log('>>> enqueued scheduled job')
      }
    })
  })
}


process.on('SIGINT', stop)
process.on('SIGTERM', stop)


export default { start, worker, queue }
