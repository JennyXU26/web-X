# web-X

6111 Group Project

## Product Requirements Document
https://docs.google.com/document/d/1QzG_ChycGgjcTCdbPzeXzMaEnG6kHxIX4vmuqIFYPKQ/edit?usp=sharing

## Quick Start

### Prerequisites
- Node.js installed

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server
Start the server with:
```bash
npm start
```

The server will run on http://localhost:3000

### Available Endpoints

**Frontend:**
- `GET /` - Mini X frontend application (HTML/CSS/JS)
- `GET /css/*` - Static CSS files
- `GET /js/*` - Static JavaScript files

**Authentication API:**
- `POST /auth/register` - User registration with email/password
  - Body: `{ email, password, displayName? }`
  - Returns: `{ userID }`
- `POST /auth/login` - User authentication 
  - Body: `{ email, password }`
  - Returns: `{ userID, displayName, posts[] }`
- `GET /auth/verify` - Verify JWT token (from cookie)
  - Returns: `{ success, userId, email }`
<<<<<<< HEAD
  
**SIWE / MetaMask Authentication API:**
- `GET /auth/siwe/nonce` - Get a nonce for SIWE message  
  - Query: `ethAddress=<string>&chainId=<number>`  
  - Returns: `{ domain, uri, version, chainId, nonce, issuedAt, statement }`
- `POST /auth/siwe/verify` - Verify signed SIWE message  
  - Body: `{ message, signature }`  
  - Returns:  
    - `200` - `{ success, userId, email, displayName, ethAddresses }`  
    - `409` - `{ needsBinding, bindingToken, suggestedDisplayName }`
- `POST /auth/siwe/bind` - Bind first-time wallet login to account  
  - Body: `{ bindingToken, email, password, displayName }`  
  - Returns: `{ success, userId, email, displayName, ethAddresses }`
- `GET /auth/siwe/verify` - Verify SIWE login status (via JWT in cookie)  
  - Returns: `{ success, userId, email, displayName, ethAddresses }`

=======
>>>>>>> aefce402eeb15bd845e7a306871e1d72b2f519df

## Development
For development mode, you can also run:
```bash
npm run dev
```

## Project Structure
```
├── server.js              # Main server entry point with Express configuration
├── config/                # Configuration files
│   ├── auth.js            # JWT configuration and utilities
│   └── database.js        # MongoDB connection configuration
├── routes/                # API route handlers
│   └── auth.js            # Authentication routes (/auth/*)
├── services/              # Business logic layer
│   └── auth.js            # Authentication service (registration, login)
├── public/                # Static web files (served at root)
│   ├── index.html         # Frontend application (Mini X)
│   ├── css/
│   │   └── style.css      # Styling and animations
│   └── js/
│       └── script.js      # Client-side JavaScript functionality
├── package.json           # Node.js dependencies and npm scripts
├── package-lock.json      # Exact dependency versions
├── .gitignore            # Git ignore rules for Node.js
└── README.md             # Project documentation
```
