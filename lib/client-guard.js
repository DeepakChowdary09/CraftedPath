/**
 * Client-side guard utilities to prevent server-side rendering issues
 */

export const isClient = typeof window !== "undefined";
export const isServer = typeof window === "undefined";

/**
 * Safely access window object
 * @param {Function} fn - Function to execute with window
 * @param {*} defaultValue - Default value for server-side
 */
export const safeWindow = (fn, defaultValue = null) => {
  if (isClient) {
    return fn(window);
  }
  return defaultValue;
};

/**
 * Safely access document object
 * @param {Function} fn - Function to execute with document
 * @param {*} defaultValue - Default value for server-side
 */
export const safeDocument = (fn, defaultValue = null) => {
  if (isClient) {
    return fn(document);
  }
  return defaultValue;
};

/**
 * Dynamically import client-side libraries
 * @param {Function} importFn - Dynamic import function
 * @returns {Promise} Promise that resolves to the library or null
 */
export const dynamicClientImport = async (importFn) => {
  if (isClient) {
    try {
      const importedModule = await importFn();
      return importedModule.default || importedModule;
    } catch (error) {
      console.error("Failed to import client library:", error);
    }
  }
  return null;
};
