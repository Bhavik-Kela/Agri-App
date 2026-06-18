import axios from "axios";
import { loadSession } from "../src/services/authStorage";

const API = axios.create({
  baseURL: "http://10.148.186.109:5000/api",
});

let currentToken = null;

export function setApiAuthToken(token) {
  currentToken = token || null;
}

API.interceptors.request.use(async (config) => {
  const token = currentToken || (await loadSession()).token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;