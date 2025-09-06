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
- `GET /` - Interactive Hello World page (HTML/CSS/JS)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /css/*` - Static CSS files
- `GET /js/*` - Static JavaScript files

## Development
For development mode, you can also run:
```bash
npm run dev
```

## Project Structure
```
├── server.js              # Main server entry point
├── public/                # Static files (served at root)
│   ├── index.html         # Main HTML page
│   ├── css/
│   │   └── style.css      # Styling and animations
│   └── js/
│       └── script.js      # Client-side JavaScript
├── config/
│   └── database.js        # MongoDB connection configuration
├── routes/
│   └── auth.js            # Authentication API routes
├── services/
│   └── auth.js            # Authentication business logic
├── package.json           # Project dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```
