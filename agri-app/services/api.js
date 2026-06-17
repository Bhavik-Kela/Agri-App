import axios from "axios";

const API = axios.create({
  baseURL: "http://10.156.8.109:5000/api",
});

export default API;