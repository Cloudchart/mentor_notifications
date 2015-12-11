import moment from 'moment'
import queue from '../clients/queue'

import { Trace } from '../models'

const defaultStartHour = '10:00'
const defaultEndHour = '20:00'
const defaultUTCOffset = '+03:00'
const defaultTimesToSend = 6
const oneDayInSeconds = 86400


// Helpers
//
function startOfToday() {
  return moment.utc().startOf('day').format()
}

function findTodayTraces(userId) {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

function scheduleSpreader(timestamp, userId, done) {
  queue.enqueueAt(timestamp * 1000, 'notifications', 'spreader', userId, () => {
    console.log('>>> enqueued spreader')
    done(null, true)
  })
}


// Worker (fires when user needs to be notified)
//
export default {
  perform: (userId, done) => {
    // return done if user doesn't want to receive notifications
    if (defaultTimesToSend === 0) { return done(null, true) }

    // schedule job unless it's present
    queue.scheduledAt('notifications', 'spreader', userId, async (err, timestamps) => {
      if (timestamps.length > 0) {
        done(null, true)
      } else {
        let nowTime = moment().unix()
        let startTime = moment(`${defaultStartHour} ${defaultUTCOffset}`, 'HH:mm Z').unix()
        let endTime = moment(`${defaultEndHour} ${defaultUTCOffset}`, 'HH:mm Z').unix()

        // *|-------|
        if (nowTime < startTime) {
          scheduleSpreader(startTime, userId, done)
        // |-------|*
        } else if (nowTime > endTime) {
          scheduleSpreader(startTime + oneDayInSeconds, userId, done)
        // |---*---|
        } else {
          let nearestTime

          if (defaultTimesToSend <= 2) {
            nearestTime = endTime
          } else {
            let traces = await findTodayTraces(userId)
            let deliveredNumberOfTimes = traces.length

            if (deliveredNumberOfTimes >= defaultTimesToSend) {
              nearestTime = startTime + oneDayInSeconds
            } else {
              let nowDelta = nowTime - startTime
              let step = (endTime - startTime) / (defaultTimesToSend - 1)
              nearestTime = startTime + step * Math.ceil(nowDelta / step)
            }
          }

          scheduleSpreader(nearestTime, userId, done)
        }
      }
    })

  }
}
