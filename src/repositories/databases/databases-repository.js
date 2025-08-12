export async function getDatabases(metabaseClient) {
    const res = await metabaseClient.request('get', `/api/database`)
    return res.data
}