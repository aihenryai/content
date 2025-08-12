// ===== Global Variables =====
let messagesData = [];
let currentView = 'timeline'; // Changed from 'categories' to 'timeline'
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
    console.log('App initializing...');
    await loadMessages();
    initializeEventListeners();
    showView('timeline'); // Changed from 'categories' to 'timeline'
    updateStats();
    console.log('App ready!');
});

// ===== Load Messages =====
async function loadMessages() {
    try {
        showLoading(true);
        
        // Simulate loading - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load from local storage or generate sample data
        const stored = localStorage.getItem('messagesData');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                messagesData = parsed.map(msg => ({
                    ...msg,
                    date: msg.date ? new Date(msg.date) : new Date()
                }));
            } catch (e) {
                console.error('Error parsing stored data:', e);
                messagesData = generateSampleData();
            }
        } else {
            messagesData = generateSampleData();
            localStorage.setItem('messagesData', JSON.stringify(messagesData));
        }
        
        // Ensure all messages have categories
        messagesData = messagesData.map(msg => ({
            ...msg,
            category: msg.category || detectCategory(msg.text),
            date: msg.date ? new Date(msg.date) : new Date()
        }));
        
        // Sort by date (newest first)
        messagesData.sort((a, b) => b.date - a.date);
        
        // Debug: Log first message structure
        if (messagesData.length > 0) {
            console.log('First message structure:', messagesData[0]);
            console.log('Text type:', typeof messagesData[0].text);
            console.log('Raw text:', messagesData[0].text);
            
            // Log a few more messages to understand the pattern
            console.log('Sample of processed messages:');
            messagesData.slice(0, 5).forEach((msg, i) => {
                console.log(`Message ${i}:`, {
                    text: msg.text.substring(0, 100) + '...',
                    category: msg.category,
                    hasEntities: !!msg.entities
                });
            });
        }
        
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
            <div class="no-results">
                <p class="search-hint">לא נמצאו תוצאות עבור "${query}"</p>
                <button class="btn-primary" onclick="showView('timeline')">
                    חזרה לציר הזמן
                </button>
            </div>
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
    
    // Group messages by date
    const groupedMessages = groupMessagesByDate(messages);
    
    // Create timeline items
    Object.entries(groupedMessages).forEach(([dateStr, dayMessages]) => {
        const timelineItem = createTimelineItem(dateStr, dayMessages);
        container.appendChild(timelineItem);
    });
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="no-timeline-results">
                <i class="fas fa-calendar-times"></i>
                <p>אין תוכן להצגה בתקופה הנבחרת</p>
                <button class="btn-primary" onclick="filterTimeline('all')">הצג הכל</button>
            </div>
        `;
    }
}

// ===== Filter Timeline =====
function filterTimeline(filter) {
    displayTimeline(filter);
}

// ===== Group Messages By Date =====
function groupMessagesByDate(messages) {
    const grouped = {};
    
    messages.forEach(msg => {
        const dateKey = formatDateKey(msg.date);
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(msg);
    });
    
    return grouped;
}

// ===== Create Timeline Item =====
function createTimelineItem(dateStr, messages) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    const messagesHtml = messages.map(msg => `
        <div class="timeline-message" onclick="showMessageModal(${JSON.stringify(msg).replace(/"/g, '&quot;')})">
            <div class="timeline-message-text">${truncateText(msg.text, 120)}</div>
            <div class="timeline-message-category">${getCategoryName(msg.category)}</div>
        </div>
    `).join('');
    
    item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <div class="timeline-date">${formatTimelineDate(dateStr)}</div>
            <div class="timeline-messages">
                ${messagesHtml}
            </div>
            <div class="timeline-count">${messages.length} ${messages.length === 1 ? 'פוסט' : 'פוסטים'}</div>
        </div>
    `;
    
    return item;
}

// ===== Get Category Name =====
function getCategoryName(category) {
    const categoryNames = {
        'ai-tools': 'כלי AI',
        'workshops': 'סדנאות וקורסים',
        'news': 'חדשות ועדכונים',
        'tips': 'טיפים וטריקים',
        'cases': 'מקרי שימוש',
        'resources': 'קישורים ומקורות'
    };
    return categoryNames[category] || category;
}

// ===== Show Random Message =====
function showRandomMessage() {
    if (messagesData.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * messagesData.length);
    const randomMessage = messagesData[randomIndex];
    showMessageModal(randomMessage);
}

// ===== Show Message Modal =====
function showMessageModal(message) {
    currentMessageIndex = messagesData.findIndex(msg => 
        msg.text === message.text && msg.date.getTime() === message.date.getTime()
    );
    
    displayModalMessage(message);
    document.getElementById('message-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ===== Display Modal Message =====
function displayModalMessage(message) {
    document.getElementById('modal-date').textContent = formatDate(message.date);
    document.getElementById('modal-text').innerHTML = formatMessageText(message.text);
    
    // Display tags
    const tags = message.entities ? extractTags(message) : [];
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = tags.length > 0 ? 
        tags.map(tag => `<span class="tag">${tag}</span>`).join('') : 
        '<span class="no-tags">אין תגיות</span>';
    
    // Display source/category
    document.getElementById('modal-source').innerHTML = `
        <span class="category-badge ${message.category}">${getCategoryName(message.category)}</span>
    `;
}

// ===== Setup Modal Controls =====
function setupModalControls() {
    const modal = document.getElementById('message-modal');
    const closeBtn = document.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('close-modal');
    const prevBtn = document.getElementById('prev-message');
    const nextBtn = document.getElementById('next-message');
    
    // Close modal functions
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    
    closeBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') nextMessage();
            if (e.key === 'ArrowRight') prevMessage();
        }
    });
    
    // Previous/Next message
    prevBtn.addEventListener('click', prevMessage);
    nextBtn.addEventListener('click', nextMessage);
}

// ===== Previous Message =====
function prevMessage() {
    if (currentMessageIndex > 0) {
        currentMessageIndex--;
        displayModalMessage(messagesData[currentMessageIndex]);
    }
}

// ===== Next Message =====
function nextMessage() {
    if (currentMessageIndex < messagesData.length - 1) {
        currentMessageIndex++;
        displayModalMessage(messagesData[currentMessageIndex]);
    }
}

// ===== Utility Functions =====
function formatDate(date) {
    if (!date || !(date instanceof Date)) return 'תאריך לא זמין';
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('he-IL', options);
}

function formatDateKey(date) {
    if (!date || !(date instanceof Date)) return 'unknown';
    return date.toISOString().split('T')[0];
}

function formatTimelineDate(dateStr) {
    if (!dateStr || dateStr === 'unknown') return 'תאריך לא ידוע';
    
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (formatDateKey(date) === formatDateKey(today)) {
        return 'היום';
    } else if (formatDateKey(date) === formatDateKey(yesterday)) {
        return 'אתמול';
    } else {
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatMessageText(text) {
    if (!text) return '';
    
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    
    // Convert line breaks to <br> tags
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

function extractTags(message) {
    if (!message.entities) return [];
    
    const tags = [];
    message.entities.forEach(entity => {
        if (entity.type === 'hashtag') {
            tags.push(entity.text);
        } else if (entity.type === 'mention') {
            tags.push(entity.text);
        }
    });
    
    return [...new Set(tags)]; // Remove duplicates
}

function isWithinDateRange(date, range) {
    const now = new Date();
    const messageDate = new Date(date);
    
    switch (range) {
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return messageDate >= weekAgo;
        case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return messageDate >= monthAgo;
        case 'quarter':
            const quarterAgo = new Date(now);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return messageDate >= quarterAgo;
        case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return messageDate >= yearAgo;
        default:
            return true;
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

function showError(message) {
    // Simple error display - could be enhanced with a proper notification system
    alert(message);
}

function updateStats() {
    document.getElementById('total-messages').textContent = messagesData.length;
    
    if (messagesData.length > 0) {
        const oldestDate = messagesData[messagesData.length - 1].date;
        const daysDiff = Math.ceil((new Date() - oldestDate) / (1000 * 60 * 60 * 24));
        document.getElementById('days-active').textContent = daysDiff;
        
        const latestDate = messagesData[0].date;
        const lastUpdateEl = document.getElementById('last-update');
        if (latestDate) {
            const today = new Date();
            const diffDays = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                lastUpdateEl.textContent = 'היום';
            } else if (diffDays === 1) {
                lastUpdateEl.textContent = 'אתמול';
            } else {
                lastUpdateEl.textContent = `לפני ${diffDays} ימים`;
            }
        }
    }
}

// ===== Generate Sample Data =====
function generateSampleData() {
    const sampleMessages = [
        {
            text: "היום השקנו גרסה חדשה של ChatGPT עם יכולות משופרות לניתוח תמונות ועבודה עם קבצים. הכלי החדש מאפשר לכם לעלות תמונות ולקבל תיאורים מפורטים, ניתוח והסברים על התוכן שבהן.",
            category: "ai-tools",
            date: new Date(2024, 2, 15, 10, 30)
        },
        {
            text: "טיפ חשוב לכתיבת פרומפטים יעילים: השתמשו בשפה ברורה ומפורטת, תנו דוגמאות ובקשו מהמודל לחשוב צעד אחר צעד. זה משפר משמעותית את איכות התוצאות.",
            category: "tips",
            date: new Date(2024, 2, 14, 15, 45)
        },
        {
            text: "בסדנה הקרובה נלמד איך לבנות צ'אטבוט חכם עם Claude API. נכסה את כל השלבים מהתחלה - מהגדרת API ועד לפריסה בענן. הרשמה פתוחה!",
            category: "workshops",
            date: new Date(2024, 2, 13, 12, 0)
        },
        {
            text: "מקרה שימוש מעניין: חברת היי-טק ישראלית השתמשה ב-AI לניתוח פידבק לקוחות והצליחה לזהות בעיות איכות לפני שהן הפכו לקריטיות. חיסכון של מיליוני שקלים!",
            category: "cases",
            date: new Date(2024, 2, 12, 9, 15)
        },
        {
            text: "עדכון חשוב: מידג'רני הכריזה על גרסה 6 עם איכות תמונה משופרת ומהירות יצירה מוגברת. הגרסה החדשה זמינה כעת למנויים.",
            category: "news",
            date: new Date(2024, 2, 11, 14, 20)
        },
        {
            text: "מאמר מומלץ על העתיד של AI בחינוך: https://example.com/ai-education-future - סקירה מקיפה של הטכנולוגיות החדשות ושילובן במערכת החינוך.",
            category: "resources",
            date: new Date(2024, 2, 10, 16, 30)
        }
    ];
    
    return sampleMessages;
}
