import schedule from 'node-schedule'
import { worker, scheduler, queue } from '../clients'


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


export default {
  start: start
}
