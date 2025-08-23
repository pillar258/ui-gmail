document.addEventListener('DOMContentLoaded', function () {
    const menuButton = document.querySelector('.menu-button');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const tabsContainer = document.querySelector('.tabs-container');
    const iframeContainer = document.getElementById('iframe-container');
    const moreTabsBtn = document.querySelector('.more-tabs-btn');
    const moreTabsDropdown = document.querySelector('.more-tabs-dropdown');
    const navMenu = document.querySelector('.nav-menu');
    let hiddenTabsStore = {};

    function createMenuItem(item) {
        const navItemWrapper = document.createElement('div');
        const hasSubmenu = item.submenu && item.submenu.length > 0;

        if (hasSubmenu) {
            navItemWrapper.className = 'nav-group';
        } else {
            navItemWrapper.className = 'nav-item-wrapper'; // A simple wrapper
        }

        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        if (item.active) {
            navItem.classList.add('active');
        }
        if (hasSubmenu) {
            navItem.classList.add('has-submenu');
        }
        navItem.dataset.navId = item.id;
        if (item.url) {
            navItem.dataset.url = item.url;
        }

        // Safely insert icon HTML 
        if (item.icon) {
            navItem.insertAdjacentHTML('afterbegin', item.icon);
        }

        const navText = document.createElement('span');
        navText.className = 'nav-text';
        navText.textContent = item.text;
        navItem.appendChild(navText);

        if (item.count) {
            const count = document.createElement('span');
            count.className = 'count';
            count.textContent = item.count;
            navItem.appendChild(count);
        }

        if (hasSubmenu) {
            const svgNS = 'http://www.w3.org/2000/svg';
            const arrow = document.createElementNS(svgNS, 'svg');
            arrow.setAttribute('class', 'arrow');
            arrow.setAttribute('width', '16');
            arrow.setAttribute('height', '16');
            arrow.setAttribute('viewBox', '0 0 24 24');

            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', 'M8 5 v14l11-7z');
            arrow.appendChild(path);

            navItem.appendChild(arrow);
        }

        navItemWrapper.appendChild(navItem);

        if (hasSubmenu) {
            const subMenu = document.createElement('div');
            subMenu.className = 'sub-menu';
            renderMenu(item.submenu, subMenu); // Recursively render submenu
            navItemWrapper.appendChild(subMenu);
        }

        return navItemWrapper;
    }

    function renderMenu(menuData, container) {
        container.innerHTML = ''; // Clear existing menu
        menuData.forEach(item => {
            const menuItemElement = createMenuItem(item);
            container.appendChild(menuItemElement);
        });
    }

    async function loadMenu() {
        try {
            const response = await fetch('../menu.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const menuData = await response.json();
            renderMenu(menuData, navMenu);
        } catch (error) {
            console.error('Error loading or rendering menu:', error);
        }
    }

    // 1. Sidebar toggle
    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');
        menuButton.classList.toggle('selected');
        updateTabs(); // Recalculate tabs when sidebar collapses/expands
    });

    // Context Menu Logic
    const contextMenu = document.getElementById('context-menu');
    let contextTabId = null;

    tabsContainer.addEventListener('contextmenu', function (e) {
        const targetTab = e.target.closest('.tab');
        if (targetTab) {
            e.preventDefault();
            contextTabId = targetTab.dataset.tabId;
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.pageX}px`;
            contextMenu.style.top = `${e.pageY}px`;
        }
    });

    window.addEventListener('click', function () {
        contextMenu.style.display = 'none';
        if (moreTabsDropdown.style.display === 'block') {
            moreTabsDropdown.style.display = 'none';
        }
    });

    contextMenu.addEventListener('click', function (e) {
        const action = e.target.dataset.action;
        if (!action || !contextTabId) return;

        switch (action) {
            case 'refresh':
                console.log(`Refreshing tab: ${contextTabId}`);
                // Add actual refresh logic here
                break;
            case 'pin':
                 ensureTabIsVisible(contextTabId);
                break;
            case 'close-others':
                document.querySelectorAll('.tab').forEach(t => {
                    const tabId = t.dataset.tabId;
                    if (tabId !== contextTabId && tabId !== 'home') {
                        const iframe = iframeContainer.querySelector(`[data-iframe-id="${tabId}"]`);
                        if (iframe) iframe.remove();
                        t.remove();
                    }
                });
                ensureTabIsVisible(contextTabId);
                break;
            case 'close-all':
                document.querySelectorAll('.tab').forEach(t => {
                    const tabId = t.dataset.tabId;
                    if (tabId !== 'home') {
                        const iframe = iframeContainer.querySelector(`[data-iframe-id="${tabId}"]`);
                        if (iframe) iframe.remove();
                        t.remove();
                    }
                });
                ensureTabIsVisible('home');
                break;
        }
        contextMenu.style.display = 'none';
    });

    // Add data-nav-id to nav items for easier identification
    document.querySelectorAll('.nav-item').forEach((item) => {
        const navText = item.querySelector('.nav-text');
        if (navText) {
            const text = navText.textContent.trim().toLowerCase().replace(/\s+/g, '-');
            item.dataset.navId = text;
        }
    });

    // Helper function to create new tabs and iframes
    function createTab(text, id, iconHtml, url) {
        // Create Iframe
        const iframe = document.createElement('iframe');
        iframe.dataset.iframeId = id;
        iframe.src = url ? `../${url}` : '../dashboard.html'; // Use provided URL or fallback
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; display: none;';
        iframeContainer.appendChild(iframe);

        // Create Tab
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = id;

        if (iconHtml) {
            const iconWrapper = document.createElement('span');
            iconWrapper.className = 'tab-icon';
            iconWrapper.innerHTML = iconHtml;
            tab.appendChild(iconWrapper);
        }

        const tabText = document.createElement('span');
        tabText.className = 'tab-text';
        tabText.textContent = text;
        tab.appendChild(tabText);

        if (id !== 'home') {
            const closeButton = document.createElement('button');
            closeButton.className = 'close-tab';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = (e) => {
                e.stopPropagation();
                const tabToClose = document.querySelector(`[data-tab-id="${id}"]`);
                const iframeToClose = iframeContainer.querySelector(`[data-iframe-id="${id}"]`);
                const isActive = tabToClose.classList.contains('active');
                if (iframeToClose) iframeToClose.remove();
                tabToClose.remove();
                if (isActive) {
                    ensureTabIsVisible('home');
                } else {
                    updateTabs(); // Just update if a non-active tab is closed
                }
            };
            tab.appendChild(closeButton);
        }

        tab.addEventListener('click', () => {
            ensureTabIsVisible(id);
        });

        return tab;
    }

    function updateTabs() {
        const containerWidth = tabsContainer.offsetWidth;
        const moreBtnWidth = moreTabsBtn.offsetWidth + 10; // margin
        let totalWidth = 0;

        // 1. Restore all hidden tabs to the container for a fresh calculation
        moreTabsDropdown.innerHTML = '';
        Object.values(hiddenTabsStore).forEach(tab => {
            tabsContainer.appendChild(tab);
        });
        hiddenTabsStore = {};

        // 2. Now, get all tabs that are physically in the container
        const allTabElements = Array.from(tabsContainer.querySelectorAll('.tab'));
        allTabElements.forEach(tab => {
            tab.style.display = 'flex';
        });

        // 3. Determine which tabs to show and which to hide
         const tabsToHide = [];
         totalWidth = 0; // Reset width for recalculation

        for (const tab of allTabElements) {
            totalWidth += tab.offsetWidth;
            if (totalWidth > containerWidth - moreBtnWidth) {
                tabsToHide.push(tab);
            }
        }

        // 4. Populate the 'More' dropdown if necessary
        if (tabsToHide.length > 0) {
            moreTabsBtn.style.display = 'flex';
            tabsToHide.forEach(tab => {
                hiddenTabsStore[tab.dataset.tabId] = tab; // Store the tab element
                tabsContainer.removeChild(tab); // Detach from DOM
                const dropdownItem = document.createElement('div');
                dropdownItem.className = 'more-tabs-item';
                dropdownItem.dataset.tabId = tab.dataset.tabId;

                const tabText = document.createElement('span');
                tabText.className = 'tab-text';
                tabText.textContent = tab.querySelector('span:not(.tab-icon)').textContent;
                dropdownItem.appendChild(tabText);

                if (tab.dataset.tabId !== 'home') {
                    const closeButton = document.createElement('button');
                    closeButton.className = 'close-tab';
                    closeButton.innerHTML = '&times;';
                    dropdownItem.appendChild(closeButton);
                    closeButton.onclick = (e) => {
                        e.stopPropagation();
                        tab.remove();
                        dropdownItem.remove();
                        updateTabs();
                    };
                }

                dropdownItem.onclick = () => {
                    ensureTabIsVisible(tab.dataset.tabId);
                    moreTabsDropdown.style.display = 'none';
                };
                
                dropdownItem.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    contextTabId = this.dataset.tabId;
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = `${e.pageX}px`;
                    contextMenu.style.top = `${e.pageY}px`;
                });

                moreTabsDropdown.appendChild(dropdownItem);
            });
        } else {
            moreTabsBtn.style.display = 'none';
            moreTabsDropdown.style.display = 'none';
        }
    }

    function ensureTabIsVisible(tabId) {
        const homeTab = tabsContainer.querySelector('[data-tab-id="home"]');
        let tabNode = tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);

        // If tab is in dropdown, get it from the store
        if (!tabNode) {
            if (hiddenTabsStore[tabId]) {
                tabNode = hiddenTabsStore[tabId];
                tabsContainer.appendChild(tabNode); // Re-attach the tab
                delete hiddenTabsStore[tabId]; // Remove from store
            }
        }

        if (tabNode && tabId !== 'home') {
            homeTab.after(tabNode); // Move it to be after 'Home'
        }

        // Activate the tab and show the corresponding iframe
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#iframe-container iframe').forEach(f => f.style.display = 'none');

        if (tabNode) {
            tabNode.classList.add('active');
            const iframe = iframeContainer.querySelector(`[data-iframe-id="${tabId}"]`);
            if (iframe) {
                iframe.style.display = 'block';
            }
        }

        updateTabs(); // Refresh the layout
    }

    moreTabsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isDisplayed = moreTabsDropdown.style.display === 'block';
        moreTabsDropdown.style.display = isDisplayed ? 'none' : 'block';
    });

    window.addEventListener('resize', updateTabs);

    // 2. Nav item selection and tab creation (Consolidated Handler)
    document.querySelector('.sidebar').addEventListener('click', function (e) {
        const item = e.target.closest('.nav-item');
        if (!item) return;

        // Handle submenu toggling first
        if (item.classList.contains('has-submenu')) {
            const subMenu = item.nextElementSibling;
            if (subMenu && subMenu.classList.contains('sub-menu')) {
                e.preventDefault(); // Prevent any other action
                item.classList.toggle('open');
            }
            return; // Stop processing for parent menu items
        }

        // Handle regular nav item clicks
        document.querySelectorAll('.sidebar .nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const navId = item.dataset.navId;
        if (!navId) return;

        const navText = item.querySelector('.nav-text').textContent.trim();
        const navIcon = item.querySelector('svg').outerHTML;
        const navUrl = item.dataset.url;

        let existingTab = document.querySelector(`.tab[data-tab-id="${navId}"]`);

        if (!existingTab) {
            const newTab = createTab(navText, navId, navIcon, navUrl);
            const homeTab = tabsContainer.querySelector('[data-tab-id="home"]');
            homeTab.after(newTab);
        }

        ensureTabIsVisible(navId);
    });

    // The old, conflicting listener on '.main-content' was removed.

    // Make existing 'Home' tab clickable
    document.querySelector('.tab[data-tab-id="home"]').addEventListener('click', () => {
        ensureTabIsVisible('home');
    });



    // Initial setup
    updateTabs();
    loadMenu();
});