import path from 'path'
import apn from 'apn'

iosCert = path.resolve('./certificates', 'ios', 'cert.pem')
iosKey = path.resolve('./certificates', 'ios', 'key.pem')

const iosApnConnection = new apn.Connection({ cert: iosCert, key: iosKey, production: true })

// TODO: configure APN feedback service


// APN error handlers
//
iosApnConnection.on('transmissionError', (errorCode, notification, device) => {
  console.error('transmissionError, code:', errorCode)
  console.log('device', device)
  console.log('notification', notification)
})

export default iosApnConnection
