chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    if (tab.url && tab.url.includes("aliexpress.com/item")) {

      chrome.storage.local.set({ "aliexpressTabId": tabId }, function(){});
      // send message to content scripts
      chrome.tabs.sendMessage(tabId, {
        type: "NEW_PRODUCT_LOADED",
      });
    }

    chrome.storage.local.get(['auth_required'], function(items){
      if (items.auth_required && (tab.url && tab.url.includes('http://localhost:8000/auth/complete/extension'))) {


        chrome.cookies.get({ url: 'http://localhost:8000/auth/complete/', name: 'access' },
          function (cookie) {
            if (cookie) {
              chrome.storage.local.set({ "aliexpress_extension_access_token": cookie.value }, function(){});
            }
        });

        chrome.cookies.get({ url: 'http://localhost:8000/auth/complete/', name: 'refresh' },
          function (cookie) {
            chrome.storage.local.set({ "aliexpress_extension_refresh_token": cookie.value }, function(){});
        });

        // close tab and return
        chrome.tabs.remove(tab.id, function() {});

        
        chrome.storage.local.get(['aliexpressTabId', "aliexpress_extension_refresh_token", "aliexpress_extension_access_token"], function(items){
          
          chrome.tabs.update(parseInt(items.aliexpressTabId), {highlighted: true});
          
          chrome.tabs.sendMessage(items.aliexpressTabId, {
            type: "USER_LOGGED_IN",
            aliexpress_extension_refresh_token : items.aliexpress_extension_refresh_token,
            aliexpress_extension_access_token: items.aliexpress_extension_access_token
          });

        })

      }
    })
  }
})


function messageListener(request, sender, sendResponse) {
  
  if (request.type == 'DOWNLOAD') {
    if (request.pricing === "Master") {
      chrome.downloads.download({filename: `Aliexpress-media/${request.productName}/${request.subfolder}/${new Date().getSeconds()}.jpg`, url: request.url} ,{
        url: request.url
      });
    }
    else {
      chrome.downloads.download({
        url: request.url
      });
    }
  }
  if (request.type == 'LOGIN') {
    chrome.storage.local.set({ "auth_required": 'True' }, function(){});
    chrome.tabs.create({
      url: 'http://localhost:8000/auth/login/extension/',
      selected: true,
    })
  }

  sendResponse();
}

chrome.runtime.onMessage.addListener(messageListener);
