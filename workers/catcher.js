import moment from 'moment'

import { Trace } from '../models'
import queue from '../initializers/node_resque'

const defaultStartTime = '10:00'
const defaultEndTime = '22:00'
const defaultNumberOfTimes = 4


// Helpers
//
function startOfToday() {
  return moment().utc().startOf('day').format()
}

function findTodayTraces(userId) {
  return Trace.findAll({ where: { userId: userId, createdAt: { $gte: startOfToday() } } })
}

function scheduleSpreader(queue, timeMoment, userId) {
  if (timeMoment && timeMoment.isValid()) {
    queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', 'spreader', userId)
    console.log('>>> enqueued spreader')
  } else {
    console.error('!!! did not enqueue spreader, invalid moment object')
  }
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
        let now = moment()
        let startTime = moment(defaultStartTime, 'HH:mm')
        let endTime = moment(defaultEndTime, 'HH:mm')

        if (now < startTime || now > endTime) {
          scheduleSpreader(queue, startTime, userId)
          return done(null, true)
        } else {
          let nearestTime

          if (defaultNumberOfTimes <= 2) {
            nearestTime = endTime
          } else {
            let traces = await findTodayTraces(userId)
            let deliveredNumberOfTimes = traces.length

            if (deliveredNumberOfTimes >= defaultNumberOfTimes) {
              nearestTime = startTime.add(1, 'day')
            } else {
              let
                startStamp = startTime.unix(),
                endStamp = endTime.unix(),
                nowStamp = now.unix(),
                nowDelta = nowStamp - startStamp,
                step = (endStamp - startStamp) / (defaultNumberOfTimes - 1),
                nearestStamp = startStamp + step * Math.ceil(nowDelta / step);

              nearestTime = moment.unix(nearestStamp)
            }
          }

         scheduleSpreader(queue, nearestTime, userId)
         return done(null, true)
        }
      }
    })
  }
}
