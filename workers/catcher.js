import moment from 'moment'

import { Trace } from '../models'
import queue from '../initializers/node_resque'

const defaultStartHourUTC = 7
const defaultEndHourUTC = 17
const defaultNumberOfTimes = 6
const oneDayInSeconds = 86400


// Helpers
//
function startOfToday() {
  return moment.utc().startOf('day').format()
}

function findTodayTraces(userId) {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

function scheduleSpreader(queue, timestamp, userId) {
  queue.enqueueAt(timestamp * 1000, 'notifications', 'spreader', userId)
  console.log('>>> enqueued spreader')
}


// Worker (fires when user needs to be notified)
//
export default {
  perform: (userId, done) => {
    // return done if user doesn't want to receive notifications
    if (defaultNumberOfTimes === 0) { return done(null, true) }

    // schedule job unless it's present
    queue.scheduledAt('notifications', 'spreader', userId, async (err, timestamps) => {
      if (timestamps.length > 0) {
        return done(null, true)
      } else {
        let nowTime = moment().unix()
        let startTime = moment.utc(defaultStartHourUTC, 'HH').unix()
        let endTime = moment.utc(defaultEndHourUTC, 'HH').unix()

        // *|-------|
        if (nowTime < startTime) {
          scheduleSpreader(queue, startTime, userId)
          return done(null, true)
        // |-------|*
        } else if (nowTime > endTime) {
          scheduleSpreader(queue, startTime + oneDayInSeconds, userId)
          return done(null, true)
        // |---*---|
        } else {
          let nearestTime

          if (defaultNumberOfTimes <= 2) {
            nearestTime = endTime
          } else {
            let traces = await findTodayTraces(userId)
            let deliveredNumberOfTimes = traces.length

            if (deliveredNumberOfTimes >= defaultNumberOfTimes) {
              nearestTime = startTime + oneDayInSeconds
            } else {
              let nowDelta = nowTime - startTime
              let step = (endTime - startTime) / (defaultNumberOfTimes - 1)
              nearestTime = startTime + step * Math.ceil(nowDelta / step)
            }
          }

         scheduleSpreader(queue, nearestTime, userId)
         return done(null, true)
        }
      }
    })
  }
}
