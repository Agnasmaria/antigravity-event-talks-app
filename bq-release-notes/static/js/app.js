// Application State Management
let allNotes = [];
let filteredNotes = [];
let currentCategory = 'all';
let searchQuery = '';
let selectedNote = null;

// DOM Elements
const notesGrid = document.getElementById('notes-grid');
const searchInput = document.getElementById('search-input');
const categoryPills = document.querySelectorAll('.filter-pill');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const cacheStatusText = document.getElementById('cache-status-text');
const emptyState = document.getElementById('empty-state');
const toast = document.getElementById('toast');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const postTweetBtn = document.getElementById('post-tweet-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const previewCategory = document.getElementById('preview-card-category');
const previewTitle = document.getElementById('preview-card-title');
const previewText = document.getElementById('preview-card-text');

// Init application
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().strip ? e.target.value.toLowerCase().trim() : e.target.value.toLowerCase();
        applyFilters();
    });

    // Category pills click handler
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.dataset.category.toLowerCase();
            applyFilters();
        });
    });

    // Refresh button click handler
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Close modal handlers
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Live Tweet text change counter
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Tweet redirect execution
    postTweetBtn.addEventListener('click', handleTweetPosting);
}

// Fetch notes from Flask backend
async function fetchReleaseNotes(forceRefresh = false) {
    // Show spinner and skeleton loader
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
    
    // Clear notes list with skeletons if initial or refresh
    notesGrid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
    emptyState.classList.add('hidden');

    try {
        const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success') {
            allNotes = data.notes;
            
            // Format cache update time
            const date = new Date(data.timestamp * 1000);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            cacheStatusText.textContent = `Last sync: ${timeString}`;
            
            applyFilters();
            
            if (forceRefresh) {
                showToast("Release notes synchronized successfully!");
            }
        } else {
            console.error("Failed to fetch notes:", data.message);
            showToast(`Error: ${data.message}`, true);
            renderEmptyState();
        }
    } catch (err) {
        console.error("Network error:", err);
        showToast("Failed to connect to backend server.", true);
        renderEmptyState();
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Filter and Search application logic
function applyFilters() {
    filteredNotes = allNotes.filter(note => {
        const matchesCategory = currentCategory === 'all' || note.category.toLowerCase() === currentCategory;
        
        const textToSearch = `${note.category} ${note.date} ${note.description_text}`.toLowerCase();
        const matchesSearch = textToSearch.includes(searchQuery);
        
        return matchesCategory && matchesSearch;
    });

    renderNotes();
}

// Render filtered cards into feed
function renderNotes() {
    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    notesGrid.innerHTML = filteredNotes.map((note, index) => {
        const catClass = note.category.toLowerCase();
        
        return `
            <div class="card" data-category="${catClass}" style="animation: fadeIn 0.4s ease-out ${index * 0.05}s both;">
                <div class="card-header">
                    <span class="badge badge-${catClass}">${note.category}</span>
                    <span class="card-date">${note.date}</span>
                </div>
                <div class="card-body">
                    ${note.description_html}
                </div>
                <div class="card-footer">
                    <button class="tweet-btn" onclick="openTweetModal(${index})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet Update
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render empty state
function renderEmptyState() {
    notesGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
}

// Modal actions: Open composer with context-aware draft
function openTweetModal(filteredIndex) {
    selectedNote = filteredNotes[filteredIndex];
    if (!selectedNote) return;

    // Show modal
    tweetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Stop background scrolling

    // Category and details setup
    previewCategory.textContent = selectedNote.category;
    previewCategory.className = `preview-tag badge-${selectedNote.category.toLowerCase()}`;
    previewTitle.textContent = `BigQuery Update: ${selectedNote.date}`;
    
    // Clean text snippet for preview card
    const rawSnippet = selectedNote.description_text;
    const cleanSnippet = rawSnippet.length > 130 ? rawSnippet.substring(0, 127) + '...' : rawSnippet;
    previewText.textContent = cleanSnippet;

    // Auto-create initial post content draft
    // Prepares text for tweet (aiming for characters < 280 including hashtags and URL)
    let summaryText = rawSnippet;
    if (summaryText.length > 120) {
        summaryText = summaryText.substring(0, 117) + '...';
    }
    
    const initialTweet = `🚀 New #BigQuery update (${selectedNote.date}):\n\n"${summaryText}"\n\nRead more details here: ${selectedNote.link} #GoogleCloud #GCP`;
    
    tweetTextarea.value = initialTweet;
    updateCharCounter();
    tweetTextarea.focus();
}

function closeTweetModal() {
    tweetModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Re-enable background scrolling
    selectedNote = null;
}

// Update Tweet composer character count dynamic colors
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCount.textContent = len;
    
    // Reset classes
    charCount.className = 'character-counter';
    
    if (len > 280) {
        charCount.classList.add('danger');
        postTweetBtn.disabled = true;
    } else if (len > 250) {
        charCount.classList.add('warning');
        postTweetBtn.disabled = false;
    } else {
        postTweetBtn.disabled = len === 0;
    }
}

// Handle posting by redirecting to Twitter web intent
function handleTweetPosting() {
    if (!tweetTextarea.value || tweetTextarea.value.length > 280) return;
    
    const tweetText = tweetTextarea.value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    window.open(twitterUrl, '_blank', 'width=550,height=420,referrerpolicy=no-referrer');
    closeTweetModal();
    showToast("Twitter intent opened successfully!");
}

// Custom Toast notification utility
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
    toast.style.border = isError ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)';
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
