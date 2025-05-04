
# Angelic Frequency Detector 🎵✨

A real-time frequency detection and analysis application that specializes in identifying and analyzing angelic frequencies using web audio technologies.

## 🎯 Features

- Real-time frequency detection and analysis
- Multiple frequency detection capabilities
- Interactive frequency visualization
- Simulation and demo modes for testing
- AI-powered frequency analysis
- Historical frequency tracking
- Sound player for reference frequencies
- Animated mascot guide
- Secure data handling and sharing

## 🛠 Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Audio Processing**: Web Audio API + FFT Analysis
- **Styling**: TailwindCSS + Shadcn/ui
- **State Management**: React Query
- **Routing**: Wouter

## 🏗 Project Structure

```
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   └── pages/         # Page components
├── server/                 # Backend application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage handling
├── shared/                 # Shared TypeScript types
└── tests/                 # Test suites
```

## 📁 Key Files Explained

### Frontend (client/)

- `components/FrequencyVisualizer.tsx`: Real-time frequency visualization
- `components/AngelicFrequencies.tsx`: Reference guide for angelic frequencies
- `components/FrequencyMeterPanel.tsx`: Current frequency display
- `hooks/useAudioAnalyzer.ts`: Core audio analysis functionality
- `lib/frequencyAnalysis.ts`: Frequency analysis algorithms
- `pages/Home.tsx`: Main application page
- `pages/SharedReport.tsx`: Shared frequency analysis reports

### Backend (server/)

- `index.ts`: Express server setup and configuration
- `routes.ts`: API endpoint definitions
- `storage.ts`: Data persistence layer
- `vite.ts`: Development server configuration

### Shared (shared/)

- `schema.ts`: TypeScript interfaces shared between frontend and backend

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## 🔌 Integrations

- **Web Audio API**: Core audio processing
- **FFT Analysis**: Frequency spectrum analysis
- **AI Analysis**: Pattern recognition in frequency sequences
- **Data Persistence**: Local storage for frequency history
- **Real-time Updates**: WebSocket for live frequency data

## 🔒 Security Features

- Secure microphone access handling
- GDPR-compliant data handling
- API fuzzing protection
- UI security measures

## 📱 Supported Platforms

- Modern web browsers (Chrome, Firefox, Safari, Edge)
- Desktop and mobile responsive design
- PWA support for installation

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please check out our contribution guidelines.

## 🐛 Bug Reports

Please use the GitHub issues section to report any bugs.

## 📫 Contact

For any questions or suggestions, please open an issue in the repository.
