# AI Learning Platform

## Overview

This is a modern AI-powered learning platform built with React, Express.js, and PostgreSQL. The application provides an interactive chat interface where users can engage with AI tutors for various subjects, complemented by video content and document management features.

**Current Status:** Fully functional with Gmail authentication, personalized chat sessions, and AI-powered Q&A system across 8 academic subjects.

## Recent Changes (January 2025) 

✓ **January 9, 2025**: Replaced Statistics section with WebDAV document upload system
✓ **January 9, 2025**: Integrated Nextcloud/WebDAV support for bulk document import
✓ **January 9, 2025**: Implemented PDF processing with OCR (Tesseract) for scanned documents
✓ **January 9, 2025**: Added automatic subject/type detection based on folder structure (e.g., "ly/Lý thuyết về mạch điện" → Physics/Theory)
✓ **January 9, 2025**: Integrated natural language text chunking using spaCy approach
✓ **January 9, 2025**: Fixed WebDAV sync API request method error and added PDF processing fallback
✓ **January 9, 2025**: Updated document table schema (renamed title to name, added type and page_count columns)
✓ **January 9, 2025**: Fixed document type detection to properly recognize "Bài tập" vs "Lý thuyết" based on filename
✓ **January 9, 2025**: Enhanced OCR fallback message with Vietnamese text and suggestions for handling scanned PDFs
✓ **January 9, 2025**: Implemented direct OCR extraction using Tesseract 5.3.4 with Vietnamese language support
✓ **January 9, 2025**: Created document_chunks table for storing processed text chunks
✓ **January 9, 2025**: Enhanced spaCy-like chunking with Vietnamese semantic break detection
✓ **January 9, 2025**: Fixed icon display issues by replacing Font Awesome icons with emoji in defaultSubjects array
✓ **January 9, 2025**: Integrated FAISS/LanceDB vector storage with LangChain for semantic search
✓ **January 9, 2025**: Implemented OpenAI embeddings for document chunks using text-embedding-ada-002
✓ **January 9, 2025**: Enhanced chat responses with RAG (Retrieval Augmented Generation) using vector search
✓ **January 9, 2025**: Added automatic vector processing for uploaded and synced documents
✓ **January 9, 2025**: Replaced emoji icons with proper Lucide React icons for all subjects
✓ **January 9, 2025**: Fixed dark mode styling in Dashboard component
✓ **January 9, 2025**: Created admin login system with environment variable credentials
✓ **January 9, 2025**: Added fallback mock data for subjects and users when database is unavailable
✓ **January 9, 2025**: Implemented dual authentication: Firebase OAuth and admin username/password
✓ **January 9, 2025**: Separated data layer from frontend code with DataService class
✓ **January 9, 2025**: Created app-config.ts for centralized configuration management
✓ **January 9, 2025**: Admin login system working (admin@eduai.com / eduai2025) with database fallback
✓ **January 9, 2025**: Rebuilt entire frontend using shadcn/ui components to minimize code complexity while keeping exact same UI
✓ **January 9, 2025**: Replaced all custom components with shadcn/ui variants: Tabs, Dialog, ScrollArea, Skeleton, etc.
✓ **January 9, 2025**: Cleaned up redundant files and standardized component naming
✓ **January 9, 2025**: Removed all admin-related functionality: data layer, authentication, routes, and UI components
✓ **January 9, 2025**: Simplified LoginScreen to only support Gmail authentication, removed admin tabs

✓ Fixed user authentication system to properly store and use database user IDs
✓ Implemented personalized chat history based on user database ID
✓ Enhanced chat interface with file upload capability
✓ Updated color scheme for better appeal to teenage students
✓ Improved error handling for chat session creation
✓ Added proper user settings management with theme and GPT model selection
✓ Fixed chat message display with proper styling for user/assistant messages
✓ Added sidebar layout for Q&A and Video views with persistent navigation
✓ Resolved chat blinking issue by disabling auto-refresh
✓ Improved sidebar design with cleaner chat history display
✓ Fixed API endpoint for chat messages (using /api/chat/messages/:sessionId)
✓ Restructured navigation to replace dashboard completely when viewing Q&A or Videos
✓ Modified SubjectModal to use navigation callbacks instead of rendering views directly
✓ **January 8, 2025**: Integrated MathJax for beautiful mathematical formula rendering
✓ **January 8, 2025**: Enhanced chat interface with modern bubble design and gradients
✓ **January 8, 2025**: Removed user avatars and improved AI avatars with rounded-xl design
✓ **January 8, 2025**: Added instant message display - user messages appear immediately when sent
✓ **January 8, 2025**: Added title column to chat_sessions table in PostgreSQL
✓ **January 8, 2025**: Implemented dynamic chat session titles based on first user question
✓ **January 8, 2025**: Fixed chat history display in sidebar with proper query structure

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API**: RESTful API with JSON responses
- **Development**: Hot reload with Vite middleware integration

### Database Design
- **Database**: PostgreSQL with Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Firebase Authentication with Google Sign-In
- **Flow**: OAuth integration with server-side user management
- **Sessions**: Firebase handles client sessions, server creates/manages user records

### Chat System
- **AI Integration**: OpenAI API for conversational AI
- **Models**: Configurable GPT models (default: gpt-4o)
- **Sessions**: Persistent chat sessions with dynamic titles based on first user question
- **Real-time**: Instant message display with optimistic updates
- **Math Support**: MathJax integration for inline ($...$) and display ($$...$$) formulas
- **History**: Complete chat history displayed in sidebar with proper session titles
- **RAG Support**: Retrieval Augmented Generation using vector search to provide context-aware responses
- **Vector Search**: LanceDB integration for semantic similarity search across document chunks

### Subject Management
- **Content**: Predefined subjects with icons and colors
- **Resources**: Each subject can have associated documents and videos
- **Organization**: Subject-based chat sessions and content grouping

### User Interface
- **Design System**: shadcn/ui components with Radix UI primitives
- **Responsive**: Mobile-first design with adaptive layouts
- **Theme**: Light/dark mode support with CSS variables
- **Accessibility**: ARIA-compliant components

## Data Flow

1. **User Authentication**: Firebase → Server authentication endpoint → Database user creation/lookup
2. **Chat Interaction**: Client → Chat API → OpenAI API → Database message storage → Client update
3. **Content Management**: Subject selection → Content APIs → Database queries → UI rendering
4. **Settings**: User preferences → Settings API → Database updates → UI state sync

## External Dependencies

### Core Services
- **Firebase**: Authentication and user management
- **OpenAI**: AI chat functionality and content generation (including embeddings)
- **Neon**: PostgreSQL database hosting
- **LanceDB**: Vector database for semantic search

### Development Tools
- **Vite**: Build tool with HMR and development server
- **Drizzle**: Database ORM and migration management
- **Tailwind**: Utility-first CSS framework

### UI Libraries
- **Radix UI**: Headless component primitives
- **Lucide**: Icon library
- **React Query**: Server state management

## Deployment Strategy

### Production Build
- Client: Vite builds static assets to `dist/public`
- Server: esbuild compiles TypeScript to `dist/index.js`
- Database: Drizzle migrations applied via `db:push` command

### Environment Requirements
- Node.js environment with ES module support
- PostgreSQL database (Neon recommended)
- Firebase project with Authentication enabled
- OpenAI API key for chat functionality

### Development Workflow
- `npm run dev`: Starts development server with hot reload
- `npm run build`: Creates production build
- `npm run start`: Runs production server
- `npm run db:push`: Applies database schema changes

The application follows a monorepo structure with shared TypeScript definitions, making it easy to maintain type safety across the full stack while keeping the codebase organized and scalable.