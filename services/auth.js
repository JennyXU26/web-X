const bcrypt = require("bcryptjs");
const { getDB } = require("../config/database");
const { generateJWT } = require("../config/auth");
<<<<<<< HEAD
const { ethers } = require("ethers");
const crypto = require("crypto");
const encryptionRounds = 10;
const { SiweMessage } = require("siwe");
const jwt = require("jsonwebtoken");
const { issueTeamToken } = require("../config/auth");
const { ObjectId } = require("mongodb");
=======

const encryptionRounds = 10;
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df

async function encryptPassword(password) {
  return await bcrypt.hash(password, encryptionRounds);
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

async function registerUser(email, password, displayName) {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    if (email.trim().length === 0 || password.length === 0) {
      return { success: false, error: "Email and password cannot be empty" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: "Invalid email format" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email: email.trim() });
    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await encryptPassword(password);

    // Create new user with new schema
    const newUser = {
      email: email.trim(),
      password: hashedPassword, // Store hashed password (not in spec but needed)
      ethAddresses: null,
      displayName: displayName || email.split("@")[0], // Default to email prefix if not provided
      posts: [], // Initialize empty posts array
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return {
      success: true,
      userID: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("[ERROR] Registration failed:", error);
    return { success: false, error: "Registration failed" };
  }
}

async function loginUser(email, password) {
  try {
    // Input validation
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Find user by email
    const user = await usersCollection.findOne({ email: email.trim() });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: "Invalid password" };
    }

    // Generate JWT token using centralized function
    const token = generateJWT(user._id.toString(), user.email);

    return {
      success: true,
      userID: user._id.toString(),
      displayName: user.displayName,
      posts: user.posts || [],
      token: token,
    };
  } catch (error) {
    console.error("[ERROR] Login failed:", error);
    return { success: false, error: "Login failed" };
  }
}

async function getUserById(userId) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        ethAddresses: user.ethAddresses,
        displayName: user.displayName,
        posts: user.posts || [],
      },
    };
  } catch (error) {
    console.error("[ERROR] Get user failed:", error);
    return { success: false, error: "Failed to get user" };
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
<<<<<<< HEAD

//generate nonce
function generateNonce(len = 17) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

//domain/uri
function deriveDomainAndUri(req) {
  const host = req.get("host");
  const domain = (process.env.SIWE_DOMAIN && process.env.SIWE_DOMAIN.trim())
    ? process.env.SIWE_DOMAIN.trim()
    : (host || "localhost").split(":")[0];
  const uri = `${req.protocol}://${host}`;
  return { domain, uri };
}

// EIP-55 SIWE
async function siweIssueNonce({ ethAddress, chainId, req }) {
  if (!ethAddress || chainId === undefined || chainId === null) {
    const err = new Error("Missing ethAddress or chainId");
    err.httpStatus = 400;
    throw err;
  }

  let checksummed;
  try {
    checksummed = ethers.getAddress(ethAddress);
  } catch {
    const err = new Error("Address not conformant to EIP-55.");
    err.httpStatus = 400;
    throw err;
  }
  if (ethAddress !== checksummed) {
    const err = new Error("Address not conformant to EIP-55.");
    err.httpStatus = 400;
    throw err;
  }

  const chainIdNum = Number(chainId);
  if (!Number.isFinite(chainIdNum) || chainIdNum <= 0) {
    const err = new Error("Invalid chainId");
    err.httpStatus = 400;
    throw err;
  }

  const db = getDB();
  const users = db.collection("users");
  try {
    await users.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
  } catch { }
  try {
    await users.createIndex({ ethAddresses: 1 }, { unique: true, sparse: true, name: "ethAddresses_1" });
  } catch { }

  const nonce = generateNonce(17);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 分钟

  const existing =
    (await users.findOne({ ethAddresses: checksummed, email: { $ne: null } })) ||
    (await users.findOne({ ethAddresses: checksummed }));
  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { nonce, nonceExpiresAt: expiresAt } }
    );
  } else {
    const suggestedDisplayName = "ETH_" + checksummed.slice(0, 6) + "..." + checksummed.slice(-4);
    await users.insertOne({
      email: null,
      ethAddresses: checksummed,
      displayName: suggestedDisplayName,
      posts: [],
      nonce,
      nonceExpiresAt: expiresAt,
      createdAt: now,
      updatedAt: now
    });
  }

  const { domain, uri } = deriveDomainAndUri(req);
  return {
    nonce,
    domain,
    uri,
    version: "1",
    issuedAt: now.toISOString(),
    statement: "Sign in to Twitter-Clone (Course Project)",
    chainId: chainIdNum
  };
}


// divide signin and bind
async function siweVerifyAndMaybeNeedBinding({ message, signature, req }) {
  if (!message || !signature) {
    const err = new Error("Missing message or signature");
    err.httpStatus = 400;
    throw err;
  }

  let siweMsg;
  try {
    siweMsg = new SiweMessage(message);
  } catch {
    const err = new Error("invalid_siwe_message: parse failed");
    err.httpStatus = 400;
    throw err;
  }

  const { domain } = deriveDomainAndUri(req);

  const vr = await siweMsg.verify({ signature, domain, nonce: siweMsg.nonce });
  if (!vr.success) {
    const err = new Error("invalid_siwe_message: signature/domain/nonce mismatch");
    err.httpStatus = 400;
    throw err;
  }

  let addr;
  try { addr = ethers.getAddress(siweMsg.address); }
  catch {
    const err = new Error("Address not conformant to EIP-55.");
    err.httpStatus = 400;
    throw err;
  }
  if (siweMsg.address !== addr) {
    const err = new Error("Address not conformant to EIP-55.");
    err.httpStatus = 400;
    throw err;
  }

  const db = getDB();
  const users = db.collection("users");
  const primaryUser =
    (await users.findOne({ ethAddresses: addr, email: { $ne: null } })) ||
    (await users.findOne({ ethAddresses: addr }));

  if (!primaryUser) {
    const err = new Error("invalid_siwe_message: user not found");
    err.httpStatus = 400;
    throw err;
  }

  let nonceHolder = primaryUser;
  if (!primaryUser.nonce) {
    const alt =
      await users.findOne({
        ethAddresses: addr,
        _id: { $ne: primaryUser._id }
      });
    if (alt && alt.nonce) {
      nonceHolder = alt;
    }
  }

  if (!nonceHolder.nonce) {
    const err = new Error("invalid_siwe_message: no nonce for user");
    err.httpStatus = 400;
    throw err;
  }
  if (nonceHolder.nonce !== siweMsg.nonce) {
    const err = new Error("invalid_siwe_message: nonce mismatch");
    err.httpStatus = 400;
    throw err;
  }
  if (!nonceHolder.nonceExpiresAt || new Date(nonceHolder.nonceExpiresAt).getTime() < Date.now()) {
    const err = new Error("invalid_siwe_message: nonce expired");
    err.httpStatus = 400;
    throw err;
  }

  await users.updateOne(
    { _id: nonceHolder._id },
    { $set: { nonce: null, nonceExpiresAt: null, updatedAt: new Date() } }
  );

  const user = primaryUser;

  if (user.email) {
    const token = issueTeamToken({
      userID: (user._id && user._id.toString) ? user._id.toString() : String(user._id),
      displayName: user.displayName || ("ETH_" + addr.slice(0, 6) + "..." + addr.slice(-4))
    });
    return {
      status: "ok",
      payload: {
        token,
        userID: (user._id && user._id.toString) ? user._id.toString() : String(user._id),
        displayName: user.displayName || ("ETH_" + addr.slice(0, 6) + "..." + addr.slice(-4)),
        posts: Array.isArray(user.posts) ? user.posts : []
      }
    };
  } else {
    const ttlMs = Number(process.env.BINDING_TTL_MS || 300000);
    const bindingToken = jwt.sign(
      { kind: "siwe-binding", addr, uid: (user._id || null) },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: Math.max(1, Math.floor(ttlMs / 1000)) + "s" }
    );
    return {
      status: "needsBinding",
      payload: {
        needsBinding: true,
        bindingToken,
        suggestedDisplayName: user.displayName || ("ETH_" + addr.slice(0, 6) + "..." + addr.slice(-4))
      }
    };
  }
}


//bind account
async function bindSiweToAccount({ bindingToken, email, password, displayName }) {
  if (!bindingToken || !email || !password) {
    const err = new Error("bindingToken/email/password required");
    err.httpStatus = 400;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(bindingToken, process.env.JWT_SECRET || "devsecret");
  } catch {
    const err = new Error("binding_token_invalid_or_expired");
    err.httpStatus = 401;
    throw err;
  }
  if (payload.kind !== "siwe-binding" || !payload.addr) {
    const err = new Error("binding_token_malformed");
    err.httpStatus = 400;
    throw err;
  }

  let addr;
  try { addr = ethers.getAddress(payload.addr); }
  catch {
    const err = new Error("Address not conformant to EIP-55.");
    err.httpStatus = 400;
    throw err;
  }

  let userID = null;
  let finalDisplayName = displayName || null;
  let postsFromAuth = [];

  try {
    const reg = await registerUser(email, password, displayName);
    if (reg && reg.success) {
      userID = reg.userID;
    }
  } catch (e) {
  }


  if (!userID) {
    const lg = await loginUser(email, password);
    if (!lg || !lg.success) {
      const err = new Error(lg?.error || "login_failed_after_register_attempt");
      err.httpStatus = (lg?.error === "Invalid password") ? 401
        : (lg?.error === "User not found") ? 404 : 400;
      throw err;
    }
    userID = lg.userID;
    finalDisplayName = finalDisplayName || lg.displayName || undefined;
    postsFromAuth = Array.isArray(lg.posts) ? lg.posts : [];
  }

  if (!userID) {
    const err = new Error("no_userid_from_auth_system");
    err.httpStatus = 500;
    throw err;
  }

  const db = getDB();
  const users = db.collection("users");

  const occupied = await users.findOne({ ethAddresses: addr });
  const byEmail = await users.findOne({ email });

  try {
    const reg = await registerUser(email, password, displayName);
    if (reg?.success) userID = reg.userID;
  } catch { }
  if (!userID) {
    const lg = await loginUser(email, password);
    if (!lg?.success) {
      const err = new Error(lg?.error || "login_failed_after_register_attempt");
      err.httpStatus = (lg?.error === "Invalid password") ? 401
        : (lg?.error === "User not found") ? 404 : 400;
      throw err;
    }
    userID = lg.userID;
    finalDisplayName = finalDisplayName || lg.displayName || undefined;
    postsFromAuth = Array.isArray(lg.posts) ? lg.posts : [];
  }


  // condition1:account exist
  if (byEmail) {
    await users.updateOne(
      { _id: byEmail._id },
      {
        $set: {
          ethAddresses: addr,
          displayName: finalDisplayName || byEmail.displayName || ("ETH_" + addr.slice(0, 6) + "..." + addr.slice(-4)),
          updatedAt: new Date()
        }
      }
    );
    if (occupied && !occupied._id.equals(byEmail._id)) {
      await users.deleteOne({ _id: occupied._id });
    }
    const bound = await users.findOne({ _id: byEmail._id });
    const token = issueTeamToken({
      userID: bound._id.toString(),
      displayName: bound.displayName,
      email: bound.email,
      ethAddresses: bound.ethAddresses
    });
    return {
      success: true,
      payload: {
        token,
        userID: bound._id.toString(),
        displayName: bound.displayName,
        posts: Array.isArray(bound.posts) ? bound.posts : postsFromAuth
      }
    };
  }

  //condition2:account doesn't exist
  const suggestedName = "ETH_" + addr.slice(0, 6) + "..." + addr.slice(-4);
  if (occupied) {
    await users.updateOne(
      { _id: occupied._id },
      {
        $set: {
          email,
          ethAddresses: addr,
          displayName: finalDisplayName || occupied.displayName || suggestedName,
          updatedAt: new Date()
        },
        $setOnInsert: { posts: [] }
      },
      { upsert: false }
    );
    const bound = await users.findOne({ _id: occupied._id });
    const token = issueTeamToken({
      userID: bound._id.toString(),
      displayName: bound.displayName,
      email: bound.email,
      ethAddresses: bound.ethAddresses
    });
    return {
      success: true,
      payload: {
        token,
        userID: bound._id.toString(),
        displayName: bound.displayName,
        posts: Array.isArray(bound.posts) ? bound.posts : postsFromAuth
      }
    };
  } else {
    const now = new Date();
    const insert = await users.insertOne({
      email, ethAddresses: addr,
      displayName: finalDisplayName || suggestedName,
      posts: [], createdAt: now, updatedAt: now
    });
    const bound = await users.findOne({ _id: insert.insertedId });
    const token = issueTeamToken({
      userID: bound._id.toString(),
      displayName: bound.displayName,
      email: bound.email,
      ethAddresses: bound.ethAddresses
    });
    return {
      success: true,
      payload: {
        token,
        userID: bound._id.toString(),
        displayName: bound.displayName,
        posts: []
      }
    };
  }

  let filter;

  if (occupied) {
    const matchesById =
      userID && ObjectId.isValid(userID) && occupied._id.equals(new ObjectId(userID));
    const matchesByEmail =
      email && occupied.email && occupied.email === email;
    const isPlaceholder = !occupied.email;

    if (matchesById || matchesByEmail || isPlaceholder) {
      filter = { _id: occupied._id };
    } else {
      const err = new Error("address_already_bound_to_another_account");
      err.httpStatus = 409;
      throw err;
    }
  } else {
    filter = ObjectId.isValid(userID) ? { _id: new ObjectId(userID) } : { email };
  }

  let ft;
  if (ObjectId.isValid(userID)) {
    ft = { _id: new ObjectId(userID) };
  } else {
    ft = { email };
  }

  const update = {
    $set: {
      ethAddresses: addr,
      ...(finalDisplayName ? { displayName: finalDisplayName } : {}),
      updatedAt: new Date()
    },
    $setOnInsert: {
      posts: []
    }
  };

  const res = await users.updateOne(ft, update, { upsert: false });
  if (res.matchedCount === 0) {
    await users.updateOne(ft, update, { upsert: true });
  }

  const bound = await users.findOne(ft);
  const resolvedDisplayName =
    bound?.displayName || finalDisplayName || suggestedName;

  const token = issueTeamToken({
    userID: (bound?._id && bound._id.toString) ? bound._id.toString() : String(userID),
    displayName: resolvedDisplayName
  });

  return {
    success: true,
    payload: {
      token,
      userID: (bound?._id && bound._id.toString) ? bound._id.toString() : String(userID),
      displayName: resolvedDisplayName,
      posts: Array.isArray(bound?.posts) ? bound.posts : postsFromAuth
    }
  };
}

module.exports.siweIssueNonce = siweIssueNonce;
module.exports.siweVerifyAndMaybeNeedBinding = siweVerifyAndMaybeNeedBinding;
module.exports.bindSiweToAccount = bindSiweToAccount;
=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df
