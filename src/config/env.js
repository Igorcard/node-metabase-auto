import dotenv from 'dotenv'
dotenv.config()

export const config = {
  baseUrl: process.env.METABASE_BASEURL,
  username: process.env.METABASE_EMAIL,
  password: process.env.METABASE_PASSWORD
}