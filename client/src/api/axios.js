import axios from 'axios'

export const TOKEN_KEY = 'token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login')
        window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export const getErrorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message ||
  (err?.request ? 'Cannot reach server' : fallback)

export default api
