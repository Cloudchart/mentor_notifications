import { queue } from '../initializers/node_resque'

describe('Performance', () => {

  beforeEach((done) => {
    queue.connect(done)
  })

  afterEach((done) => {
    queue.end(done)
  })


  describe('spreader', () => {
    it('should enque many items', (done) => {
      let range = Array.from(Array(10).keys())

      range.forEach((item) => {
        queue.enqueueAt(Date.now(), 'notifications', 'spreader', 'd51bc108-6e93-4bc3-bb63-0871f7d26bea', () => {
          console.log('>>> enqueued spreader')
        })
      })

      done()
    })
  })

})
