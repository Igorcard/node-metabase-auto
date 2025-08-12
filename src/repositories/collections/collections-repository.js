
export async function createCollection(metabaseClient, params) {
    const res = await metabaseClient.request('post', '/api/collection', params)
    return res.data
}

export async function getCollections(metabaseClient) {
    const res = await metabaseClient.request('get', `/api/collection/`)
    return res.data
}