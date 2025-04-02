(function() {
    'use strict';

    const SCRIPT_NAME = '4pda Modern Theme App';
    const SCRIPT_VERSION = '1.3'; // Версия с возвратом селекторов и отладкой меню/спойлеров
    const LOG_PREFIX = `[${SCRIPT_NAME} v${SCRIPT_VERSION}]`;

    console.log(`${LOG_PREFIX} Script starting...`);

    /**
     * ========================================================================
     * ШАБЛОН НОВОГО ПОСТА (HTML Generation) v1.3 - Без изменений
     * ========================================================================
     */
    function createPostHtml(postData) {
        const defaultAvatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2328a745'/%3E%3C/svg%3E`;
        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');
        const repHtml = `<span class="mp-rep" title="Репутация: ${postData.reputation}">⭐ ${postData.reputation}</span>`;

        return `
            <article class="mp-post" data-post-id="${postData.postId}" data-author-id="${postData.authorId}">
              <header class="mp-header">
                <div class="mp-author-info">
                  <img class="mp-avatar" src="${postData.avatarUrl || defaultAvatarSvg}" alt="Аватар ${postData.authorNick}" loading="lazy" onerror="this.src='${defaultAvatarSvg}'; this.onerror=null;">
                  <div class="mp-author-details" style="position: relative;">
                    <div class="mp-author-line1">
                       <a class="mp-author-nick" href="${postData.authorProfileUrl}" data-user-id="${postData.authorId}" title="Открыть меню пользователя">${postData.authorNick}</a>
                       ${repHtml}
                    </div>
                    <div class="mp-author-line2">
                       <span class="mp-author-status" title="Статус">${postData.authorStatus}</span>
                       ${postData.authorGroup ? ` | <span class="mp-author-group" title="Группа">${postData.authorGroup}</span>` : ''}
                    </div>
                    <!-- Меню пользователя будет вставлено сюда JS -->
                  </div>
                </div>
                <div class="mp-meta-actions">
                   <div class="mp-meta">
                      <span class="mp-ip" title="IP адрес">${postData.ipAddress}</span>
                      <span class="mp-separator">|</span>
                      <a class="mp-post-number" href="#entry${postData.postId}" title="Ссылка на пост">#${postData.postNumber}</a>
                      <label class="mp-secheck" style="${postData.canModerate ? 'display: inline-block;' : 'display: none;'}" title="Выбрать пост"><input type="checkbox" name="selectedpids[]" value="${postData.postId}"><i class="check"></i></label>
                   </div>
                   <div class="mp-actions-menu-container" style="position: relative;">
                      <button class="mp-actions-trigger" aria-label="Действия с постом" title="Действия">⋮</button>
                      <ul class="mp-actions-menu">${actionsHtml.length > 0 ? actionsHtml : '<li>Нет действий</li>'}</ul>
                   </div>
                </div>
              </header>
              <div class="mp-body">
                ${postData.postBodyHtml}
              </div>
              <footer class="mp-footer">
                  <span class="mp-creation-date ${postData.editClass}" title="${postData.editTooltip || ''}">${postData.creationDate}</span>
                  ${postData.editReason ? `<div class="mp-edit-reason" title="Причина редактирования">${postData.editReason}</div>` : ''}
              </footer>
            </article>
        `;
    }

    /**
     * ========================================================================
     * ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ ОРИГИНАЛЬНОЙ СТРАНИЦЫ (Data Extraction) v1.3
     * Строго используем карту селекторов!
     * ========================================================================
     */
     function extractPostData(originalPostTable) {
        const postId = originalPostTable.dataset.post; if (!postId) return null;
        const logScopePrefix = `Post ${postId} Extract`;
        // console.log(`--- [${logScopePrefix}] Starting extraction ---`);
        const data = { postId, authorNick: '?', authorId: null, authorProfileUrl: '#', authorPmUrl: '#', avatarUrl: null, authorStatus: '', authorGroup: '', reputation: '0', repHistoryUrl: '#', repPlusUrl: '#', ipAddress: '', postNumber: '?', postBodyHtml: '<p>Контент не найден</p>', creationDate: '', isEdited: false, editClass: '', editTooltip: '', editReason: '', actions: [], canModerate: false };

        try {
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td[class^="post"]:first-child`);
            const metaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3`);
            const leftButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:first-child');
            const rightButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:last-child');
            if (!userInfoCell || !metaCell || !postBodyCell || !buttonsRow || !leftButtonsCell || !rightButtonsCell) { console.error(`[${logScopePrefix}] ❌ CRITICAL: Essential cells missing!`); return null; }

            // --- Автор и ID (Карта: ✅) ---
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            if (nickLink) { data.authorNick = nickLink.textContent?.trim() || '?'; data.authorProfileUrl = nickLink.href || '#'; const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/); if (userIdMatch) data.authorId = userIdMatch[1]; }

            // --- QMS URL (Сначала из меню, потом из кнопок - Карта: ✅ / ℹ️) ---
            const userMenuContainer = document.getElementById(`post-member-${postId}_menu`); const pmLink = userMenuContainer?.querySelector('a[href*="act=qms&mid="]'); if (pmLink) data.authorPmUrl = pmLink.href; else if (data.authorId) { const qmsButton = rightButtonsCell.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`); if (qmsButton) data.authorPmUrl = qmsButton.href; }

            // --- Информация о пользователе (Из Карты: ✅ / ℹ️) ---
            const avatarImg = userInfoCell.querySelector('.user-avatar img'); if (avatarImg) data.avatarUrl = avatarImg.src;
            const statusElem = userInfoCell.querySelector('.mem-title'); if (statusElem) data.authorStatus = statusElem.textContent?.trim() || '';
            // --- Группа пользователя (Возврат к проверенному методу) ---
            const groupTextNode = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.includes('Группа:'));
            const groupSpan = groupTextNode?.nextElementSibling; // Ищем СЛЕДУЮЩИЙ элемент
            if (groupSpan && groupSpan.tagName === 'SPAN' && groupSpan.style.color) { // Добавили проверку style.color как в верификаторе
                 data.authorGroup = groupSpan.textContent?.trim() || '';
                 console.log(`[${logScopePrefix}] ✅ Author Group FOUND: "${data.authorGroup}"`);
            } else {
                 console.log(`[${logScopePrefix}] ℹ️ Author Group NOT found or span has no style.`);
                 // Логируем, что нашли (или не нашли) после "Группа:"
                 console.log(`[${logScopePrefix}]   Group Text Node:`, groupTextNode);
                 console.log(`[${logScopePrefix}]   Element after Group Text Node:`, groupSpan);
            }
            const repValueSpan = userInfoCell.querySelector('span[data-member-rep]'); if (repValueSpan) data.reputation = repValueSpan.textContent?.trim() || '0';
            // --- Ссылки репутации (Возврат к проверенным селекторам из карты) ---
            const repContainer = repValueSpan?.closest('center') || userInfoCell; // Контейнер для поиска ссылок
            const repHistoryLink = repContainer.querySelector(`a[href*="act=rep&view=history&mid=${data.authorId}"]`); if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
            const repPlusAnchor = repContainer.querySelector(`a[onclick*="rep_change_window_open"][title*="Поднять репутацию"]`); // Селектор из карты
            if (repPlusAnchor) { data.repPlusUrl = repPlusAnchor.href; console.log(`[${logScopePrefix}] ✅ Rep Plus Link FOUND using verified selector: ${data.repPlusUrl}`); } else { console.log(`[${logScopePrefix}] ❌ Rep Plus Link NOT found using verified selector.`); }
            const ipLink = userInfoCell.querySelector('.post-field-ip a'); if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent?.trim() || '';

            // --- Метаданные поста (Карта: ✅ / ℹ️) ---
            const postNumLink = metaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]'); if (postNumLink) data.postNumber = postNumLink.textContent?.trim().replace('#','') || '?';
            const dateNode = Array.from(metaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/) && !node.parentElement?.closest('a')); if (dateNode) data.creationDate = dateNode.textContent?.trim() || '';
            if (metaCell.querySelector('label.secheck input[name="selectedpids[]"]')) data.canModerate = true;

            // --- Тело поста и редактирование (Карта: ✅ / ℹ️) ---
            const postBodyDiv = postBodyCell.querySelector(`div.postcolor[id="post-${postId}"]`);
            if (postBodyDiv) { const clonedContent = postBodyDiv.cloneNode(true); const editSpan = clonedContent.querySelector('span.edit'); if (editSpan) { data.isEdited = true; data.editTooltip = editSpan.textContent?.trim() || ''; const editLink = editSpan.querySelector('a'); data.editClass = (editLink && data.authorId && editLink.href.includes(`showuser=${data.authorId}`)) ? 'edited-by-self' : 'edited-by-other'; editSpan.remove(); } const signatureDiv = clonedContent.querySelector('div.signature'); if(signatureDiv) signatureDiv.remove(); data.postBodyHtml = clonedContent.innerHTML; }
            const editReasonDiv = postBodyCell.querySelector(`div.post-edit-reason`); if (editReasonDiv) data.editReason = editReasonDiv.textContent?.trim() || '';

            // --- Кнопки действий (Карта: ✅ / ℹ️ - Используем проверенные фильтры) ---
            const rawActions = [];
            rightButtonsCell.querySelectorAll('a.g-btn').forEach(button => rawActions.push({ element: button, text: button.textContent?.trim(), onclick: button.getAttribute('onclick'), href: button.href || '#' }));
            const reportButton = leftButtonsCell.querySelector('a.g-btn[href*="act=report&t="]'); if(reportButton) rawActions.push({ element: reportButton, text: 'ЖАЛОБА', onclick: null, href: reportButton.href });

             rawActions.forEach(action => {
                 const { element, text, onclick, href } = action;
                 let actionText = text; let actionUrl = href; let actionOnClick = onclick ? onclick.replace(/"/g, "'") : null;

                 // Пропуск ненужных (включая "В ШАПКУ" по ID атрибута data-to-pinpost-id)
                 if (text === 'ИМЯ' || element.hasAttribute('data-to-pinpost-id') || element.classList.contains('pinlink') || (onclick && (onclick.includes('--seMODhide') || onclick.includes('--seMODdel'))) || element.getAttribute('data-rel') === 'lyteframe' || text === 'В ШАПКУУЖЕ В ШАПКЕ') { return; }
                 // Пропуск Karma "ПЛОХО"
                 if (text === 'ПЛОХО' || (onclick && onclick.includes('ka_vote') && onclick.includes('-1'))) return;

                 // Обработка известных
                 if (element.matches('[data-quote-link]')) { return; } // Пока пропускаем цитату
                 else if (element.id && element.id.startsWith('edit-but-')) { actionText = 'Изменить'; const fullEditLink = document.querySelector(`#${element.id}_menu a[href*='do=edit_post']`) || element; actionUrl = fullEditLink.href; actionOnClick = null; }
                 else if (text === 'ЖАЛОБА') { actionText = 'Жалоба'; actionUrl = href; actionOnClick = null; }
                 else if (text === 'ХОРОШО' || (onclick && onclick.includes('ka_vote') && onclick.includes('1'))) { actionText = 'Хорошо!'; actionUrl = '#'; actionOnClick = onclick ? onclick.replace(/"/g, "'") : null; }
                 else if (!actionText) { actionText = element.title || '?'; }

                 // Добавляем
                 if (actionText !== '?') { data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick }); }
             });

            return data;

        } catch (error) { console.error(`[${logScopePrefix}] ❌ CRITICAL error during extraction:`, error); if (error.stack) console.error(error.stack); return null; }
    }

    /**
     * ========================================================================
     * ИНИЦИАЛИЗАЦИЯ И ЗАМЕНА ПОСТОВ (Main Logic) v1.3 - Без изменений
     * ========================================================================
     */
    function initModernPosts() {
        console.log(`${LOG_PREFIX} initModernPosts running...`);
        const pinnedPostSelector = '#topic-pin-content > table.ipbtable[data-post]';
        const allPostTables = document.querySelectorAll('table.ipbtable[data-post]');
        const pinnedPostElement = document.querySelector(pinnedPostSelector);
        let originalPosts = Array.from(allPostTables);
        if (pinnedPostElement) { originalPosts = originalPosts.filter(el => el !== pinnedPostElement); originalPosts.unshift(pinnedPostElement); }
        console.log(`${LOG_PREFIX} Found ${originalPosts.length} original post tables to process.`);
        if (originalPosts.length === 0) return;

        const postsToReplace = [];
        originalPosts.forEach((originalPostTable, index) => {
            const postData = extractPostData(originalPostTable);
            if (postData) {
                const newPostHtml = createPostHtml(postData);
                const tempContainer = document.createElement('div'); tempContainer.innerHTML = newPostHtml;
                const newPostElement = tempContainer.firstElementChild;
                if (newPostElement) postsToReplace.push({ original: originalPostTable, new: newPostElement });
                else { console.error(`${LOG_PREFIX} Failed to create new post element for ID: ${postData.postId}`); originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; }
            } else { console.warn(`${LOG_PREFIX} Failed to extract data for post table ${index + 1} (ID: ${originalPostTable.dataset.post}), skipping replacement.`); originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; }
        });

        console.log(`${LOG_PREFIX} Replacing ${postsToReplace.length} posts...`);
        postsToReplace.forEach(pair => { if (pair.original.parentNode) pair.original.replaceWith(pair.new); else console.warn(`${LOG_PREFIX} Original post table ID ${pair.original.dataset.post} has no parentNode.`); });
        console.log(`${LOG_PREFIX} Replacement finished.`);

        addEventListeners();
    }

    /**
     * ========================================================================
     * ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ (Event Listeners) v1.3 - Исправлено закрытие
     * ========================================================================
     */
    const listenerState = { added: false };

    function addEventListeners() {
        const postsContainer = document.body;
        if (listenerState.added) return;
        // Используем 'mousedown' вместо 'click' для закрытия меню,
        // так как он срабатывает раньше и может помочь избежать конфликтов.
        postsContainer.addEventListener('mousedown', handleDelegatedInteraction); // ИЗМЕНЕНО НА MOUSEDOWN
        listenerState.added = true;
        console.log(`${LOG_PREFIX} Added delegated Mousedown listener to body.`);
    }

    /** Универсальный обработчик Mousedown (делегированный) v1.3 */
    function handleDelegatedInteraction(event) {
        const target = event.target;
        let consumed = false; // Флаг, что событие обработано элементом управления

        // Определяем клик на триггерах или внутри меню
        const isActionTrigger = target.closest('.mp-actions-trigger');
        const isNickLink = target.closest('.mp-author-nick');
        const isInsideActionMenu = target.closest('.mp-actions-menu');
        const isInsideUserMenu = target.closest('.mp-user-menu');
        const isSpoilerHead = target.closest('.mp-body .sp-head');

        // --- Переключение меню ---
        if (isActionTrigger) {
            event.stopPropagation(); // Остановить всплытие, чтобы body не закрыл меню
            const menu = isActionTrigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
            toggleMenu(menu, isActionTrigger);
            consumed = true;
        } else if (isNickLink) {
            event.preventDefault(); event.stopPropagation(); // Остановить всплытие и переход
            const detailsContainer = isNickLink.closest('.mp-author-details');
            if (!detailsContainer) return;
            let userMenu = detailsContainer.querySelector('.mp-user-menu');
            if (!userMenu) { // Создать если нет
                 const postElement = isNickLink.closest('.mp-post');
                 if (postElement) userMenu = createUserMenu(postElement);
                 if (userMenu) detailsContainer.appendChild(userMenu);
                 else { console.error(`${LOG_PREFIX} Failed to create user menu on demand.`); return; }
            }
            toggleMenu(userMenu, isNickLink);
            consumed = true;
        }

        // --- Обработка кликов внутри меню ---
        else if (isInsideUserMenu || isInsideActionMenu) {
             // Специальная обработка для кнопки "+" репутации
             const repPlusButton = target.closest('.mp-user-menu .rep-plus');
             if (repPlusButton) {
                 handleRepPlusClick(event, repPlusButton); // Обрабатываем клик
                 consumed = true; // Считаем событие обработанным, чтобы не закрыть меню
             } else {
                  // Для других кликов внутри меню (например, по ссылкам) - просто останавливаем всплытие, чтобы не закрыть меню
                  event.stopPropagation();
                  consumed = true; // Считаем обработанным
                  // Закрываем меню ТОЛЬКО после перехода по ссылке (если это ссылка)
                  if (target.tagName === 'A' && target.href && !target.onclick) { // Если это обычная ссылка
                        setTimeout(closeAllMenus, 100); // Небольшая задержка для перехода
                  }
             }
        }

        // --- Переключение спойлера ---
        else if (isSpoilerHead) {
            handleSpoilerToggle(isSpoilerHead);
            // Не устанавливаем consumed = true, чтобы клик по спойлеру закрывал меню
        }


        // --- Закрытие меню при клике вне ---
        // Срабатывает, только если событие не было 'consumed' выше
        if (!consumed) {
            // console.log(`${LOG_PREFIX} Mousedown outside interactive elements detected, closing all menus.`);
            closeAllMenus();
        }
    }

    // --- Функции открытия/закрытия/позиционирования меню (v1.3) ---
    function toggleMenu(menuElement, triggerElement) {
        if (!menuElement || !triggerElement) return;
        const isActive = menuElement.classList.contains('visible');
        // Закрываем все *другие* меню
        closeAllOtherMenus(menuElement);
        // Переключаем текущее
        if (isActive) {
            closeMenu(menuElement);
        } else {
            openMenu(menuElement, triggerElement);
        }
    }

    function openMenu(menuElement, triggerElement) {
        if (!menuElement || !triggerElement) return;
        menuElement.classList.add('visible'); // Сначала добавляем класс
        positionMenu(triggerElement, menuElement); // Потом позиционируем
        // console.log(`${LOG_PREFIX} Opened menu:`, menuElement);
    }

    function closeMenu(menuElement) {
        if (!menuElement) return;
        menuElement.classList.remove('visible');
        // console.log(`${LOG_PREFIX} Closed menu:`, menuElement);
    }

    function closeAllMenus() {
        document.querySelectorAll('.mp-actions-menu.visible, .mp-user-menu.visible').forEach(closeMenu);
        // console.log(`${LOG_PREFIX} Closed ALL menus.`);
    }
    // Вспомогательная функция для закрытия всех меню, КРОМЕ указанного
    function closeAllOtherMenus(excludeMenu = null) {
         document.querySelectorAll('.mp-actions-menu.visible, .mp-user-menu.visible').forEach(menu => {
             if (menu !== excludeMenu) {
                 closeMenu(menu);
             }
         });
    }

    // Улучшенная функция позиционирования
    function positionMenu(triggerElement, menuElement) {
        if (!menuElement || !triggerElement) return;
        menuElement.style.position = 'fixed'; // Используем fixed для позиционирования относительно viewport
        menuElement.style.display = 'block'; // Для расчета размеров

        const triggerRect = triggerElement.getBoundingClientRect();
        const menuRect = menuElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top = triggerRect.bottom + 2;
        let left = triggerRect.left;

        // Проверка выхода за нижний край
        if (top + menuRect.height > viewportHeight - 5) {
            let topAbove = triggerRect.top - menuRect.height - 2;
            // Размещаем сверху, только если оно не уходит выше верха экрана
            if (topAbove > 5) {
                top = topAbove;
            } // Иначе оставляем снизу (лучше обрезать, чем над шапкой)
        }

        // Проверка выхода за правый край
         if (left + menuRect.width > viewportWidth - 5) {
             left = triggerRect.right - menuRect.width; // Выровнять по правому краю триггера
         }

         // Проверка выхода за левый край
         left = Math.max(5, left); // Не даем уйти левее 5px от края экрана

         // Применяем координаты fixed
         menuElement.style.top = `${top}px`;
         menuElement.style.left = `${left}px`;
         menuElement.style.right = 'auto'; // Сбрасываем right
         menuElement.style.bottom = 'auto'; // Сбрасываем bottom

        // console.log(`${LOG_PREFIX} Positioned menu FIXED at top: ${top}px, left: ${left}px`);
    }

    // --- Остальные обработчики (v1.3 - добавлена отладка спойлера) ---
    function handleSpoilerToggle(header) {
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody?.classList.contains('sp-body')) {
            const isOpen = header.classList.toggle('open'); // Меняем класс на ШАПКЕ
            spoilerBody.classList.toggle('open', isOpen); // Синхронизируем класс на теле
             console.log(`${LOG_PREFIX} Spoiler toggled. Header has open class: ${header.classList.contains('open')}`);
        }
    }

    function handleRepPlusClick(event, button) {
         event.preventDefault(); event.stopPropagation();
         const url = button.href;
         if (url && url !== '#') {
             const authorId = button.closest('.mp-post')?.dataset?.authorId || Math.random();
             window.open(url, `rep_${authorId}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         } else { console.warn(`${LOG_PREFIX} Invalid URL for rep plus button:`, button); }
         closeAllMenus(); // Закрываем меню после клика
     }

    /** Создает DOM элемент меню пользователя v1.3 */
    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId; const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#'; const authorNick = nickElement?.textContent.trim() || '';
        let reputation = '0', repHistoryUrl = '#', repPlusUrl = '#';
        const originalPostTable = document.querySelector(`table.ipbtable[data-post="${postElement.dataset.postId}"]`);
        if (originalPostTable && authorId) {
            const repContainer = originalPostTable.querySelector(`span[data-member-rep="${authorId}"]`)?.closest('center') || originalPostTable.querySelector(`#pb-${postId}-r2 td[class^="post"]:first-child`);
            if(repContainer){
                const repValueSpan = repContainer.querySelector(`span[data-member-rep="${authorId}"]`); if (repValueSpan) reputation = repValueSpan.textContent?.trim() || '0';
                const repHistoryLink = repContainer.querySelector(`a[href*="act=rep&view=history&mid=${authorId}"]`); if (repHistoryLink) repHistoryUrl = repHistoryLink.href;
                const repPlusAnchor = repContainer.querySelector(`a[onclick*="rep_change_window_open"][title*="Поднять репутацию"]`); // Используем селектор из карты
                if (repPlusAnchor) repPlusUrl = repPlusAnchor.href;
            }
        } else { const repElement = postElement.querySelector('.mp-rep'); if(repElement) reputation = repElement.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0'; }
        if (!authorId) { console.error(`${LOG_PREFIX} Create User Menu: Author ID missing.`); return null; }
        const menu = document.createElement('ul'); menu.className = 'mp-user-menu';
        menu.innerHTML = `<li><a href="${profileUrl}" target="_blank">Профиль</a></li><li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li><li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li><hr><li class="rep-item"><span class="rep-value"><a href="${repHistoryUrl}" title="История репутации" target="_blank">⭐ ${reputation}</a></span>${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}</li>`;
        return menu;
     }

    /** Закрывает все меню - обертка */
    function closeAllMenusOnClickOutside() { closeAllMenus(); }

    /**
     * ========================================================================
     * ТОЧКА ВХОДА (Initialization) v1.3 - Без изменений
     * ========================================================================
     */
    try {
        if (document.readyState === 'interactive' || document.readyState === 'complete') { initModernPosts(); }
        else { document.addEventListener('DOMContentLoaded', initModernPosts, { once: true }); }
    } catch (error) { console.error(`${LOG_PREFIX} Critical error during initialization setup:`, error); if (error.stack) console.error(error.stack); }

})(); // Конец основной IIFE