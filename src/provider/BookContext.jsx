import { createContext, useContext, useEffect, useState } from "react";
import { getBookById, removeWork } from "../api/bookApi";
import { useAuth } from "./AuthContext";
import { getMyFavorites, getMyBooks } from '../api/bookApi'
import { toggleAddToFavorites } from "../api/bookApi";

const BookContext = createContext();

export default function BookProvider({ children }) {
    const { jwt } = useAuth()

    const [bookData, setBookData] = useState(null);
    const [id, setId] = useState(() => localStorage.getItem('bookId'));
    const [bookLoading, setBookLoading] = useState(false)
    const [favorites, setFavorites] = useState([])
    const [works, setWorks] = useState([])
    const [fLoading, setFLoading] = useState(false)
    const [wLoading, setWLoading] = useState(false)
    const [isEmptyF, setIsEmptyF] = useState(true)
    const [isEmptyW, setIsEmptyW] = useState(true)
    const [updateFavorites, setUpdateFavorites] = useState(false)
    const [updateWorks, setUpdateWorks] = useState(false)

    const fetchFavorites = async () => {
        try {
            setFLoading(true)
            const response = await getMyFavorites(jwt)
            setFavorites(response.data || response)
        } catch {
            console.log('Error fetching favorites')
        } finally {
            setFLoading(false)
        }
    }

    const fetchWorks = async () => {
        try {
            setWLoading(true)
            const response = await getMyBooks(jwt)
            setWorks(response.data)
        } catch {
            console.log('Error fetching works')
        } finally {
            setWLoading(false)

        }
    }

    const removeItem = async (index, id) => {
        if (!jwt) return null
        try {
            const response = await toggleAddToFavorites(jwt, id)
            // Always refresh favorites list after toggle
            await fetchFavorites()
            return response
        } catch {
            console.log('Error removing from favorites')
            return null
        }
    }

    const removeMyWork = async (index, id) => {
        if (!jwt) return
        try {
            const response = await removeWork(jwt, id)
            if (response.data){
                await fetchWorks()
            }
        } catch {
            console.log('Error removing work.')
        }
    }
    
    useEffect(() => {
        if (jwt) {
            fetchFavorites()
            fetchWorks()
        }
    }, [jwt])

    useEffect(() => {
        if (jwt && !updateFavorites) {
            fetchFavorites()
        }
    }, [updateFavorites])

    useEffect(() => {
        if (jwt && !updateWorks) {
            fetchWorks()
        }
    }, [updateWorks])

    useEffect(() => {
        if (!fLoading) setIsEmptyF(favorites.length === 0)
    }, [favorites])

    useEffect(() => {
        if (!wLoading) setIsEmptyF(works.length === 0)
    }, [works])

    useEffect(() => {
        if (id) {
            localStorage.setItem("bookId", id);
        } else {
            localStorage.removeItem("bookId");
        }
    }, [id]);

    useEffect(() => {
        const fetchBook = async () => {
            if (!id) return
            try {
                setBookLoading(true)
                const response = await getBookById(id);
                setBookData(response.data);
            } catch (err) {
                console.error("Failed to fetch book:", err);
            } finally {
                setBookLoading(false)
            }
        };

        fetchBook();
    }, [id]);

    return (
        <BookContext.Provider value={
            {
                id,
                setId,
                bookData,
                setBookData,
                bookLoading,
                favorites,
                setFavorites,
                works,
                setWorks,
                isEmptyF,
                setIsEmptyF,
                isEmptyW,
                setIsEmptyW,
                fLoading,
                wLoading,
                removeItem,
                removeMyWork,
                setUpdateFavorites,
                setUpdateWorks
            }}>
            {children}
        </BookContext.Provider>
    );
}

export const useBook = () => useContext(BookContext);
