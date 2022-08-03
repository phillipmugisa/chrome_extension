(() => {

    let PRICING;
    const backend_url = 'http://localhost:8000/';

    // listen for message from service worker
    chrome.runtime.onMessage.addListener((obj, sender) => {

        if (obj.type === "NEW_PRODUCT_LOADED") {
            newProductLoaded();
        }

        if (obj.type === "USER_LOGGED_IN") {
            localStorage.setItem('aliexpress_extension_access_token', obj.aliexpress_extension_access_token)
            localStorage.setItem('aliexpress_extension_refresh_token', obj.aliexpress_extension_refresh_token)
            handleDownload();
        }
    });


    // render extension components
    const newProductLoaded = async () => {
        const extensionComponentArea = document.querySelector("ext-component-area");

        if (!extensionComponentArea) {
            // if not exists
            const extensionComponentArea = document.createElement("div");            
            extensionComponentArea.className = "ext-component-area";   

            // detect extension activator
            if (!document.getElementById('ext-activator')) {
                // add extension activator
                const extensionActivator = document.createElement('button');
                extensionActivator.id = 'ext-activator';
                extensionComponentArea.appendChild(extensionActivator);
                extensionActivator.addEventListener("click",() =>  showSelectionPopup(extensionComponentArea));
            }

            let bodyElem = document.querySelector(".hm-right");
            bodyElem.appendChild(extensionComponentArea);

        }
    }

    const showSelectionPopup = (extensionComponentArea) => {

        if (document.getElementById('selection-popup'))
        {
            let selectionPopup = document.getElementById('selection-popup');
            // reset form
            selectionPopup.querySelector('form').reset();
            extensionComponentArea.removeChild(selectionPopup);
            return;
        }

        const selectionPopup = document.createElement('div');
        selectionPopup.id = 'selection-popup';
        extensionComponentArea.appendChild(selectionPopup);

        // add pop up title
        const titleArea = document.createElement('div');
        titleArea.id = 'title-area';
        const title = document.createElement('h3');
        title.id = 'title';
        title.textContent = "Select Desired Features";
       
        titleArea.appendChild(title);
        selectionPopup.appendChild(titleArea);

        const popupForm = document.createElement('form');
        popupForm.id = 'popup-form';
        selectionPopup.appendChild(popupForm);


        const msg = document.createElement('b');
        popupForm.appendChild(msg)

        // form checkboxes
        const formCheckBoxData = [{'name': 'main-image', 'label' : 'Main Product Images'}, {'name': 'variation-images', 'label' : 'Variation Images'},{'name': 'description-images', 'label' : 'Description Images'},{'name': 'product-videos', 'label' : 'Product Videos'}];

        for (let i=0; i < formCheckBoxData.length; i++) {
            let formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            // checkbox
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = formCheckBoxData[i].name;
            checkbox.value = formCheckBoxData[i].label;
            checkbox.id = formCheckBoxData[i].name;

            // label
            let label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = formCheckBoxData[i].label;
            
            formGroup.appendChild(checkbox);
            formGroup.appendChild(label);
            popupForm.appendChild(formGroup);
        }

        // add download btn
        const downloadBtn = document.createElement("button");
        downloadBtn.className = "ext-download-btn";
        downloadBtn.textContent = "Download";

        popupForm.appendChild(downloadBtn);
        downloadBtn.addEventListener("click", (e) => {
            e.preventDefault()
            // atleast one feature selected
            let selectedFeatures = new Array()
            popupForm.querySelectorAll('input')
                .forEach(input => {
                    if (input.checked) {
                        selectedFeatures.push(input.value);
                    }
                })

            if (selectedFeatures.length <= 0) {
                // show error message
                showPopUpError(msg, 'No feature Selected');
            }
            else {
                msg.textContent = '';
                handleDownload(msg, selectedFeatures)
            }

        });
    }

    const showPopUpError = (elem, msg) => {
        elem.textContent = msg;
        setTimeout(() => {
            elem.textContent = '';
        }, 5000)
    }

    const handleDownload = (msgElem, selectedFeatures) => {
        // check login status
        loggedInUser()
        .then(__resp => {
            if (__resp) {
                // check subscription status
                getSubscriptionFeatures()
                .then(userSubscriptionFeatures => {
                    if (userSubscriptionFeatures) {
            
                        PRICING = userSubscriptionFeatures['pricing'];
                        // compare features
                        if (!selectedFeatures) return;
                        selectedFeatures.forEach(
                            (feature) => {
                                if (!userSubscriptionFeatures['features'].includes(feature)) {
                                    showPopUpError(msgElem, `Upgrade Package`);
                                    return;
                                }
                                else {
                        
                                    // download main products
                                    if (feature == 'Main Product Images') {
                                        downloadProductMain();
                                        return;
                                    }
                            
                                    // download variation image
                                    if (feature == 'Variation Images') {
                                        downloadVariationImages();
                                        return;
                                    }
                            
                                    // download description images
                                    if (feature == 'Description Images') {
                                        downloadDescriptionImages();
                                        return;
                                    }
                            
                                    // downloaf product video
                                    if (feature == 'Product Videos') {
                                        downloadProductVideos();
                                        return;
                                    }
                                }
                            }
                        )
                    }

                })
        
            }
        })

    }

    const makeRequest = async (data, passed_url) => {

        return await fetch(`${backend_url}api/${passed_url}`, {
            method: "POST",
            headers: {
                'Content-Type' : 'application/json',
                Authorization: localStorage.getItem('aliexpress_extension_refresh_token') ? "JWT " + localStorage.getItem('aliexpress_extension_refresh_token') : null,
            },
            mode: "cors",
            cache: "no-cache",
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data)
        });
    }

    const loggedInUser = async () => {
        if (localStorage.getItem('aliexpress_extension_refresh_token'))
            {
                const _resp = await makeRequest({
                    "refresh": localStorage.getItem('aliexpress_extension_refresh_token')
                }, 'token/refresh/')
                if (_resp.status === 200) {
                    const _jsonResponse = await _resp.json();
                    // reset access token
                    localStorage.setItem('aliexpress_extension_access_token', _jsonResponse.access);
                    return true;
                }
                else
                {
                    chrome.runtime.sendMessage({
                            type:  'LOGIN'
                        }, () => {
                    });
                    localStorage.clear();
                }
            }
            else
            {
                logInUser()
            }
            return false;

    }

    const getSubscriptionFeatures = async () => {
        // request to backend
        const _resp = await fetch(`${backend_url}api/subscriptions/aliexpress/`, {
            method: "GET",
            headers: {
                'Content-Type' : 'application/json',
                Authorization: localStorage.getItem('aliexpress_extension_access_token') ? "JWT " + localStorage.getItem('aliexpress_extension_access_token') : null,
            }
        });
        
        if (_resp.status >= 200 && _resp.status <= 299) {
            const data = await _resp.json();
            return {
                "user" : 1,
                "package": data.package,
                "pricing": data.pricing,
                "features" : data.features
            }
        }
        else {
            logInUser()
            return null;
        }


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

    const downloadProductMain = () => {
        let targetImages = document.querySelectorAll('.images-view-list img');

        if (targetImages != null && targetImages != undefined) {
            targetImages.forEach(image => {
                let imageSrc = image.src;
    
                // get jpg src
                let linkParts = imageSrc.split('.');
                let generateSrc = `${linkParts[0]}.${linkParts[1]}.${linkParts[2]}.jpg`;
    
                // to jpeg
                // download image
                toJpeg(generateSrc)
                    .then(url => performDownload(url, 'product-images'));
                
            })
        }
    }

    const downloadVariationImages = () => { 
        let targetImages = document.querySelectorAll('.sku-property-list img');

        if (targetImages != null && targetImages != undefined) {
            targetImages.forEach(image => {
                let imageSrc = image.src;
    
                // get jpg src
                let linkParts = imageSrc.split('.');
                let generateSrc = `${linkParts[0]}.${linkParts[1]}.${linkParts[2]}.jpg`;
    
                // to jpeg
                // download image
                toJpeg(generateSrc)
                    .then(url => performDownload(url, 'variation-imgs'));
                
            })
        }
    }

    const downloadDescriptionImages = () => {
        let targetImages = document.querySelectorAll('.detailmodule_image img');

        console.log(targetImages)

        if (targetImages != null && targetImages != undefined) {
            targetImages.forEach(image => {
                let imageSrc = image.src;
    
                // get jpg src
                let linkParts = imageSrc.split('.');
                let generateSrc = `${linkParts[0]}.${linkParts[1]}.${linkParts[2]}.jpg`;
    
                // to jpeg
                // download image
                toJpeg(generateSrc)
                    .then(url => performDownload(url, 'description-images'));
                
            })
        }
    }

    const downloadProductVideos = () => {
        const productVideos = document.querySelectorAll('video');
        productVideos.forEach(videoElem => {
            performDownload(videoElem.src, 'videos');
        });
    }

    const logInUser = () => {

        chrome.runtime.sendMessage({
                    type:  'LOGIN'
                }, () => {
            });

    }

    const performDownload = (imgUrl, subfolder) => {
        let productName = document.querySelector('.product-title-text').textContent;
        // trigger download
        chrome.runtime.sendMessage({
                type:  'DOWNLOAD',
                pricing:  PRICING,
                subfolder: subfolder,
                productName: productName.split(' ').join('-'),
                url: imgUrl
            }, () => {
        });
    }

    newProductLoaded();
})()