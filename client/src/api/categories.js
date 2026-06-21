import api from "./client.js";

export const getCategories = (params = {}) =>
  api.get("/categories", { params }).then((r) => r.data);

export const createCategory = (data) =>
  api.post("/categories", data).then((r) => r.data);

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((r) => r.data);
