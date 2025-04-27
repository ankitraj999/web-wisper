document.addEventListener('DOMContentLoaded', function() {
    const crawlBtn = document.getElementById('crawlBtn');
    const askBtn = document.getElementById('askBtn');
    const questionInput = document.getElementById('question');
    const resultDiv = document.getElementById('result');
    const statusDiv = document.getElementById('status');
  
    // Check if page is already crawled
    chrome.storage.local.get(['crawlStatus'], function(data) {
      if (data.crawlStatus === 'completed') {
        statusDiv.textContent = 'Page crawled and ready for questions';
        statusDiv.style.color = '#34a853';
      }
    });
  
    crawlBtn.addEventListener('click', function() {
      statusDiv.textContent = 'Crawling page...';
      statusDiv.style.color = '#f4b400';
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "crawlPage"}, function(response) {
          if (response && response.success) {
            statusDiv.textContent = 'Page crawled and ready for questions';
            statusDiv.style.color = '#34a853';
            chrome.storage.local.set({crawlStatus: 'completed'});
          } else {
            statusDiv.textContent = 'Failed to crawl page';
            statusDiv.style.color = '#ea4335';
          }
        });
      });
    });
  
    askBtn.addEventListener('click', function() {
      const question = questionInput.value.trim();
      if (!question) {
        resultDiv.textContent = 'Please enter a question.';
        return;
      }
  
      resultDiv.textContent = 'Thinking...';
      
      chrome.runtime.sendMessage(
        {action: "askQuestion", question: question},
        function(response) {
          if (response && response.answer) {
            resultDiv.textContent = response.answer;
          } else {
            resultDiv.textContent = 'Failed to get an answer. Make sure you crawled the page first.';
          }
        }
      );
    });
  });