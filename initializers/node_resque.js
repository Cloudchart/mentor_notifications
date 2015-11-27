import NR from 'node-resque'

import connectionDetails from '../config/redis.json'
import workers from '../workers'

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
queue.connect()


// Hooks
//
queue.on('error', (error) => { console.log('Queue error:', error) })


// Notifications queue simulation from WebApp
//
queue.enqueue('notifications', 'catcher', '0c7a7080-3e38-44fb-8736-2de7d95283e8')


export default queue
