document.addEventListener('DOMContentLoaded', () => {
    const jargonInput = document.getElementById('jargon-input');
    const translationStyleSelect = document.getElementById('translation-style');
    const translateButton = document.getElementById('translate-button');
    const translationOutput = document.getElementById('translation-output');
    const errorMessageDiv = document.getElementById('error-message');

    // The backend server will handle the API key securely.
    const API_TRANSLATE_ENDPOINT = '/api/translate';

    translateButton.addEventListener('click', async () => {
        const jargon = jargonInput.value.trim();
        const style = translationStyleSelect.value;
        errorMessageDiv.textContent = ''; // Clear previous errors
        translationOutput.textContent = 'Translating...'; // Loading indicator

        if (!jargon) {
            errorMessageDiv.textContent = 'Please enter some jargon to translate.';
            translationOutput.textContent = 'Your translation will appear here...';
            return;
        }

        // No API key check needed here anymore.

        try {
            // Call our backend endpoint
            const response = await fetch(API_TRANSLATE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jargon, style }) // Send jargon and style to backend
            });

            const data = await response.json(); // Always parse JSON, even for errors

            if (!response.ok) {
                // Use the error message from the backend response if available
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            // Expecting { translation: "..." } from the backend
            if (data.translation) {
                translationOutput.textContent = data.translation;
            } else {
                throw new Error('Invalid response format from backend.');
            }

        } catch (error) {
            console.error('Translation Error:', error);
            errorMessageDiv.textContent = `Error: ${error.message}`; // Display the error message
            translationOutput.textContent = 'Translation failed.';
        }
    });
});
