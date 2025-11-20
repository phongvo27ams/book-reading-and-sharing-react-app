import baseApi, { createApiWithToken } from "./apiConfig";

export const publishBook = async (meta, pdfFile, coverFile, token) => {
    const api = createApiWithToken(token);
    const formData = new FormData();

    // meta dưới dạng application/json (Blob)
    const metaBlob = new Blob([JSON.stringify(meta)], { type: 'application/json' });
    formData.append('meta', metaBlob);

    // pdf bắt buộc
    formData.append('pdf', pdfFile);

    // cover tùy chọn
    if (coverFile) {
        formData.append('cover', coverFile);
    }

    // Override header để không bị 'application/json'
    const response = await api.post("/books/upload", formData, {
        headers: {
            // Không set boundary thủ công, để trình duyệt tự thêm
            'Content-Type': 'multipart/form-data'
        },
        // Phòng khi axios có transformRequest stringify dữ liệu
        transformRequest: [(data) => data],
    });
    return response.data;
}

export const getBookById = async (bookId) => {
    const response = await baseApi.get(`/books/${bookId}`)
    return response.data
}

export const getBooksByFilterList = async (list, keyword, page, size) => {
    const request = {
        filters: list,
        keyword: keyword
    }
    
    const response = await baseApi.post("/books/filter", request, {
        params: {
            page: page,
            size: size
        }
    })

    return response.data
}

export const removeWork = async (token, id) => {
    const api = createApiWithToken(token)
    const response = await api.delete(`/books/${id}`)
    return response.data
}

export const getMyBooks = async (token) => {
    const api = createApiWithToken(token)
    const response = await api.get("/books/collection")
    return response.data
}

export const getMyFavorites = async (token) => {
    const api = createApiWithToken(token)
    const response = await api.get("/books/favorites")
    return response.data
}

export const toggleAddToFavorites = async (token, bookId) => {
    const api = createApiWithToken(token)
    const response = await api.post(`/books/favorites/toggle/${bookId}`)
    return response.data
}

export const favoriteCheck = async (token, bookId) => {
    const api = createApiWithToken(token)
    const response = await api.get("/books/favorites/check",{
        params: {
            bookId : bookId
        }
    })
    return response.data
}

export const getPurchasedBookIds = async (token) => {
    const api = createApiWithToken(token)
    const response = await api.get("/books/purchased")
    return response.data
}

export const get6FreeBooks = async () => {
    const response = await baseApi.get("/books/free6")
    return response.data
}

export const get6CostBooks = async () => {
    const response = await baseApi.get("/books/cost6")
    return response.data
}

export const get6CommBooks = async () => {
    const response = await baseApi.get("/books/comm6")
    return response.data
}