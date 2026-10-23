from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_chroma import Chroma

# Initialize the FastAPI server instance
app = FastAPI(title="EcoOps - Local AI Engineering RAG API")

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Only allow requests from these specific origins
    allow_credentials=True,
    allow_methods=["*"],              # Allow all standard HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],              # Allow all incoming request headers
)

# Boot up lightweight AI components safely
print("Loading local embeddings and LLM configuration...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")
llm = ChatOllama(model="llama3.2:1b", temperature=0.1)

# Connect to the local vector directory
db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

# Define the validation schema
class QuestionRequest(BaseModel):
    question: str

# API endpoint
@app.post("/api/ask")
async def ask_local_ai(payload: QuestionRequest):
    try:
        user_query = payload.question
        
        # Retrieval: Fetch the best match block from ChromaDB
        matching_docs = db.similarity_search(user_query, k=1)
        
        if not matching_docs:
            return {
                "query": user_query,
                "context_used": "No matching context found.",
                "answer": "I cannot find any relevant facts in my local database."
            }
            
        best_chunk = matching_docs[0]
        retrieved_context = best_chunk.page_content
        source_file = best_chunk.metadata.get("source", "Unknown file")
        
        # Optimized prompt for tiny local models to speak naturally without hallucinating
        system_prompt = f"""
        You are a polite and professional company HR and engineering assistant.
        
        Task: Answer the user's question clearly using ONLY the facts provided in the Context below. 
        Rules: 
        1. Respond in a complete, polite, and natural human sentence.
        2. Do NOT say "Based on the context provided".
        3. Do NOT make up any information outside the Context.

        Context:
        {retrieved_context}

        Question:
        {user_query}

        Answer:
        """

        
        # Generation: Run the local LLM
        response = llm.invoke(system_prompt)
        
        return {
            "query": user_query,
            "context_used": retrieved_context,
            "source_file": source_file,
            "answer": response.content.strip()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
