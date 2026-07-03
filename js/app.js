/* ============================================
   CONSULTA DNI PERÚ - Frontend Logic
   ============================================ */

(function () {
    'use strict';

    // ---------- DOM Elements ----------
    const form = document.getElementById('dni-form');
    const input = document.getElementById('dni-input');
    const searchBtn = document.getElementById('search-btn');
    const charCount = document.getElementById('char-count');
    const errorMsg = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    const resultsCard = document.getElementById('results-card');
    const resultDni = document.getElementById('result-dni');
    const resultNombre = document.getElementById('result-nombre');
    const resultTime = document.getElementById('result-time');
    const closeResults = document.getElementById('close-results');
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('copy-text');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const clearHistory = document.getElementById('clear-history');

    // ---------- State ----------
    const HISTORY_KEY = 'consulta_dni_history';
    const MAX_HISTORY = 20;

    // ---------- Utilities ----------
    function isValidDni(dni) {
        return /^\d{8}$/.test(dni);
    }

    function formatTime(date) {
        return new Intl.DateTimeFormat('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    function showError(message) {
        errorText.textContent = message;
        errorMsg.classList.add('--visible');
        setTimeout(() => {
            errorMsg.classList.remove('--visible');
        }, 4000);
    }

    function hideError() {
        errorMsg.classList.remove('--visible');
    }

    function setLoading(loading) {
        if (loading) {
            searchBtn.classList.add('--loading');
            searchBtn.disabled = true;
            input.disabled = true;
        } else {
            searchBtn.classList.remove('--loading');
            searchBtn.disabled = false;
            input.disabled = false;
        }
    }

    // ---------- History Management ----------
    function getHistory() {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveToHistory(dni, nombre) {
        const history = getHistory();
        
        // Remove duplicate if exists
        const filtered = history.filter(item => item.dni !== dni);
        
        // Add to beginning
        filtered.unshift({
            dni,
            nombre,
            timestamp: Date.now()
        });

        // Limit size
        const trimmed = filtered.slice(0, MAX_HISTORY);
        
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
        } catch {
            // localStorage might be full or disabled
        }

        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();

        if (history.length === 0) {
            historySection.classList.remove('--visible');
            return;
        }

        historySection.classList.add('--visible');
        historyList.innerHTML = '';

        history.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'history__item';
            el.style.animationDelay = `${index * 0.05}s`;
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
            el.setAttribute('aria-label', `Consultar DNI ${item.dni}`);

            el.innerHTML = `
                <div class="history__item-info">
                    <span class="history__item-dni">${item.dni}</span>
                    <span class="history__item-name">${item.nombre}</span>
                </div>
                <span class="history__item-time">${formatTime(new Date(item.timestamp))}</span>
            `;

            el.addEventListener('click', () => {
                input.value = item.dni;
                charCount.textContent = item.dni.length;
                updateCounter();
                input.focus();
                // Auto-search
                form.dispatchEvent(new Event('submit'));
            });

            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });

            historyList.appendChild(el);
        });
    }

    // ---------- API Call ----------
    async function consultarDni(dni) {
        const response = await fetch('/api/consulta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dni })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error en la consulta');
        }

        return data;
    }

    // ---------- Show Results ----------
    function showResults(dni, nombre) {
        resultDni.textContent = dni;
        resultNombre.textContent = nombre;
        resultTime.textContent = formatTime(new Date());

        resultsCard.classList.add('--visible');

        // Scroll to results smoothly
        setTimeout(() => {
            resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    function hideResults() {
        resultsCard.classList.remove('--visible');
    }

    // ---------- Counter Update ----------
    function updateCounter() {
        const len = input.value.length;
        charCount.textContent = len;

        const counterEl = document.querySelector('.search-form__counter');
        if (len === 8) {
            counterEl.classList.add('--complete');
        } else {
            counterEl.classList.remove('--complete');
        }
    }

    // ---------- Event Listeners ----------
    
    // Input: Only digits, update counter
    input.addEventListener('input', () => {
        // Remove non-digits
        input.value = input.value.replace(/\D/g, '');
        updateCounter();
        hideError();
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const dni = input.value.trim();

        if (!isValidDni(dni)) {
            showError('Ingresa un DNI válido de 8 dígitos numéricos.');
            input.focus();
            return;
        }

        setLoading(true);
        hideResults();

        try {
            const data = await consultarDni(dni);
            showResults(dni, data.nombre);
            saveToHistory(dni, data.nombre);
        } catch (err) {
            showError(err.message || 'Ocurrió un error al consultar. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    });

    // Close results
    closeResults.addEventListener('click', hideResults);

    // Copy button
    copyBtn.addEventListener('click', async () => {
        const nombre = resultNombre.textContent;
        const dni = resultDni.textContent;
        const textToCopy = `DNI: ${dni} - ${nombre}`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            copyText.textContent = '¡Copiado!';
            copyBtn.classList.add('--copied');
            setTimeout(() => {
                copyText.textContent = 'Copiar';
                copyBtn.classList.remove('--copied');
            }, 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            copyText.textContent = '¡Copiado!';
            copyBtn.classList.add('--copied');
            setTimeout(() => {
                copyText.textContent = 'Copiar';
                copyBtn.classList.remove('--copied');
            }, 2000);
        }
    });

    // Clear history
    clearHistory.addEventListener('click', () => {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
        hideResults();
    });

    // Keyboard shortcut: Enter to focus input
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    });

    // ---------- Init ----------
    renderHistory();
    input.focus();

})();
