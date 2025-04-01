// ==UserScript==
// @name         4pda Modern Desktop Theme (Loader)
// @namespace    http://tampermonkey.net/
// @version      0.3 // Обновил версию для ясности
// @description  Loads modern theme for 4pda showtopic pages (Desktop) from GitHub
// @author       LetovRF
// @match        *://4pda.to/forum/index.php?showtopic=*
// @match        *://4pda.ru/forum/index.php?showtopic=*
// @connect      raw.githubusercontent.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-idle // Запускаем после полной загрузки DOM
// ==/UserScript==

(function() {
    'use strict';

    // --- КОНФИГУРАЦИЯ ---
    const githubUser = 'immensaccessum'; // Ваш ник
    const githubRepo = '4pda-modern';   // Название репозитория
    const githubBranch = 'main';       // Ветка (обычно main или master)
    // --------------------

    const cacheBuster = `?v=${Date.now()}`; // Для предотвращения кеширования при разработке
    const cssUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/src/style.css${cacheBuster}`;
    const jsUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/src/app.js${cacheBuster}`;

    console.log('[Loader] Starting to load resources...');

    // 1. Загрузка и применение CSS
    GM_xmlhttpRequest({
        method: 'GET',
        url: cssUrl,
        onload: function(response) {
            if (response.status >= 200 && response.status < 300) {
                GM_addStyle(response.responseText);
                console.log('[Loader] Modern Theme CSS loaded successfully.');
            } else {
                console.error('[Loader] Failed to load CSS:', response.status, response.statusText, cssUrl);
            }
        },
        onerror: function(error) {
            console.error('[Loader] Error loading CSS:', error, cssUrl);
        }
    });

    // 2. Загрузка и выполнение JS
    GM_xmlhttpRequest({
        method: 'GET',
        url: jsUrl,
        onload: function(response) {
            if (response.status >= 200 && response.status < 300) {
                try {
                    // Безопасный способ выполнить загруженный код в его собственной области видимости
                    (new Function(response.responseText))();
                    console.log('[Loader] Modern Theme JS loaded and executed successfully.');
                } catch (e) {
                    console.error('[Loader] Error executing loaded JS:', e);
                    // Дополнительная информация об ошибке
                    if (e.stack) {
                        console.error(e.stack);
                    }
                }
            } else {
                console.error('[Loader] Failed to load JS:', response.status, response.statusText, jsUrl);
            }
        },
        onerror: function(error) {
            console.error('[Loader] Error loading JS:', error, jsUrl);
        }
    });

    console.log('[Loader] Resource loading initiated.');

})();