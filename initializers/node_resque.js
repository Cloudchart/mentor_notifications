#!/usr/bin/env babel-node --optional es7.asyncFunctions

import NR from 'node-resque'
import moment from 'moment'

import connectionDetails from '../config/redis.json'

import { Trace } from '../models'
import { Insight, UsersThemesInsight } from '../models/web_app'
import Users from '../data/users'


// Helpers
//
let startOfToday, findUser, findLastTrace, findTodayTraces, scheduleSpreader;

startOfToday = () => moment().utc().startOf('day').format()
findUser = (userId) => Users.find((user) => { return user.id === userId })

findLastTrace = (userId) => {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

findTodayTraces = (userId) => {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

scheduleSpreader = (queue, timeMoment, userId) => {
  if (timeMoment && timeMoment.isValid()) {
    queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', "spreader", userId)
    console.log('> enqueued spreader')
  } else {
    console.warn('> did not enqueue spreader, invalid moment object')
  }
}


// Workers
//
let jobs = {
  // fires when user needs to be notified
  catcher: {
    perform: (userId, done) => {
      // find user
      let user = findUser(userId)
      let desiredNumberOfTimes = user.notificationSettings.numberOfTimes

      // return done if user doesn't want to receive notifications
      if (desiredNumberOfTimes === 0) return done(null, true)

      // schedule job unless it's present
      queue.scheduledAt('notifications', 'spreader', user.id, async (err, timestamps) => {
        if (timestamps.length > 0) {
          queue.delDelayed('notifications', 'spreader', user.id, (err, deletedTimestamps) => {
            console.log(err, deletedTimestamps)
          })
          return done(null, true)
        } else {
          let now = moment()
          let startTime = moment(user.notificationSettings.startTime, 'HH:mm')
          let endTime = moment(user.notificationSettings.endTime, 'HH:mm')

          if (now < startTime || now > endTime) {
            scheduleSpreader(queue, startTime, user.id)
            return done(null, true)
          } else {
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

      // get insights without user reactions
      UsersThemesInsight.findAll({
        attributes: ['insight_id'],
        where: { user_id: 'c4e34cfd-05fc-4ad8-88ae-db73f2a3b1e5', rate: null }
      }).then((ids) => {
        console.log(ids)
      })

      // send notification (email, push)
      // leave trace
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
