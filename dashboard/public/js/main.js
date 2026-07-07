document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    
    setupLanguageSelector();
    
    initializePage();
    
    setupGlobalEvents();
    
    addSafeInitializeHelper();
});

function addSafeInitializeHelper() {
    if (window.utils) {
        window.utils.safelyInitialize = function(elementSelector, initFunction) {
            const element = typeof elementSelector === 'string' 
                ? document.querySelector(elementSelector) 
                : elementSelector;
                
            if (element) {
                return initFunction(element);
            }
            return false;
        };
        
        window.utils.onPage = function(pagePath, callback) {
            const currentPath = window.location.pathname;
            const matches = typeof pagePath === 'string' 
                ? currentPath === pagePath
                : pagePath.test(currentPath);
                
            if (matches) {
                callback();
                return true;
            }
            return false;
        };
    }
}

function initializeUI() {
    document.documentElement.classList.add('dark');
    
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('animate-slide-in');
    });

    document.querySelectorAll('button, a').forEach(element => {
        if (!element.classList.contains('nav-link')) {
            element.classList.add('hover-pulse');
        }
    });

    initializeTooltips();
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const filterTarget = searchInput.dataset.filterTarget || '.searchable-item';
        utils.initSearchFilter(searchInput, filterTarget);
    }
    
    initializeMobileUI();
    
    setupMobileMenu();
    
    setupTouchHandling();
}

function initializeMobileUI() {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (!input.classList.contains('mobile-input') && 
            !input.classList.contains('mobile-select')) {
            
            if (input.tagName === 'SELECT') {
                input.classList.add('mobile-select');
            } else {
                input.classList.add('mobile-input');
            }
            
            input.addEventListener('focus', function() {
                this.classList.add('mobile-focus');
            });
            
            input.addEventListener('blur', function() {
                this.classList.remove('mobile-focus');
            });
        }
    });
    
    document.querySelectorAll('button:not(.mobile-nav-toggle), .btn').forEach(button => {
        button.classList.add('touch-friendly');
    });
}

function setupLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    const mobileLangButton = document.getElementById('mobileLangButton');
    const mobileLangSelector = document.getElementById('mobileLangSelector');
    
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    if (mobileLangButton && mobileLangSelector) {
        mobileLangButton.addEventListener('click', () => {
            mobileLangSelector.classList.toggle('translate-y-full');
            mobileLangSelector.classList.toggle('translate-y-0');
        });
        
        mobileLangSelector.querySelectorAll('a[data-lang]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = e.target.closest('a').dataset.lang;
                changeLanguage(lang);
            });
        });
    }
    
    if (document.documentElement.dir === 'rtl') {
        applyRtlAdjustments();
    }
}

function changeLanguage(lang) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    document.cookie = `preferredLanguage=${lang}; max-age=${365 * 24 * 60 * 60}; path=/`;
    
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    
    setTimeout(() => {
        window.location.href = url.toString();
    }, 300);
}

function initializeTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        const tooltipText = trigger.dataset.tooltip;
        const tooltipPosition = trigger.dataset.tooltipPosition || 'top';
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${tooltipPosition}`;
        tooltip.textContent = tooltipText;
        
        trigger.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltip);
            
            const triggerRect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let top, left;
            
            switch (tooltipPosition) {
                case 'top':
                    top = triggerRect.top - tooltipRect.height - 10;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = triggerRect.bottom + 10;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.left - tooltipRect.width - 10;
                    break;
                case 'right':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.right + 10;
                    break;
            }
            
            tooltip.style.top = `${top + window.scrollY}px`;
            tooltip.style.left = `${left + window.scrollX}px`;
            
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);
        });
        
        trigger.addEventListener('mouseleave', () => {
            const activeTooltip = document.querySelector('.tooltip.show');
            if (activeTooltip) {
                activeTooltip.classList.remove('show');
                setTimeout(() => {
                    activeTooltip.remove();
                }, 200);
            }
        });
    });
}

function setupGlobalEvents() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
            e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth'
                });
        }
    });
});

    const saveBar = document.getElementById('saveBar');
    if (saveBar) {
        document.querySelectorAll('.settings-trigger').forEach(element => {
            element.addEventListener('change', () => {
                saveBar.classList.add('show');
            });
        });
        
        const resetButton = document.getElementById('resetSettings');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                saveBar.classList.remove('show');
                utils.showToast('success', 'Settings reset to defaults');
            });
        }
    }
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const textToCopy = btn.dataset.copyText || btn.parentElement.textContent.trim();
            utils.copyToClipboard(textToCopy);
        });
    });
}

function initializePage() {
    console.log('Initializing page...');
    
    setupDarkMode();
    
    setupMobileMenu();
    
    initializeUI();
    
    setupLanguageSelector();
    
    setupRefreshStats();
    
    if (window.location.pathname === '/') {
        setupDashboard();
    }
    
    setupDropdowns();
}

function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.classList.add('hover');
        });
        
        link.addEventListener('mouseleave', () => {
            link.classList.remove('hover');
        });
    });
    
    const sectionTitles = sidebar.querySelectorAll('.nav-section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('click', () => {
            const section = title.closest('.nav-section');
            if (section) {
                const links = section.querySelector('.nav-links');
                if (links) {
                    links.classList.toggle('hidden');
                    title.classList.toggle('collapsed');
                }
            }
        });
    });
}

function setupDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (window.themeManager && themeToggle) {
        const newToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newToggle, themeToggle);
        
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.themeManager.toggleTheme();
        });
        
        console.log('Theme toggle initialized using themeManager');
    }
}

function applyThemeAdjustments() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    document.querySelectorAll('[data-theme-adjust]').forEach(el => {
        if (isDarkMode) {
            el.classList.add('dark-theme');
            el.classList.remove('light-theme');
        } else {
            el.classList.add('light-theme');
            el.classList.remove('dark-theme');
        }
    });
    
    document.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { isDarkMode } 
    }));
}

function setupRefreshStats() {
    const refreshBtn = document.getElementById('refresh-stats');
    if (!refreshBtn) return;
    
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('animate-spin');
        
        fetch('/api/dashboard/stats')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateDashboardStats(data.stats);
                    const timestamp = new Date().toLocaleTimeString();
                    document.getElementById('last-update').textContent = `Updated ${timestamp}`;
        } else {
                    console.error('Failed to fetch stats:', data.error);
        }
    })
    .catch(error => {
                console.error('Error refreshing stats:', error);
            })
            .finally(() => {
                refreshBtn.classList.remove('animate-spin');
            });
    });
}

function setupMobileMenu() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const sidebar = document.querySelector('.sidebar');
    
    if (!mobileNavToggle || !mobileNavOverlay || !sidebar) {
        console.warn('Mobile navigation elements not found. Mobile menu will not function correctly.');
        return;
    }
    
    console.log('Setting up mobile menu handlers');
    
    sidebar.classList.add('animate-mobile');
    
    sidebar.style.transform = 'translateZ(0)';
    sidebar.style.webkitTransform = 'translateZ(0)';
    sidebar.style.backfaceVisibility = 'hidden';
    sidebar.style.perspective = '1000';
    
    const sidebarContent = sidebar.querySelector('.sidebar-content');
    if (sidebarContent) {
        sidebarContent.style.position = 'relative';
        sidebarContent.style.zIndex = '5';
    }
    
    const allClickableElements = sidebar.querySelectorAll('a, button');
    console.log('Found clickable elements:', allClickableElements.length);
    
    allClickableElements.forEach((element, index) => {
        if (element.id === 'themeToggle') {
            element.setAttribute('data-mobile-enhanced', 'true');
            element.setAttribute('data-element-index', index);
            
            element.style.cursor = 'pointer';
            element.style.touchAction = 'manipulation';
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.position = 'relative';
            element.style.zIndex = '10';
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.themeManager) {
                    window.themeManager.toggleTheme();
                }
            });
            
            console.log('Preserving theme toggle functionality');
            return;
        }
        
        const clone = element.cloneNode(true);
        
        clone.style.cursor = 'pointer';
        clone.style.touchAction = 'manipulation';
        clone.style.webkitTapHighlightColor = 'transparent';
        clone.style.position = 'relative';
        clone.style.zIndex = '10';
        
        element.parentNode.replaceChild(clone, element);
        
        clone.setAttribute('data-mobile-enhanced', 'true');
        clone.setAttribute('data-element-index', index);
        
        ['click', 'touchend'].forEach(eventType => {
            clone.addEventListener(eventType, (e) => {
                e.stopPropagation();
                
                console.log(`Sidebar element ${eventType}:`, clone.textContent, 'index:', index);
                
                if (clone.tagName === 'A' && clone.href) {
                    if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
                        setTimeout(() => toggleMobileNav(), 10);
                        
                        const targetUrl = clone.href;
                        setTimeout(() => {
                            console.log('Navigating to:', targetUrl);
                            window.location.href = targetUrl;
                        }, 300);
                        
                        if (eventType === 'click') {
                            e.preventDefault();
                        }
                    }
                }
            }, { capture: true, passive: false });
        });
    });
    
    function toggleMobileNav() {
        console.log('Toggling mobile navigation');
        
        sidebar.classList.toggle('show');
        mobileNavOverlay.classList.toggle('show');
        
        const isExpanded = sidebar.classList.contains('show');
        mobileNavToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        
        document.body.classList.toggle('overflow-hidden');
        
        if (isExpanded) {
            sidebar.style.visibility = 'visible';
            sidebar.style.transform = 'translateX(0) translateZ(0)';
            sidebar.style.webkitTransform = 'translateX(0) translateZ(0)';
            
            const allLinks = sidebar.querySelectorAll('a, button');
            allLinks.forEach(link => {
                link.style.pointerEvents = 'auto';
                link.style.position = 'relative';
                link.style.zIndex = '10';
                
                if (window.location.search.includes('debug')) {
                    link.style.border = '1px solid red';
                }
            });
            
            sidebar.offsetWidth;
        } else {
            sidebar.style.transform = 'translateX(-100%) translateZ(0)';
            sidebar.style.webkitTransform = 'translateX(-100%) translateZ(0)';
            
            setTimeout(() => {
                if (!sidebar.classList.contains('show')) {
                    sidebar.style.visibility = 'hidden';
                }
            }, 300);
        }
        
        const icon = mobileNavToggle.querySelector('i');
        if (icon) {
            if (sidebar.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
    
    mobileNavToggle.addEventListener('click', toggleMobileNav);
    mobileNavOverlay.addEventListener('click', toggleMobileNav);
    
    const sidebarLinks = sidebar.querySelectorAll('a.nav-link');
    sidebarLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.position = 'relative';
        link.style.zIndex = '15';
        
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
                console.log('Nav link clicked:', link.textContent);
                
                if (!e.defaultPrevented) {
                    toggleMobileNav();
                }
            }
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && sidebar.classList.contains('show')) {
            toggleMobileNav();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            toggleMobileNav();
        }
    });
}

function setupDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        const dropdown = toggle.nextElementSibling;
        if (!dropdown || !dropdown.classList.contains('dropdown-content')) return;
        
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('.dropdown-content.show').forEach(open => {
                if (open !== dropdown) {
                    open.classList.remove('show');
                }
            });
            
            dropdown.classList.toggle('show');
        });
    });
    
    document.addEventListener('click', (e) => {
        const dropdowns = document.querySelectorAll('.dropdown-content.show');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target) && 
                !dropdown.previousElementSibling.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
}

function setupDashboard() {
    console.log('Setting up dashboard...');
    
}

function initializeCounters() {
    document.querySelectorAll('.stat-value').forEach(counter => {
        const target = parseFloat(counter.textContent) || 0;
        let current = 0;
        const increment = target / 20;
        
        counter.textContent = '0';
        
        const updateCounter = () => {
            current += increment;
            if (current > target) {
                current = target;
            }
            
            counter.textContent = Number.isInteger(target) ? 
                Math.floor(current).toString() : 
                current.toFixed(1);
                
            if (current < target) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    });
}

function showToast(title, message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 border-l-4 shadow-md p-4 
                       ${type === 'success' ? 'border-green-500' : 'border-red-500'} 
                       rounded-r-lg z-50 animate-fade-in`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${type === 'success' 
                    ? '<i class="fas fa-check-circle text-green-500 text-lg"></i>' 
                    : '<i class="fas fa-exclamation-circle text-red-500 text-lg"></i>'}
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">${title}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button class="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    toast.querySelector('button').addEventListener('click', function() {
        toast.classList.add('animate-fade-out');
                setTimeout(() => {
            document.body.removeChild(toast);
                }, 300);
            });
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('animate-fade-out');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
}

function applyRtlAdjustments() {
    document.body.classList.add('rtl');
    
    document.querySelectorAll('.ml-auto').forEach(el => {
        el.classList.remove('ml-auto');
        el.classList.add('mr-auto');
    });
    
    document.querySelectorAll('.flex.space-x-2, .flex.space-x-3, .flex.space-x-4').forEach(el => {
        el.style.flexDirection = 'row-reverse';
    });
    
    document.querySelectorAll('.fa-chevron-right').forEach(el => {
        el.classList.remove('fa-chevron-right');
        el.classList.add('fa-chevron-left');
    });
}

function updateDashboardStats(stats) {
    const pingElement = document.querySelector('[data-stat="ping"]');
    if (pingElement) {
        pingElement.textContent = 'Ping: ' + stats.ping + 'ms';
    }
    
    const memoryElement = document.querySelector('[data-stat="memory"]');
    if (memoryElement) {
        memoryElement.textContent = 'Memory: ' + stats.memoryUsage + ' MB';
    }
    
    const serversElement = document.querySelector('[data-stat-type="servers"]');
    if (serversElement) {
        const countElement = serversElement.querySelector('.animate-count');
        if (countElement) countElement.textContent = stats.servers;
    }
    
    const usersElement = document.querySelector('[data-stat-type="users"]');
    if (usersElement) {
        const countElement = usersElement.querySelector('.animate-count');
        if (countElement) countElement.textContent = stats.users;
    }
    
    const commandsElement = document.querySelector('[data-stat-type="commands"]');
    if (commandsElement) {
        const countElement = commandsElement.querySelector('.animate-count');
        if (countElement) countElement.textContent = stats.commands;
    }
    
    if (stats.protection) {
        document.getElementById('activeProtections').textContent = 
            stats.protection.activeProtections;
        document.getElementById('totalRoles').textContent = 
            stats.protection.protectedRoles;
        document.getElementById('whitelistedBots').textContent = 
            stats.protection.whitelistedBots;
        document.getElementById('blockedActions').textContent = 
            stats.protection.activeLogs;
    }
}

function setupTouchHandling() {
    if (typeof document === 'undefined' || !('ontouchstart' in window)) {
        return;
    }
    
    console.log('Setting up enhanced touch handling for mobile');
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const allLinks = sidebar.querySelectorAll('a, button');
    allLinks.forEach(link => {
        link.addEventListener('touchstart', function(e) {
            console.log('Touch start on element:', this.textContent?.trim());
            
            this.classList.add('touch-active');
            
            e.stopPropagation();
        }, { passive: true });
        
        link.addEventListener('touchend', function(e) {
            console.log('Touch end on element:', this.textContent?.trim());
            
            this.classList.remove('touch-active');
            
            if (this.tagName === 'A' && this.href && 
                window.innerWidth <= 992 && sidebar.classList.contains('show')) {
                
                console.log('Processing touch-based navigation');
                
                const targetUrl = this.href;
                
                const mobileNavToggle = document.getElementById('mobileNavToggle');
                if (mobileNavToggle) {
                    mobileNavToggle.click();
                } else {
                    sidebar.classList.remove('show');
                    const overlay = document.getElementById('mobileNavOverlay');
                    if (overlay) overlay.classList.remove('show');
                }
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
                
                e.preventDefault();
            }
        }, { passive: false });
    });
    
    sidebar.addEventListener('touchstart', function(e) {
        console.log('Sidebar touch start at:', e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
}
