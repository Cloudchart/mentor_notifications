#!/usr/bin/env babel-node --optional es7.asyncFunctions

import NR from 'node-resque'
import moment from 'moment'
import postmark from 'postmark'

import config from '../config/app.json'
import connectionDetails from '../config/redis.json'
import { Trace } from '../models'
import { Insight, UsersThemesInsight, User } from '../models/web_app'
import Users from '../data/users'

const postmarkClient = new postmark.Client(config.postmarkApiKey)


// Helpers
//
function startOfToday() {
  return moment().utc().startOf('day').format()
}

function findLastTrace(userId) {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

function findTodayTraces(userId) {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

function scheduleSpreader(queue, timeMoment, userId) {
  if (timeMoment && timeMoment.isValid()) {
    queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', "spreader", userId)
    console.log('> enqueued spreader')
  } else {
    console.error('! did not enqueue spreader, invalid moment object')
  }
}


// Workers
//
let jobs = {
  // fires when user needs to be notified
  catcher: {
    perform: (userId, done) => {
      // find user
      let user = Users.find((user) => { return user.id === userId })
      let desiredNumberOfTimes = user.notificationSettings.numberOfTimes

      // return done if user doesn't want to receive notifications
      if (desiredNumberOfTimes === 0) { return done(null, true) }

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
    perform: async (userId, done) => {
      console.log('spreader here', moment().format())
      // find user
      let
        user = await User.findById(userId),
        lastTrace = await findLastTrace(userId),
        range = { $lte: moment().utc().format() };

      if (lastTrace) { range['$gte'] = lastTrace.createdAt }

      // get insights without user reactions
      let usersThemesInsights = await UsersThemesInsight.findAll({
        attributes: ['insight_id'],
        where: { user_id: user.id, rate: null, created_at: range }
      })

      let insightIds = usersThemesInsights.map((uti) => { return uti.insight_id })

      if (insightIds.length == 0) {
        console.log('no insights were found')
        return done(null, true)
      }

      // send notification (email, push)
      if (user.email) {
        postmarkClient.sendEmail({
          from: config.defaultFrom,
          to: user.email,
          subject: 'Notification',
          TextBody: insightIds.join(', ')
        }, async (error, success) => {
          if(error) {
            console.error('Unable to send via postmark: ' + error.message)
            return
          }

          // leave trace
          let trace = await Trace.create({ userId: user.id, status: 'delivered' })
          console.log(trace.status)
          done(null, true)
        })
      }
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
queue.enqueue('notifications', 'catcher', '9f76ad2d-7e86-4b2d-984c-2bd03636e240')
