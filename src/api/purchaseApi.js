import {createApiWithToken} from './apiConfig'

export const createZaloPayOrder = async (token, requestData) => {
    const api = createApiWithToken(token)
    const response = await api.post("/purchase/book/zalo-pay/create-order", requestData)
    return response.data
}

export const payUsingFoxBudget = async (token, requestData) => {
    const api = createApiWithToken(token)
    const response = await api.post("/purchase/book/fox-budget", requestData)
    return response.data
}

export const purchaseToWallet = async (token, requestData) => {
    const api = createApiWithToken(token)
    const response = await api.post("/purchase/wallet", requestData)
    return response.data
}

export const getZaloPayPaymentStatus = async (token, bookId) => {
    const api = createApiWithToken(token)
    const response = await api.get("/purchase/book/zalo-pay/check-status", {
        params: {
            bookId: bookId
        }
    })
    return response.data
}

export const getZaloPayOrderStatus = async (token, appTransId) => {
    const api = createApiWithToken(token)
    const response = await api.get("/purchase/book/zalo-pay/order-status", {
        params: {
            appTransId: appTransId
        }
    })
    return response.data
}