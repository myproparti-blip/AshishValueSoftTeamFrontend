import api, { invalidateCache as clearAxiosCache } from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;
export const createValuation = async (data) => {
  try {
    const response = await api.post(`${API_BASE_URL}/valuations`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating valuation:", error);
    throw error.response?.data || error.message;
  }
};
export const getValuationById = async (id, username, userRole, clientId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/valuations/${id}`, {
      params: { username, userRole, clientId }
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching valuation:", error);
    throw error.response?.data || error.message;
  }
};
export const getAllValuations = async (filters = {}) => {
  try {
    const response = await api.get(`${API_BASE_URL}/valuations`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching valuations:", error);
    throw error.response?.data || error.message;
  }
};

export const updateValuation = async (id, data, username, userRole, clientId) => {
  try {
    const response = await api.put(`${API_BASE_URL}/valuations/${id}`, data, {
      params: { username, userRole, clientId }
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating valuation:", error);
    throw error.response?.data || error.message;
  }
};
export const managerSubmit = async (id, actionOrPayload, feedback, username, userRole) => {
  try {
    const user = localStorage.getItem("user");
    const userData = user ? JSON.parse(user) : {};
    const clientId = userData.clientId || "unknown";
    
    let requestBody;
    if (typeof actionOrPayload === 'object' && actionOrPayload !== null) {
      requestBody = {
        status: actionOrPayload.status,
        managerFeedback: actionOrPayload.managerFeedback,
        clientId
      };
    } else {
      requestBody = {
        action: actionOrPayload,
        feedback,
        username,
        userRole,
        clientId
      };
    }
    
    const response = await api.post(
      `${API_BASE_URL}/valuations/${id}/manager-submit`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting valuation:", error);
    throw error.response?.data || error.message;
  }
};
export const managerSubmitValuation = async (id, action, feedback, username, userRole) => {
  return managerSubmit(id, action, feedback, username, userRole);
};

export const requestRework = async (id, comments, username, userRole) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/valuations/${id}/request-rework`,
      { comments, username, userRole }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting rework:", error);
    throw error.response?.data || error.message;
  }
};



export const invalidateCache = (pattern) => {
  clearAxiosCache(pattern);
};


export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.error) {
    return error.error;
  }
  return "An unexpected error occurred";
};

export const formatSuccessMessage = (response) => {
  if (typeof response === 'string') {
    return response;
  }
  if (response?.message) {
    return response.message;
  }
  return "Operation completed successfully";
};
