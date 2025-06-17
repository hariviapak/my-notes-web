# My Notes & Finance Web App

A web-based notes and financial tracking application built with React, TypeScript, and Dexie.js for local storage.

## Features

- **Notes System**
  - Rich text editor
  - Categories and tags
  - Link to transactions
  - Search functionality

- **Transaction System**
  - Track expenses and transfers
  - Auto-suggestions for fields
  - Category management
  - Balance calculations

- **Data Backup/Restore**
  - Export to JSON file
  - Import from JSON file
  - Data validation on import

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/my-notes-web.git
   cd my-notes-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To build the application for production:

```bash
npm run build
```

### Deployment to GitHub Pages

1. Update the `homepage` field in `package.json` with your GitHub Pages URL:
   ```json
   {
     "homepage": "https://yourusername.github.io/my-notes-web"
   }
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Technologies Used

- React
- TypeScript
- Material-UI
- Dexie.js (IndexedDB)
- React Router
- React Quill
- Vite

## Data Storage

The application uses IndexedDB through Dexie.js for local storage. All data is stored in the user's browser and can be exported/imported as JSON files.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
