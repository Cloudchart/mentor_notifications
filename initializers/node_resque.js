#!/usr/bin/env babel-node --optional es7.asyncFunctions

import NR from 'node-resque'
import moment from 'moment'

import { Trace } from '../models'
import Users from '../data/users'


// Helpers
//
let startOfToday = () => moment().utc().startOf('day').format()
let findUser = (userId) => Users.find((user) => { return user.id === userId })

let findLastTrace = (userId) => {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

let findTodayTraces = (userId) => {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

let scheduleSpreader = (queue, timeMoment, userId) => {
  queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', "spreader", userId)
  console.log('> enqueued spreader')
}


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
  // fires when user needs to be notified
  catcher: {
    perform: (userId, done) => {
      // find user
      let user = findUser(userId)
      // return done if user don't want to receive notifications
      if (user.notificationSettings.numberOfTimes === 0) return done(null, true)

      // schedule job unless it's present
      queue.scheduledAt('notifications', 'spreader', user.id, async (err, timestamps) => {
        if (timestamps.length > 0) {
          // console.log(moment.unix(1446793200).format())
          // queue.delDelayed('notifications', 'spreader', user.id)
          return done(null, true)
        } else {
          let now = moment()
          let startTime = moment(user.notificationSettings.startTime, 'HH:mm')

          if (now < startTime) {
            scheduleSpreader(queue, startTime, user.id)
            return done(null, true)
          } else {
            let endTime = moment(user.notificationSettings.endTime, 'HH:mm')
            let desiredNumberOfTimes = user.notificationSettings.numberOfTimes

            if (desiredNumberOfTimes > 1) {
              let traces = await findTodayTraces(user.id)
              // let nearestTime =
              console.log('should determine next schedule')
            } else {
              startTime = startTime.add(1, 'day')
              scheduleSpreader(queue, startTime, user.id)
            }

            return done(null, true)
          }
        }
      })
    }
  },
  // sends notification to a user
  spreader: {
    perform: (userId, done) => {
      console.log('spreader here', moment().format())
      // find user
      let user = findUser(userId)

      // get insights without user reactions and send notification (email, push) and leave trace or
      // reschedule job if user settings changed?
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
queue.connect()


// Hooks
//
queue.on('error', (error) => { console.log(error) })


// Notifications queue simulation from WebApp
//
queue.enqueue('notifications', 'catcher', 1)
