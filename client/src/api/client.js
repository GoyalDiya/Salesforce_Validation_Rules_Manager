import axios from 'axios'

// In dev, leave this empty so calls go through the Vite proxy (vite.config.js)
// to localhost:3000. In production set VITE_API_BASE_URL to the deployed
// backend URL, e.g. "https://your-backend.onrender.com".
const baseURL = import.meta.env.VITE_API_BASE_URL || '/'

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    // Bypasses the ngrok free-tier browser interstitial. Harmless when the
    // backend isn't behind ngrok — just an unrecognized header.
    'ngrok-skip-browser-warning': '1',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.statusText ||
      error.message ||
      'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
