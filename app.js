// ===== Global Variables =====
let messagesData = [];
let currentView = 'categories';
let currentCategory = null;
let searchResults = [];
let currentMessageIndex = 0;

// ===== Category Keywords =====
const categoryKeywords = {
    'ai-tools': ['ChatGPT', 'Claude', 'Midjourney', 'DALL-E', 'Stable Diffusion', 'GPT', 'AI', 'כלי', 'בינה מלאכותית', 'צ\'אט', 'קלוד'],
    'workshops': ['סדנה', 'סדנת', 'workshop', 'קורס', 'course', 'הרצאה', 'מפגש', 'למידה', 'הדרכה'],
    'news': ['חדש', 'עדכון', 'update', 'news', 'השקה', 'גרסה', 'version', 'פיצ\'ר', 'feature'],
    'tips': ['טיפ', 'tip', 'טריק', 'trick', 'פרומפט', 'prompt', 'איך', 'how', 'מדריך', 'guide'],
    'cases': ['מקרה', 'case', 'דוגמה', 'example', 'שימוש', 'use case', 'יישום', 'פרויקט'],
    'resources': ['קישור', 'link', 'מאמר', 'article', 'משאב', 'resource', 'מקור', 'אתר', 'כתובת']
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadMessages();
    initializeEventListeners();
    showView('categories');
    updateStats();
});

// ===== Load Messages from JSON =====
async function loadMessages() {
    try {
        showLoading(true);
        const response = await fetch('result.json');
        const data = await response.json();
        messagesData = data.messages || [];
        
        // Process and categorize messages
        messagesData = messagesData.map((msg, index) => {
            const text = Array.isArray(msg.text) ? msg.text.join(' ') : msg.text;
            return {
                ...msg,
                id: msg.id || index,
                text: text,
                category: detectCategory(text),
                date: new Date(msg.date)
            };
        });
        
        // Sort by date (newest first)
        messagesData.sort((a, b) => b.date - a.date);
        
        showLoading(false);
        displayCategories();
    } catch (error) {
        console.error('Error loading messages:', error);
        showLoading(false);
        showError('שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
    }
}

// ===== Detect Category =====
function detectCategory(text) {
    if (!text) return 'resources';
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }
    
    return 'resources'; // Default category
}

// ===== Display Categories =====
function displayCategories() {
    const categories = document.querySelectorAll('.category-section');
    
    categories.forEach(categoryEl => {
        const category = categoryEl.dataset.category;
        const messages = messagesData.filter(msg => msg.category === category);
        
        // Update count
        const countEl = categoryEl.querySelector('.category-count');
        countEl.textContent = messages.length;
        
        // Show preview messages (latest 3)
        const previewContainer = categoryEl.querySelector('.preview-messages');
        previewContainer.innerHTML = '';
        
        messages.slice(0, 3).forEach(msg => {
            const previewEl = createPreviewElement(msg);
            previewContainer.appendChild(previewEl);
        });
    });
}

// ===== Create Preview Element =====
function createPreviewElement(message) {
    const div = document.createElement('div');
    div.className = 'preview-message';
    div.innerHTML = `
        <div class="preview-message-date">${formatDate(message.date)}</div>
        <div class="preview-message-text">${truncateText(message.text, 100)}</div>
    `;
    div.onclick = () => showMessageModal(message);
    return div;
}

// ===== Create Message Card =====
function createMessageCard(message) {
    const div = document.createElement('div');
    div.className = 'message-card';
    
    const tags = message.entities ? extractTags(message) : [];
    const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    div.innerHTML = `
        <div class="message-date">${formatDate(message.date)}</div>
        <div class="message-text">${truncateText(message.text, 150)}</div>
        <div class="message-meta">
            <div class="message-tags">${tagsHtml}</div>
            <span class="read-more">קרא עוד</span>
        </div>
    `;
    
    div.onclick = () => showMessageModal(message);
    return div;
}

// ===== Initialize Event Listeners =====
function initializeEventListeners() {
    // Navigation cards
    document.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('click', () => {
            const view = card.dataset.view;
            if (view) {
                showView(view);
                setActiveNavCard(card);
            }
        });
    });
    
    // Random button
    document.getElementById('random-button').addEventListener('click', showRandomMessage);
    
    // Category expand/collapse
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.category-section');
            section.classList.toggle('expanded');
        });
    });
    
    // Show all buttons
    document.querySelectorAll('.show-all-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = btn.closest('.category-section').dataset.category;
            showCategoryFullView(category);
        });
    });
    
    // Search functionality
    setupSearch();
    
    // Timeline filters
    document.querySelectorAll('.timeline-filter').forEach(filter => {
        filter.addEventListener('click', () => {
            document.querySelectorAll('.timeline-filter').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            filterTimeline(filter.dataset.filter);
        });
    });
    
    // Back button
    document.getElementById('back-to-categories').addEventListener('click', () => {
        showView('categories');
    });
    
    // Modal controls
    setupModalControls();
}

// ===== Setup Search =====
function setupSearch() {
    // Header search toggle
    const searchToggle = document.getElementById('search-toggle');
    const headerSearch = document.getElementById('header-search');
    
    searchToggle.addEventListener('click', () => {
        headerSearch.classList.toggle('active');
        if (headerSearch.classList.contains('active')) {
            document.getElementById('header-search-input').focus();
        }
    });
    
    // Header search
    document.getElementById('header-search-btn').addEventListener('click', performHeaderSearch);
    document.getElementById('header-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performHeaderSearch();
    });
    
    // Advanced search
    document.getElementById('search-btn').addEventListener('click', performAdvancedSearch);
    document.getElementById('advanced-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performAdvancedSearch();
    });
}

// ===== Perform Header Search =====
function performHeaderSearch() {
    const query = document.getElementById('header-search-input').value.trim();
    if (!query) return;
    
    searchResults = messagesData.filter(msg => 
        msg.text.toLowerCase().includes(query.toLowerCase())
    );
    
    showView('advanced-search');
    displaySearchResults(searchResults, query);
}

// ===== Perform Advanced Search =====
function performAdvancedSearch() {
    const query = document.getElementById('advanced-search-input').value.trim();
    const categoryFilter = document.getElementById('filter-category').value;
    const dateFilter = document.getElementById('filter-date').value;
    
    if (!query) {
        showError('אנא הכנס מילות חיפוש');
        return;
    }
    
    searchResults = messagesData.filter(msg => {
        const matchesQuery = msg.text.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = !categoryFilter || msg.category === categoryFilter;
        const matchesDate = !dateFilter || isWithinDateRange(msg.date, dateFilter);
        
        return matchesQuery && matchesCategory && matchesDate;
    });
    
    displaySearchResults(searchResults, query);
}

// ===== Display Search Results =====
function displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = `
            <p class="search-hint">לא נמצאו תוצאות עבור "${query}"</p>
        `;
        return;
    }
    
    container.innerHTML = `
        <p class="search-summary">נמצאו ${results.length} תוצאות עבור "${query}"</p>
        <div class="messages-grid"></div>
    `;
    
    const grid = container.querySelector('.messages-grid');
    results.forEach(msg => {
        grid.appendChild(createMessageCard(msg));
    });
}

// ===== Show View =====
function showView(view) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const viewElement = document.getElementById(`${view}-section`);
    if (viewElement) {
        viewElement.classList.add('active');
        currentView = view;
        
        if (view === 'timeline') {
            displayTimeline();
        }
    }
}

// ===== Set Active Nav Card =====
function setActiveNavCard(activeCard) {
    document.querySelectorAll('.nav-card').forEach(card => {
        card.classList.remove('active');
    });
    activeCard.classList.add('active');
}

// ===== Show Category Full View =====
function showCategoryFullView(category) {
    currentCategory = category;
    const messages = messagesData.filter(msg => msg.category === category);
    
    const titleEl = document.getElementById('category-full-title');
    const containerEl = document.getElementById('category-full-messages');
    
    const categoryNames = {
        'ai-tools': 'כלי AI',
        'workshops': 'סדנאות וקורסים',
        'news': 'חדשות ועדכונים',
        'tips': 'טיפים וטריקים',
        'cases': 'מקרי שימוש',
        'resources': 'קישורים ומקורות'
    };
    
    titleEl.textContent = categoryNames[category] || category;
    containerEl.innerHTML = '';
    
    messages.forEach(msg => {
        containerEl.appendChild(createMessageCard(msg));
    });
    
    showView('category-full-view');
}

// ===== Display Timeline =====
function displayTimeline(filter = 'all') {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    let messages = [...messagesData];
    
    // Apply filter
    if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        messages = messages.filter(msg => msg.date > monthAgo);
    } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        messages = messages.filter(msg => msg.date > weekAgo);
    }
    
    // Group by month
    const grouped = groupByMonth(messages);
    
    Object.entries(grouped).forEach(([month, msgs]) => {
        const monthEl = document.createElement('div');
        monthEl.className = 'timeline-month';
        monthEl.innerHTML = `<h3 class="timeline-month-title">${month}</h3>`;
        
        msgs.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${formatDate(msg.date)}</div>
                    <div class="timeline-text">${truncateText(msg.text, 200)}</div>
                </div>
            `;
            item.querySelector('.timeline-content').onclick = () => showMessageModal(msg);
            monthEl.appendChild(item);
        });
        
        container.appendChild(monthEl);
    });
}

// ===== Show Random Message =====
function showRandomMessage() {
    if (messagesData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * messagesData.length);
    const message = messagesData[randomIndex];
    
    const modal = document.getElementById('random-modal');
    const modalBody = document.getElementById('random-modal-body');
    
    modalBody.innerHTML = `
        <div class="message-full">
            <div class="message-date">${formatDate(message.date)}</div>
            <div class="message-content">${formatMessage(message.text)}</div>
            ${message.media ? `<div class="message-media">${getMediaHtml(message.media)}</div>` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Another random button
    document.getElementById('another-random').onclick = () => {
        showRandomMessage();
    };
}

// ===== Show Message Modal =====
function showMessageModal(message) {
    const modal = document.getElementById('message-modal');
    const modalDate = document.getElementById('modal-date');
    const modalTags = document.getElementById('modal-tags');
    const modalBody = document.getElementById('modal-body');
    
    currentMessageIndex = messagesData.findIndex(msg => msg.id === message.id);
    
    modalDate.textContent = formatDate(message.date);
    modalTags.innerHTML = extractTags(message).map(tag => `<span class="tag">${tag}</span>`).join('');
    
    modalBody.innerHTML = `
        <div class="message-full">
            <div class="message-content">${formatMessage(message.text)}</div>
            ${message.media ? `<div class="message-media">${getMediaHtml(message.media)}</div>` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

// ===== Setup Modal Controls =====
function setupModalControls() {
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = () => {
            closeBtn.closest('.modal').style.display = 'none';
        };
    });
    
    // Click outside to close
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // Navigation buttons
    document.getElementById('prev-message').onclick = () => navigateMessage(-1);
    document.getElementById('next-message').onclick = () => navigateMessage(1);
    
    // Share button
    document.getElementById('share-message').onclick = shareMessage;
}

// ===== Navigate Message =====
function navigateMessage(direction) {
    const newIndex = currentMessageIndex + direction;
    if (newIndex >= 0 && newIndex < messagesData.length) {
        showMessageModal(messagesData[newIndex]);
    }
}

// ===== Share Message =====
function shareMessage() {
    const message = messagesData[currentMessageIndex];
    const text = `${message.text}\n\nמתוך: AI עם הנרי`;
    
    if (navigator.share) {
        navigator.share({
            title: 'AI עם הנרי',
            text: text,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            alert('הטקסט הועתק ללוח');
        });
    }
}

// ===== Update Stats =====
function updateStats() {
    const stats = {
        'total-messages': messagesData.length,
        'total-tools': messagesData.filter(msg => msg.category === 'ai-tools').length,
        'total-workshops': messagesData.filter(msg => msg.category === 'workshops').length,
        'total-tips': messagesData.filter(msg => msg.category === 'tips').length
    };
    
    Object.entries(stats).forEach(([id, count]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });
}

// ===== Utility Functions =====
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('he-IL', options);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function formatMessage(text) {
    if (!text) return '';
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
}

function extractTags(message) {
    const tags = [];
    if (message.entities) {
        message.entities.forEach(entity => {
            if (entity.type === 'hashtag') {
                tags.push(entity.text);
            }
        });
    }
    return tags;
}

function getMediaHtml(media) {
    if (!media) return '';
    
    if (media.type === 'photo') {
        return `<img src="media/photos/${media.file_id}.jpg" alt="תמונה" loading="lazy">`;
    } else if (media.type === 'video') {
        return `<video controls src="media/files/${media.file_id}.mp4"></video>`;
    } else if (media.type === 'document') {
        return `<a href="media/files/${media.file_id}" download class="download-link">
            <i class="fas fa-download"></i> הורד קובץ
        </a>`;
    }
    
    return '';
}

function isWithinDateRange(date, range) {
    const now = new Date();
    let startDate;
    
    switch (range) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case '3months':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            return true;
    }
    
    return date >= startDate;
}

function groupByMonth(messages) {
    const grouped = {};
    
    messages.forEach(msg => {
        const monthYear = msg.date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        if (!grouped[monthYear]) {
            grouped[monthYear] = [];
        }
        grouped[monthYear].push(msg);
    });
    
    return grouped;
}

function filterTimeline(filter) {
    displayTimeline(filter);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.classList.toggle('active', show);
}

function showError(message) {
    alert(message); // You can replace with a better notification system
}
