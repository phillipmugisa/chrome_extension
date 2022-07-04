chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && (tab.url.includes("aliexpress.com/category") || tab.url.includes("aliexpress.com/item"))) {

    // send message to content scripts
    chrome.tabs.sendMessage(tabId, {
      type: "PRODUCTS",
    });
  }
});

function handleDownloadMessage(request, sender, sendResponse) {
  
  if (request.type === "DOWNLOAD") {
      chrome.downloads.download({
        url: request.url
      });
//    request.products.forEach(product => {
      // fetch image
//      chrome.downloads.download({
//        url: product['imgUrl']
//      });
//    });
  }

  sendResponse();
}

chrome.runtime.onMessage.addListener(handleDownloadMessage);
