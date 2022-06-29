(() => {
    let bodyElem;
    let products = [];

    // listen for message from service worker
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, products } = obj;

        if (type === "NEW") {
            newProductsLoaded();
        }
    });

    const newProductsLoaded = async () => {
        const downloadBtnExists = document.querySelector("download-btn");

        if (!downloadBtnExists) {
            // adding custom download button to our page
            const downloadBtnDiv = document.createElement("div");

            
            downloadBtnDiv.className = "ext-download-btn-area";
            downloadBtnDiv.title = "Download Product Images";

            
            const downloadBtn = document.createElement("button");
            downloadBtn.className = "ext-download-btn";
            downloadBtn.textContent = "Download Images";
            
            downloadBtnDiv.appendChild(downloadBtn);

            bodyElem = document.querySelector(".hm-right");
            bodyElem.appendChild(downloadBtnDiv);
            downloadBtn.addEventListener("click", downloadImageEventListener);
        }
    }

    const downloadImageEventListener = async () => {
        let productSection;
        if (document.querySelector('.JIIxO')) {
            productSection = document.querySelector('.JIIxO')
        }
        else
        {
            productSection = document.querySelector('._2AlTf')
        }

        
        const productImgs = productSection.querySelectorAll('img.product-img');
        productImgs.forEach(imgElem => {
            let imgSrc = imgElem.src;

            // get product name
            const productName = imgElem.parentElement.parentElement.querySelector('._18_85').textContent;

            products.push({"productName" : productName, "imgUrl" : imgSrc});
        })

        // trigger download
        chrome.runtime.sendMessage({
            type: "DOWNLOAD",
            products: products
        })
    }

    newProductsLoaded();
})();

