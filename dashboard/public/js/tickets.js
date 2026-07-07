document.addEventListener('DOMContentLoaded', () => {
    if (window.utils && window.utils.onPage) {
        utils.onPage('/tickets', () => {
            console.log('Initializing ticket page...');
            initializeTicketToggles();
            initializeEmbedSettings();
            initializeSectionSettings();
            initializeGlobalControls();
            initializeSaveBar();
            initializeMultiSelects();
            initializeNewSectionForm();
            initializeDeleteButtons();
            initializeImagePreviews();
            updateTicketStats();
            initializeEmojiPickers();
            initializeAddTicketButton();
        });
    } else {
        if (window.location.pathname === '/tickets') {
            console.log('Initializing ticket page (fallback)...');
            initializeTicketToggles();
            initializeEmbedSettings();
            initializeSectionSettings();
            initializeGlobalControls();
            initializeSaveBar();
            initializeMultiSelects();
            initializeNewSectionForm();
            initializeDeleteButtons();
            initializeImagePreviews();
            updateTicketStats();
            initializeEmojiPickers();
            initializeAddTicketButton();
        }
    }
});

function initializeTicketToggles() {
    console.log('Initializing ticket toggles...');
    const systemToggle = document.getElementById('ticket-enabled');
    if (systemToggle) {
        systemToggle.addEventListener('change', () => {
            console.log('System toggle changed:', systemToggle.checked);
            showSaveBar();
            updateTicketStats();
        });
    }

    const sectionToggles = document.querySelectorAll('.section-toggle');
    if (!sectionToggles || sectionToggles.length === 0) {
        console.log('No section toggles found');
        return;
    }

    sectionToggles.forEach(toggle => {
        if (!toggle) return;
        toggle.addEventListener('change', () => {
            console.log('Section toggle changed:', toggle.dataset.section, toggle.checked);
            showSaveBar();
            updateTicketStats();
        });
    });
}

function initializeEmbedSettings() {
    console.log('Initializing embed settings...');
    const embedInputs = [
        'ticket-embed-color',
        'ticket-embed-thumbnail',
        'ticket-embed-footer',
        'ticket-embed-footerIcon',
        'required-server-enabled',
        'required-server-guildId',
        'required-server-inviteUrl',
        'required-server-message'
    ];

    embedInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            ['change', 'input'].forEach(eventType => {
                input.addEventListener(eventType, () => {
                    console.log('Setting changed:', id, input.value);
                    showSaveBar();
                });
            });
        }
    });
}

function initializeSectionSettings() {
    console.log('Initializing section settings...');
    const sectionInputs = [
        '.section-name',
        '.section-emoji',
        '.section-description',
        '.section-category',
        '.section-logChannel',
        '.section-adminRoles',
        '.section-cooldown',
        '.section-imageUrl'
    ];

    sectionInputs.forEach(selector => {
        document.querySelectorAll(selector).forEach(input => {
            ['change', 'input'].forEach(eventType => {
                input.addEventListener(eventType, () => {
                    console.log('Section setting changed:', selector, input.value);
                    showSaveBar();
                    updateTicketStats();
                });
            });
        });
    });
}

function initializeMultiSelects() {
    console.log('Initializing multi-selects...');
    document.querySelectorAll('select[multiple]').forEach(select => {
        select.addEventListener('change', () => {
            console.log('Multi-select changed:', select.id);
            showSaveBar();
        });
    });
}

function initializeGlobalControls() {
    console.log('Initializing global controls...');
    const enableAllBtn = document.getElementById('enableAllTickets');
    const disableAllBtn = document.getElementById('disableAllTickets');

    if (enableAllBtn) {
        enableAllBtn.addEventListener('click', () => {
            console.log('Enabling all sections...');
            document.querySelectorAll('.section-toggle').forEach(toggle => {
                toggle.checked = true;
            });
            showSaveBar();
            updateTicketStats();
        });
    }

    if (disableAllBtn) {
        disableAllBtn.addEventListener('click', () => {
            console.log('Disabling all sections...');
            document.querySelectorAll('.section-toggle').forEach(toggle => {
                toggle.checked = false;
            });
            showSaveBar();
            updateTicketStats();
        });
    }
}

function collectTicketSettings() {
    console.log('Collecting ticket settings...');
    const settings = {
        enabled: document.getElementById('ticket-enabled')?.checked || false,
        embed: {
            color: document.getElementById('ticket-embed-color')?.value || '#3498db',
            thumbnail: document.getElementById('ticket-embed-thumbnail')?.value || null,
            footer: document.getElementById('ticket-embed-footer')?.value || '',
            footerIcon: document.getElementById('ticket-embed-footerIcon')?.value || null,
            timestamp: true
        },
        requiredServer: {
            enabled: document.getElementById('required-server-enabled')?.checked || false,
            guildId: document.getElementById('required-server-guildId')?.value || '',
            inviteUrl: document.getElementById('required-server-inviteUrl')?.value || '',
            message: document.getElementById('required-server-message')?.value || '❌ يجب عليك الانضمام إلى سيرفرنا أولاً حتى تتمكن من فتح تذكرة!'
        },
        sections: []
    };

    if (settings.embed.thumbnail === '') settings.embed.thumbnail = null;
    if (settings.embed.footerIcon === '') settings.embed.footerIcon = null;

    document.querySelectorAll('.ticket-section').forEach(sectionEl => {
        const index = sectionEl.dataset.section;
        const imageUrl = sectionEl.querySelector('.section-imageUrl')?.value || '';
        
        const section = {
            enabled: sectionEl.querySelector('.section-toggle')?.checked || false,
            name: sectionEl.querySelector('.section-name')?.value || '',
            emoji: sectionEl.querySelector('.section-emoji')?.value || '',
            description: sectionEl.querySelector('.section-description')?.value || '',
            categoryId: sectionEl.querySelector('.section-category')?.value || '',
            logChannelId: sectionEl.querySelector('.section-logChannel')?.value || '',
            adminRoles: Array.from(sectionEl.querySelector('.section-adminRoles')?.selectedOptions || [])
                .map(option => option.value),
            cooldown: parseInt(sectionEl.querySelector('.section-cooldown')?.value || '0'),
            imageUrl: imageUrl === '' ? null : imageUrl
        };
        settings.sections.push(section);
    });

    console.log('Collected settings:', settings);
    return settings;
}

async function saveTicketSettings() {
    console.log('Saving ticket settings...');
    try {
        const settings = collectTicketSettings();
        
        const response = await fetch('/api/tickets/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save settings');

        console.log('Settings saved successfully:', data);
        hideSaveBar();
        showToast('Ticket settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving ticket settings:', error);
        showToast('Failed to save ticket settings', 'error');
    }
}

function initializeSaveBar() {
    console.log('Initializing save bar...');
    const saveBtn = document.getElementById('saveTicketSettings');
    const resetBtn = document.getElementById('resetTicketSettings');

    if (saveBtn) {
        saveBtn.addEventListener('click', saveTicketSettings);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all ticket settings?')) {
                window.location.reload();
            }
        });
    }
}

function showSaveBar() {
    const saveBar = document.getElementById('saveBar');
    if (saveBar) {
        saveBar.classList.add('show');
    }
}

function hideSaveBar() {
    const saveBar = document.getElementById('saveBar');
    if (saveBar) {
        saveBar.classList.remove('show');
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

function updateTicketStats() {
    const activeCount = document.querySelectorAll('.section-toggle:checked').length;
    animateStatValue('activeTickets', activeCount);

    const adminRoles = new Set();
    document.querySelectorAll('.section-adminRoles').forEach(select => {
        Array.from(select.selectedOptions).forEach(option => {
            adminRoles.add(option.value);
        });
    });
    animateStatValue('adminRoles', adminRoles.size);

    const categories = new Set();
    document.querySelectorAll('.section-category').forEach(select => {
        if (select.value) categories.add(select.value);
    });
    animateStatValue('categories', categories.size);

    const cooldowns = Array.from(document.querySelectorAll('.section-cooldown'))
        .map(input => parseInt(input.value) || 0)
        .filter(val => val > 0);
    const avgCooldown = cooldowns.length ? 
        Math.round(cooldowns.reduce((a, b) => a + b, 0) / cooldowns.length) : 0;
    animateStatValue('avgCooldown', avgCooldown + 'h');
}

function animateStatValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.remove('stat-update');
    element.textContent = newValue;
    void element.offsetWidth;
    element.classList.add('stat-update');
}

function initializeImagePreviews() {
    document.querySelectorAll('.section-imageUrl').forEach(input => {
        input.addEventListener('change', (e) => {
            const section = e.target.closest('.ticket-section');
            const previewContainer = section.querySelector('.image-preview');
            if (!previewContainer) return;

            const url = e.target.value;
            if (url) {
                previewContainer.innerHTML = `
                    <img src="${url}" 
                         alt="Section Image"
                         class="rounded-lg max-h-32 object-cover"
                         onerror="this.style.display='none'">
                `;
            } else {
                previewContainer.innerHTML = '';
            }
            showSaveBar();
        });
    });
}

function initializeNewSectionForm() {
    const form = document.getElementById('newSectionForm');
    const addButton = document.getElementById('addNewSection');
    const clearButton = document.getElementById('clearNewSection');
    const imageUrlInput = document.getElementById('new-section-imageUrl');
    const previewDiv = document.getElementById('new-section-preview');

    imageUrlInput?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            const img = previewDiv.querySelector('img') || new Image();
            img.src = url;
            img.onload = () => {
                previewDiv.classList.remove('hidden');
                if (!previewDiv.contains(img)) {
                    previewDiv.appendChild(img);
                }
            };
            img.onerror = () => {
                previewDiv.classList.add('hidden');
                showFieldError('new-section-imageUrl', 'Invalid image URL');
            };
        } else {
            previewDiv.classList.add('hidden');
        }
    });

    addButton?.addEventListener('click', async () => {
        if (validateNewSectionForm()) {
            try {
                const imageUrl = document.getElementById('new-section-imageUrl')?.value || '';
                
                const newSection = {
                    enabled: document.getElementById('new-section-enabled')?.checked || true,
                    name: document.getElementById('new-section-name')?.value,
                    emoji: document.getElementById('new-section-emoji')?.value,
                    description: document.getElementById('new-section-description')?.value,
                    categoryId: document.getElementById('new-section-category')?.value,
                    logChannelId: document.getElementById('new-section-logChannel')?.value,
                    adminRoles: Array.from(document.getElementById('new-section-adminRoles')?.selectedOptions || [])
                        .map(opt => opt.value),
                    cooldown: parseInt(document.getElementById('new-section-cooldown')?.value || '24'),
                    imageUrl: imageUrl === '' ? null : imageUrl
                };

                const response = await fetch('/api/tickets/sections/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSection)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to add section');
                }

                showToast('Ticket section added successfully', 'success');
                clearNewSectionForm();
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Error adding section:', error);
                showToast(error.message || 'Failed to add ticket section', 'error');
            }
        }
    });

    clearButton?.addEventListener('click', clearNewSectionForm);
}

function validateNewSectionForm() {
    let isValid = true;
    const requiredFields = [
        'new-section-name',
        'new-section-description',
        'new-section-category',
        'new-section-logChannel'
    ];

    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        let value = field.type === 'select-multiple' ? 
            Array.from(field.selectedOptions).length : 
            field.value.trim();

        if (!value) {
            isValid = false;
            showFieldError(fieldId, 'This field is required');
        }
    });

    const adminRoles = document.getElementById('new-section-adminRoles');
    if (adminRoles && Array.from(adminRoles.selectedOptions).length === 0) {
        isValid = false;
        showFieldError('new-section-adminRoles', 'Select at least one admin role');
    }

    const cooldown = document.getElementById('new-section-cooldown');
    if (cooldown && (isNaN(cooldown.value) || parseInt(cooldown.value) < 0)) {
        isValid = false;
        showFieldError('new-section-cooldown', 'Must be a positive number');
    }

    const emoji = document.getElementById('new-section-emoji');
    if (emoji) {
        if (!emoji.value.trim()) {
            emoji.value = '📩';
        } else if (!isEmoji(emoji.value)) {
            isValid = false;
            showFieldError('new-section-emoji', 'Must be a valid emoji');
        }
    }

    console.log('Form validation result:', isValid);
    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = field?.parentElement?.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        field.classList.add('border-red-500');
    }
}

function clearNewSectionForm() {
    const form = document.getElementById('newSectionForm');
    const fields = [
        'new-section-name',
        'new-section-emoji',
        'new-section-description',
        'new-section-category',
        'new-section-logChannel',
        'new-section-adminRoles',
        'new-section-cooldown',
        'new-section-imageUrl'
    ];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        if (field.type === 'select-multiple') {
            Array.from(field.options).forEach(opt => opt.selected = false);
        } else if (field.type === 'number') {
            field.value = '24';
        } else {
            field.value = '';
        }
        field.classList.remove('border-red-500');
    });

    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });

    document.getElementById('new-section-preview')?.classList.add('hidden');
}

function isEmoji(str) {
    if (!str || str.trim() === '') return false;
    
    return str.trim().length <= 4 || 
           /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}]/u.test(str) ||
           /^[👍👌🎉😊❤️🔥✅⭐🚀😍]/.test(str) ||
           /^[:;][a-zA-Z0-9_-]+:$/.test(str);
}

function initializeDeleteButtons() {
    document.querySelectorAll('.delete-section').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const section = e.target.closest('.ticket-section');
            const index = section.dataset.section;

            if (confirm('Are you sure you want to delete this ticket section?')) {
                try {
                    const response = await fetch(`/api/tickets/sections/${index}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Failed to delete section');

                    section.style.opacity = '0';
                    section.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        section.remove();
                        updateTicketStats();
                    }, 300);
                    showToast('Ticket section deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting section:', error);
                    showToast('Failed to delete ticket section', 'error');
                }
            }
        });
    });
}

function generateCategoryOptions() {
    return Array.from(document.querySelectorAll('.section-category option'))
        .map(opt => `<option value="${opt.value}">${opt.textContent}</option>`)
        .join('');
}

function generateChannelOptions() {
    return Array.from(document.querySelectorAll('.section-logChannel option'))
        .map(opt => `<option value="${opt.value}">${opt.textContent}</option>`)
        .join('');
}

function generateRoleOptions() {
    return Array.from(document.querySelectorAll('.section-adminRoles option'))
        .map(opt => `<option value="${opt.value}">${opt.textContent}</option>`)
        .join('');
}

function initializeRealTimeUpdates() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        ['input', 'change'].forEach(eventType => {
            input.addEventListener(eventType, () => {
                showSaveBar();
                updateTicketStats();
            });
        });
    });
}

function initializeEmojiPickers() {
    document.querySelectorAll('.emoji-picker-btn').forEach(btn => {
        const input = btn.parentElement.querySelector('input');
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-mart').forEach(p => p.remove());

            const rect = btn.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            const picker = new EmojiMart.Picker({
                data: async () => {
                    const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data');
                    return response.json();
                },
                onEmojiSelect: (emoji) => {
                    input.value = emoji.native;
                    input.dispatchEvent(new Event('change'));
                    showSaveBar();
                    picker.remove();
                },
                theme: 'dark',
                set: 'native',
                showPreview: false,
                showSkinTones: false,
                maxFrequentRows: 2
            });

            document.body.appendChild(picker);
            
            const isRTL = document.dir === 'rtl';
            const pickerRect = picker.getBoundingClientRect();
            
            let top = rect.bottom + scrollTop + 5;
            let left = isRTL ? rect.left + scrollLeft - pickerRect.width + rect.width : rect.left + scrollLeft;

            if (top + pickerRect.height > window.innerHeight) {
                top = rect.top + scrollTop - pickerRect.height - 5;
            }
            if (left + pickerRect.width > window.innerWidth) {
                left = window.innerWidth - pickerRect.width - 5;
            }
            if (left < 0) {
                left = 5;
            }

            picker.style.position = 'absolute';
            picker.style.top = `${top}px`;
            picker.style.left = `${left}px`;
            picker.style.zIndex = '1000';

            const closePickerOnClickOutside = (e) => {
                if (!picker.contains(e.target) && !btn.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', closePickerOnClickOutside);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', closePickerOnClickOutside);
            }, 100);
        });
    });
}

function initializeAddTicketButton() {
    const addTicketButton = document.getElementById('addTicketSection');
    if (addTicketButton) {
        console.log('Initializing add ticket section button');
        addTicketButton.addEventListener('click', () => {
            const newSectionForm = document.getElementById('newSectionForm');
            if (newSectionForm) {
                newSectionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newSectionForm.classList.add('highlight-animation');
                setTimeout(() => {
                    newSectionForm.classList.remove('highlight-animation');
                }, 1500);
            }
        });
    }
} 
