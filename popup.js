import { getCurrentTab } from './utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getCurrentTab();

    if (!activeTab.url.includes("aliexpress.com/category") || !activeTab.url.includes("aliexpress.com/item"))
    {
        // not youtube page
        const container = document.querySelector('.ext-container');
        container.innerHTML = '<div class="title">Please visit AliExpress Products Page</div>'
    }
});
