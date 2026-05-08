import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    withCredentials: true,
});

if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isLoginRequest = originalRequest.url?.includes('/auth/login');

        if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
            originalRequest._retry = true;
            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                const data = response.data as { accessToken: string };
                api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                window.location.href = '/'; // Logout if refresh fails
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
