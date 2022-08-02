chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    if (tab.url && tab.url.includes("aliexpress.com/item")) {
      // send message to content scripts
      chrome.tabs.sendMessage(tabId, {
        type: "NEW_PRODUCT_LOADED",
      });
    }
  }
})


function handleDownloadMessage(request, sender, sendResponse) {
  
  if (request.type === "MASTER_PACKAGE_DOWNLOAD") {
      chrome.downloads.download({filename: `Aliexpress-media/${request.productName}/${request.subfolder}/${new Date().getSeconds()}.jpg`, url: request.url} ,{
        url: request.url
      });
  }
  else {
    chrome.downloads.download({
      url: request.url
    });
  }

  sendResponse();
}

chrome.runtime.onMessage.addListener(handleDownloadMessage);
