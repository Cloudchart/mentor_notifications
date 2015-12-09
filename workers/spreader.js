import apn from 'apn'

import { Trace } from '../models'
import { Insight, Device, UsersThemesInsight, User, DevicePushToken } from '../models/web_app'
import { safariApnConnection, iosApnConnection, postmarkClient } from '../clients'
import { truncate } from '../utils'


// Helpers
//
function findLastTrace(userId) {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

function sendEmail(user, insightIds) {
  return new Promise((done, fail) => {
    if (!user.email) { done() }

    postmarkClient.sendEmail({
      from: 'staff@insights.vc',
      to: user.email,
      subject: 'Notification',
      TextBody: insightIds.join(', ')
    }, (error, success) => {
      if (success) {
        console.log('email sent')
        done(success)
      } else {
        console.error('unable to send via postmark:', error.message)
        fail(error)
      }
    })

  })
}

function sendIosPush(user, insightIds) {
  return new Promise(async (done, fail) => {

    // get token
    let device = await Device.findOne({
      attributes: ['push_token'],
      where: { user_id: user.id }
    })
    let iosPushToken = device.push_token

    if (!iosPushToken) { done() }

    // get insight content
    let randomInsight = await Insight.findById(insightIds[0])
    let insightContent = truncate(randomInsight.content, 100)

    // gather payload
    let iosDevice = new apn.Device(iosPushToken)
    let iosNote = new apn.Notification()
    iosNote.alert = 'New advice for you: ' + insightContent
    iosNote.sound = 'default'
    iosNote.badge = insightIds.length
    iosNote.payload = { screen: 'AdviceForYou' }

    // send notification
    iosApnConnection.pushNotification(iosNote, iosDevice)
    console.log('ios push sent')
    done()

  })
}

function sendSafariPush(user) {
  return new Promise(async (done, fail) => {

    // get tokens
    let devicePushTokens = await DevicePushToken.findAll({
      attributes: ['value'],
      where: { user_id: user.id, type: 'safari' }
    })
    let safariPushTokens = devicePushTokens.map((dpt) => dpt.value)

    safariPushTokens.forEach((token) => {
      let safariDevice = new apn.Device(token)
      let safariNote = new apn.Notification()
      safariNote.alert = {
        title: 'Mentor',
        body: 'You have new insights to explore'
      }
      safariNote.urlArgs = ['']

      safariApnConnection.pushNotification(safariNote, safariDevice)
    })

    console.log('safari push sent')
    done()

  })
}


// Worker (sends notification to a user)
//
export default {
  perform: async (userId, done) => {
    // find user
    let user = await User.findById(userId)

    if (!user) {
      console.error('user', userId, 'was not found')
      return done(null, true)
    }

    // find last trace and define range
    let lastTrace = await findLastTrace(userId)
    let range = { $lte: new Date }
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

    // send notification
    Promise.all([
      sendEmail(user, insightIds),
      sendSafariPush(user),
      sendIosPush(user, insightIds)
    ]).then(async () => {
      // leave trace
      let trace = await Trace.create({ userId: user.id, status: 'delivered' })
      console.log('trace created with status:', trace.status)
      done(null, true)
    }).catch((error) => {
      console.error('something went wrong')
      done(null, true)
    })
  }
}
