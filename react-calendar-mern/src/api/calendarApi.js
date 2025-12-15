// src/api/calendarApi.js
import axios from "axios";

const VITE_API_URL = import.meta.env.VITE_API_URL; 
// 예: http://localhost:8080/api

const calendarApi = axios.create({
  baseURL: VITE_API_URL,
});

// ⭐ 요청마다 Authorization Bearer 토큰 자동 첨부
calendarApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default calendarApi;
