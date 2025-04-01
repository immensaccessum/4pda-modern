// ==UserScript==
// @name         4pda Modern Mobile Theme (Loader)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Loads modern theme for 4pda showtopic pages from GitHub
// @author       LetovRF
// @match        *://4pda.to/forum/index.php?showtopic=*
// @match        *://4pda.ru/forum/index.php?showtopic=*
// @connect      raw.githubusercontent.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-start // Пытаемся применить стили как можно раньше
// ==/UserScript==

(function() {
    'use strict';

    // --- КОНФИГУРАЦИЯ ---
    const githubUser = 'immensaccessum';
    const githubRepo = '4pda-modern';
    const githubBranch = 'main';
    // --------------------

    const cssUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/src/style.css?v=${Date.now()}`;
    const jsUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${githubBranch}/src/app.js?v=${Date.now()}`;

    // Добавляем ?v=Date.now() для предотвращения кеширования при разработке

    // 1. Загрузка и применение CSS
    GM_xmlhttpRequest({
        method: 'GET',
        url: cssUrl,
        onload: function(response) {
            if (response.status === 200) {
                GM_addStyle(response.responseText);
                console.log('Modern Theme CSS loaded.');
            } else {
                console.error('Failed to load CSS:', response.status, response.statusText);
            }
        },
        onerror: function(error) {
            console.error('Error loading CSS:', error);
        }
    });

    // 2. Загрузка и выполнение JS после загрузки DOM
    // Используем DOMContentLoaded, чтобы убедиться, что основной HTML уже есть
    document.addEventListener('DOMContentLoaded', () => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: jsUrl,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        // Безопасный способ выполнить загруженный код
                        (new Function(response.responseText))();
                        console.log('Modern Theme JS loaded and executed.');
                    } catch (e) {
                        console.error('Error executing loaded JS:', e);
                    }
                } else {
                    console.error('Failed to load JS:', response.status, response.statusText);
                }
            },
            onerror: function(error) {
                console.error('Error loading JS:', error);
            }
        });
    });

})();