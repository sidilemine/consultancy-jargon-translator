document.addEventListener('DOMContentLoaded', () => {
    const jargonInput = document.getElementById('jargon-input');
    const translationStyleSelect = document.getElementById('translation-style');
    const translateButton = document.getElementById('translate-button');
    const generateButton = document.getElementById('generate-button'); // Get generate button
    const translationOutput = document.getElementById('translation-output');
    const errorMessageDiv = document.getElementById('error-message');

    // Backend endpoints
    const API_TRANSLATE_ENDPOINT = '/api/translate';
    const API_GENERATE_ENDPOINT = '/api/generate'; // New endpoint for generation

    // --- Generate Button Listener ---
    generateButton.addEventListener('click', async () => {
        errorMessageDiv.textContent = '';
        jargonInput.value = 'Generating...'; // Indicate loading
        generateButton.disabled = true; // Disable button during generation
        translateButton.disabled = true;

        try {
            const response = await fetch(API_GENERATE_ENDPOINT, { method: 'POST' }); // Call generate endpoint
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            if (data.jargon) {
                jargonInput.value = data.jargon; // Populate textarea
            } else {
                throw new Error('Invalid response format from generation API.');
            }
        } catch (error) {
            console.error('Generation Error:', error);
            errorMessageDiv.textContent = `Generation Error: ${error.message}`;
            jargonInput.value = ''; // Clear textarea on error
        } finally {
             generateButton.disabled = false; // Re-enable buttons
             translateButton.disabled = false;
        }
    });

    // --- Translate Button Listener ---
    translateButton.addEventListener('click', async () => {
        let jargon = jargonInput.value.trim();
        let style = translationStyleSelect.value;
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
                // Add a flag if the special bullet point style is selected
                body: JSON.stringify({
                    jargon,
                    style,
                    explainBullets: style === 'Key Bullet Points'
                })
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
