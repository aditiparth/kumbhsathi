import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

export const sendChat = (message, history, lang) =>
  API.post("/chat", { message, history, lang });

export const getItinerary = (days, group, lang) =>
  API.post("/itinerary", { days, group, lang });

export const getCrowd = () => API.get("/crowd");

export const getEmergency = () => API.get("/emergency");