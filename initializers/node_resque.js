import path from 'path'
import NR from 'node-resque'
import moment from 'moment'
import postmark from 'postmark'
import apn from 'apn'

import connectionDetails from '../config/redis.json'
import { Trace } from '../models'
import { Insight, UsersThemesInsight, User } from '../models/web_app'
import Users from '../data/users'
import workers from '../workers'


// initializers
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


// hooks
queue.on('error', (error) => { console.log(error) })


// notifications queue simulation from WebApp
queue.enqueue('notifications', 'catcher', '0c7a7080-3e38-44fb-8736-2de7d95283e8')


export default queue
