document.addEventListener('DOMContentLoaded', () => {
    if (window.utils && window.utils.onPage) {
        utils.onPage('/logs', () => {
            initializeLogToggles();
            initializeSearchFilter();
            initializeGlobalControls();
            initializeChannelSelects();
            initializeColorPickers();
            initializeIgnoreBots();
        });
    } else {
        if (window.location.pathname === '/logs') {
            initializeLogToggles();
            initializeSearchFilter();
            initializeGlobalControls();
            initializeChannelSelects();
            initializeColorPickers();
            initializeIgnoreBots();
        }
    }
});

function initializeLogToggles() {
    if (!utils || !utils.safelyInitialize) return;
    
    utils.safelyInitialize('.log-toggle', () => {
        const toggles = document.querySelectorAll('.log-toggle');
        if (!toggles || toggles.length === 0) return;
        
        toggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                try {
                    const logType = e.target.dataset.log;
                    const enabled = e.target.checked;
                    
                    await updateLogSettings(logType, { enabled });
                    
                    utils.showToast(
                        enabled ? 'success' : 'success',
                        enabled ? 'Log enabled' : 'Log disabled'
                    );
                } catch (error) {
                    console.error('Toggle error:', error);
                    e.target.checked = !e.target.checked;
                    utils.showToast('error', 'Failed to update log settings');
                }
            });
        });
    });
}

function initializeSearchFilter() {
    if (!utils || !utils.safelyInitialize) return;
    
    utils.safelyInitialize('#logSearch', (searchInput) => {
        utils.safelyInitialize('#logsGrid', (logsGrid) => {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const logCards = logsGrid.querySelectorAll('.log-card');
                
                logCards.forEach(card => {
                    const logName = card.querySelector('h3')?.textContent.toLowerCase() || '';
                    const logDescription = card.querySelector('p')?.textContent.toLowerCase() || '';
                    
                    if (logName.includes(searchTerm) || logDescription.includes(searchTerm)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    });
}

function initializeGlobalControls() {
    const enableAllBtn = document.getElementById('enableAllLogs');
    const disableAllBtn = document.getElementById('disableAllLogs');
    
    enableAllBtn.addEventListener('click', () => updateAllLogs(true));
    disableAllBtn.addEventListener('click', () => updateAllLogs(false));
}

async function updateAllLogs(enabled) {
    const toggles = document.querySelectorAll('.log-toggle');
    const updates = [];
    
    toggles.forEach(toggle => {
        if (toggle.checked !== enabled) {
            toggle.checked = enabled;
            updates.push(updateLogSettings(toggle.dataset.log, { enabled }));
        }
    });
    
    try {
        await Promise.all(updates);
        showToast(
            enabled ? 'All logs enabled' : 'All logs disabled',
            'success'
        );
    } catch (error) {
        console.error('Error updating all logs:', error);
        showToast('Failed to update all logs', 'error');
    }
}

function initializeChannelSelects() {
    const channelSelects = document.querySelectorAll('.log-channel');
    
    channelSelects.forEach(select => {
        select.addEventListener('change', async (e) => {
            const logType = e.target.dataset.log;
            const channelId = e.target.value;
            
            try {
                await updateLogSettings(logType, { channelId });
                showToast('Channel updated successfully', 'success');
            } catch (error) {
                console.error('Channel update error:', error);
                showToast('Failed to update channel', 'error');
            }
        });
    });
}

function initializeColorPickers() {
    const colorPickers = document.querySelectorAll('.log-color');
    
    colorPickers.forEach(picker => {
        picker.addEventListener('change', async (e) => {
            const logType = e.target.dataset.log;
            const color = e.target.value;
            
            try {
                await updateLogSettings(logType, { color });
                showToast('Color updated successfully', 'success');
            } catch (error) {
                console.error('Color update error:', error);
                showToast('Failed to update color', 'error');
            }
        });
    });
}

function initializeIgnoreBots() {
    const ignoreBotCheckboxes = document.querySelectorAll('.log-ignore-bots');
    
    ignoreBotCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const logType = e.target.dataset.log;
            const ignoreBots = e.target.checked;
            
            try {
                await updateLogSettings(logType, { ignoreBots });
                showToast('Bot ignore setting updated', 'success');
            } catch (error) {
                console.error('Ignore bots update error:', error);
                showToast('Failed to update bot ignore setting', 'error');
            }
        });
    });
}

async function updateLogSettings(logType, settings) {
    try {
        console.log('Updating log settings:', { logType, settings });
        
        const response = await fetch('/api/logs/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                logType,
                settings
            })
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update settings');
        }

        const logCard = document.querySelector(`[data-log="${logType}"]`);
        if (logCard) {
            console.log('Updating UI for log card:', logType);
            if ('enabled' in settings) {
                const toggle = logCard.querySelector('.log-toggle');
                if (toggle) toggle.checked = settings.enabled;
            }

            if ('channelId' in settings) {
                const channelSelect = logCard.querySelector('.log-channel');
                if (channelSelect) channelSelect.value = settings.channelId;
            }

            if ('color' in settings) {
                const colorPicker = logCard.querySelector('.log-color');
                if (colorPicker) colorPicker.value = settings.color;
            }

            if ('ignoreBots' in settings) {
                const ignoreBots = logCard.querySelector('.log-ignore-bots');
                if (ignoreBots) ignoreBots.checked = settings.ignoreBots;
            }
        }

        return data;
    } catch (error) {
        console.error('Error updating log settings:', error);
        throw error;
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } transition-all transform translate-y-0 opacity-100 z-50`;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
} 
