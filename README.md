# Context RAG Chat Application

A full-stack document-grounded chatbot built with the MERN stack and Retrieval-Augmented Generation (RAG). The project combines a React frontend with an Express + MongoDB backend to ingest uploaded documents, index them for semantic search, and answer questions using only the most relevant passages from the document library.

## Overview

This application allows users to:

- Upload PDF, TXT, Markdown, and CSV documents
- Split uploaded content into overlapping chunks
- Generate embeddings for each chunk
- Store chunks and vectors in MongoDB with Atlas Vector Search
- Ask questions in natural language
- Retrieve relevant context and generate grounded responses with source citations

The server is designed to answer from indexed documents rather than rely on unsupported assumptions. If the content does not contain the information needed, the model is instructed to say so.

## Architecture

### Client

The frontend is a React + Vite app located in the `Client` folder. It provides:

- Document upload interface
- Chat UI for Q&A
- Conversation history
- Retrieved source snippets for each answer

### Server

The backend is an Express API located in the `Server` folder. It handles:

- File upload and validation
- Text extraction from supported document types
- Chunking and embeddings
- MongoDB storage and vector retrieval
- Grounded chat generation using an LLM

## Project Structure

```text
ChatBot/
├── Client/                  # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
├── Server/                  # Express API and document processing
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── index.js
│   ├── package.json
├── .gitignore
├── README.md               # This file
└── package-lock.json       # Root lockfile if created in the workspace
```

## Tech Stack

- Frontend: React 19, Vite
- Backend: Node.js, Express
- Database: MongoDB with Atlas Vector Search
- AI: Google Gemini and/or OpenAI embeddings/chat models
- Document processing: PDF, TXT, Markdown, CSV

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ and npm
- MongoDB instance with Atlas Vector Search enabled
- Google API key or OpenAI API key depending on your configuration
- A configured chat model and embedding model

## Environment Setup

### Server configuration

Create a `.env` file in the `Server` directory with values similar to:

```env
PORT=5000
CLIENT_ORIGIN=frontend_url
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_api_key
CHAT_MODEL=your_chat_model
EMBEDDING_MODEL=your_embedding_model
MONGODB_VECTOR_INDEX=your_vector_index_name
```

### Client configuration

Create a `.env` file in the `Client` directory:

```env
VITE_API_URL=backend_api
```

## Running the Project

### 1) Install dependencies

```bash
cd Client && npm install
cd ../Server && npm install
```

### 2) Start the backend

```bash
cd Server
npm run server
```

### 3) Start the frontend

```bash
cd Client
npm run dev
```

The frontend is typically served at `http://localhost:5173`.

## API Endpoints

The server exposes the following routes:

- `GET /api/health` — Check API, database, and AI configuration status
- `GET /api/documents` — List indexed documents
- `POST /api/documents/upload` — Upload one or more documents
- `DELETE /api/documents/:id` — Remove a document and its vectors
- `POST /api/chat` — Send a chat message with optional conversation history

Upload limits:

- Supported formats: PDF, TXT, Markdown, CSV
- Maximum file size: 10 MB per file
- Maximum files per request: 5

## Usage

1. Open the frontend in the browser.
2. Upload one or more documents.
3. Wait for the backend to index the files.
4. Ask a question about the uploaded content.
5. Review the answer and the retrieved source passages.

## Notes

- This project is optimized for document-grounded Q&A rather than general-purpose conversation.
- The backend can be configured to use either Gemini or OpenAI depending on your environment and model settings.
- Ensure your MongoDB collection and vector index match the schema expected by the server.