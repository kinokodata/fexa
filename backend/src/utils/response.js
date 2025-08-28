export const success = (data, pagination = null) => {
  const response = { success: true, data };
  if (pagination) {
    response.pagination = pagination;
  }
  return response;
};

export const error = (message, statusCode = 500) => {
  return {
    success: false,
    error: { message }
  };
};