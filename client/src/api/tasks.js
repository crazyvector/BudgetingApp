import api from "./client.js";

export const getTasks = (params = {}) => api.get("/tasks", { params }).then((r) => r.data);

export const createTask = (data) => api.post("/tasks", data).then((r) => r.data);

export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);
