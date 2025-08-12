
export async function getCardParams(metabaseClient, cardId, paramKey) {
    const res = await metabaseClient.request('get', `/api/card/${cardId}/params/${paramKey}/values`)
    return res.data
}

export async function  getCard(metabaseClient, cardId) {
    const res = await metabaseClient.request('get', `/api/card/${cardId}`)
    return res.data
}

export async function createCard(metabaseClient, cardData) {
    const res = await metabaseClient.request('post', '/api/card', cardData)
    return res.data
}

export async function updateCard(metabaseClient, cardId, cardData) {
    const res = await metabaseClient.request('put', `/api/card/${cardId}`, cardData)
    return res.data
}