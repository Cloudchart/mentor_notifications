import postmark from 'postmark'

const client = new postmark.Client(process.env.POSTMARK_API_KEY)

export default client
