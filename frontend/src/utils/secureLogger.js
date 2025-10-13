/**
 * Secure Logger Utility
 * Prevents sensitive data from being logged in production
 */

export const secureLog = {
  /**
   * Safe development-only logging
   * @param {string} message - Log message
   * @param {any} data - Data to log (will be redacted in production)
   */
  dev: (message, data = null) => {
    if (import.meta.env.MODE === "development") {
      if (data !== null) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  },

  /**
   * Safe development-only warning
   * @param {string} message - Warning message
   * @param {any} data - Data to log
   */
  warn: (message, data = null) => {
    if (import.meta.env.MODE === "development") {
      if (data !== null) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  },

  /**
   * Safe development-only error logging
   * @param {string} message - Error message
   * @param {any} error - Error object
   */
  error: (message, error = null) => {
    if (import.meta.env.MODE === "development") {
      if (error !== null) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    }
  },

  /**
   * Redact sensitive fields from objects before logging
   * @param {object} data - Object to redact
   * @param {string[]} sensitiveFields - Fields to redact
   * @returns {object} - Redacted object
   */
  redact: (data, sensitiveFields = [
    'token', 'password', 'email', 'phone', 'mobile', 
    'contact', 'ssn', 'tin', 'id_number'
  ]) => {
    if (!data || typeof data !== 'object') return data;
    
    const redacted = { ...data };
    
    sensitiveFields.forEach(field => {
      Object.keys(redacted).forEach(key => {
        if (key.toLowerCase().includes(field.toLowerCase())) {
          redacted[key] = '[REDACTED]';
        }
      });
    });
    
    return redacted;
  }
};

export default secureLog;