// authjs.js - 前端登录/注册逻辑
let isSiweBindingMode = false;
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
// construct SIWE matching EIP-4361
function buildSiweMessage({ domain, address, uri, version, chainId, nonce, issuedAt, statement }) {
  const exp = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${exp}`;
}

// ---------------- 表单切换 ----------------
document.getElementById("show-register").addEventListener("click", () => {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("form-title").innerText = "Register";
  clearErrors();
  clearMessages();
  isSiweBindingMode = false;
  document.getElementById("siwe-binding-token").value = "";
  document.getElementById("register-binding-note").style.display = "none";
});

document.getElementById("show-login").addEventListener("click", () => {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
  document.getElementById("form-title").innerText = "Login";
  clearErrors();
  clearMessages();
  isSiweBindingMode = false;
  document.getElementById("siwe-binding-token").value = "";
  document.getElementById("register-binding-note").style.display = "none";
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
    let res, data;

    if (isSiweBindingMode) {
      //bind mode
      const bindingToken = document.getElementById("siwe-binding-token").value;
      res = await fetch("/auth/siwe/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bindingToken,
          email,
          password,
          displayName: username
        })
      });
      data = await res.json();

      if (res.ok) {
        registerMsg.classList.add("success");
        registerMsg.innerText = "✅ Wallet linked & account ready!";
        await window.app.checkAuthStatus();
        setTimeout(() => { window.location.href = "index.html"; }, 800);
        return;
      } else {
        registerMsg.classList.add("error");
        registerMsg.innerText = data.error || "Binding failed";
        return;
      }
    } else {
      res = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: username })
      });
      data = await res.json();

      if (res.ok) {
        document.getElementById("register-form").reset();
        document.getElementById("show-login").click();
        const loginMsg = document.getElementById("login-message");
        loginMsg.classList.add("success");
        loginMsg.innerText = "✅ Registration successful! Please login.";
      } else {
        registerMsg.classList.add("error");
        registerMsg.innerText = data.error || "Registration failed";
      }
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
      await window.app.checkAuthStatus();
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

  if (isConnectingWallet) return;
  isConnectingWallet = true;

  try {
    //connect wallet
    let accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) {
      accounts = await ethereum.request({ method: "eth_requestAccounts" });
    }
    const rawAddress = accounts[0];
    const walletAddress = ethers.getAddress(rawAddress);
    const chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);

    console.log("[INFO] Wallet connected:", walletAddress);
    loginMsg.classList.add("success");
    loginMsg.innerText = `Wallet connected: ${walletAddress}`;

    //Request nonce
    const nonceRes = await fetch(`/auth/siwe/nonce?ethAddress=${encodeURIComponent(walletAddress)}&chainId=${chainId}`);
    const meta = await nonceRes.json();
    if (!nonceRes.ok) {
      throw new Error(meta?.error || "Failed to get nonce");
    }
    console.log("[INFO] SIWE meta from server:", meta);

    //User signs the nonce
    const message = buildSiweMessage({
      domain: meta.domain,
      address: walletAddress,
      uri: meta.uri,
      version: meta.version,
      chainId,
      nonce: meta.nonce,
      issuedAt: meta.issuedAt,
      statement: meta.statement
    });
    console.log('SIWE message >>>\n' + message + '\n<<< END');


    const signature = await ethereum.request({
      method: "personal_sign",
      params: [message, walletAddress]
    });
    console.log("[INFO] Signature generated:", signature);

    //signature verification
    const verifyRes = await fetch("/auth/siwe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature })
    });

    // 200 success；409 need bind
    if (verifyRes.status === 200) {
      const data = await verifyRes.json();
      loginMsg.classList.add("success");
      loginMsg.innerText = "✅ MetaMask login successful!";
      await window.app.checkAuthStatus();
      setTimeout(() => { window.location.href = "index.html"; }, 800);
      return;
    }

    if (verifyRes.status === 409) {
      const data = await verifyRes.json();

      isSiweBindingMode = true;

      const showRegBtn = document.getElementById("show-register");
      if (showRegBtn) showRegBtn.click();

      const regForm = document.getElementById("register-form");
      if (!regForm) {
        loginMsg.classList.add("error");
        loginMsg.innerText = "Register form not found.";
        return;
      }

      let tokenEl = document.getElementById("siwe-binding-token");
      if (!tokenEl) {
        tokenEl = document.createElement("input");
        tokenEl.type = "hidden";
        tokenEl.id = "siwe-binding-token";
        tokenEl.name = "siweBindingToken";
        regForm.appendChild(tokenEl);
      }
      tokenEl.value = data.bindingToken;

      const nameEl = document.getElementById("register-username");
      if (nameEl) nameEl.value = data.suggestedDisplayName || "";

      let noteEl = document.getElementById("register-binding-note");
      if (!noteEl) {
        noteEl = document.createElement("div");
        noteEl.id = "register-binding-note";
        noteEl.className = "alert alert-info py-2";
        noteEl.style.display = "none";
        regForm.insertAdjacentElement("afterbegin", noteEl);
      }
      noteEl.textContent = "You are linking your MetaMask wallet. Please complete registration to bind.";
      noteEl.style.display = "block";

      const emailEl = document.getElementById("register-email");
      if (emailEl) emailEl.focus();

      return;
    }

    const errData = await verifyRes.json().catch(() => ({}));
    loginMsg.classList.add("error");
    loginMsg.innerText = errData?.error || "MetaMask login failed";
    console.warn("[WARN] MetaMask login failed:", errData);

  } catch (err) {
    console.error("[ERROR] MetaMask login failed:", err);
    loginMsg.classList.add("error");
    loginMsg.innerText = "MetaMask login failed: " + err.message;
  } finally {
    isConnectingWallet = false;
  }
});
