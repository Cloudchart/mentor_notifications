import { UsersThemesInsight } from '../models/web_app'
import { lastTimestamp } from '../utils'
import queue from '../initializers/node_resque'


// Worker (decides when a user needs to be notified)
//
export default {
  perform: async (done) => {
    // get users to be notified
    let usersThemesInsights = await UsersThemesInsight.findAll({
      attributes: ['user_id'],
      where: { rate: null, created_at: { $gte: lastTimestamp.get() } }
    })
    let userIds = new Set()
    usersThemesInsights.forEach((uti) => { userIds.add(uti.user_id) })
    console.log(userIds)

    // enqueue catcher
    userIds.forEach((id) => {
      queue.enqueue('notifications', 'catcher', id)
    })

    // update last timestamp
    lastTimestamp.set(new Date)
    done(null, true)
  }
}