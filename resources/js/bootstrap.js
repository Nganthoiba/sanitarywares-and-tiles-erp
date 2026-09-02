import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json';

// Helper to check if a request URL targets /api/user (e.g., http://127.0.0.1:8000/api/user or /api/user)
export const isApiUserUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsedUrl = new URL(url, window.location.origin);
        return parsedUrl.pathname === '/api/user';
    } catch (e) {
        return url === '/api/user' || url.startsWith('/api/user?') || url === 'http://127.0.0.1:8000/api/user' || url.startsWith('http://127.0.0.1:8000/api/user?');
    }
};

export const handleUnauthenticated = () => {
    localStorage.clear();
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// Axios response interceptor for /api/user
window.axios.interceptors.response.use(
    (response) => {
        if (isApiUserUrl(response.config?.url)) {
            if (response.status === 401 || (response.data && response.data.message === 'Unauthenticated.')) {
                handleUnauthenticated();
            }
        }
        return response;
    },
    (error) => {
        if (error.response && isApiUserUrl(error.config?.url)) {
            if (error.response.status === 401 || (error.response.data && error.response.data.message === 'Unauthenticated.')) {
                handleUnauthenticated();
            }
        }
        return Promise.reject(error);
    }
);

// Global Fetch interceptor for /api/user
if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');

        if (isApiUserUrl(url)) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                if (response.status === 401 || (data && data.message === 'Unauthenticated.')) {
                    handleUnauthenticated();
                }
            } catch (e) {
                if (response.status === 401) {
                    handleUnauthenticated();
                }
            }
        }
        return response;
    };
}
