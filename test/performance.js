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
        queue.enqueueAt(Date.now(), 'notifications', 'spreader', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c', () => {
          console.log('>>> enqueued spreader')
        })
      })

      done()
    })
  })

})
