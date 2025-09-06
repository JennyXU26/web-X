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
- `GET /` - Welcome message
- `GET /test_db` - MongoDB KV operations test page (counter demo)

## Development
For development mode, you can also run:
```bash
npm run dev
```

## Project Structure
```
├── server.js              # Main server entry point
├── config/
│   └── database.js         # MongoDB connection configuration
├── routes/
│   └── testdb.js          # Test database routes
├── package.json           # Project dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```
