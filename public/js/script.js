// Twitter Clone JavaScript

class TwitterClone {
  constructor() {
    this.currentPage = 1;
    this.postsPerPage = 10;
    this.baseURL = "http://localhost:3000";
    this.posts = [];
    this.totalPages = 1;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPosts(1);
    this.initDarkMode();
    this.checkAuthStatus();
  }

  setupEventListeners() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById("darkModeToggle");
    darkModeToggle.addEventListener("change", this.toggleDarkMode.bind(this));

    // Post form submission
    const postForm = document.getElementById("postForm");
    postForm.addEventListener("submit", this.handlePostSubmit.bind(this));

    // Character counter
    const postText = document.getElementById("postText");
    postText.addEventListener("input", this.updateCharCounter.bind(this));

    // Modal events
    const postModal = document.getElementById("postModal");
    postModal.addEventListener(
      "hidden.bs.modal",
      this.resetPostForm.bind(this),
    );
  }

  initDarkMode() {
    const savedTheme = localStorage.getItem("theme") || "light";
    const darkModeToggle = document.getElementById("darkModeToggle");

    if (savedTheme === "dark") {
      darkModeToggle.checked = true;
      document.documentElement.setAttribute("data-bs-theme", "dark");
    }
  }

  toggleDarkMode() {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const theme = darkModeToggle.checked ? "dark" : "light";

    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }

  updateCharCounter() {
    const postText = document.getElementById("postText");
    const charCount = document.getElementById("charCount");
    const submitBtn = document.getElementById("submitPost");

    const length = postText.value.length;
    charCount.textContent = length;

    // Update styling based on character count
    charCount.className = "";
    if (length > 250) {
      charCount.classList.add("char-warning");
    }
    if (length > 280) {
      charCount.classList.add("char-danger");
      submitBtn.disabled = true;
    } else {
      submitBtn.disabled = false;
    }
  }

  async handlePostSubmit(e) {
    e.preventDefault();

    const postText = document.getElementById("postText");
    const submitBtn = document.getElementById("submitPost");
    const text = postText.value.trim();

    if (!text || text.length > 280) return;

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Posting...';

    try {
      const response = await fetch(`${this.baseURL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const result = await response.json();

        // Close modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("postModal"),
        );
        modal.hide();

        // Refresh posts
        await this.loadPosts(1);

        // Show success message
        this.showToast("Post created successfully!", "success");
      } else {
        throw new Error("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      this.showToast("Failed to create post. Please try again.", "error");
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  resetPostForm() {
    const postText = document.getElementById("postText");
    const charCount = document.getElementById("charCount");
    const submitBtn = document.getElementById("submitPost");

    postText.value = "";
    charCount.textContent = "0";
    charCount.className = "";
    submitBtn.disabled = false;
  }

  async loadPosts(page = 1) {
    const postsContainer = document.getElementById("postsContainer");
    const loadingSpinner = document.getElementById("loadingSpinner");

    // Show loading spinner
    loadingSpinner.style.display = "block";

    try {
      // Convert 1-based frontend page to 0-based API page
      const apiPage = page - 1;
      const response = await fetch(`${this.baseURL}/posts?page=${apiPage}`);

      if (response.ok) {
        const data = await response.json();
        this.posts = data.posts || [];
        this.currentPage = page;

        // Use pageNum from server response for total pages
        this.totalPages = data.pageNum || 1;

        this.renderPosts();
        this.renderPagination();
      } else {
        throw new Error("Failed to load posts");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      this.renderErrorState();
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  async renderPosts() {
    const postsContainer = document.getElementById("postsContainer");

    if (this.posts.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Show loading state while fetching post details
    postsContainer.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
      // Fetch detailed information for each post
      const postDetails = await Promise.all(
        this.posts.map(async (postId) => {
          try {
            // Fetch post details
            const postResponse = await fetch(`${this.baseURL}/posts/${postId}`);
            if (!postResponse.ok) throw new Error('Failed to fetch post');
            const postData = await postResponse.json();

            // Fetch user details
            const userResponse = await fetch(`${this.baseURL}/users/${postData.author}`);
            if (!userResponse.ok) throw new Error('Failed to fetch user');
            const userData = await userResponse.json();

            return {
              id: postId,
              text: postData.text,
              author: postData.author,
              createdAt: new Date(postData.createdAt),
              displayName: userData.displayName
            };
          } catch (error) {
            console.error(`Error fetching details for post ${postId}:`, error);
            return {
              id: postId,
              text: 'Failed to load post content',
              author: 'unknown',
              createdAt: new Date(),
              displayName: 'Unknown User'
            };
          }
        })
      );

      // Generate HTML for posts with real data
      const postsHTML = postDetails
        .map((post) => {
          const formattedDate = this.formatDate(post.createdAt);

          return `
            <div class="post-card" data-post-id="${post.id}">
              <div class="post-header">
                <strong class="post-author">${this.escapeHtml(post.displayName)}</strong>
              </div>
              <hr class="post-divider">
              <div class="post-content">
                ${this.escapeHtml(post.text)}
              </div>
              <div class="post-footer">
                <small class="post-date">${formattedDate}</small>
              </div>
            </div>
          `;
        })
        .join("");

      postsContainer.innerHTML = postsHTML;

      // Add animation to new posts
      const postCards = postsContainer.querySelectorAll(".post-card");
      postCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add("new-post");
        }, index * 50);
      });

    } catch (error) {
      console.error('Error rendering posts:', error);
      postsContainer.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-exclamation-triangle"></i>
          <h5>Failed to load posts</h5>
          <p>Please try refreshing the page.</p>
        </div>
      `;
    }
  }

  formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  renderEmptyState() {
    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-chat-text"></i>
                <h5>No posts yet</h5>
                <p>Be the first to share what's happening!</p>
            </div>
        `;
  }

  renderErrorState() {
    const postsContainer = document.getElementById("postsContainer");
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
    const paginationContainer = document.getElementById("paginationContainer");

    if (this.totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let paginationHTML = "";

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
      const isActive = i === this.currentPage ? "active" : "";
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
    const times = ["2m", "5m", "12m", "1h", "2h", "4h", "8h", "1d", "2d", "3d"];
    return times[Math.floor(Math.random() * times.length)];
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async checkAuthStatus() {
    try {
      let response = await fetch(`${this.baseURL}/auth/verify`, {
        method: "GET",
        credentials: "include",
      });

      // if auth/verify fail，try SIWE verify
      if (!response.ok) {
        response = await fetch(`${this.baseURL}/auth/siwe/verify`, {
          method: "GET",
          credentials: "include",
        });
      }

      const loginButton = document.querySelector('[data-bs-target="#authModal"]');

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // User is logged in - fetch full profile data
          await this.loadUserProfile(data.userId);

          // Update button to show profile instead of auth modal
          loginButton.innerHTML = '<i class="bi bi-person-check me-1"></i>Profile';
          loginButton.classList.remove('btn-outline-primary');
          loginButton.classList.add('btn-success');
          loginButton.setAttribute('data-bs-target', '#profileModal');

          // Store user info for later use
          this.currentUser = {
            userId: data.userId,
            email: data.email
          };
        }
      } else {
        // User is not logged in
        this.setLoggedOutState();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      this.setLoggedOutState();
    }
  }

  setLoggedOutState() {
    const loginButton = document.querySelector('[data-bs-target="#authModal"], [data-bs-target="#profileModal"]');
    loginButton.innerHTML = '<i class="bi bi-person-circle me-1"></i>Login';
    loginButton.classList.remove('btn-success');
    loginButton.classList.add('btn-outline-primary');
    loginButton.setAttribute('data-bs-target', '#authModal');
    this.currentUser = null;
  }

  async loadUserProfile(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();

        // Update profile modal with user data
        document.getElementById('profile-displayname').textContent = userData.displayName || '-';
        document.getElementById('profile-email').textContent = userData.email || '-';
        const addr = userData.ethAddresses;
        document.getElementById('profile-ethaddress').textContent = addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '-';


        // Store full user data
        this.currentUser = {
          ...this.currentUser,
          displayName: userData.displayName,
          ethAddress: userData.ethAddress
        };
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  async handleLogout() {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Close profile modal
        const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        if (profileModal) {
          profileModal.hide();
        }

        // Reset to logged out state
        this.setLoggedOutState();

        // Show success message
        this.showToast("Logged out successfully!", "success");

        // Optionally reload posts to reflect logged out state
        await this.loadPosts(1);
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      this.showToast("Logout failed. Please try again.", "error");
    }
  }

  showToast(message, type = "info") {
    // Create toast element
    const toastHTML = `
            <div class="toast align-items-center text-bg-${type === "error" ? "danger" : "success"} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    // Add toast to container
    toastContainer.insertAdjacentHTML("beforeend", toastHTML);

    // Initialize and show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Remove toast element after it's hidden
    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new TwitterClone();
});

// Handle page clicks for pagination (prevent default link behavior)
document.addEventListener("click", (e) => {
  if (e.target.closest(".page-link")) {
    e.preventDefault();
  }
});
