import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper function to handle response format { ok, data, error }
// Returns the data object directly on success, or throws error message
export const apiHelper = async (method, url, data = null, params = null) => {
    try {
        const response = await axiosInstance({
            method,
            url,
            data,
            params,
        });

        if (response.data.ok) {
            return response.data.data;
        } else {
            throw new Error(response.data.error || 'Unknown Error');
        }
    } catch (error) {
        const errMsg = error.response?.data?.error || error.message || 'Network Error';
        throw new Error(errMsg);
    }
};

export default {
    // Auth
    login: (data) => apiHelper('post', '/auth/login', data),
    register: (data) => apiHelper('post', '/auth/register', data),

    // Categories
    getCategories: () => apiHelper('get', '/categories'),
    createCategory: (data) => apiHelper('post', '/categories', data),
    deleteCategory: (id) => apiHelper('delete', `/categories/${id}`),

    // Transactions
    getTransactions: (month) => apiHelper('get', '/transactions', null, { month }),
    createTransaction: (data) => apiHelper('post', '/transactions', data),
    deleteTransaction: (id) => apiHelper('delete', `/transactions/${id}`),
};
