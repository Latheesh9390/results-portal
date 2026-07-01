import api from "./axios";

export async function searchResult({ hallticket, examType }) {
  try {
    const { data } = await api.post("/api/results/search", {
      hallticket,
      exam_type: examType,
    });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.detail || "Something went wrong. Please try again.";
    const wrapped = new Error(message);
    wrapped.status = status;
    throw wrapped;
  }
}
