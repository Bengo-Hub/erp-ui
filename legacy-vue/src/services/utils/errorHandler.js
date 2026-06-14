// errorHandler.js
export function handleError(error) {
    // Handle the error appropriately (e.g., log it or show a message)
    console.error(error);
    return { error: true, message: 'An error occurred: ' + error.toString() };
}
