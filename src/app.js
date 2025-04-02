(function() {
    'use strict';

    const SCRIPT_NAME = '4pda Modern Theme App';
    const SCRIPT_VERSION = '1.0'; // Начинаем с версии 1.0 :)
    const LOG_PREFIX = `[${SCRIPT_NAME} v${SCRIPT_VERSION}]`;

    console.log(`${LOG_PREFIX} Script starting...`);

    /**
     * ========================================================================
     * ШАБЛОН НОВОГО ПОСТА (HTML Generation)
     * ========================================================================
     */

    /**
     * Создает HTML-строку для одного поста на основе предоставленных данных.
     * @param {object} postData - Объект с данными поста, полученный из extractPostData.
     * @returns {string} HTML-строка нового поста.
     */
    function createPostHtml(postData) {
        // Простая SVG-заглушка: зеленый круг
        const defaultAvatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2328a745'/%3E%3C/svg%3E`;

        // Генерируем список действий для меню
        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');

        // Репутация в шапке (без ссылок, т.к. они в меню пользователя)
        const repHtml = `<span class="mp-rep" title="Репутация: ${postData.reputation}">⭐ ${postData.reputation}</span>`;

        return `
            <article class="mp-post" data-post-id="${postData.postId}" data-author-id="${postData.authorId}">
              <header class="mp-header">
                <div class="mp-author-info">
                  <img class="mp-avatar" src="${postData.avatarUrl || defaultAvatarSvg}" alt="Аватар ${postData.authorNick}" loading="lazy" onerror="this.src='${defaultAvatarSvg}'; this.onerror=null;">
                  <div class="mp-author-details" style="position: relative;"> <!-- Relative для позиционирования меню -->
                    <div class="mp-author-line1">
                       <a class="mp-author-nick" href="${postData.authorProfileUrl}" data-user-id="${postData.authorId}" title="Открыть меню пользователя">${postData.authorNick}</a>
                       ${repHtml}
                    </div>
                    <div class="mp-author-line2">
                       <span class="mp-author-status" title="Статус">${postData.authorStatus}</span>
                       ${postData.authorGroup ? ` | <span class="mp-author-group" title="Группа">${postData.authorGroup}</span>` : ''} <!-- Используем authorGroup -->
                    </div>
                    <!-- Меню пользователя будет вставлено сюда JS -->
                  </div>
                </div>
                <div class="mp-meta-actions">
                   <div class="mp-meta">
                      <!-- IP по умолчанию скрыт CSS -->
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
                  ${postData.editReason ? `<div class="mp-edit-reason" title="Причина редактирования">${postData.editReason}</div>` : ''} <!-- Показываем причину редактирования, если есть -->
              </footer>
            </article>
        `;
    }

    /**
     * ========================================================================
     * ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ ОРИГИНАЛЬНОЙ СТРАНИЦЫ (Data Extraction)
     * ========================================================================
     */

    /**
     * Извлекает данные из оригинального элемента поста (настольная версия).
     * Использует проверенные селекторы из "Карты Селекторов".
     * @param {Element} originalPostTable - Элемент <table> оригинального поста.
     * @returns {object|null} Объект с данными поста или null, если извлечь не удалось.
     */
     function extractPostData(originalPostTable) {
        const postId = originalPostTable.dataset.post;
        if (!postId) { console.warn(`${LOG_PREFIX} Post table found without data-post attribute:`, originalPostTable); return null; }

        const logScopePrefix = `Post ${postId} Extract`;
        console.log(`--- [${logScopePrefix}] Starting extraction ---`);

        const data = {
            postId: postId, authorNick: '?', authorId: null, authorProfileUrl: '#', authorPmUrl: '#',
            avatarUrl: null, authorStatus: '', authorGroup: '', /* Вместо Warnings */ reputation: '0',
            repHistoryUrl: '#', repPlusUrl: '#', ipAddress: '', postNumber: '?', postBodyHtml: '<p>Не удалось извлечь содержимое поста.</p>',
            creationDate: '', isEdited: false, editClass: '', editTooltip: '', editReason: '', /* Добавили причину */ actions: [], canModerate: false,
            // Доп. поля, которые пока не извлекаем, но могут понадобиться
            // device: '', onlineStatus: '', messagesCount: '', registrationDate: '', karmaValue: '0', karmaPlusUrl: '#', karmaMinusUrl: '#'
         };

        try {
            // --- Основные контейнеры ---
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td[class^="post"]:first-child`);
            const metaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3`);
            const leftButtonsCell = buttonsRow ? buttonsRow.querySelector('td.formbuttonrow:first-child') : null;
            const rightButtonsCell = buttonsRow ? buttonsRow.querySelector('td.formbuttonrow:last-child') : null;

            // Проверка критических контейнеров
            if (!userInfoCell || !metaCell || !postBodyCell || !buttonsRow || !leftButtonsCell || !rightButtonsCell) {
                console.error(`[${logScopePrefix}] ❌ CRITICAL: One or more essential cells not found! Cannot proceed.`);
                return null; // Не можем продолжить без основных ячеек
            }

            // --- Извлечение данных (с проверками) ---

            // Автор и ID
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            if (nickLink) {
                data.authorNick = nickLink.textContent?.trim() || '?';
                data.authorProfileUrl = nickLink.href || '#';
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/);
                if (userIdMatch) data.authorId = userIdMatch[1];
                // Пытаемся найти ссылку на QMS в скрытом меню
                const userMenuContainer = document.getElementById(`post-member-${postId}_menu`);
                const pmLink = userMenuContainer?.querySelector('a[href*="act=qms&mid="]');
                if (pmLink) data.authorPmUrl = pmLink.href;
                 // Если не нашли в меню, пробуем найти в кнопках (менее надежно)
                 else if (data.authorId) {
                     const qmsButton = rightButtonsCell.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`);
                     if (qmsButton) data.authorPmUrl = qmsButton.href;
                 }
            }

            // Информация о пользователе (левая колонка)
            const avatarImg = userInfoCell.querySelector('.user-avatar img');
            if (avatarImg) data.avatarUrl = avatarImg.src;
            const statusElem = userInfoCell.querySelector('.mem-title');
            if (statusElem) data.authorStatus = statusElem.textContent?.trim() || '';
            const groupElemTextNode = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.includes('Группа:'));
            if (groupElemTextNode) {
                const groupSpan = groupElemTextNode.nextElementSibling;
                if(groupSpan) data.authorGroup = groupSpan.textContent?.trim() || ''; // Сохраняем группу
            }
            const repValueSpan = userInfoCell.querySelector('span[data-member-rep]');
            if (repValueSpan) data.reputation = repValueSpan.textContent?.trim() || '0';
            const repHistoryLink = userInfoCell.querySelector(`a[href*="act=rep&view=history&mid=${data.authorId}"]`); // Используем ID для точности
            if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
            const repPlusAnchor = userInfoCell.querySelector(`a[href*="act=rep&do=plus&mid=${data.authorId}"]`); // Используем ID
            if (repPlusAnchor) data.repPlusUrl = repPlusAnchor.href;
            const ipLink = userInfoCell.querySelector('.post-field-ip a');
            if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent?.trim() || '';
            // TODO: Добавить извлечение device, onlineStatus, messagesCount, registrationDate, если решим их использовать

            // Метаданные поста (верхняя строка)
            const postNumLink = metaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]');
            if (postNumLink) data.postNumber = postNumLink.textContent?.trim().replace('#','') || '?';
            const dateNode = Array.from(metaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/) && !node.parentElement?.closest('a'));
            if (dateNode) data.creationDate = dateNode.textContent?.trim() || '';
            if (metaCell.querySelector('label.secheck input[name="selectedpids[]"]')) data.canModerate = true;

            // Тело поста и редактирование
            const postBodyDiv = postBodyCell.querySelector(`div.postcolor[id="post-${postId}"]`);
            if (postBodyDiv) {
                const clonedContent = postBodyDiv.cloneNode(true);
                const editSpan = clonedContent.querySelector('span.edit');
                if (editSpan) {
                    data.isEdited = true;
                    data.editTooltip = editSpan.textContent?.trim() || '';
                    const editLink = editSpan.querySelector('a');
                    if (editLink && data.authorId && editLink.href.includes(`showuser=${data.authorId}`)) {
                        data.editClass = 'edited-by-self';
                    } else {
                         data.editClass = 'edited-by-other';
                    }
                    editSpan.remove();
                }
                const signatureDiv = clonedContent.querySelector('div.signature');
                if(signatureDiv) signatureDiv.remove();
                data.postBodyHtml = clonedContent.innerHTML; // Очищенный HTML
            }
            // Причина редактирования (вне postBodyDiv)
            const editReasonDiv = postBodyCell.querySelector(`div.post-edit-reason`);
             if (editReasonDiv) {
                 data.editReason = editReasonDiv.textContent?.trim() || '';
             }


            // Кнопки действий
            rightButtonsCell.querySelectorAll('a.g-btn').forEach(button => {
                const btnText = button.textContent?.trim();
                const btnOnClick = button.getAttribute('onclick');
                const btnHref = button.href || '#';

                if (!btnText && !button.title) return; // Пропускаем кнопки без текста и title
                if (btnText === 'ИМЯ' || btnText === 'В ШАПКУ' || btnText === 'УЖЕ В ШАПКЕ' || button.classList.contains('pinlink') || (btnOnClick && (btnOnClick.includes('--seMODhide') || btnOnClick.includes('--seMODdel')))) return;

                let actionText = btnText;
                let actionUrl = btnHref;
                let actionOnClick = btnOnClick ? btnOnClick.replace(/"/g, "'") : null; // Заменяем кавычки

                if (button.matches('[data-quote-link]')) {
                    actionText = 'Цитировать'; actionUrl = '#';
                    const onMouseOver = button.getAttribute('onmouseover');
                    actionOnClick = onMouseOver && onMouseOver.includes('copyQ') ? `${onMouseOver.replace('copyQ', 'window.copyQ').replace(/"/g, "'")} window.pasteQ(); return false;` : 'window.pasteQ(); return false;';
                } else if (button.id && button.id.startsWith('edit-but-')) {
                    actionText = 'Изменить';
                    const fullEditLink = document.querySelector(`#${button.id}_menu a[href*='do=edit_post']`) || button;
                    actionUrl = fullEditLink.href; // Всегда ссылка на полное редактирование
                    actionOnClick = null;
                } else if (btnText === 'ЖАЛОБА') {
                    actionText = 'Жалоба'; // Кнопка ЖАЛОБА есть в левой ячейке! Переносим поиск
                } else if (!actionText) {
                    actionText = button.title || '?'; // Используем title, если нет текста
                }

                data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick });
            });
            // Ищем кнопку "Жалоба" в левой ячейке
            const reportButton = leftButtonsCell.querySelector('a.g-btn[href*="act=report&t="]');
            if(reportButton) {
                 data.actions.push({ text: 'Жалоба', url: reportButton.href, onclick: null });
            }
            // TODO: Добавить извлечение кармы, если нужно

            console.log(`[${logScopePrefix}] Extraction successful.`);
            return data;

        } catch (error) {
            console.error(`[${logScopePrefix}] ❌ CRITICAL error during extraction:`, error);
            if (error.stack) console.error(error.stack);
            return null; // Возвращаем null при ошибке
        }
    }

    /**
     * ========================================================================
     * ИНИЦИАЛИЗАЦИЯ И ЗАМЕНА ПОСТОВ (Main Logic)
     * ========================================================================
     */

    /**
     * Инициализирует замену старых постов на новые.
     */
    function initModernPosts() {
        console.log(`${LOG_PREFIX} initModernPosts running...`);

        const pinnedPostSelector = '#topic-pin-content > table.ipbtable[data-post]';
        const allPostTables = document.querySelectorAll('table.ipbtable[data-post]');
        const pinnedPostElement = document.querySelector(pinnedPostSelector);
        let originalPosts = Array.from(allPostTables);

        if (pinnedPostElement) {
            originalPosts = originalPosts.filter(el => el !== pinnedPostElement);
            originalPosts.unshift(pinnedPostElement);
        }

        console.log(`${LOG_PREFIX} Found ${originalPosts.length} original post tables to process.`);
        if (originalPosts.length === 0) return; // Нечего делать

        const postsToReplace = [];
        originalPosts.forEach((originalPostTable, index) => {
            const postData = extractPostData(originalPostTable); // Извлекаем данные
            if (postData) {
                const newPostHtml = createPostHtml(postData); // Генерируем HTML
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = newPostHtml;
                const newPostElement = tempContainer.firstElementChild;
                if (newPostElement) {
                    postsToReplace.push({ original: originalPostTable, new: newPostElement });
                } else {
                    console.error(`${LOG_PREFIX} Failed to create new post element for ID: ${postData.postId}`);
                    originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; // Показываем оригинал
                }
            } else {
                console.warn(`${LOG_PREFIX} Failed to extract data for post table ${index + 1} (ID: ${originalPostTable.dataset.post}), skipping replacement.`);
                originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; // Показываем оригинал
            }
        });

        console.log(`${LOG_PREFIX} Replacing ${postsToReplace.length} posts...`);
        postsToReplace.forEach(pair => {
            if (pair.original.parentNode) {
                pair.original.replaceWith(pair.new);
            } else {
                 console.warn(`${LOG_PREFIX} Original post table ID ${pair.original.dataset.post} has no parentNode, cannot replace.`);
            }
        });
        console.log(`${LOG_PREFIX} Replacement finished.`);

        addEventListeners(); // Добавляем обработчики к новым постам
    }

    /**
     * ========================================================================
     * ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ (Event Listeners)
     * ========================================================================
     */

    /**
     * Добавляет обработчики событий, используя делегирование.
     */
    function addEventListeners() {
        const postsContainer = document.body; // Вешаем на body
        const listenerKey = 'modernThemeListenersAdded';

        // Удаляем старый обработчик, если он был (на случай повторного вызова)
        if (postsContainer.dataset[listenerKey]) {
            postsContainer.removeEventListener('click', handleDelegatedClick);
            delete postsContainer.dataset[listenerKey];
            console.log(`${LOG_PREFIX} Removed previous delegated event listener.`);
        }

        // Добавляем новый обработчик
        postsContainer.addEventListener('click', handleDelegatedClick);
        postsContainer.dataset[listenerKey] = 'true'; // Помечаем, что добавили
        console.log(`${LOG_PREFIX} Added delegated event listener to body.`);
    }

    /**
     * Универсальный обработчик кликов (делегированный).
     * @param {Event} event
     */
    function handleDelegatedClick(event) {
        const target = event.target;

        // --- Обработка разных кликов ---
        if (target.closest('.mp-actions-trigger')) {
            handleActionMenuToggle(event, target.closest('.mp-actions-trigger'));
        } else if (target.closest('.mp-author-nick')) {
            handleUserMenuToggle(event, target.closest('.mp-author-nick'));
        } else if (target.closest('.mp-body .sp-head')) {
            handleSpoilerToggle(event, target.closest('.mp-body .sp-head'));
        } else if (target.closest('.mp-user-menu .rep-plus')) {
             handleRepPlusClick(event, target.closest('.mp-user-menu .rep-plus'));
        }
        // Добавить другие обработчики сюда (например, для кнопок в меню действий, если нужен JS)
        // else if (target.closest('.mp-actions-menu a[onclick*="pasteQ"]')) {
        //     // Если нужен специальный обработчик для цитирования
        // }
        else if (!target.closest('.mp-actions-menu, .mp-user-menu')) {
            // Клик вне меню - закрываем все
            closeAllMenusOnClickOutside();
        } else {
            // Клик внутри меню - останавливаем всплытие, чтобы не закрыть его
            event.stopPropagation();
        }
    }

    /** Обработчик клика на триггер меню действий */
    function handleActionMenuToggle(event, trigger) {
        event.stopPropagation();
        const menu = trigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
        if (!menu) return;
        const isVisible = menu.classList.contains('visible');
        closeAllMenusOnClickOutside(); // Закрыть все перед показом/скрытием
        if (!isVisible) {
            menu.classList.add('visible');
            menu.style.display = 'block';
            positionMenu(trigger, menu);
            console.log(`${LOG_PREFIX} Action menu opened.`);
        } else {
             console.log(`${LOG_PREFIX} Action menu closed.`);
        }
    }

    /** Обработчик клика на ник */
    function handleUserMenuToggle(event, nickLink) {
        event.preventDefault(); event.stopPropagation();
        const postElement = nickLink.closest('.mp-post');
        const detailsContainer = nickLink.closest('.mp-author-details');
        if (!postElement || !detailsContainer) return;

        let userMenu = detailsContainer.querySelector('.mp-user-menu');
        const isVisible = userMenu && userMenu.classList.contains('visible');
        closeAllMenusOnClickOutside(); // Закрыть все перед показом/скрытием

        if (!isVisible) {
            if (!userMenu) { // Создать если нет
                userMenu = createUserMenu(postElement);
                if (userMenu) detailsContainer.appendChild(userMenu);
                else { console.error(`${LOG_PREFIX} Failed to create user menu.`); return; }
            }
            positionMenu(nickLink, userMenu); // Позиционировать
            userMenu.classList.add('visible');
            console.log(`${LOG_PREFIX} User menu opened.`);
        } else {
            console.log(`${LOG_PREFIX} User menu closed.`);
        }
    }

    /** Обработчик клика на шапку спойлера */
    function handleSpoilerToggle(event, header) {
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody && spoilerBody.classList.contains('sp-body')) {
            const isOpen = spoilerBody.classList.toggle('open');
            header.classList.toggle('open', isOpen);
            console.log(`${LOG_PREFIX} Spoiler toggled. Is open: ${isOpen}`);
        }
    }

     /** Обработчик клика на кнопку "+" репутации */
     function handleRepPlusClick(event, button) {
         event.preventDefault(); event.stopPropagation();
         const authorId = button.closest('.mp-post')?.dataset?.authorId;
         const url = button.href;
         if (url && url !== '#') {
             window.open(url, `rep_${authorId || ''}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         }
         closeAllMenusOnClickOutside();
     }


    /** Создает DOM элемент меню пользователя */
    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId;
        const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#';
        const authorNick = nickElement?.textContent.trim() || '';
        // --- Извлекаем данные репутации из оригинального поста (если он еще есть) ---
        // Это более надежно, чем парсить из созданного mp-rep
        const originalPostTable = document.querySelector(`table.ipbtable[data-post="${postElement.dataset.postId}"]`);
        let reputation = '0', repHistoryUrl = '#', repPlusUrl = '#';
        if (originalPostTable) {
            const repValueSpan = originalPostTable.querySelector('span[data-member-rep]');
            if (repValueSpan) reputation = repValueSpan.textContent?.trim() || '0';
            const repHistoryLink = originalPostTable.querySelector(`a[href*="act=rep&view=history&mid=${authorId}"]`);
            if (repHistoryLink) repHistoryUrl = repHistoryLink.href;
            const repPlusAnchor = originalPostTable.querySelector(`a[href*="act=rep&do=plus&mid=${authorId}"]`);
            if (repPlusAnchor) repPlusUrl = repPlusAnchor.href;
        } else {
            // Запасной вариант, если оригинал уже удален (менее надежно)
             const repElement = postElement.querySelector('.mp-rep');
             if(repElement) reputation = repElement.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0';
             console.warn(`${LOG_PREFIX} Create User Menu: Could not find original post table ID ${postElement.dataset.postId} for accurate rep data.`);
        }
        // ---------------------------------------------------------------------

        if (!authorId) { console.error(`${LOG_PREFIX} Create User Menu: Author ID missing.`); return null; }

        const menu = document.createElement('ul');
        menu.className = 'mp-user-menu';
        menu.innerHTML = `
            <li><a href="${profileUrl}" target="_blank">Профиль</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&source=top&search_author=${encodeURIComponent(authorNick)}&result=topics&noform=1" target="_blank">Найти темы</a></li>
            <hr>
            <li class="rep-item">
                <span class="rep-value"><a href="${repHistoryUrl}" title="История репутации" target="_blank">⭐ ${reputation}</a></span>
                ${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}
            </li>
        `;
        return menu;
     }


    /** Позиционирует меню относительно триггера */
    function positionMenu(triggerElement, menuElement) {
         const triggerRect = triggerElement.getBoundingClientRect();
         const container = menuElement.offsetParent || document.documentElement;
         const containerRect = container.getBoundingClientRect();
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
         const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

         menuElement.style.position = 'absolute';
         menuElement.style.display = 'block'; // Нужно для расчета размеров

         const menuHeight = menuElement.offsetHeight;
         const menuWidth = menuElement.offsetWidth;
         const viewportHeight = window.innerHeight;
         const viewportWidth = window.innerWidth;

         let top = triggerRect.bottom - containerRect.top + 2;
         let left = triggerRect.left - containerRect.left;

         if (triggerRect.bottom + menuHeight + 2 > viewportHeight && triggerRect.top - menuHeight - 2 > 0) {
             top = triggerRect.top - containerRect.top - menuHeight - 2; // Попробовать сверху
         }
         if (triggerRect.left + menuWidth > viewportWidth) {
              left = triggerRect.right - containerRect.left - menuWidth; // Выровнять по правому краю
         }

         menuElement.style.top = `${top}px`;
         menuElement.style.left = `${Math.max(0, left)}px`; // Не уходить левее 0

         // menuElement.style.display = 'none'; // Скрыть обратно перед показом через класс .visible
         console.log(`${LOG_PREFIX} Positioned menu at top: ${top}px, left: ${left}px`);
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
     * ТОЧКА ВХОДА (Initialization)
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