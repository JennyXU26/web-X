// Twitter Clone JavaScript

class TwitterClone {
    constructor() {
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.baseURL = 'http://localhost';
        this.posts = [];
        this.totalPages = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPosts(1);
        this.initDarkMode();
    }

    setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('change', this.toggleDarkMode.bind(this));

        // Post form submission
        const postForm = document.getElementById('postForm');
        postForm.addEventListener('submit', this.handlePostSubmit.bind(this));

        // Character counter
        const postText = document.getElementById('postText');
        postText.addEventListener('input', this.updateCharCounter.bind(this));

        // Modal events
        const postModal = document.getElementById('postModal');
        postModal.addEventListener('hidden.bs.modal', this.resetPostForm.bind(this));
    }

    initDarkMode() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (savedTheme === 'dark') {
            darkModeToggle.checked = true;
            document.documentElement.setAttribute('data-bs-theme', 'dark');
        }
    }

    toggleDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const theme = darkModeToggle.checked ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }

    updateCharCounter() {
        const postText = document.getElementById('postText');
        const charCount = document.getElementById('charCount');
        const submitBtn = document.getElementById('submitPost');
        
        const length = postText.value.length;
        charCount.textContent = length;
        
        // Update styling based on character count
        charCount.className = '';
        if (length > 250) {
            charCount.classList.add('char-warning');
        }
        if (length > 280) {
            charCount.classList.add('char-danger');
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
        }
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        
        const postText = document.getElementById('postText');
        const submitBtn = document.getElementById('submitPost');
        const text = postText.value.trim();
        
        if (!text || text.length > 280) return;
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Posting...';
        
        try {
            const response = await fetch(`${this.baseURL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
                modal.hide();
                
                // Refresh posts
                await this.loadPosts(1);
                
                // Show success message
                this.showToast('Post created successfully!', 'success');
            } else {
                throw new Error('Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            this.showToast('Failed to create post. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    resetPostForm() {
        const postText = document.getElementById('postText');
        const charCount = document.getElementById('charCount');
        const submitBtn = document.getElementById('submitPost');
        
        postText.value = '';
        charCount.textContent = '0';
        charCount.className = '';
        submitBtn.disabled = false;
    }

    async loadPosts(page = 1) {
        const postsContainer = document.getElementById('postsContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // Show loading spinner
        loadingSpinner.style.display = 'block';
        
        try {
            const response = await fetch(`${this.baseURL}/?page=${page}`);
            
            if (response.ok) {
                const data = await response.json();
                this.posts = data.posts || [];
                this.currentPage = page;
                
                // Calculate total pages (assuming we get info about total posts)
                // For now, we'll estimate based on returned posts
                this.totalPages = Math.max(1, Math.ceil(this.posts.length / this.postsPerPage));
                
                this.renderPosts();
                this.renderPagination();
            } else {
                throw new Error('Failed to load posts');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            this.renderErrorState();
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    renderPosts() {
        const postsContainer = document.getElementById('postsContainer');
        
        if (this.posts.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const postsHTML = this.posts.map((post, index) => {
            // Generate mock data for demonstration
            const postId = `post_${Date.now()}_${index}`;
            const author = `user${Math.floor(Math.random() * 1000)}`;
            const timeAgo = this.getRandomTimeAgo();
            const avatar = author.charAt(0).toUpperCase();
            
            return `
                <div class="post-card" data-post-id="${postId}">
                    <div class="d-flex">
                        <div class="post-avatar me-3">
                            ${avatar}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <strong class="me-2">@${author}</strong>
                                <span class="post-meta">${timeAgo}</span>
                            </div>
                            <div class="post-content">
                                ${this.escapeHtml(post)}
                            </div>
                            <div class="post-actions">
                                <a href="#" class="post-action">
                                    <i class="bi bi-chat me-1"></i>
                                    ${Math.floor(Math.random() * 50)}
                                </a>
                                <a href="#" class="post-action">
                                    <i class="bi bi-arrow-repeat me-1"></i>
                                    ${Math.floor(Math.random() * 25)}
                                </a>
                                <a href="#" class="post-action">
                                    <i class="bi bi-heart me-1"></i>
                                    ${Math.floor(Math.random() * 100)}
                                </a>
                                <a href="#" class="post-action">
                                    <i class="bi bi-share me-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        postsContainer.innerHTML = postsHTML;
        
        // Add animation to new posts
        const postCards = postsContainer.querySelectorAll('.post-card');
        postCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('new-post');
            }, index * 50);
        });
    }

    renderEmptyState() {
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-chat-text"></i>
                <h5>No posts yet</h5>
                <p>Be the first to share what's happening!</p>
            </div>
        `;
    }

    renderErrorState() {
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h5>Unable to load posts</h5>
                <p>Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="app.loadPosts(${this.currentPage})">
                    Retry
                </button>
            </div>
        `;
    }

    renderPagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        
        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="app.loadPosts(${this.currentPage - 1})">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${isActive}">
                    <a class="page-link" href="#" onclick="app.loadPosts(${i})">${i}</a>
                </li>
            `;
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="app.loadPosts(${this.currentPage + 1})">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    getRandomTimeAgo() {
        const times = [
            '2m', '5m', '12m', '1h', '2h', '4h', '8h', '1d', '2d', '3d'
        ];
        return times[Math.floor(Math.random() * times.length)];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toastHTML = `
            <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : 'success'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        
        // Add toast to container
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        // Initialize and show toast
        const toastElement = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TwitterClone();
});

// Handle page clicks for pagination (prevent default link behavior)
document.addEventListener('click', (e) => {
    if (e.target.closest('.page-link')) {
        e.preventDefault();
    }
});
