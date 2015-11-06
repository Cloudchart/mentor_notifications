#!/usr/bin/env babel-node --optional es7.asyncFunctions

import NR from 'node-resque'
import moment from 'moment'

import { Trace } from '../models'
import Users from '../data/users'

import '../lib/math_extension'


// Helpers
//
let
  startOfToday = () => moment().utc().startOf('day').format(),
  findUser = (userId) => Users.find((user) => { return user.id === userId }),

  findLastTrace = (userId) => {
    return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
  },

  findTodayTraces = (userId) => {
    return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
  },

  scheduleSpreader = (queue, timeMoment, userId) => {
    if (timeMoment && timeMoment.isValid()) {
      queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', "spreader", userId)
      console.log('> enqueued spreader')
    } else {
      console.log('> did not enqueue spreader, invalid moment object')
    }
  };


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
      // return done if user doesn't want to receive notifications
      if (user.notificationSettings.numberOfTimes === 0) return done(null, true)

      // schedule job unless it's present
      queue.scheduledAt('notifications', 'spreader', user.id, async (err, timestamps) => {
        if (timestamps.length > 0) {
          // console.log(moment.unix(1446830228).format())
          // queue.delDelayed('notifications', 'spreader', user.id)
          return done(null, true)
        } else {
          let now = moment()
          let startTime = moment(user.notificationSettings.startTime, 'HH:mm')
          let endTime = moment(user.notificationSettings.endTime, 'HH:mm')

          if (now < startTime || now > endTime) {
            scheduleSpreader(queue, startTime, user.id)
            return done(null, true)
          } else {
            let desiredNumberOfTimes = user.notificationSettings.numberOfTimes
            let nearestTime

            if (desiredNumberOfTimes <= 2) {
              nearestTime = endTime
            } else {
              let traces = await findTodayTraces(user.id)
              let deliveredNumberOfTimes = traces.length

              if (deliveredNumberOfTimes >= desiredNumberOfTimes) {
                nearestTime = startTime.add(1, 'day')
              } else {
                let
                  startStamp = startTime.unix(),
                  endStamp = endTime.unix(),
                  nowStamp = now.unix(),
                  nowDelta = nowStamp - startStamp,
                  step = (endStamp - startStamp) / (desiredNumberOfTimes - 1),
                  nearestStamp = startStamp + step * Math.ceil(nowDelta / step);

                nearestTime = moment.unix(nearestStamp)
                console.log(nearestTime.format())
              }
            }

           scheduleSpreader(queue, nearestTime, user.id)
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
