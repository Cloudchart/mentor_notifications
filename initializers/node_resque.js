import schedule from 'node-schedule'
import NR from 'node-resque'
import workers from '../workers'
import { redisClient, queue } from '../clients'

const worker = new NR.worker({ connection: { redis: redisClient }, queues: 'notifications' }, workers)
const scheduler = new NR.scheduler({ connection: { redis: redisClient } })


function stop() {
  queue.end(() => {
    scheduler.end(() => {
      worker.end(() => {
        process.exit(0)
      })
    })
  })
}

function start() {
  worker.connect(() => {
    worker.workerCleanup()
    worker.start()
    console.log('>>> started worker')
  })

  scheduler.connect(() => {
    scheduler.start()
    console.log('>>> started scheduler')
  })

  queue.connect(() => {
    schedule.scheduleJob('*/10 * * * *', () => {
      console.log('>>> enqueued scheduled job')
      if (scheduler.master) { queue.enqueue('notifications', 'listener') }
    })
  })
}


process.on('SIGINT', stop)
process.on('SIGTERM', stop)


export default { start, worker, queue }
