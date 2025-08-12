
export async function cloneDashboard(metabaseClient, dashboardIdModel) {
    const res = await metabaseClient.request('post', `/api/dashboard/${dashboardIdModel}/copy`, { is_deep_copy: true })
    return res.data
}

export async function updateDashboard(metabaseClient, dashboardId, payload) {
    const res = await metabaseClient.request('put', `/api/dashboard/${dashboardId}`, payload)
    return res.data
}

export async function addDashcard(metabaseClient, dashboardId, dashcardPayload) {
    const res = await metabaseClient.request('post', `/api/dashboard/${dashboardId}/cards`, dashcardPayload)
    return res.data
}

export async function setDashboardCards(metabaseClient, dashboardId, cards) {
    const payload = { cards }
    const res = await metabaseClient.request('put', `/api/dashboard/${dashboardId}/cards`, payload)
    return res.data
}

export async function createDashboard(metabaseClient, name) {
    const res = await metabaseClient.request('post', '/api/dashboard', { name })
    return res.data
}

export async function addCardToDashboard(metabaseClient, dashboardId, cardId, position = 0) {
    const payload = {
        cardId,
        parameter_mappings: [],
        visualization_settings: {},
        col: position % 4, // distribui em colunas
        row: Math.floor(position / 4),
        sizeX: 4,
        sizeY: 4
    }
    const res = await metabaseClient.request('post', `/api/dashboard/${dashboardId}/cards`, payload)
    return res.data
}

export async function getDashboard(metabase, dashboardId) {
    const res = await metabase.request('get', `/api/dashboard/${dashboardId}`)
    return res.data
}