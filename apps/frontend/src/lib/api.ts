import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
const localApiBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: isProduction ? '/api' : localApiBaseURL,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (!isProduction && host !== 'localhost' && host !== '127.0.0.1') {
            config.baseURL = `http://${host}:3001/api`;
        }
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('worker');
                const path = window.location.pathname;
                if (path.startsWith('/admin')) {
                    window.location.href = '/admin/login';
                } else {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token: string | null) => {
    if (token) {
        localStorage.setItem('accessToken', token);
    } else {
        localStorage.removeItem('accessToken');
    }
};

export default api;
