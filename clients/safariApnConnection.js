import path from 'path'
import apn from 'apn'

safariCert = path.resolve('./certificates', 'safari', 'cert.pem')
safariKey = path.resolve('./certificates', 'safari', 'key.pem')

const safariApnConnection = new apn.Connection({ cert: safariCert, key: safariKey, production: true })

export default safariApnConnection
