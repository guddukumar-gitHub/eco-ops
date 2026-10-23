from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma


def run_ingestion():
    data_path = Path("./knowledge_dir")
    db_path = "./chroma_db"

    data_files = sorted(
        path
        for path in data_path.rglob("*")
        if path.is_file() and path.suffix.lower() in {".md", ".txt"}
    )
    if not data_files:
        print(
            f"Error: Please put some .txt or .md files inside the '{data_path}' folder first!"
        )
        return

    print(f"Reading {len(data_files)} text/markdown file(s)...", flush=True)

    raw_documents = []
    for data_file in data_files:
        print(f"Reading {data_file}...", flush=True)
        raw_documents.append(
            Document(
                page_content=data_file.read_text(encoding="utf-8"),
                metadata={"source": str(data_file)},
            )
        )
    print(f"Loaded {len(raw_documents)} raw document source files.")

    print("Slicing text into semantic chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=10)
    chunked_docs = text_splitter.split_documents(raw_documents)
    print(f"Created {len(chunked_docs)} clean sub-chunks ready for vector space.")

    print("Initializing local embedding generator (nomic-embed-text)...")
    embeddings = OllamaEmbeddings(model="nomic-embed-text")

    print(f"Saving vectors into local database directory ({db_path})...")
    db = Chroma.from_documents(chunked_docs, embeddings, persist_directory=db_path)

    print("Ingestion sequence completed successfully! Your data is fully indexed.")


if __name__ == "__main__":
    run_ingestion()