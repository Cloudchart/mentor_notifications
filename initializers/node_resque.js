import NR from 'node-resque'
import moment from 'moment'

import { Trace } from '../models'
import Users from '../data/users'


// Helpers
//
let findUser = (userId) => Users.find((user) => { return user.id === userId })
let findTrace = (userId) => Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })


// Connection
//
let connectionDetails = {
  package: 'ioredis',
  host: '127.0.0.1',
  password: null,
  port: 6379,
  database: 0,
  namespace: 'resque'
  // looping: true,
  // options: {password: 'abc'}
};


// Workers
//
let jobs = {
  catcher: {
    perform: (userId, done) => {
      // find user
      let user = findUser(userId)

      // do nothing if delayed job is present
      // reschedule job if user settings changed?

      // schedule job based on user settings
      queue.timestamps((error, timestamps) => {
        console.log(timestamps)
      })

      let startTime = moment(user.notificationSettings.startTime, 'HH:mm')
      console.log(startTime.format())
      // queue.enqueueAt(startTime, 'notifications', "spreader", user.id)
      // console.log('enqueued spreader')

      done(null, true)
    }
  },
  spreader: {
    perform: (userId, done) => {
      // find user
      // get insights without user reactions and send notification (email, push) and leave trace or
      // reschedule job if user settings changed?
      console.log('spreader here')
      done(null, true)
    }
  }
}


// Initializers
//
let worker = new NR.worker({ connection: connectionDetails, queues: 'notifications' }, jobs)
worker.connect(() => {
  worker.workerCleanup()
  worker.start()
})

let scheduler = new NR.scheduler({ connection: connectionDetails })
scheduler.connect(() => {
  scheduler.start()
})

let queue = new NR.queue({ connection: connectionDetails }, jobs)


// Hooks
//
queue.on('error', (error) => { console.log(error) })


// WebApp enqueue simulation
//
queue.connect(() => {
  queue.enqueue('notifications', 'catcher', 1)
})
