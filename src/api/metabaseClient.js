import axios from 'axios'

export class MetabaseClient {
    constructor({ baseUrl, username, password }) {
        this.baseUrl = baseUrl
        this.username = username
        this.password = password
        this.sessionId = null
    }

    async authenticate() {
        const res = await axios.post(`${this.baseUrl}/api/session`, {
            username: this.username,
            password: this.password
        })
        this.sessionId = res.data.id
    }

    async request(method, path, data = null) {
        if (!this.sessionId) {
            await this.authenticate()
        }
        const config = {
            method,
            url: `${this.baseUrl}${path}`,
            headers: { 'X-Metabase-Session': this.sessionId },
            data
        }
        return axios(config)
    }
}