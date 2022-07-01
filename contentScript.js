(() => {
    let products = [];

    // listen for message from service worker
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, products } = obj;

        if (type === "PRODUCTS") {
            newProductsLoaded('products');
        }
    });

    const newProductsLoaded = async (page) => {
        const downloadBtnExists = document.querySelector("download-btn");

        if (!downloadBtnExists) {
            // adding custom download button to our page
            const downloadBtnDiv = document.createElement("div");
            
            downloadBtnDiv.className = "ext-download-btn-area";            
            
            // image download btn
            const downloadImagesBtn = document.createElement("button");
            downloadImagesBtn.className = "ext-download-btn";
            downloadImagesBtn.id = "img-download";
            downloadImagesBtn.textContent = "Download Images";

            downloadBtnDiv.appendChild(downloadImagesBtn);

            // check if page has video
            if (document.querySelector("video"))
            {
                // vidoe download btn
                const downloadVideosBtn = document.createElement("button");
                downloadVideosBtn.className = "ext-download-btn";
                downloadImagesBtn.id = "video-download";
                downloadVideosBtn.textContent = "Download Vidoes";
                downloadBtnDiv.appendChild(downloadVideosBtn);
                downloadVideosBtn.addEventListener("click", downloadVideoEventListener);
            }            

            let bodyElem = document.querySelector(".hm-right");
            bodyElem.appendChild(downloadBtnDiv);
            
            downloadImagesBtn.addEventListener("click", downloadImageEventListener);
        }
    }

    const getProductSection = () => {        
        let productSection = null;
        if (document.querySelector('.JIIxO')) {
            productSection = document.querySelector('.JIIxO')
        }
        else
        {
            productSection = document.querySelector('._2AlTf')
        }
        return productSection;
    }

    function toJpeg (img){
        return new Promise(function (resolve) {
            var xhr = new XMLHttpRequest();
                xhr.open("get", img.src, true);
                xhr.responseType = "blob";
                xhr.onload = function () {
                    if (this.status == 200) {
                        var blob = this.response;
                        var oFileReader = new FileReader();
                        oFileReader.onloadend = function (e) {
                            // Create a new Image Obj
                            var newImg = new Image();
                            // Set crossOrigin Anonymous 
                            newImg.crossOrigin = "Anonymous";
                            newImg.onload = function() {
                                // Create a new Canvas
                                var canvas = document.createElement("canvas");
                                // Set 2D context
                                var context = canvas.getContext("2d");
                                // Set crossOrigin Anonymous 
                                canvas.crossOrigin = "anonymous";
                                // Set Width/Height
                                canvas.width = newImg.width;
                                canvas.height = newImg.height;
                                // Start
                                context.drawImage(newImg, 0, 0);
                                // Get jpeg Base64
                                // img.src = canvas.toDataURL("image/jpeg");
                                resolve(canvas.toDataURL('image/jpeg'));
                            };
                            // Load Webp Base64
                            newImg.src = e.target.result;
                        };
                        oFileReader.readAsDataURL(blob);
                    }
                };
                xhr.send();
        })
    }

    const downloadImageEventListener = async () => {
        let productSection = getProductSection();

        // check if user is on products pages
        if (productSection && productSection != null)
        {
            const productImgs = productSection.querySelectorAll('img.product-img');
            
            new Promise((resolve) => {
                productImgs.forEach(imgElem => {
                    toJpeg(imgElem)
                        .then(url => {
                            products.push({"imgUrl" : url});
                        });            
                });
                resolve();
            })
                .then(() => performDownload(products));
        }
        else
        {
            // on description page
            let imgs = document.querySelectorAll('.product-main img:not(.simple-card-img):not(.product-img), .detailmodule_image img');

            new Promise((resolve) => {
                imgs.forEach(imgElem => {
                    toJpeg(imgElem)
                        .then(url => {
                            products.push({"imgUrl" : url});
                        });            
                });
                resolve();
            })
                .then(() => performDownload(products));
        }        
    }

    const downloadVideoEventListener = () => {

        let productSection = getProductSection();

        const productVideos = productSection.querySelectorAll('video');
        productVideos.forEach(imgElem => {
                       
            let videoSrc;
            fetch(imgElem.src)
            .then(response => response.blob())
            .then(blob => {
                videoSrc = URL.createObjectURL(blob);
                
                // get product name
                const productName = imgElem.parentElement.parentElement.querySelector('._18_85').textContent;
                
                products.push({"productName" : productName, "imgUrl" : videoSrc});
            })
            
        });
        performDownload(products);
    }

    const performDownload = (products) => {
        // trigger download
        chrome.runtime.sendMessage({
            type: "DOWNLOAD",
            products: products
        }, () => {
            products = [];
        });
    }

    newProductsLoaded();
})();