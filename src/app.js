(function() {
    'use strict';

    const SCRIPT_NAME = '4pda Modern Theme App';
    const SCRIPT_VERSION = '1.1'; // Версия с исправлениями
    const LOG_PREFIX = `[${SCRIPT_NAME} v${SCRIPT_VERSION}]`;

    console.log(`${LOG_PREFIX} Script starting...`);

    /**
     * ========================================================================
     * ШАБЛОН НОВОГО ПОСТА (HTML Generation) v1.1
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
                   <div class="mp-actions-menu-container">
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
     * ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ ОРИГИНАЛЬНОЙ СТРАНИЦЫ (Data Extraction) v1.1
     * ========================================================================
     */
     function extractPostData(originalPostTable) {
        const postId = originalPostTable.dataset.post;
        if (!postId) { console.warn(`${LOG_PREFIX} Post table found without data-post attribute:`, originalPostTable); return null; }
        const logScopePrefix = `Post ${postId} Extract`;
        // console.log(`--- [${logScopePrefix}] Starting extraction ---`); // Уменьшаем логирование

        const data = {
            postId: postId, authorNick: '?', authorId: null, authorProfileUrl: '#', authorPmUrl: '#',
            avatarUrl: null, authorStatus: '', authorGroup: '', reputation: '0',
            repHistoryUrl: '#', repPlusUrl: '#', ipAddress: '', postNumber: '?', postBodyHtml: '<p>Не удалось извлечь содержимое поста.</p>',
            creationDate: '', isEdited: false, editClass: '', editTooltip: '', editReason: '', actions: [], canModerate: false,
         };

        try {
            // Основные контейнеры
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td[class^="post"]:first-child`);
            const metaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3`);
            const leftButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:first-child');
            const rightButtonsCell = buttonsRow?.querySelector('td.formbuttonrow:last-child');

            if (!userInfoCell || !metaCell || !postBodyCell || !buttonsRow || !leftButtonsCell || !rightButtonsCell) {
                console.error(`[${logScopePrefix}] ❌ CRITICAL: Essential cells not found!`); return null;
            }

            // Автор и ID
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            if (nickLink) {
                data.authorNick = nickLink.textContent?.trim() || '?';
                data.authorProfileUrl = nickLink.href || '#';
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/);
                if (userIdMatch) data.authorId = userIdMatch[1];
                const userMenuContainer = document.getElementById(`post-member-${postId}_menu`);
                const pmLink = userMenuContainer?.querySelector('a[href*="act=qms&mid="]');
                if (pmLink) data.authorPmUrl = pmLink.href;
                else if (data.authorId) {
                    const qmsButton = rightButtonsCell.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`);
                    if (qmsButton) data.authorPmUrl = qmsButton.href;
                }
            }

            // Информация о пользователе
            const avatarImg = userInfoCell.querySelector('.user-avatar img'); if (avatarImg) data.avatarUrl = avatarImg.src;
            const statusElem = userInfoCell.querySelector('.mem-title'); if (statusElem) data.authorStatus = statusElem.textContent?.trim() || '';
            // ИСПРАВЛЕНО: Ищем span ПОСЛЕ текстового узла "Группа:"
            const groupTextNode = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.includes('Группа:'));
            const groupSpan = groupTextNode?.nextElementSibling; // Берем следующий элемент
            if (groupSpan && groupSpan.tagName === 'SPAN') data.authorGroup = groupSpan.textContent?.trim() || '';
            const repValueSpan = userInfoCell.querySelector('span[data-member-rep]'); if (repValueSpan) data.reputation = repValueSpan.textContent?.trim() || '0';
            if (data.authorId) { // Ищем ссылки репутации по ID
                const repHistoryLink = userInfoCell.querySelector(`a[href*="act=rep&view=history&mid=${data.authorId}"]`); if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
                const repPlusAnchor = userInfoCell.querySelector(`a[href*="act=rep&do=plus&mid=${data.authorId}"]`); if (repPlusAnchor) data.repPlusUrl = repPlusAnchor.href;
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
                if (editSpan) {
                    data.isEdited = true; data.editTooltip = editSpan.textContent?.trim() || '';
                    const editLink = editSpan.querySelector('a');
                    data.editClass = (editLink && data.authorId && editLink.href.includes(`showuser=${data.authorId}`)) ? 'edited-by-self' : 'edited-by-other';
                    editSpan.remove();
                }
                const signatureDiv = clonedContent.querySelector('div.signature'); if(signatureDiv) signatureDiv.remove();
                data.postBodyHtml = clonedContent.innerHTML;
            }
            const editReasonDiv = postBodyCell.querySelector(`div.post-edit-reason`); if (editReasonDiv) data.editReason = editReasonDiv.textContent?.trim() || '';

            // Кнопки действий (Фильтрация нежелательных)
            const rawActions = [];
            // Сначала правая ячейка
            rightButtonsCell.querySelectorAll('a.g-btn').forEach(button => {
                const btnText = button.textContent?.trim(); const btnOnClick = button.getAttribute('onclick'); const btnHref = button.href || '#';
                if (!btnText && !button.title) return;
                rawActions.push({ element: button, text: btnText, onclick: btnOnClick, href: btnHref });
            });
             // Потом левая ячейка (для Жалобы)
             const reportButton = leftButtonsCell.querySelector('a.g-btn[href*="act=report&t="]');
             if(reportButton) rawActions.push({ element: reportButton, text: 'ЖАЛОБА', onclick: null, href: reportButton.href });

             // Обработка и фильтрация
             rawActions.forEach(action => {
                 const { element, text, onclick, href } = action;
                 let actionText = text; let actionUrl = href; let actionOnClick = onclick ? onclick.replace(/"/g, "'") : null;

                 // Пропуск ненужных кнопок
                 if (text === 'ИМЯ' || text === 'В ШАПКУ' || text === 'УЖЕ В ШАПКЕ' || element.classList.contains('pinlink') || (onclick && (onclick.includes('--seMODhide') || onclick.includes('--seMODdel')))) return;
                 // Пропуск Karma "ПЛОХО"
                 if (text === 'ПЛОХО' || (onclick && onclick.includes('ka_vote') && onclick.includes('-1'))) return;
                 // Пропуск "Цитировать" (пока убрали)
                 // if (element.matches('[data-quote-link]')) return;

                 // Обработка известных кнопок
                 if (element.matches('[data-quote-link]')) {
                     actionText = 'Цитировать'; actionUrl = '#';
                     const onMouseOver = element.getAttribute('onmouseover');
                     actionOnClick = onMouseOver && onMouseOver.includes('copyQ') ? `${onMouseOver.replace('copyQ', 'window.copyQ').replace(/"/g, "'")} window.pasteQ(); return false;` : 'window.pasteQ(); return false;';
                     // ***** ПОКА НЕ ДОБАВЛЯЕМ ЦИТИРОВАНИЕ *****
                     return;
                 } else if (element.id && element.id.startsWith('edit-but-')) {
                     actionText = 'Изменить'; const fullEditLink = document.querySelector(`#${element.id}_menu a[href*='do=edit_post']`) || element; actionUrl = fullEditLink.href; actionOnClick = null;
                 } else if (text === 'ЖАЛОБА') {
                     actionText = 'Жалоба'; actionUrl = href; actionOnClick = null;
                 } else if (text === 'ХОРОШО' || (onclick && onclick.includes('ka_vote') && onclick.includes('1'))) { // Карма "ХОРОШО"
                      actionText = 'Хорошо!'; // Переименуем для ясности
                      actionUrl = '#'; // У кармы нет прямой ссылки
                      actionOnClick = onclick ? onclick.replace(/"/g, "'") : null; // Оставляем onclick
                 } else if (!actionText) { // Если текста нет, но есть title
                     actionText = element.title || '?';
                 } else if (actionText === 'В FAQ') { // Пропускаем FAQ
                     return;
                 }

                 // Добавляем в финальный список
                 data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick });
             });

            // console.log(`[${logScopePrefix}] Extraction successful.`); // Уменьшаем логирование
            return data;

        } catch (error) {
            console.error(`[${logScopePrefix}] ❌ CRITICAL error during extraction:`, error);
            if (error.stack) console.error(error.stack);
            return null;
        }
    }

    /**
     * ========================================================================
     * ИНИЦИАЛИЗАЦИЯ И ЗАМЕНА ПОСТОВ (Main Logic) v1.1
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
     * ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ (Event Listeners) v1.1
     * ========================================================================
     */
    const listenerState = { added: false }; // Состояние, чтобы не добавлять листенер много раз

    function addEventListeners() {
        const postsContainer = document.body;
        if (listenerState.added) { console.log(`${LOG_PREFIX} Delegated listener already added.`); return; } // Не добавлять повторно

        postsContainer.addEventListener('click', handleDelegatedClick);
        listenerState.added = true;
        console.log(`${LOG_PREFIX} Added delegated event listener to body.`);
    }

    function handleDelegatedClick(event) {
        const target = event.target;
        let consumed = false; // Флаг, что событие обработано

        // --- Обработка разных кликов ---
        const actionTrigger = target.closest('.mp-actions-trigger');
        if (actionTrigger) { handleActionMenuToggle(event, actionTrigger); consumed = true; }

        const nickLink = target.closest('.mp-author-nick');
        if (nickLink && !consumed) { handleUserMenuToggle(event, nickLink); consumed = true; }

        const spoilerHead = target.closest('.mp-body .sp-head');
        if (spoilerHead && !consumed) { handleSpoilerToggle(event, spoilerHead); consumed = true; }

        const repPlusButton = target.closest('.mp-user-menu .rep-plus');
        if (repPlusButton && !consumed) { handleRepPlusClick(event, repPlusButton); consumed = true; }

        // --- Закрытие меню при клике вне ---
        if (!consumed && !target.closest('.mp-actions-menu, .mp-user-menu')) {
            closeAllMenusOnClickOutside();
        } else if (!consumed && target.closest('.mp-actions-menu, .mp-user-menu')) {
            // Клик внутри меню, но не на активном элементе - останавливаем всплытие
            event.stopPropagation();
        }
    }

    /** Обработчик клика на триггер меню действий */
    function handleActionMenuToggle(event, trigger) {
        event.stopPropagation();
        const menu = trigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
        if (!menu) return;
        const isVisible = menu.classList.contains('visible');
        // Закрываем ВСЕ меню перед показом/скрытием
        closeAllMenusOnClickOutside();
        if (!isVisible) {
            menu.classList.add('visible');
            positionMenu(trigger, menu); // Пересчитываем позицию при открытии
            // console.log(`${LOG_PREFIX} Action menu opened.`);
        }
        // else { console.log(`${LOG_PREFIX} Action menu closed.`); } // Закрывается через closeAllMenusOnClickOutside
    }

    /** Обработчик клика на ник */
    function handleUserMenuToggle(event, nickLink) {
        event.preventDefault(); event.stopPropagation();
        const postElement = nickLink.closest('.mp-post');
        const detailsContainer = nickLink.closest('.mp-author-details');
        if (!postElement || !detailsContainer) return;

        let userMenu = detailsContainer.querySelector('.mp-user-menu');
        const isVisible = userMenu && userMenu.classList.contains('visible');
        // Закрываем ВСЕ меню перед показом/скрытием
        closeAllMenusOnClickOutside();

        if (!isVisible) {
            if (!userMenu) { // Создать если нет
                userMenu = createUserMenu(postElement);
                if (userMenu) detailsContainer.appendChild(userMenu);
                else { console.error(`${LOG_PREFIX} Failed to create user menu.`); return; }
            }
            positionMenu(nickLink, userMenu); // Позиционировать при открытии
            userMenu.classList.add('visible');
            // console.log(`${LOG_PREFIX} User menu opened.`);
        }
         // else { console.log(`${LOG_PREFIX} User menu closed.`); } // Закрывается через closeAllMenusOnClickOutside
    }

    /** Обработчик клика на шапку спойлера */
    function handleSpoilerToggle(event, header) {
        // Не останавливаем всплытие, чтобы сработал closeAllMenusOnClickOutside, если клик был вне меню
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody && spoilerBody.classList.contains('sp-body')) {
            const isOpen = spoilerBody.classList.toggle('open');
            header.classList.toggle('open', isOpen); // Важно! Добавляем класс к шапке
            // console.log(`${LOG_PREFIX} Spoiler toggled. Is open: ${isOpen}`);
        }
    }

     /** Обработчик клика на кнопку "+" репутации */
     function handleRepPlusClick(event, button) {
         event.preventDefault(); // Предотвращаем стандартное действие
         event.stopPropagation(); // Останавливаем всплытие внутри меню
         const url = button.href;
         if (url && url !== '#') {
             const authorId = button.closest('.mp-post')?.dataset?.authorId || Math.random();
             window.open(url, `rep_${authorId}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         } else {
             console.warn(`${LOG_PREFIX} Invalid URL for rep plus button:`, button);
         }
         closeAllMenusOnClickOutside(); // Закрыть все меню после клика
     }


    /** Создает DOM элемент меню пользователя v1.1 */
    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId;
        const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#';
        const authorNick = nickElement?.textContent.trim() || '';
        // --- Извлекаем данные репутации СНАЧАЛА из data-атрибутов, если есть, потом из оригинала ---
        // Предполагаем, что extractPostData сохранил их в data объекте, который был использован для создания элемента
        // Но лучше переизвлечь из оригинала для надежности, если он доступен
        let reputation = '0', repHistoryUrl = '#', repPlusUrl = '#';
        const originalPostTable = document.querySelector(`table.ipbtable[data-post="${postElement.dataset.postId}"]`);
        if (originalPostTable && authorId) {
            const repValueSpan = originalPostTable.querySelector(`span[data-member-rep="${authorId}"]`); // Ищем по ID для точности
            if (repValueSpan) reputation = repValueSpan.textContent?.trim() || '0';
            const repHistoryLink = originalPostTable.querySelector(`a[href*="act=rep&view=history&mid=${authorId}"]`);
            if (repHistoryLink) repHistoryUrl = repHistoryLink.href;
            const repPlusAnchor = originalPostTable.querySelector(`a[href*="act=rep&do=plus&mid=${authorId}"]`);
            if (repPlusAnchor) repPlusUrl = repPlusAnchor.href;
        } else {
            // Запасной вариант - из созданного .mp-rep (менее надежно для ссылок)
             const repElement = postElement.querySelector('.mp-rep');
             if(repElement) reputation = repElement.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0';
             console.warn(`${LOG_PREFIX} Create User Menu: Could not find original post table ID ${postElement.dataset.postId} for accurate rep URLs.`);
        }
        // ---------------------------------------------------------------------

        if (!authorId) { console.error(`${LOG_PREFIX} Create User Menu: Author ID missing.`); return null; }

        const menu = document.createElement('ul');
        menu.className = 'mp-user-menu';
        // Убрали "Найти темы"
        menu.innerHTML = `
            <li><a href="${profileUrl}" target="_blank">Профиль</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li>
            <hr>
            <li class="rep-item">
                <span class="rep-value"><a href="${repHistoryUrl}" title="История репутации" target="_blank">⭐ ${reputation}</a></span>
                ${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}
            </li>
        `;
        return menu;
     }


    /** Позиционирует меню относительно триггера v1.1 */
    function positionMenu(triggerElement, menuElement) {
        const triggerRect = triggerElement.getBoundingClientRect();
        const menuRect = menuElement.getBoundingClientRect(); // Размеры меню ПОСЛЕ display: block
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        menuElement.style.position = 'absolute'; // Перенесено для консистентности
        menuElement.style.display = 'block'; // Уже должно быть block для расчета rect

        let top = triggerRect.bottom + window.scrollY + 2;
        let left = triggerRect.left + window.scrollX;

        // Проверка выхода за нижний край
        if (triggerRect.bottom + menuRect.height + 2 > viewportHeight) {
            // Пытаемся разместить сверху
             let topAbove = triggerRect.top + window.scrollY - menuRect.height - 2;
             if (topAbove > window.scrollY) { // Если верхний край выше начала видимой области
                 top = topAbove;
             } // Иначе оставляем снизу (может обрезаться, но это лучше чем над шапкой сайта)
        }

         // Проверка выхода за правый край
         if (triggerRect.left + menuRect.width > viewportWidth) {
              left = triggerRect.right + window.scrollX - menuRect.width; // Выровнять по правому краю триггера
              // Доп. проверка: не ушло ли левее края экрана
              left = Math.max(window.scrollX + 5, left); // Оставляем 5px отступа слева
         } else {
             // Доп. проверка: не ушло ли левее края экрана при обычном позиционировании
             left = Math.max(window.scrollX + 5, left);
         }

         // Применяем абсолютные координаты
         menuElement.style.top = `${top}px`;
         menuElement.style.left = `${left}px`;

         // console.log(`${LOG_PREFIX} Positioned menu at top: ${top}px, left: ${left}px`);
    }

    /** Закрывает все меню */
    function closeAllMenusOnClickOutside() { closeAllActionMenus(); closeAllUserMenus(); }
    function closeAllActionMenus(excludeMenu = null) {
        document.querySelectorAll('.mp-actions-menu.visible').forEach(menu => {
            if (menu !== excludeMenu) menu.classList.remove('visible');
        });
    }
    function closeAllUserMenus(excludeMenu = null) {
         document.querySelectorAll('.mp-user-menu.visible').forEach(menu => {
             if (menu !== excludeMenu) menu.classList.remove('visible');
         });
     }

    /**
     * ========================================================================
     * ТОЧКА ВХОДА (Initialization) v1.1
     * ========================================================================
     */
    try {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            initModernPosts();
        } else {
            document.addEventListener('DOMContentLoaded', initModernPosts, { once: true });
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Critical error during initialization setup:`, error);
        if (error.stack) console.error(error.stack);
    }

})(); // Конец основной IIFE