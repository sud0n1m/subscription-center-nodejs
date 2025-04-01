// Get the base64-encoded customer ID from the URL
const path = window.location.pathname;
const base64CustomerId = path.split('/')[2]; // Get the ID from /preferences/{id}

// Store the current preferences data
let currentPreferences = null;

// Elements
const titleElement = document.getElementById('title');
const subtitleElement = document.getElementById('subtitle');
const topicsContainer = document.getElementById('topics');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const unsubscribeAllButton = document.getElementById('unsubscribeAllButton');
const toastContainer = document.getElementById('toast-container');
const preferencesContainer = document.getElementById('preferences-container');
const successScreen = document.getElementById('success-screen');

// Toast notification function
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    // Remove the toast after duration
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in-out forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

// Show success screen
function showSuccessScreen() {
    preferencesContainer.style.display = 'none';
    successScreen.style.display = 'block';
}

// Fetch preferences from the backend
async function fetchPreferences() {
    try {
        const response = await fetch(`/preferences/${base64CustomerId}/data`);
        if (!response.ok) throw new Error('Failed to fetch preferences');
        
        const data = await response.json();
        currentPreferences = data;
        
        // Update the UI with the fetched data
        renderPreferences(data);
    } catch (error) {
        console.error('Error loading preferences:', error);
        titleElement.textContent = 'Error Loading Preferences';
        subtitleElement.textContent = 'Please try again later.';
        showToast('Error loading preferences', 'error');
    }
}

// Render the preferences data in the UI
function renderPreferences(data) {
    // Update header
    titleElement.textContent = data.preferences.header.title;
    subtitleElement.textContent = data.preferences.header.subtitle;

    // Clear existing topics
    topicsContainer.innerHTML = '';

    // Render each topic
    data.preferences.topics.forEach(topic => {
        const topicElement = document.createElement('div');
        topicElement.className = 'topic-item';
        topicElement.innerHTML = `
            <label class="toggle-container">
                <input type="checkbox" data-topic-id="${topic.id}" ${topic.subscribed ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
            <div class="topic-content">
                <h3 class="topic-name">${topic.name}</h3>
                ${topic.description ? `<p class="topic-description">${topic.description}</p>` : ''}
            </div>
        `;
        topicsContainer.appendChild(topicElement);
    });
}

// Handle form submission
async function savePreferences() {
    if (!currentPreferences) return;

    try {
        const updatedPreferences = {
            globallyUnsubscribed: false,
            topics: Array.from(document.querySelectorAll('[data-topic-id]')).map(checkbox => ({
                id: parseInt(checkbox.dataset.topicId),
                subscribed: checkbox.checked
            }))
        };

        saveButton.disabled = true;
        cancelButton.disabled = true;
        unsubscribeAllButton.disabled = true;

        const response = await fetch(`/preferences/${base64CustomerId}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedPreferences)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save preferences');
        }

        // Show success message and success screen
        showToast('Preferences saved successfully!');
        showSuccessScreen();
    } catch (error) {
        console.error('Error saving preferences:', error);
        showToast('Failed to save preferences. Please try again.', 'error');
        // Re-enable buttons on error
        saveButton.disabled = false;
        cancelButton.disabled = false;
        unsubscribeAllButton.disabled = false;
    }
}

// Handle unsubscribe all
async function handleUnsubscribeAll() {
    if (!confirm('Are you sure you want to unsubscribe from all emails? This action cannot be undone.')) {
        return;
    }

    try {
        saveButton.disabled = true;
        cancelButton.disabled = true;
        unsubscribeAllButton.disabled = true;

        const response = await fetch(`/preferences/${base64CustomerId}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                globallyUnsubscribed: true,
                topics: currentPreferences.preferences.topics.map(topic => ({
                    id: topic.id,
                    subscribed: false
                }))
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to unsubscribe');
        }

        // Show success message and success screen
        showToast('Successfully unsubscribed from all emails.');
        showSuccessScreen();
    } catch (error) {
        console.error('Error unsubscribing:', error);
        showToast('Failed to unsubscribe. Please try again.', 'error');
        // Re-enable buttons on error
        saveButton.disabled = false;
        cancelButton.disabled = false;
        unsubscribeAllButton.disabled = false;
    }
}

// Handle cancel button
function handleCancel() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        // Reload the current preferences
        fetchPreferences();
    }
}

// Add event listeners
saveButton.addEventListener('click', savePreferences);
cancelButton.addEventListener('click', handleCancel);
unsubscribeAllButton.addEventListener('click', handleUnsubscribeAll);

// Load preferences when the page loads
fetchPreferences(); 