### 🕸️ Web Page QA Extension
This browser extension allows users to extract content from any webpage, convert it into vector embeddings, and ask questions directly about the page using the Groq API.

### 🚀 Features
Crawl Current Page: Extracts and cleans text from the current browser tab.

Smart Chunking: Splits text into overlapping chunks to preserve context.

Vector Embeddings: Generates embeddings for each chunk using a placeholder API (swap with OpenAI, Groq, etc.).

In-Memory Vector Store: Stores embeddings in a local in-memory store for quick access.

Semantic Search + QA: Answers user questions using cosine similarity and Groq API.

### 🛠️ How It Works
🧹 Content Extraction
When the user clicks Crawl Current Page, the extension extracts visible text from the current tab.

🔗 Chunking with Overlap
The text is split into manageable chunks with overlap to retain contextual continuity between them.

📐 Embedding Generation
Each chunk is converted into a vector embedding. (You can plug in real embedding APIs like OpenAI, Cohere, Groq, etc.)

📦 In-Memory Vector Storage
Embeddings are stored in a simple in-memory store acting as a lightweight vector DB.

### ❓ Query Processing

When a user asks a question, it generates an embedding for the query.

Computes cosine similarity between the query and chunk embeddings.

Selects the top-k relevant chunks.

Sends them to Groq API as context for answering.

Displays the answer to the user.

### 🧪 Tech Stack
JavaScript (browser extension)

Groq API (for question answering)

Placeholder/real embedding APIs

In-memory vector DB (custom implementation)

### 📦 Setup
Clone this repo.

Load it as an unpacked extension in Chrome:

Go to chrome://extensions/

Enable "Developer mode"

Click "Load unpacked" and select this directory.

Click on the extension and use Crawl Current Page to get started.

