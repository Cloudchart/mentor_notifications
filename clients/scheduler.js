import NR from 'node-resque'
import workers from '../workers'
import redisClient from './redisClient'

const scheduler = new NR.scheduler({ connection: { redis: redisClient } })

export default scheduler
