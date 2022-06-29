chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("aliexpress.com/category")) {
    const queryParameters = tab.url.split("?")[1];

    // send message to content scripts
    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
    });
  }
});

function handleDownloadMessage(request, sender, sendResponse) {
  
  if (request.type === "DOWNLOAD") {    
    console.log(request.products)
    request.products.forEach(product => {

      // fetch image
      chrome.downloads.download({
        url: product['imgUrl']
      });
    });
  }

  sendResponse();
}

chrome.runtime.onMessage.addListener(handleDownloadMessage);