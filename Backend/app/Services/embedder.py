import hashlib

import chromadb
import semchunk
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from transformers import AutoTokenizer

MODEL_NAME = "BAAI/bge-small-en-v1.5"
CHUNK_SIZE = 512
VECTOR_DB_PATH = "./my_vector_db"
COLLECTION_NAME = "text_embeddings"

_tokenizer = None
_chunker = None
_collection = None


def _get_chunker():
    global _tokenizer, _chunker

    if _chunker is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _chunker = semchunk.chunkerify(_tokenizer, chunk_size=CHUNK_SIZE)

    return _chunker


def _get_collection():
    global _collection

    if _collection is None:
        embedding_function = SentenceTransformerEmbeddingFunction(model_name=MODEL_NAME)
        client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_function,
        )

    return _collection


def chunk_text(text):
    chunks = _get_chunker()(text)
    print("Generated chunks:", chunks)
    return chunks


def store_embeddings(chunks):
    try:
        collection = _get_collection()
        ids = [hashlib.md5(chunk.encode()).hexdigest() for chunk in chunks]
        #metadatas = [{'session_id': session_id} for _ in chunks]
        collection.add(
            documents=chunks,
            ids=ids,
            #metadatas=metadatas
        )
        return True
    except Exception as e:
        print(f"Error storing embeddings: {e}")
        return False


def query_context(query: str):
    collection = _get_collection()
    results = collection.query(
        query_texts=[query],
        n_results=5,
       # where={'session_id': session_id}
    )
    return results
