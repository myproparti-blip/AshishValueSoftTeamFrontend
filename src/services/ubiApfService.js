import api, { invalidateCache as clearAxiosCache } from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Create a new UBI APF form
 * @param {Object} data - Form data to create
 * @returns {Promise} Created form data
 */
export const createUbiApfForm = async (data) => {
  try {
    console.log("[createUbiApf] Sending request:", { 
      uniqueId: data.uniqueId,
      clientId: data.clientId ? data.clientId.substring(0, 8) + "..." : "missing"
    });

    const response = await api.post(`${API_BASE_URL}/ubi-apf`, data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create UBI APF form');
    }

    console.log("[createUbiApf] Success");
    return response.data.data;
  } catch (error) {
    console.error("[createUbiApf] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get all UBI APF forms with filters
 * @param {Object} filters - Filter criteria (username, userRole, clientId, status, etc.)
 * @returns {Promise} List of forms with pagination
 */
export const getAllUbiApfForms = async (filters = {}) => {
  try {
    console.log("[getAllUbiApf] Fetching with filters:", {
      userRole: filters.userRole,
      status: filters.status,
      page: filters.page
    });

    const response = await api.get(`${API_BASE_URL}/ubi-apf`, {
      params: filters
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch UBI APF forms');
    }

    console.log("[getAllUbiApf] Success:", {
      total: response.data.pagination?.total,
      returned: response.data.data?.length
    });
    return response.data;
  } catch (error) {
    console.error("[getAllUbiApf] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get a single UBI APF form by ID
 * @param {String} id - Form unique ID
 * @param {String} username - Current user
 * @param {String} userRole - User role (user/manager/admin)
 * @param {String} clientId - Client identifier
 * @returns {Promise} Form data
 */
export const getUbiApfFormById = async (id, username, userRole, clientId) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid form ID format');
    }

    console.log("[getUbiApfById] Fetching form:", {
      id,
      username,
      userRole,
      clientId: clientId ? clientId.substring(0, 8) + "..." : "missing"
    });

    const response = await api.get(`${API_BASE_URL}/ubi-apf/${id}`, {
      params: { username, userRole, clientId }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch UBI APF form');
    }

    console.log("[getUbiApfById] Success");
    return response.data.data;
  } catch (error) {
    console.error("[getUbiApfById] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Update a UBI APF form
 * @param {String} id - Form unique ID
 * @param {Object} data - Updated form data
 * @param {String} username - Current user
 * @param {String} userRole - User role
 * @param {String} clientId - Client identifier
 * @returns {Promise} Updated form data
 */
export const updateUbiApfForm = async (id, data, username, userRole, clientId) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid form ID format');
    }

    if (!username || !userRole || !clientId) {
      throw new Error('Missing required user information');
    }

    console.log("[updateUbiApf] Sending update request:", {
      id,
      username,
      userRole,
      clientId: clientId ? clientId.substring(0, 8) + "..." : "missing",
      dataSize: JSON.stringify(data).length
    });

    const response = await api.put(`${API_BASE_URL}/ubi-apf/${id}`, data, {
      params: { username, userRole, clientId }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update UBI APF form');
    }

    console.log("[updateUbiApf] Success");
    clearAxiosCache('ubi-apf');
    return response.data.data;
  } catch (error) {
    console.error("[updateUbiApf] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Manager/Admin submit (approve or reject) a UBI APF form
 * @param {String} id - Form unique ID
 * @param {String} action - Action: 'approved' or 'rejected'
 * @param {String} feedback - Optional feedback/comments
 * @param {String} username - Manager username
 * @param {String} userRole - Manager role
 * @returns {Promise} Updated form data
 */
export const managerSubmitUbiApfForm = async (id, action, feedback, username, userRole) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid form ID format');
    }

    if (!['approved', 'rejected'].includes(action)) {
      throw new Error('Invalid action. Must be "approved" or "rejected"');
    }

    // Get clientId from localStorage
    const user = localStorage.getItem("user");
    const userData = user ? JSON.parse(user) : {};
    const clientId = userData.clientId || "unknown";

    const requestBody = {
      action,
      feedback: feedback ? feedback.trim() : "",
      username,
      userRole,
      clientId
    };

    console.log("[managerSubmitUbiApf] Sending:", {
      id,
      action,
      username,
      clientId: clientId.substring(0, 8) + "..."
    });

    const response = await api.post(
      `${API_BASE_URL}/ubi-apf/${id}/manager-submit`,
      requestBody
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to submit UBI APF form');
    }

    console.log("[managerSubmitUbiApf] Success:", { action });
    clearAxiosCache('ubi-apf');
    return response.data.data;
  } catch (error) {
    console.error("[managerSubmitUbiApf] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Request rework on an approved UBI APF form
 * @param {String} id - Form unique ID
 * @param {String} comments - Rework comments/instructions
 * @param {String} username - Manager username
 * @param {String} userRole - Manager role
 * @returns {Promise} Updated form data
 */
export const requestReworkUbiApfForm = async (id, comments, username, userRole) => {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid form ID format');
    }

    // Get clientId from localStorage
    const user = localStorage.getItem("user");
    const userData = user ? JSON.parse(user) : {};
    const clientId = userData.clientId || "unknown";

    const requestBody = {
      comments: comments ? comments.trim() : "",
      username,
      userRole,
      clientId
    };

    console.log("[requestReworkUbiApf] Sending request:", {
      id,
      username,
      clientId: clientId.substring(0, 8) + "..."
    });

    const response = await api.post(
      `${API_BASE_URL}/ubi-apf/${id}/request-rework`,
      requestBody
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to request rework');
    }

    console.log("[requestReworkUbiApf] Success");
    clearAxiosCache('ubi-apf');
    return response.data.data;
  } catch (error) {
    console.error("[requestReworkUbiApf] Error:", error.message);
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Invalidate UBI APF cache
 * @param {String} pattern - Optional cache pattern
 */
export const invalidateCache = (pattern = 'ubi-apf') => {
  clearAxiosCache(pattern);
};
