// authjs.js - 前端登录/注册逻辑

function showError(id, msg) {
  const el = document.getElementById(id);
  el.style.display = "block";
  el.innerText = msg;
}

function clearErrors() {
  document.querySelectorAll(".error").forEach(e => {
    e.style.display = "none";
    e.innerText = "";
  });
}

function clearMessages() {
  document.querySelectorAll(".message").forEach(e => {
    e.classList.remove("success", "error");
    e.innerText = "";
  });
}

// ---------------- 表单切换 ----------------
document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("form-title").innerText = "Register";
  clearErrors();
  clearMessages();
});

document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
  document.getElementById("form-title").innerText = "Login";
  clearErrors();
  clearMessages();
});

// ---------------- 注册逻辑 ----------------
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  clearMessages();

  const username = document.getElementById("register-username").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;
  const registerMsg = document.getElementById("register-message");

  if (!username) return showError("register-username-error", "Username is required");
  if (!email) return showError("register-email-error", "Email is required");
  if (!password) return showError("register-password-error", "Password is required");
  if (password !== confirm) return showError("register-confirm-error", "Passwords do not match");

  console.log("[INFO] Registration attempt:", { email, password, displayName: username });

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: username })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById("register-form").reset();
      document.getElementById("show-login").click();
      const loginMsg = document.getElementById("login-message");
      loginMsg.classList.add("success");
      loginMsg.innerText = "✅ Registration successful! Please login.";
    } else {
      registerMsg.classList.add("error");
      registerMsg.innerText = data.error || "Registration failed";
      console.warn("[WARN] Registration failed:", data);
    }
  } catch (err) {
    console.error("[ERROR] Network or server error during registration:", err);
    registerMsg.classList.add("error");
    registerMsg.innerText = "Network error. Please try again.";
  }
});

// ---------------- 登录逻辑 ----------------
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  clearMessages();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const loginMsg = document.getElementById("login-message");

  if (!email) return showError("login-username-error", "Email is required");
  if (!password) return showError("login-password-error", "Password is required");

  console.log("[INFO] Login attempt:", { email, password });

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      loginMsg.classList.add("success");
      loginMsg.innerText = "✅ Login successful! Redirecting...";
      // 如果后端返回 token，存储 token
      // localStorage.setItem("token", data.token);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      loginMsg.classList.add("error");
      loginMsg.innerText = data.error || "Login failed";
      console.warn("[WARN] Login failed:", data);
    }
  } catch (err) {
    console.error("[ERROR] Network or server error during login:", err);
    loginMsg.classList.add("error");
    loginMsg.innerText = "Network error. Please try again.";
  }
});

// ---------------- 密码显示/隐藏 ----------------
document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const targetId = icon.getAttribute("data-target");
    const input = document.getElementById(targetId);
    const img = icon.querySelector("img"); // 获取里面的 <img>

    if (input.type === "password") {
      input.type = "text";
      img.src = "https://img.icons8.com/fluency-systems-regular/48/invisible.png";
      img.alt = "invisible icon";
    } else {
      input.type = "password";
      img.src = "https://img.icons8.com/fluency-systems-regular/48/visible--v1.png";
      img.alt = "visible icon";
    }
  });
});

// ---------------- 确认密码实时校验 ----------------
const passwordInput = document.getElementById("register-password");
const confirmInput = document.getElementById("register-confirm");
const confirmStatus = document.getElementById("confirm-status");

function checkPasswordMatch() {
  if (!confirmInput.value) {
    confirmStatus.innerText = "";
    confirmStatus.className = "status-icon";
    return;
  }

  if (passwordInput.value === confirmInput.value) {
    confirmStatus.innerText = "✔";
    confirmStatus.className = "status-icon success";
  } else {
    confirmStatus.innerText = "✖";
    confirmStatus.className = "status-icon error";
  }
}

passwordInput.addEventListener("input", checkPasswordMatch);
confirmInput.addEventListener("input", checkPasswordMatch);

// ---------------- MetaMask 登录 ----------------
// ---------------- MetaMask Login ----------------
let isConnectingWallet = false; // Prevent multiple requests

document.getElementById("metamask-login").addEventListener("click", async () => {
  const loginMsg = document.getElementById("login-message");
  clearErrors();
  clearMessages();

  if (!window.ethereum) {
    loginMsg.classList.add("error");
    loginMsg.innerText = "MetaMask not installed. Please install the MetaMask extension.";
    return;
  }

  if (isConnectingWallet) return; // Prevent duplicate clicks
  isConnectingWallet = true;

  try {
    // 1️⃣ Check if wallet is already connected
    let accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      // If not connected, request connection
      accounts = await ethereum.request({ method: "eth_requestAccounts" });
    }

    const walletAddress = accounts[0];
    console.log("[INFO] Wallet connected:", walletAddress);
    loginMsg.classList.add("success");
    loginMsg.innerText = `Wallet connected: ${walletAddress}`;

    // 2️⃣ Request nonce from backend
    const nonceRes = await fetch("/auth/metamask/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress })
    });
    const { nonce } = await nonceRes.json();
    console.log("[INFO] Received nonce from server:", nonce);

    // 3️⃣ User signs the nonce
    const signature = await ethereum.request({
      method: "personal_sign",
      params: [nonce, walletAddress]
    });
    console.log("[INFO] Signature generated:", signature);

    // 4️⃣ Submit signature to backend for verification
    const verifyRes = await fetch("/auth/metamask/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, signature })
    });
    const data = await verifyRes.json();

    if (verifyRes.ok) {
      loginMsg.classList.add("success");
      loginMsg.innerText = "✅ MetaMask login successful! Redirecting...";
      // localStorage.setItem("token", data.token);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      loginMsg.classList.add("error");
      loginMsg.innerText = data.error || "MetaMask login failed";
      console.warn("[WARN] MetaMask login failed:", data);
    }
  } catch (err) {
    console.error("[ERROR] MetaMask login failed:", err);
    loginMsg.classList.add("error");
    loginMsg.innerText = "MetaMask login failed: " + err.message;
  } finally {
    isConnectingWallet = false; // Reset flag
  }
});

