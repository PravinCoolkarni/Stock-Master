import semchunk
from transformers import AutoTokenizer
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

import hashlib
model_name = "BAAI/bge-small-en-v1.5"
tokenizer = AutoTokenizer.from_pretrained(model_name)
chunker = semchunk.chunkerify(tokenizer, chunk_size=512)

# Initialize the database (saves to a local folder)
bge_ef = SentenceTransformerEmbeddingFunction(model_name="BAAI/bge-small-en-v1.5")
client = chromadb.PersistentClient(path="./my_vector_db")
collection = client.get_or_create_collection(name="text_embeddings", embedding_function=bge_ef)


def chunk_text(text):
    chunks = chunker(text)
    print("Generated chunks:", chunks)
    return chunks

def store_embeddings(chunks, session_id: str):
    try:
        # Store your chunks and embeddings
        ids = [hashlib.md5(chunk.encode()).hexdigest() for chunk in chunks]
        metadatas = [{'session_id': session_id} for _ in chunks]
        collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
        return True
    except Exception as e:
        print(f"Error storing embeddings: {e}")
        return False
    
def query_context(query: str, session_id: str):
    results = collection.query(
        query_texts=[query],
        n_results=5,
        where={'session_id': session_id}
    )
    return results