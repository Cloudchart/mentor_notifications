import moment from 'moment'

import { Trace } from '../models'
import Users from '../data/users'
import queue from '../initializers/node_resque'


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
    queue.enqueueAt(timeMoment.unix() * 1000, 'notifications', "spreader", userId)
    console.log('> enqueued spreader')
  } else {
    console.error('! did not enqueue spreader, invalid moment object')
  }
}


// Worker (fires when user needs to be notified)
//
export default {
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
}
