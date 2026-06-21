import api from "./client.js";

export const getBudgets = (params = {}) =>
  api.get("/budgets", { params }).then((r) => r.data);

export const createBudget = (data) =>
  api.post("/budgets", data).then((r) => r.data);

export const updateBudget = (id, data) =>
  api.put(`/budgets/${id}`, data).then((r) => r.data);

export const deleteBudget = (id) =>
  api.delete(`/budgets/${id}`).then((r) => r.data);
