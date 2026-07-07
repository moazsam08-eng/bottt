const THEME_STORAGE_KEY = 'darkMode';

const DARK_THEME = {
    'primary': '#5865F2',
    'background-primary': '#0B0C10',
    'background-secondary': '#15171C',
    'background-tertiary': '#1E2027',
    'text-primary': '#FFFFFF',
    'text-secondary': '#D1D5DB',
    'text-muted': '#8E939E',
    'border-color': 'rgba(255, 255, 255, 0.06)',
    'accent-color': '#5865F2',
    'accent-hover': '#4752C4',
    'danger-color': '#ED4245',
    'success-color': '#23A55A'
};

function applyThemeColors(colors) {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
    });
}

function initTheme() {
    document.documentElement.classList.add('dark');
    applyThemeColors(DARK_THEME);
    localStorage.setItem(THEME_STORAGE_KEY, 'true');

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
        themeToggle.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', initTheme);

(function() {
    document.documentElement.classList.add('dark');
})();

window.themeManager = {
    setTheme: () => {},
    isDarkMode: () => true,
    toggleTheme: () => {}
};
