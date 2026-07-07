document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname !== '/leveling') return;
    initLeveling();
});

function initLeveling() {
    const watchIds = [
        'leveling-enabled', 'leveling-color', 'leveling-xp',
        'leveling-cooldown', 'leveling-channel', 'leveling-message',
        'leveling-blacklist-channels', 'leveling-blacklist-roles'
    ];

    watchIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) ['change', 'input'].forEach(e => el.addEventListener(e, showSaveBar));
    });

    document.getElementById('saveLeveling')?.addEventListener('click', saveLeveling);
    document.getElementById('resetLeveling')?.addEventListener('click', () => window.location.reload());
    document.getElementById('add-level-role')?.addEventListener('click', addLevelRole);
    document.querySelectorAll('.remove-level-role').forEach(btn => {
        btn.addEventListener('click', () => { btn.closest('.level-role-row')?.remove(); updateNoRoles(); showSaveBar(); });
    });
}

function updateNoRoles() {
    const rows = document.querySelectorAll('.level-role-row');
    const el = document.getElementById('no-level-roles');
    if (el) el.classList.toggle('hidden', rows.length > 0);
}

function addLevelRole() {
    const template = document.getElementById('add-role-template');
    if (!template) return;
    const rolesHtml = template.querySelector('.roles-template')?.outerHTML || '<select></select>';
    const index = Date.now();
    const row = document.createElement('div');
    row.className = 'level-role-row flex items-center gap-3 bg-gray-700 rounded-lg p-3';
    row.dataset.index = index;
    row.innerHTML = `
        <span class="text-gray-300 text-sm w-24">عند المستوى:</span>
        <input type="number" class="lr-level w-24 px-2 py-1 bg-gray-600 rounded text-white text-sm" value="1" min="1">
        <span class="text-gray-300 text-sm">الرتبة:</span>
        <div class="flex-1">${rolesHtml.replace('class="roles-template"', 'class="lr-role w-full px-2 py-1 bg-gray-600 rounded text-white text-sm"')}</div>
        <button class="remove-level-role text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
    `;
    row.querySelector('.remove-level-role')?.addEventListener('click', () => { row.remove(); updateNoRoles(); showSaveBar(); });
    document.getElementById('level-roles-list')?.appendChild(row);
    updateNoRoles();
    showSaveBar();
}

function collectSettings() {
    const levelRoles = [];
    document.querySelectorAll('.level-role-row').forEach(row => {
        const level = parseInt(row.querySelector('.lr-level')?.value || '0');
        const roleId = row.querySelector('.lr-role')?.value || '';
        if (level > 0 && roleId) levelRoles.push({ level, roleId });
    });

    return {
        enabled: document.getElementById('leveling-enabled')?.checked || false,
        xpPerMessage: parseInt(document.getElementById('leveling-xp')?.value || '16'),
        cooldown: parseInt(document.getElementById('leveling-cooldown')?.value || '10'),
        levelUpMessage: document.getElementById('leveling-message')?.value || '',
        levelUpChannel: document.getElementById('leveling-channel')?.value || '',
        blacklistedChannels: Array.from(document.getElementById('leveling-blacklist-channels')?.selectedOptions || []).map(o => o.value),
        blacklistedRoles: Array.from(document.getElementById('leveling-blacklist-roles')?.selectedOptions || []).map(o => o.value),
        levelRoles,
        embed: {
            color: document.getElementById('leveling-color')?.value || '#5865F2'
        }
    };
}

async function saveLeveling() {
    try {
        const settings = collectSettings();
        const res = await fetch('/api/leveling/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
        hideSaveBar();
        showToast('تم حفظ إعدادات المستويات بنجاح', 'success');
    } catch (err) {
        showToast('فشل حفظ الإعدادات', 'error');
    }
}

function showSaveBar() {
    document.getElementById('saveBar')?.classList.add('visible');
}

function hideSaveBar() {
    document.getElementById('saveBar')?.classList.remove('visible');
}
