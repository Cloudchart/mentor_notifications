import postmark from 'postmark'

const postmarkClient = new postmark.Client(process.env.POSTMARK_API_KEY)

export default postmarkClient
