# EchoSphere

**Real connections, amplified on demand**

EchoSphere is a hybrid social media application that combines authentic, no-nonsense sharing with optional AI-driven "Boost Mode" features. The app prioritizes genuine life updates in a chronological, pressure-free environment while allowing users to opt into enhanced features for deeper engagement.

## Features

### Authentic Base Experience
- Chronological feeds without algorithmic manipulation
- Private circles for targeted sharing
- No likes or vanity metrics - focus on genuine connections
- Clean, distraction-free interface

### Boost Mode (Optional)
- AI-powered content suggestions
- Semantic feedback and emotion-based interactions
- Gamification elements for enhanced engagement
- Personalized content grouping

## Tech Stack

- **Frontend**: React Native with TypeScript
- **State Management**: Redux Toolkit
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Integration**: OpenAI API
- **Payments**: Stripe
- **Testing**: Jest, Detox

## Getting Started

### Prerequisites

- Node.js (>=18)
- React Native development environment
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

4. For iOS, install CocoaPods:
   ```bash
   cd ios && bundle install && bundle exec pod install && cd ..
   ```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android
```

### Testing

```bash
# Run unit tests
npm test

# Run linting
npm run lint
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API and external service integrations
├── store/          # Redux store and slices
├── types/          # TypeScript type definitions
└── utils/          # Utility functions and helpers
```

## Development

This project follows the implementation plan outlined in `.kiro/specs/authenti-boost/tasks.md`. Each task builds incrementally on the previous ones, ensuring a solid foundation and test coverage.

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

Private project - All rights reserved.