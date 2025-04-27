// In-memory vector database (will be lost when browser closes)
let vectorDB = [];
const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
let GROQ_API_KEY = "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"; // Will be set by the user

// Simple embedding function
// In a real implementation, you would use proper embedding API
function createEmbedding(text) {
  // This is a very simplified hash-based embedding for demonstration
  // In a real implementation, you would use an actual embedding model
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Create a 128-dim "embedding" based on the hash
  const embedding = [];
  let tempHash = hash;
  for (let i = 0; i < 128; i++) {
    embedding.push((tempHash % 200) / 100 - 1); // Values between -1 and 1
    tempHash = Math.floor(tempHash / 10) + (tempHash % 10) * 1000000;
  }
  
  return embedding;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Chunk text into smaller pieces
function chunkText(text, chunkSize = 1000, overlapSize = 200) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex += (chunkSize - overlapSize);
  }
  
  return chunks;
}

// Initialize the settings
chrome.storage.local.get(['groqApiKey'], function(data) {
  if (data.groqApiKey) {
    GROQ_API_KEY = data.groqApiKey;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "processContent") {
    // Clear previous database
    vectorDB = [];
    
    // Process content into chunks
    const content = request.content;
    const fullText = `${content.title} ${content.metaDescription} ${content.headings} ${content.bodyText}`;
    const chunks = chunkText(fullText);
    
    // Create embeddings for each chunk
    chunks.forEach((chunk, index) => {
      const embedding = createEmbedding(chunk);
      vectorDB.push({
        id: index,
        text: chunk,
        embedding: embedding,
        url: content.url
      });
    });
    
    chrome.storage.local.set({crawlStatus: 'completed'});
    sendResponse({success: true});
  }
  
  else if (request.action === "askQuestion") {
    if (vectorDB.length === 0) {
      sendResponse({error: "No content has been crawled yet"});
      return;
    }
    
    const question = request.question;
    const questionEmbedding = createEmbedding(question);
    
    // Find the most relevant chunks
    const similarities = vectorDB.map(item => ({
      id: item.id,
      text: item.text,
      similarity: cosineSimilarity(questionEmbedding, item.embedding)
    }));
    
    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Take top 3 most relevant chunks
    const relevantChunks = similarities.slice(0, 3).map(item => item.text).join("\n\n");
    
    // Call Groq API with the question and context
    if (!GROQ_API_KEY) {
      // Prompt for API key if not set
      const apiKey = prompt("Please enter your Groq API key:", "");
      if (apiKey) {
        GROQ_API_KEY = apiKey;
        chrome.storage.local.set({groqApiKey: apiKey});
        queryGroqAPI(question, relevantChunks, sendResponse);
      } else {
        sendResponse({answer: "Groq API key is required to answer questions."});
      }
    } else {
      queryGroqAPI(question, relevantChunks, sendResponse);
    }
    
    return true; // Required for async sendResponse
  }
  
  else if (request.action === "setApiKey") {
    GROQ_API_KEY = request.apiKey;
    chrome.storage.local.set({groqApiKey: request.apiKey});
    sendResponse({success: true});
  }
});

function queryGroqAPI(question, context, sendResponse) {
  fetch(GROQ_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on provided context. Keep your answers concise and focused on the information from the context. If the answer cannot be found in the context, say so."
        },
        {
          role: "user",
          content: `Context information: ${context}\n\nQuestion: ${question}\n\nAnswer the question based on the context provided.`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.choices && data.choices.length > 0) {
      sendResponse({answer: data.choices[0].message.content});
    } else {
      sendResponse({answer: "Failed to get response from Groq API."});
    }
  })
  .catch(error => {
    sendResponse({answer: `Error: ${error.message}`});
  });
}