# EcoOps

EcoOps is a local AI-powered knowledge assistant for workplace information. It combines a React frontend, a Node.js proxy API, and a Python RAG service to answer questions using local documents and a small local LLM.

## Project structure

- `frontend/` — Vite + React UI for the assistant
- `backend-node/` — Express API that accepts chat requests and stores logs in MongoDB
- `backend-rag/` — FastAPI + LangChain service for document retrieval and LLM inference

## Features

- Searchable knowledge answers from local `.md` and `.txt` files
- FastAPI retrieval service using ChromaDB and local embeddings
- Express gateway for chat requests and MongoDB logging
- Modern React frontend with dark/light theme support
- Local-first setup without depending on cloud APIs

## Tech stack

- Frontend: React, Vite
- Node backend: Express, MongoDB, Mongoose
- Python backend: FastAPI, LangChain, ChromaDB, Ollama
- AI models: `nomic-embed-text`, `llama3.2:1b`

## Prerequisites

Before running the app, make sure you have:

- Node.js 18+
- Python 3.10+
- MongoDB running locally
- Ollama installed and running

Pull the required models:

```bash
ollama pull nomic-embed-text
ollama pull llama3.2:1b
```

## Setup

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will run on `http://localhost:5173` by default.

### 2) Node backend

```bash
cd backend-node
npm install
node index.js
```

This service listens on `http://localhost:3000` and proxies requests to the Python AI service.

### 3) Python RAG backend

```bash
cd backend-rag
python -m venv .venv
.venv\Scripts\activate
pip install fastapi uvicorn langchain langchain-community langchain-core langchain-chroma langchain-ollama chromadb
```

Then start the service:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`.

### 4) Ingest knowledge files

Add your workplace knowledge documents into `backend-rag/knowledge_dir` as `.md` or `.txt` files, then run:

```bash
cd backend-rag
python ingest.py
```

This loads the files into the local Chroma vector database.

## Environment variables

The Node backend uses a `.env` file in `backend-node/`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecoops
AI_SERVICE_URL=http://localhost:8000/api/ask
```

## Running the full app

Use these commands in separate terminals:

```bash
cd frontend
npm run dev
```

```bash
cd backend-node
node index.js
```

```bash
cd backend-rag
.venv\Scripts\activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Then open `http://localhost:5173` in the browser.

## Notes

- The app expects the MongoDB instance to be running locally.
- The RAG backend depends on the local Ollama service for embeddings and generation.
- The knowledge base is populated from files inside `backend-rag/knowledge_dir`.

