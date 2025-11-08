import axios, { type InternalAxiosRequestConfig } from "axios";

const BASE_URL = "http://chooy-alb-196282736.us-east-1.elb.amazonaws.com"; //http://chooy-alb-1334393243.us-east-1.elb.amazonaws.com
// Instance cho API
const api = axios.create({
  baseURL: BASE_URL+"/api",
  timeout: 120000,
});

// Instance cho các yêu cầu không sử dụng /api
const apiWithoutPrefix = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});



// Thêm interceptor cho instance API nếu cần
const handleBefore = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  console.log('Axios interceptor - Request URL:', config.url);
  console.log('Axios interceptor - Token exists:', !!token);
  console.log('Axios interceptor - Token value:', token ? token.substring(0, 20) + '...' : 'null');

  if (token) {
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }
    
    // Set Authorization header
    config.headers["Authorization"] = `Bearer ${token}`;
    console.log('Axios interceptor - Authorization header set:', config.headers["Authorization"] ? 'Yes' : 'No');
    console.log('Axios interceptor - Authorization header value:', config.headers["Authorization"] ? (config.headers["Authorization"] as string).substring(0, 20) + '...' : 'Not set');
  } else {
    console.warn('Axios interceptor - No token found in localStorage');
    console.warn('Axios interceptor - localStorage keys:', Object.keys(localStorage));
  }
  
  console.log('Axios interceptor - Final headers:', {
    Authorization: config.headers?.["Authorization"] ? 'Bearer ***' : 'Not set',
    'Content-Type': config.headers?.["Content-Type"] || 'Not set'
  });
  
  return config;
};

api.interceptors.request.use(handleBefore, (error) => {
  return Promise.reject(error);
});

apiWithoutPrefix.interceptors.request.use(handleBefore, (error) => {
  return Promise.reject(error);
});

// Export cả hai instance
export default api;
export {apiWithoutPrefix};