chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "crawlPage") {
      // Extract all text content from the page
      const content = extractPageContent();
      
      // Send content to background script for processing
      chrome.runtime.sendMessage(
        {action: "processContent", content: content},
        function(response) {
          sendResponse({success: true});
        }
      );
      return true; // Required for async sendResponse
    }
  });
  
  function extractPageContent() {
    // Get all text from the page
    const bodyText = document.body.innerText;
    
    // Get metadata
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    const h1s = Array.from(document.querySelectorAll('h1')).map(h1 => h1.innerText).join(' ');
    const h2s = Array.from(document.querySelectorAll('h2')).map(h2 => h2.innerText).join(' ');
    
    // Combine all content
    return {
      url: window.location.href,
      title: title,
      metaDescription: metaDescription,
      headings: `${h1s} ${h2s}`,
      bodyText: bodyText
    };
  }
  