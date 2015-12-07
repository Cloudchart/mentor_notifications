import NR from 'node-resque'
import workers from '../workers'
import redisClient from './redisClient'

const worker = new NR.worker({ connection: { redis: redisClient }, queues: 'notifications' }, workers)

export default worker
