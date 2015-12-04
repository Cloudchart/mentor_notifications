import { Trace } from '../models'
import queue from '../initializers/node_resque'

const defaultStartHourUTC = 7
const defaultEndHourUTC = 19
const defaultNumberOfTimes = 4
const oneDayInMilliseconds = 86400000


// Helpers
//
function startOfToday() {
  let now = new Date()
  return + new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function findTodayTraces(userId) {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

function scheduleSpreader(queue, timestamp, userId) {
  queue.enqueueAt(timestamp, 'notifications', 'spreader', userId)
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
        let now = new Date
        let nowTime = + now
        let startTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), defaultStartHourUTC)
        let endTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), defaultEndHourUTC)

        // *|-------|
        if (nowTime < startTime) {
          scheduleSpreader(queue, startTime, userId)
          return done(null, true)
        // |-------|*
        } else if (nowTime > endTime) {
          scheduleSpreader(queue, startTime + oneDayInMilliseconds, userId)
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
              nearestTime = startTime + oneDayInMilliseconds
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
