import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 30_000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.statusText ||
      error.message ||
      'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
