import NR from 'node-resque'
import Redis from 'ioredis'

import config from '../config/redis.json'
import workers from '../workers'

let env = process.env.NODE_ENV || 'development'
let connectionDetails = config[env]

if (connectionDetails.use_env_variable) {
  connectionDetails = { redis: new Redis(process.env[connectionDetails.use_env_variable]) }
}


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
  queue.enqueue('notifications', 'catcher', '0c7a7080-3e38-44fb-8736-2de7d95283e8')
})


export default queue
