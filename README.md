# IDE (Indicate Demand / Exchange) ??

IDE is a marketplace feed application built with React Native and Expo. It allows users to quickly post what they want to sell (SALE) or what they want to buy (REQUEST) without initial friction.

## Features

- **Zero-Friction Browsing & Posting:** Browse listings and post new items anonymously using device-based identity (UUID). 
- **Auto-Expiring Posts:** Marketplace remains fresh; all posts naturally expire after **48 hours**.
- **Dual Marketplace:** Filter the feed by **SALE** (people selling items) or **REQUEST** (people looking for items/offers).
- **Token System:** Premium actions (like purchasing tokens) are managed via Firebase Auth and processed via Paystack (integrated using WebView).
- **Direct Contact:** See a listing you like? Get the user's contact directly without complex in-app messaging.

## Tech Stack

- **Framework:** [Expo](https://expo.dev) & React Native
- **Navigation:** expo-router for file-based routing
- **State Management:** zustand
- **Networking:** xios
- **Backend / Auth:** Firebase Auth & Firebase Storage
- **Identity Storage:** expo-secure-store
- **WebView (Payments):** eact-native-webview

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- 
pm or yarn
- Expo CLI

### Installation

1. Install dependencies:
   `ash
   npm install
   `
   *(Note: if you encounter peer dependency issues with React Native packages, use \
pm install --legacy-peer-deps\)*

2. Environment Variables:
   Create a \.env\ file in the root of the project using the \.env.example\ file as a template:
   `env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   `

3. Start the development server:
   `ash
   npx expo start
   `

## Project Structure

`	ext
src/
+-- app/                  # expo-router file structures (tabs, overlays, auth)
+-- components/           # Reusable UI components (PostCard, ExpiryBadge, Modals)
¦   +-- ui/               # Lower-level styled building blocks
+-- lib/                  # Utilities (Axios config, Firebase init, Device UUID)
+-- store/                # Zustand global state manager (useStore)
+-- types/                # TypeScript interface definitions 
`

## AI Implementation Guide

To further extend or rebuild components of this app using AI companions, reference the \AI_IMPLEMENTATION_GUIDE.md\ provided in the root workspace. It contains stringent architectural constraints, schema details, and explicit guidance for file composition and endpoints within the IDE system.
