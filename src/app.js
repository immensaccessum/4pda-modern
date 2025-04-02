(function() {
    'use strict';

    const SCRIPT_NAME = '4pda Modern Theme App';
    const SCRIPT_VERSION = '1.2'; // Версия с исправлениями меню и позиционирования
    const LOG_PREFIX = `[${SCRIPT_NAME} v${SCRIPT_VERSION}]`;

    console.log(`${LOG_PREFIX} Script starting...`);

    /**
     * ========================================================================
     * ШАБЛОН НОВОГО ПОСТА (HTML Generation) v1.2
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
                   <div class="mp-actions-menu-container" style="position: relative;"> <!-- Relative для позиционирования меню -->
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
     * ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ ОРИГИНАЛЬНОЙ СТРАНИЦЫ (Data Extraction) v1.2
     * ========================================================================
     */
     function extractPostData(originalPostTable) {
        const postId = originalPostTable.dataset.post; if (!postId) return null;
        const logScopePrefix = `Post ${postId} Extract`;
        const data = { postId, authorNick: '?', authorId: null, authorProfileUrl: '#', authorPmUrl: '#', avatarUrl: null, authorStatus: '', authorGroup: '', reputation: '0', repHistoryUrl: '#', repPlusUrl: '#', ipAddress: '', postNumber: '?', postBodyHtml: '<p>Контент не найден</p>', creationDate: '', isEdited: false, editClass: '', editTooltip: '', editReason: '', actions: [], canModerate: false };

        try {
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td[class^="post"]:first-child`);
            const metaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3`);
            const leftButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:first-child');
            const rightButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:last-child');
            if (!userInfoCell || !metaCell || !postBodyCell || !buttonsRow || !leftButtonsCell || !rightButtonsCell) { console.error(`[${logScopePrefix}] ❌ CRITICAL: Essential cells missing!`); return null; }

            // Автор и ID
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            if (nickLink) {
                data.authorNick = nickLink.textContent?.trim() || '?'; data.authorProfileUrl = nickLink.href || '#';
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/); if (userIdMatch) data.authorId = userIdMatch[1];
                const userMenuContainer = document.getElementById(`post-member-${postId}_menu`);
                const pmLink = userMenuContainer?.querySelector('a[href*="act=qms&mid="]'); if (pmLink) data.authorPmUrl = pmLink.href;
                else if (data.authorId) { const qmsButton = rightButtonsCell.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`); if (qmsButton) data.authorPmUrl = qmsButton.href; }
            }

            // Информация о пользователе
            const avatarImg = userInfoCell.querySelector('.user-avatar img'); if (avatarImg) data.avatarUrl = avatarImg.src;
            const statusElem = userInfoCell.querySelector('.mem-title'); if (statusElem) data.authorStatus = statusElem.textContent?.trim() || '';
            const groupTextNode = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.includes('Группа:')); const groupSpan = groupTextNode?.nextElementSibling; if (groupSpan?.tagName === 'SPAN') data.authorGroup = groupSpan.textContent?.trim() || '';
            const repValueSpan = userInfoCell.querySelector('span[data-member-rep]'); if (repValueSpan) data.reputation = repValueSpan.textContent?.trim() || '0';
            if (data.authorId) {
                const repHistoryLink = userInfoCell.querySelector(`a[href*="act=rep&view=history&mid=${data.authorId}"]`); if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
                const repPlusAnchor = userInfoCell.querySelector(`a[href*="act=rep&do=plus&mid=${data.authorId}"]`);
                if (repPlusAnchor) { data.repPlusUrl = repPlusAnchor.href; console.log(`[${logScopePrefix}] Rep Plus URL found: ${data.repPlusUrl}`); } else { console.log(`[${logScopePrefix}] Rep Plus URL NOT found for mid=${data.authorId}.`); } // Логируем находку/отсутствие
            }
            const ipLink = userInfoCell.querySelector('.post-field-ip a'); if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent?.trim() || '';

            // Метаданные поста
            const postNumLink = metaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]'); if (postNumLink) data.postNumber = postNumLink.textContent?.trim().replace('#','') || '?';
            const dateNode = Array.from(metaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/) && !node.parentElement?.closest('a')); if (dateNode) data.creationDate = dateNode.textContent?.trim() || '';
            if (metaCell.querySelector('label.secheck input[name="selectedpids[]"]')) data.canModerate = true;

            // Тело поста и редактирование
            const postBodyDiv = postBodyCell.querySelector(`div.postcolor[id="post-${postId}"]`);
            if (postBodyDiv) {
                const clonedContent = postBodyDiv.cloneNode(true);
                const editSpan = clonedContent.querySelector('span.edit');
                if (editSpan) { data.isEdited = true; data.editTooltip = editSpan.textContent?.trim() || ''; const editLink = editSpan.querySelector('a'); data.editClass = (editLink && data.authorId && editLink.href.includes(`showuser=${data.authorId}`)) ? 'edited-by-self' : 'edited-by-other'; editSpan.remove(); }
                const signatureDiv = clonedContent.querySelector('div.signature'); if(signatureDiv) signatureDiv.remove();
                data.postBodyHtml = clonedContent.innerHTML;
            }
            const editReasonDiv = postBodyCell.querySelector(`div.post-edit-reason`); if (editReasonDiv) data.editReason = editReasonDiv.textContent?.trim() || '';

            // Кнопки действий (Финальная фильтрация)
            const rawActions = [];
            rightButtonsCell.querySelectorAll('a.g-btn').forEach(button => rawActions.push({ element: button, text: button.textContent?.trim(), onclick: button.getAttribute('onclick'), href: button.href || '#' }));
            const reportButton = leftButtonsCell.querySelector('a.g-btn[href*="act=report&t="]'); if(reportButton) rawActions.push({ element: reportButton, text: 'ЖАЛОБА', onclick: null, href: reportButton.href });

             rawActions.forEach(action => {
                 const { element, text, onclick, href } = action;
                 let actionText = text; let actionUrl = href; let actionOnClick = onclick ? onclick.replace(/"/g, "'") : null;

                 // Пропуск ненужных (включая "В ШАПКУ" по ID атрибута)
                 if (text === 'ИМЯ' || element.hasAttribute('data-to-pinpost-id') || element.classList.contains('pinlink') || (onclick && (onclick.includes('--seMODhide') || onclick.includes('--seMODdel')))) return;
                 if (text === 'ПЛОХО' || (onclick && onclick.includes('ka_vote') && onclick.includes('-1'))) return;
                 if (element.getAttribute('data-rel') === 'lyteframe') return; // Пропуск FAQ

                 // Обработка известных
                 if (element.matches('[data-quote-link]')) {
                    // Пока не добавляем цитирование
                     return;
                 } else if (element.id && element.id.startsWith('edit-but-')) {
                     actionText = 'Изменить'; const fullEditLink = document.querySelector(`#${element.id}_menu a[href*='do=edit_post']`) || element; actionUrl = fullEditLink.href; actionOnClick = null;
                 } else if (text === 'ЖАЛОБА') {
                     actionText = 'Жалоба'; actionUrl = href; actionOnClick = null;
                 } else if (text === 'ХОРОШО' || (onclick && onclick.includes('ka_vote') && onclick.includes('1'))) {
                      actionText = 'Хорошо!'; actionUrl = '#'; actionOnClick = onclick ? onclick.replace(/"/g, "'") : null;
                 } else if (!actionText) {
                     actionText = element.title || '?';
                 } else if (actionText === 'В ШАПКУУЖЕ В ШАПКЕ') { // Доп. проверка для слитного текста
                     return;
                 }

                 // Добавляем только если есть текст и ссылка/onclick
                 if (actionText !== '?' && (actionUrl !== '#' || actionOnClick)) {
                    data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick });
                 }
             });
            // console.log(`[${logScopePrefix}] Final actions:`, data.actions.map(a=>a.text)); // Отладка

            return data;

        } catch (error) {
            console.error(`[${logScopePrefix}] ❌ CRITICAL error during extraction:`, error); if (error.stack) console.error(error.stack); return null;
        }
    }

    /**
     * ========================================================================
     * ИНИЦИАЛИЗАЦИЯ И ЗАМЕНА ПОСТОВ (Main Logic) v1.2
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
     * ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ (Event Listeners) v1.2
     * ========================================================================
     */
    const listenerState = { added: false }; // Состояние, чтобы не добавлять листенер много раз

    function addEventListeners() {
        const postsContainer = document.body;
        if (listenerState.added) { /*console.log(`${LOG_PREFIX} Delegated listener already added.`);*/ return; } // Тихо выходим, если уже добавлен

        postsContainer.addEventListener('click', handleDelegatedClick);
        listenerState.added = true;
        console.log(`${LOG_PREFIX} Added delegated event listener to body.`);
    }

    /** Универсальный обработчик кликов (делегированный) v1.2 */
    function handleDelegatedClick(event) {
        const target = event.target;
        let consumed = false;

        // --- Определяем, какое меню активно (если есть) ---
        const activeActionMenu = document.querySelector('.mp-actions-menu.visible');
        const activeUserMenu = document.querySelector('.mp-user-menu.visible');

        // --- Клик на триггер меню действий (⋮) ---
        const actionTrigger = target.closest('.mp-actions-trigger');
        if (actionTrigger) {
            event.stopPropagation(); // Остановить всплытие, чтобы не закрыть сразу
            const menu = actionTrigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
            if (!menu) return;
            if (activeActionMenu === menu) { // Клик на триггер уже открытого меню
                closeMenu(menu);
            } else { // Клик на триггер другого или закрытого меню
                closeAllMenus(); // Закрыть все остальные
                openMenu(menu, actionTrigger);
            }
            consumed = true;
        }

        // --- Клик на ник пользователя ---
        const nickLink = target.closest('.mp-author-nick');
        if (nickLink && !consumed) {
            event.preventDefault(); event.stopPropagation(); // Остановить всплытие и переход по ссылке
            const detailsContainer = nickLink.closest('.mp-author-details');
            if (!detailsContainer) return;
            let userMenu = detailsContainer.querySelector('.mp-user-menu');
            // Создаем меню, если его нет
            if (!userMenu) {
                 const postElement = nickLink.closest('.mp-post');
                 if (postElement) {
                     userMenu = createUserMenu(postElement);
                     if (userMenu) detailsContainer.appendChild(userMenu);
                     else { console.error(`${LOG_PREFIX} Failed to create user menu.`); return; }
                 } else { console.error(`${LOG_PREFIX} Failed to find parent post element for nick.`); return;}
            }
            // Переключаем видимость
            if (activeUserMenu === userMenu) { // Клик на ник уже открытого меню
                closeMenu(userMenu);
            } else { // Клик на ник другого или закрытого меню
                closeAllMenus(); // Закрыть все остальные
                openMenu(userMenu, nickLink);
            }
            consumed = true;
        }

        // --- Клик на шапку спойлера ---
        const spoilerHead = target.closest('.mp-body .sp-head');
        if (spoilerHead && !consumed) {
            handleSpoilerToggle(spoilerHead); // Передаем только шапку
            // Не устанавливаем consumed = true, чтобы клик по спойлеру мог закрыть меню
        }

        // --- Клик на кнопку "+" репутации в меню пользователя ---
         const repPlusButton = target.closest('.mp-user-menu .rep-plus');
         if (repPlusButton && !consumed) {
             handleRepPlusClick(event, repPlusButton); // Передаем событие для preventDefault
             consumed = true; // Считаем обработанным, чтобы не закрыть меню сразу
         }

        // --- Закрытие меню при клике вне ---
        if (!consumed && !target.closest('.mp-actions-menu, .mp-user-menu')) {
            // console.log(`${LOG_PREFIX} Click outside detected, closing all menus.`);
            closeAllMenus();
        }
        // Клик внутри меню (но не на активном элементе) - просто останавливаем всплытие
        else if (!consumed && target.closest('.mp-actions-menu, .mp-user-menu')) {
             event.stopPropagation();
        }
    }

    // --- Функции открытия/закрытия/позиционирования меню ---
    function openMenu(menuElement, triggerElement) {
        if (!menuElement || !triggerElement) return;
        positionMenu(triggerElement, menuElement); // Позиционируем перед показом
        menuElement.classList.add('visible');
        // console.log(`${LOG_PREFIX} Opened menu:`, menuElement.classList);
    }

    function closeMenu(menuElement) {
        if (!menuElement) return;
        menuElement.classList.remove('visible');
        // console.log(`${LOG_PREFIX} Closed menu:`, menuElement.classList);
    }

    function closeAllMenus() {
        document.querySelectorAll('.mp-actions-menu.visible, .mp-user-menu.visible').forEach(closeMenu);
    }

    function positionMenu(triggerElement, menuElement) {
        if (!menuElement || !triggerElement) return;
        // Простые относительные координаты
        menuElement.style.position = 'absolute';
        menuElement.style.display = 'block'; // Для расчета размеров (хотя управляется .visible)

        if (menuElement.classList.contains('mp-actions-menu')) {
            menuElement.style.top = 'calc(100% + 4px)'; // Снизу триггера
            menuElement.style.left = 'auto'; // Сбрасываем left
            menuElement.style.right = '0'; // По правому краю контейнера
        } else if (menuElement.classList.contains('mp-user-menu')) {
            menuElement.style.top = 'calc(100% + 4px)'; // Снизу ника
            menuElement.style.left = '0'; // По левому краю контейнера
            menuElement.style.right = 'auto'; // Сбрасываем right
        }
        // Сбрасываем bottom на всякий случай
        menuElement.style.bottom = 'auto';

        // --- Проверка выхода за экран (упрощенная) ---
        // После установки базовых top/left/right даем браузеру отрисовать
        requestAnimationFrame(() => {
            const menuRect = menuElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

             // Проверка по горизонтали
             if (menuRect.right > viewportWidth - 5) { // Вылезло вправо
                 menuElement.style.left = 'auto';
                 menuElement.style.right = '0px'; // Прижать к правому краю родителя (если меню действий)
                 // Если это меню юзера, может быть лучше прижать к правому краю триггера?
                  if(menuElement.classList.contains('mp-user-menu')) {
                     const triggerRect = triggerElement.getBoundingClientRect();
                     menuElement.style.left = `${triggerRect.width - menuRect.width}px`; // Выровнять правый край меню с правым краем ника
                  }
             }
            if (menuRect.left < 5) { // Вылезло влево
                menuElement.style.left = '0px'; // Прижать к левому краю родителя
                menuElement.style.right = 'auto';
            }
             // Проверка по вертикали (только если вылазит снизу, пробуем открыть вверх)
             if (menuRect.bottom > viewportHeight - 5 && menuRect.top > menuRect.height) { // Если вылезло снизу и есть место сверху
                 menuElement.style.top = `-${menuRect.height + 4}px`; // Над триггером
             }
             // console.log(`${LOG_PREFIX} Position after adjustment: T=${menuElement.style.top}, L=${menuElement.style.left}, R=${menuElement.style.right}`);
        });


    }

    // --- Остальные обработчики ---
    function handleSpoilerToggle(header) {
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody?.classList.contains('sp-body')) {
            const isOpen = header.classList.toggle('open'); // Меняем класс на ШАПКЕ
            // JS управление display для совместимости (хотя должно работать через CSS)
             spoilerBody.style.display = isOpen ? 'block' : 'none';
             // console.log(`${LOG_PREFIX} Spoiler toggled. Header has open class: ${isOpen}`);
        }
    }

    function handleRepPlusClick(event, button) {
         event.preventDefault(); event.stopPropagation();
         const url = button.href;
         if (url && url !== '#') {
             const authorId = button.closest('.mp-post')?.dataset?.authorId || Math.random();
             window.open(url, `rep_${authorId}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         }
         closeAllMenus();
     }

    /** Создает DOM элемент меню пользователя v1.2 */
    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId; const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#'; const authorNick = nickElement?.textContent.trim() || '';
        let reputation = '0', repHistoryUrl = '#', repPlusUrl = '#';
        const originalPostTable = document.querySelector(`table.ipbtable[data-post="${postElement.dataset.postId}"]`);
        if (originalPostTable && authorId) {
            const repValueSpan = originalPostTable.querySelector(`span[data-member-rep="${authorId}"]`); if (repValueSpan) reputation = repValueSpan.textContent?.trim() || '0';
            const repHistoryLink = originalPostTable.querySelector(`a[href*="act=rep&view=history&mid=${authorId}"]`); if (repHistoryLink) repHistoryUrl = repHistoryLink.href;
            const repPlusAnchor = originalPostTable.querySelector(`a[href*="act=rep&do=plus&mid=${authorId}"]`); if (repPlusAnchor) repPlusUrl = repPlusAnchor.href;
        } else { const repElement = postElement.querySelector('.mp-rep'); if(repElement) reputation = repElement.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0'; }
        if (!authorId) { console.error(`${LOG_PREFIX} Create User Menu: Author ID missing.`); return null; }
        const menu = document.createElement('ul'); menu.className = 'mp-user-menu';
        menu.innerHTML = `<li><a href="${profileUrl}" target="_blank">Профиль</a></li><li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li><li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li><hr><li class="rep-item"><span class="rep-value"><a href="${repHistoryUrl}" title="История репутации" target="_blank">⭐ ${reputation}</a></span>${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}</li>`;
        return menu;
     }

    /** Закрывает все меню */
    function closeAllMenusOnClickOutside() { closeAllMenus(); }

    /**
     * ========================================================================
     * ТОЧКА ВХОДА (Initialization) v1.2
     * ========================================================================
     */
    try {
        if (document.readyState === 'interactive' || document.readyState === 'complete') { initModernPosts(); }
        else { document.addEventListener('DOMContentLoaded', initModernPosts, { once: true }); }
    } catch (error) { console.error(`${LOG_PREFIX} Critical error during initialization setup:`, error); if (error.stack) console.error(error.stack); }

})(); // Конец основной IIFE