(() => {
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
		if (document.querySelector('.product-container'))
		{
		    const downloadImagesBtn = document.createElement("button");
		    downloadImagesBtn.className = "ext-download-btn";
		    downloadImagesBtn.id = "img-download";
		    downloadImagesBtn.textContent = "Download Images";

		    downloadBtnDiv.appendChild(downloadImagesBtn);
		    downloadImagesBtn.addEventListener("click", downloadImageEventListener);
		}
            
	    // description download btn
		else if (document.querySelector('.product-main'))
		{
		    const downloadDescritionImgBtn = document.createElement("button");
		    downloadDescritionImgBtn.className = "ext-download-btn";
		    downloadDescritionImgBtn.id = "img-download";
		    downloadDescritionImgBtn.textContent = "Download Description Images";

		    downloadBtnDiv.appendChild(downloadDescritionImgBtn);
		    downloadDescritionImgBtn.addEventListener("click", downloadImageEventListener);
		}

            // check if page has video
		    if (document.querySelector("video"))
		    {
			// vidoe download btn
			const downloadVideosBtn = document.createElement("button");
			downloadVideosBtn.className = "ext-download-btn";
			downloadVideosBtn.id = "video-download";
			downloadVideosBtn.textContent = "Download Vidoes";
			downloadBtnDiv.appendChild(downloadVideosBtn);
			downloadVideosBtn.addEventListener("click", downloadVideoEventListener);
		    }            

            let bodyElem = document.querySelector(".hm-right");
            bodyElem.appendChild(downloadBtnDiv);
            
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
                xhr.open("get", img, true);
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

    const downloadImageEventListener = async (e) => {
	e.target.disabled = true;
	e.target.classList.add("loading");

        let productSection = getProductSection();

        // check if user is on products pages
        if (productSection && productSection != null)
        {
            const productImgs = productSection.querySelectorAll('img.product-img');
            
                productImgs.forEach(imgElem => {
                    toJpeg(imgElem.src.replace('.jpg_220x220xz',""))
                        .then(url => {
                            performDownload(url, e.target);
                        });            
                });
        }
        else
        {
            // on description page
            let imgs = document.querySelectorAll('.product-main .images-view-list img');

		imgs.forEach(imgElem => {
		    toJpeg(imgElem.src.replace("jpg_50x50", "jpg_Q90"))
			.then(url => {
				// we are download each img once it is converted
				// removed products array to remove delay when button is clicked
				performDownload(url, e.target);
			});            
		});
        }        
    }

    const downloadVideoEventListener = (e) => {
	e.target.disabled = true;
	e.target.classList.add("loading")

        const productVideos = document.querySelectorAll('video');
        productVideos.forEach(videoElem => {
            performDownload(videoElem.src, e.target);
        });
    }

    const performDownload = (imgUrl, eventActivator) => {
        // trigger download
        chrome.runtime.sendMessage({
            type: "DOWNLOAD",
            url: imgUrl
        }, () => {
		eventActivator.disabled = false;
		eventActivator.classList.remove("loading")
        });
    }

    newProductsLoaded();
})();
