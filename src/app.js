(function() {
    'use strict';

    console.log("[App.js] Modern Theme App.js starting...");

    /**
     * Создает HTML-строку для одного поста на основе предоставленных данных.
     * Использует SVG-заглушку для аватара.
     * @param {object} postData - Объект с данными поста.
     * @returns {string} HTML-строка нового поста.
     */
    function createPostHtml(postData) {
        // Простая SVG-заглушка: зеленый круг
        const defaultAvatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2328a745'/%3E%3C/svg%3E`;

        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');

        // Репутация в шапке (без ссылок, т.к. они в меню)
        const repHtml = `<span class="mp-rep" title="Репутация: ${postData.reputation}">⭐ ${postData.reputation}</span>`;

        return `
            <article class="mp-post" data-post-id="${postData.postId}" data-author-id="${postData.authorId}">
              <header class="mp-header">
                <div class="mp-author-info">
                  <img class="mp-avatar" src="${postData.avatarUrl || defaultAvatarSvg}" alt="Аватар ${postData.authorNick}" loading="lazy" onerror="this.src='${defaultAvatarSvg}'; this.onerror=null;">
                  <div class="mp-author-details" style="position: relative;"> <!-- Добавляем relative для позиционирования меню -->
                    <div class="mp-author-line1">
                       <a class="mp-author-nick" href="${postData.authorProfileUrl}" data-user-id="${postData.authorId}" title="Открыть меню пользователя">${postData.authorNick}</a>
                       ${repHtml} <!-- Вставляем репутацию -->
                    </div>
                    <div class="mp-author-line2">
                       <span class="mp-author-status" title="Статус">${postData.authorStatus}</span>
                       ${postData.authorWarnings ? ` | <span class="mp-author-warnings" title="Группа">${postData.authorWarnings}</span>` : ''} <!-- Показываем группу/предупреждения если есть -->
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
              </footer>
            </article>
        `;
    }

    /**
     * Извлекает данные из оригинального элемента поста (настольная версия).
     * Обновлено для работы с классами post1 и post2.
     * @param {Element} originalPostTable - Элемент <table> оригинального поста.
     * @returns {object|null} Объект с данными поста или null, если извлечь не удалось.
     */
     function extractPostData(originalPostTable) {
        try {
            const postId = originalPostTable.dataset.post;
            if (!postId) {
                 console.warn("[App.js Extract] Post table found without data-post attribute:", originalPostTable);
                 return null;
            }

            console.log(`[App.js Extract] Starting extraction for post ID: ${postId}`);

            const data = {
                postId: postId, authorNick: '?', authorId: null, authorProfileUrl: '#', authorPmUrl: '#',
                avatarUrl: null, authorStatus: '', authorWarnings: '', reputation: '0', repHistoryUrl: '#',
                repPlusUrl: '#', ipAddress: '', postNumber: '?', postBodyHtml: '<p>Не удалось извлечь содержимое поста.</p>',
                creationDate: '', isEdited: false, editClass: '', editTooltip: '', actions: [], canModerate: false,
             };

            // --- Универсальные селекторы для ячеек ---
            const postClassSelectorPart = `td[class^="post"]`; // Начинается с "post" (post1 или post2)
            const userInfoCellSelector = `#pb-${postId}-r2 > ${postClassSelectorPart}:first-child`; // Ячейка с инфо юзера
            const postBodyCellSelector = `#post-main-${postId}`; // Ячейка с телом поста

            // Ник, ID, Профиль
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            if (nickLink) {
                data.authorNick = nickLink.textContent.trim();
                data.authorProfileUrl = nickLink.href;
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/);
                if (userIdMatch) data.authorId = userIdMatch[1];
                console.log(`[App.js Extract ${postId}] Nick: ${data.authorNick}, ID: ${data.authorId}`);
            } else {
                 console.warn(`[App.js Extract ${postId}] Nick link not found using selector: #post-member-${postId} span.normalname a`);
            }

            // Левая колонка пользователя
            const userInfoCell = originalPostTable.querySelector(userInfoCellSelector);
            if (userInfoCell) {
                console.log(`[App.js Extract ${postId}] Found user info cell.`);
                 const avatarImg = userInfoCell.querySelector('.user-avatar img');
                 if (avatarImg) data.avatarUrl = avatarImg.src; else console.warn(`[App.js Extract ${postId}] Avatar image not found.`);
                 const statusElem = userInfoCell.querySelector('.mem-title');
                 if (statusElem) data.authorStatus = statusElem.textContent.trim(); else console.warn(`[App.js Extract ${postId}] Status (.mem-title) not found.`);
                 const groupElemTextNode = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Группа:'));
                 if (groupElemTextNode) {
                     const groupSpan = groupElemTextNode.nextElementSibling;
                     if(groupSpan) data.authorWarnings = groupSpan.textContent.trim(); // Используем группу как Warnings
                 } else console.warn(`[App.js Extract ${postId}] Group text node not found.`);
                 const repLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"] span[data-member-rep]');
                 if (repLink) data.reputation = repLink.textContent.trim(); else console.warn(`[App.js Extract ${postId}] Reputation span not found.`);
                 const repHistoryLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"]');
                 if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href; else console.warn(`[App.js Extract ${postId}] Reputation history link not found.`);
                 const repPlusAnchor = userInfoCell.querySelector('a[href*="act=rep&do=plus"]');
                 if (repPlusAnchor) data.repPlusUrl = repPlusAnchor.href; else console.warn(`[App.js Extract ${postId}] Reputation plus link not found.`);
                 const ipLink = userInfoCell.querySelector('.post-field-ip a');
                 if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent.trim(); else console.warn(`[App.js Extract ${postId}] IP link not found.`);
            } else {
                 console.warn(`[App.js Extract ${postId}] User info cell not found using selector: ${userInfoCellSelector}`);
            }

             // Верхняя строка поста (Метаданные)
             const postMetaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
             if (postMetaCell) {
                 console.log(`[App.js Extract ${postId}] Found post meta cell.`);
                 const postNumLink = postMetaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]');
                 if (postNumLink) data.postNumber = postNumLink.textContent.trim().replace('#',''); else console.warn(`[App.js Extract ${postId}] Post number link not found.`);
                 const dateNode = Array.from(postMetaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/));
                 if (dateNode) data.creationDate = dateNode.textContent.trim(); else console.warn(`[App.js Extract ${postId}] Creation date text node not found.`);
                 if (postMetaCell.querySelector('label.secheck input[name="selectedpids[]"]')) data.canModerate = true; else console.log(`[App.js Extract ${postId}] Moderator checkbox not found.`);
             } else {
                  console.warn(`[App.js Extract ${postId}] Post meta cell not found using selector: #ph-${postId}-d2`);
             }

            // Тело поста
            const postBodyCell = originalPostTable.querySelector(postBodyCellSelector);
            if (postBodyCell) {
                 console.log(`[App.js Extract ${postId}] Found post body cell.`);
                const postContentDiv = postBodyCell.querySelector(`div.postcolor[id="post-${postId}"]`);
                if (postContentDiv) {
                    const clonedContent = postContentDiv.cloneNode(true);
                    const editSpan = clonedContent.querySelector('span.edit');
                    if (editSpan) {
                        data.isEdited = true;
                        data.editTooltip = editSpan.textContent.trim();
                        const editLink = editSpan.querySelector('a');
                        if (editLink && data.authorId && editLink.href.includes(`showuser=${data.authorId}`)) {
                            data.editClass = 'edited-by-self';
                        } else {
                             data.editClass = 'edited-by-other';
                        }
                        editSpan.remove(); // Удаляем span из основного контента
                    }
                    const signatureDiv = clonedContent.querySelector('div.signature');
                    if(signatureDiv) signatureDiv.remove(); // Удаляем подпись
                    data.postBodyHtml = clonedContent.innerHTML; // Берем innerHTML без span.edit и signature
                    console.log(`[App.js Extract ${postId}] Post body HTML extracted.`);
                } else {
                     console.warn(`[App.js Extract ${postId}] Post content div (div.postcolor[id="post-${postId}"]) not found inside body cell.`);
                     // Запасной вариант: взять всё из ячейки, но попытаться удалить подпись
                     const clonedBodyCell = postBodyCell.cloneNode(true);
                     const signatureDiv = clonedBodyCell.querySelector('div.signature');
                     if(signatureDiv) signatureDiv.remove();
                     data.postBodyHtml = clonedBodyCell.innerHTML;
                }
            } else {
                 console.warn(`[App.js Extract ${postId}] Post body cell not found using selector: ${postBodyCellSelector}`);
            }

            // Кнопки действий
            const buttonsCell = originalPostTable.querySelector(`#pb-${postId}-r3 td.formbuttonrow:last-child`);
            if (buttonsCell) {
                 console.log(`[App.js Extract ${postId}] Found buttons cell.`);
                 buttonsCell.querySelectorAll('a.g-btn').forEach(button => {
                    const btnText = button.textContent.trim();
                    const btnOnClick = button.getAttribute('onclick');
                    const btnHref = button.href || '#';

                    // Пропускаем ненужные кнопки
                    if (btnText === 'ИМЯ' || btnText === 'В ШАПКУ' || btnText === 'УЖЕ В ШАПКЕ' || button.classList.contains('pinlink') || (btnOnClick && (btnOnClick.includes('--seMODhide') || btnOnClick.includes('--seMODdel') || btnOnClick.includes('scroll(0,0)') )) || button.getAttribute('data-rel') === 'lyteframe' ) { // Добавил пропуск FAQ и Вверх
                        return;
                    }

                    let actionText = btnText;
                    let actionUrl = btnHref;
                    let actionOnClick = btnOnClick ? btnOnClick.replace(/"/g, "'") : null; // Заменяем кавычки сразу

                    if (button.matches('[data-quote-link]')) {
                        actionText = 'Цитировать'; actionUrl = '#';
                        const onMouseOver = button.getAttribute('onmouseover');
                        actionOnClick = onMouseOver && onMouseOver.includes('copyQ') ? `${onMouseOver.replace('copyQ', 'window.copyQ').replace(/"/g, "'")} window.pasteQ(); return false;` : 'window.pasteQ(); return false;';
                    } else if (button.id && button.id.startsWith('edit-but-')) {
                        actionText = 'Изменить';
                        // Ищем ссылку на полное редактирование, так как быстрое может быть не всегда
                        const fullEditLink = document.querySelector(`#${button.id}_menu a[href*='do=edit_post']`) || button; // Если меню нет, берем основную кнопку
                         actionUrl = fullEditLink.href;
                         actionOnClick = null; // Используем прямую ссылку

                         // // Код для быстрого редактирования (если решим вернуть)
                         // const quickEditLink = document.querySelector(`#${button.id}_menu a[onclick*='ajax_prep_for_edit']`);
                         // if (quickEditLink) {
                         //      actionOnClick = quickEditLink.getAttribute('onclick').replace(/"/g, "'");
                         //      actionUrl = '#';
                         // } else {
                         //      actionUrl = button.href; // Ссылка на полное редактирование
                         //      actionOnClick = null;
                         // }
                    } else if (btnText === 'ЖАЛОБА') {
                        actionText = 'Жалоба'; actionUrl = button.href; actionOnClick = null;
                    } else if (!actionText && button.title) {
                        actionText = button.title; // Если текста нет, берем title
                    } else if (!actionText) {
                         return; // Пропускаем кнопки без текста и title
                    }

                    // Добавляем только валидные действия
                    if (actionText && (actionUrl !== '#' || actionOnClick)) {
                        data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick });
                    }
                 });
                 console.log(`[App.js Extract ${postId}] Extracted ${data.actions.length} actions:`, data.actions.map(a=>a.text));
            } else {
                  console.warn(`[App.js Extract ${postId}] Buttons cell not found using selector: #pb-${postId}-r3 td.formbuttonrow:last-child`);
            }

            console.log(`[App.js Extract ${postId}] Extraction finished.`);
            return data;

        } catch (error) {
            console.error(`[App.js Extract] Critical error extracting data for post table ID ${originalPostTable?.dataset?.post}:`, error);
            if (error.stack) console.error(error.stack);
            return null; // Возвращаем null в случае критической ошибки
        }
    }


    /**
     * Инициализирует замену старых постов на новые.
     */
    function initModernPosts() {
        console.log("[App.js] initModernPosts called");

        // Селекторы
        const pinnedPostSelector = '#topic-pin-content > table.ipbtable[data-post]';
        const allPostTables = document.querySelectorAll('table.ipbtable[data-post]');

        const pinnedPostElement = document.querySelector(pinnedPostSelector);
        let originalPosts = Array.from(allPostTables);

        if (pinnedPostElement) {
            originalPosts = originalPosts.filter(el => el !== pinnedPostElement);
            originalPosts.unshift(pinnedPostElement); // Закрепленный всегда первый
            console.log(`[App.js] Found pinned post ID: ${pinnedPostElement.dataset.post}`);
        }

        console.log(`[App.js] Found ${originalPosts.length} total post tables to process.`);

        if (originalPosts.length === 0) {
            console.warn("[App.js] No post tables found with 'data-post' attribute. Initialization stopped.");
            return;
        }

        const postsToReplace = [];

        originalPosts.forEach((originalPostTable, index) => {
             console.log(`[App.js] Processing post table ${index + 1}/${originalPosts.length}, ID: ${originalPostTable.dataset.post}`);
            const postData = extractPostData(originalPostTable); // Вызываем обновленную функцию

            if (!postData) {
                 console.warn(`[App.js] Failed to extract data for post table ${index + 1} (ID: ${originalPostTable.dataset.post}), skipping replacement.`);
                 originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; // Показываем оригинал
                 return;
            }

            const newPostHtml = createPostHtml(postData); // Используем обновленную функцию
            const tempContainer = document.createElement('div'); tempContainer.innerHTML = newPostHtml;
            const newPostElement = tempContainer.firstElementChild;

            if (newPostElement) {
                postsToReplace.push({ original: originalPostTable, new: newPostElement });
            } else {
                console.error("[App.js] Failed to create new post element for post ID:", postData.postId);
                originalPostTable.style.display = ''; originalPostTable.style.visibility = 'visible'; // Показываем оригинал
            }
        });

        console.log(`[App.js] Replacing ${postsToReplace.length} posts...`);
        postsToReplace.forEach(pair => {
            if (pair.original.parentNode) {
                pair.original.replaceWith(pair.new);
            } else {
                 console.warn(`[App.js] Original post table ID ${pair.original.dataset.post} has no parentNode, cannot replace.`);
            }
        });
        console.log(`[App.js] Replacement finished.`);

        addEventListeners(); // Вызываем обновленную функцию добавления обработчиков
    }

    /**
     * Добавляет обработчики событий.
     * Используем делегирование событий для повышения надежности.
     */
    function addEventListeners() {
        console.log("[App.js] Adding event listeners using event delegation...");
        const postsContainer = document.body; // Используем body для максимального охвата

        // --- Удаляем старый универсальный обработчик, если он был ---
        // postsContainer.removeEventListener('click', handleDelegatedClick); // Нужна ссылка на саму функцию

        // --- Используем делегирование ---
        // Слушаем клики на всем контейнере
        // Добавляем один раз, можно добавить проверку, чтобы не дублировать
        if (!postsContainer.dataset.modernThemeListenersAdded) {
            postsContainer.addEventListener('click', handleDelegatedClick);
            postsContainer.dataset.modernThemeListenersAdded = 'true'; // Помечаем, что листенер добавлен
             console.log("[App.js] Delegated event listener ADDED to body.");
        } else {
            console.log("[App.js] Delegated event listener on body already exists.");
        }


    }

    /**
     * Универсальный обработчик кликов (делегированный).
     * @param {Event} event
     */
    function handleDelegatedClick(event) {
        const target = event.target;
        // console.log("[App.js Delegate Click] Click detected on:", target); // Для отладки можно раскомментировать

        // Клик на триггер меню действий (⋮)
        const actionTrigger = target.closest('.mp-actions-trigger');
        if (actionTrigger) {
            console.log("[App.js Delegate Click] Action trigger clicked.");
            handleActionMenuToggle(event, actionTrigger); // Передаем событие и триггер
            return;
        }

        // Клик на ник пользователя
        const nickLink = target.closest('.mp-author-nick');
        if (nickLink) {
            console.log("[App.js Delegate Click] Nick link clicked.");
            handleUserMenuToggle(event, nickLink); // Передаем событие и ссылку
            return;
        }

        // Клик на шапку спойлера
        const spoilerHead = target.closest('.mp-body .sp-head');
        if (spoilerHead) {
            console.log("[App.js Delegate Click] Spoiler head clicked.");
            handleSpoilerToggle(event, spoilerHead); // Передаем событие и шапку
            return;
        }

        // Клик на кнопку "+" репутации в меню пользователя
         const repPlusButton = target.closest('.mp-user-menu .rep-plus');
         if (repPlusButton) {
             console.log("[App.js Delegate Click] Rep plus button clicked.");
             handleRepPlusClick(event, repPlusButton); // Передаем событие и кнопку
             return;
         }

        // Если клик был не на меню и не на триггере/нике, закрываем все меню
        if (!target.closest('.mp-actions-menu, .mp-user-menu')) {
             // console.log("[App.js Delegate Click] Click outside menus detected, closing menus."); // Для отладки
             closeAllMenusOnClickOutside();
        } else {
             // Клик внутри меню - останавливаем всплытие, чтобы не закрыть его
             // console.log("[App.js Delegate Click] Click inside menu detected, stopping propagation."); // Для отладки
             event.stopPropagation();
        }
    }


    /**
     * Обработчик клика на триггер меню действий.
     * @param {Event} event
     * @param {Element} trigger - Элемент-триггер (кнопка).
     */
    function handleActionMenuToggle(event, trigger) {
        event.stopPropagation(); // Останавливаем здесь, чтобы не закрыть сразу
        const menu = trigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
        if (!menu) { console.warn("Action menu not found for trigger:", trigger); return; }
        const isVisible = menu.classList.contains('visible');
        console.log(`[App.js Action Menu] Trigger clicked. Menu found. Currently visible: ${isVisible}`);
        closeAllMenusOnClickOutside(); // Закрываем все перед открытием/закрытием текущего
        if (!isVisible) { // Если было закрыто, открываем
             menu.classList.add('visible');
             menu.style.display = 'block'; // Убедимся, что display не none
             positionMenu(trigger, menu); // Позиционируем при открытии
             console.log(`[App.js Action Menu] Menu opened.`);
        } else {
             console.log(`[App.js Action Menu] Menu closed (was already visible).`);
        }
    }

    /**
     * Обработчик клика на ник пользователя для показа меню.
     * @param {Event} event
     * @param {Element} nickLink - Элемент ссылки на ник.
     */
    function handleUserMenuToggle(event, nickLink) {
         event.preventDefault(); // Предотвращаем переход по ссылке ника
         event.stopPropagation(); // Останавливаем здесь, чтобы не закрыть сразу
         const postElement = nickLink.closest('.mp-post');
         if (!postElement) { console.warn("Post element not found for nick link:", nickLink); return; }
         const detailsContainer = nickLink.closest('.mp-author-details');
         if (!detailsContainer) { console.warn("Details container not found for nick link:", nickLink); return; }

         let userMenu = detailsContainer.querySelector('.mp-user-menu'); // Ищем меню внутри detailsContainer
         const isVisible = userMenu && userMenu.classList.contains('visible');
         console.log(`[App.js User Menu] Nick clicked. Menu ${userMenu ? 'found' : 'not found'}. Currently visible: ${isVisible}`);

         closeAllMenusOnClickOutside(); // Закрываем все перед открытием/закрытием текущего

         if (!isVisible) { // Если было закрыто или не существует
             if (!userMenu) { // Создаем, если не существует
                 console.log("[App.js User Menu] Creating user menu for user ID:", nickLink.dataset.userId);
                 userMenu = createUserMenu(postElement);
                 if (userMenu) {
                    detailsContainer.appendChild(userMenu); // Добавляем в конец detailsContainer
                    console.log("[App.js User Menu] Menu created and appended.");
                 } else {
                      console.error("[App.js User Menu] Failed to create user menu.");
                      return; // Нечего показывать
                 }
             }
              // Позиционируем и показываем
             positionMenu(nickLink, userMenu);
             userMenu.classList.add('visible'); // Показываем
             // userMenu.style.display = 'block'; // display управляется классом .visible в CSS
             console.log(`[App.js User Menu] Menu opened/positioned.`);

         } else {
             console.log(`[App.js User Menu] Menu closed (was already visible).`);
         }
    }

    /**
     * Обработчик клика на шапку спойлера.
     * @param {Event} event
     * @param {Element} header - Элемент шапки спойлера (.sp-head).
     */
    function handleSpoilerToggle(event, header) {
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody && spoilerBody.classList.contains('sp-body')) {
            const isOpen = spoilerBody.classList.toggle('open');
            header.classList.toggle('open', isOpen);
            // spoilerBody.style.display = isOpen ? 'block' : 'none'; // Управляется классами в CSS
             console.log(`[App.js Spoiler] Toggled spoiler. Is open: ${isOpen}`);
        } else {
            console.warn("[App.js Spoiler] Spoiler body not found for header:", header);
        }
    }

     /**
     * Обработчик клика на кнопку "+" репутации в меню.
     * @param {Event} event
     * @param {Element} button - Элемент кнопки (+).
     */
     function handleRepPlusClick(event, button) {
         event.preventDefault(); // Предотвращаем стандартное действие ссылки
         event.stopPropagation(); // Важно остановить всплытие внутри меню
         const authorId = button.closest('.mp-post')?.dataset?.authorId;
         const url = button.href;
         console.log(`[App.js Rep Plus] Clicked for user ${authorId}. Opening window: ${url}`);
         if (url && url !== '#') {
            window.open(url, `rep_${authorId || Math.random()}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         } else {
             console.warn("[App.js Rep Plus] Invalid URL for rep plus button:", button);
         }
         closeAllMenusOnClickOutside(); // Закрыть все меню
     }


    /**
     * Создает DOM элемент меню пользователя.
     * @param {Element} postElement - Элемент поста <article>.
     * @returns {Element|null} - Сгенерированный элемент <ul> меню или null.
     */
     function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId;
        const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#';
        const authorNick = nickElement?.textContent.trim() || '';
        // Извлекаем данные о репутации из ОРИГИНАЛЬНОГО поста, если это возможно, или из data-* атрибута
        const originalPostTable = document.querySelector(`table.ipbtable[data-post="${postElement.dataset.postId}"]`); // Находим оригинал
        let reputation = '0', repHistoryUrl = '#', repPlusUrl = '#';

        if (originalPostTable) {
             const repLink = originalPostTable.querySelector('a[href*="act=rep"][title*="репутацию"] span[data-member-rep]');
             if (repLink) reputation = repLink.textContent.trim();
             const repHistoryLink = originalPostTable.querySelector('a[href*="act=rep"][title*="репутацию"]');
             if (repHistoryLink) repHistoryUrl = repHistoryLink.href;
             const repPlusAnchor = originalPostTable.querySelector('a[href*="act=rep&do=plus"]');
             if (repPlusAnchor) repPlusUrl = repPlusAnchor.href;
        } else {
            // Запасной вариант - попытаться взять из созданного элемента (менее надежно)
             const repElement = postElement.querySelector('.mp-rep');
             if(repElement) reputation = repElement.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0';
             // Ссылки на историю и плюс в этом случае взять неоткуда
             console.warn(`[App.js Create User Menu] Could not find original post table for ID ${postElement.dataset.postId} to get rep details.`);
        }


        if (!authorId) { console.error("[App.js Create User Menu] Author ID not found."); return null; }

        const menu = document.createElement('ul');
        menu.className = 'mp-user-menu';
        // Добавляем ссылки поиска по ID автора - надежнее, чем по нику
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
        // Обработчик для кнопки "+" репутации теперь вешается через делегирование

        return menu;
     }


    /**
     * Позиционирует меню относительно элемента-триггера.
     * @param {Element} triggerElement - Элемент, вызвавший меню (ник, кнопка).
     * @param {Element} menuElement - Элемент меню.
     */
    function positionMenu(triggerElement, menuElement) {
         const triggerRect = triggerElement.getBoundingClientRect();
         // Важно: offsetParent может быть не body, если родитель позиционирован
         const container = menuElement.offsetParent || document.documentElement; // Используем documentElement как запасной вариант
         const containerRect = container.getBoundingClientRect();
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
         const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

         // Сбрасываем стили перед расчетом
         menuElement.style.position = 'absolute'; // Убедимся, что позиционирование абсолютное
         menuElement.style.top = 'auto';
         menuElement.style.left = 'auto';
         menuElement.style.right = 'auto';
         menuElement.style.bottom = 'auto';
         // menuElement.style.display = 'block'; // Не нужно, управляется классом visible

         const menuHeight = menuElement.offsetHeight;
         const menuWidth = menuElement.offsetWidth;
         const viewportHeight = window.innerHeight;
         const viewportWidth = window.innerWidth;

         // Рассчитываем координаты относительно offsetParent
         let top = triggerRect.bottom - containerRect.top + 2; // +2px отступ снизу
         let left = triggerRect.left - containerRect.left;

         // Проверяем выход за нижнюю границу видимой области
         if (triggerRect.bottom + menuHeight + 2 > viewportHeight) {
             // Пытаемся разместить сверху
             let topAbove = triggerRect.top - containerRect.top - menuHeight - 2;
             if (topAbove >= 0) { // Если сверху есть место
                 top = topAbove;
             } // Иначе оставляем снизу (меню может обрезаться)
         }

         // Проверяем выход за правую границу видимой области
         if (triggerRect.left + menuWidth > viewportWidth) {
              // Пытаемся выровнять по правому краю триггера
              left = triggerRect.right - containerRect.left - menuWidth;
         }

         // Применяем рассчитанные координаты (добавляем scroll для абсолютного позиционирования)
         // menuElement.style.top = `${top + scrollTop}px`; // Неправильно, top/left уже относительно offsetParent
         // menuElement.style.left = `${left + scrollLeft}px`;
         menuElement.style.top = `${top}px`;
         menuElement.style.left = `${Math.max(0, left)}px`; // Не даем уйти левее нуля

         console.log(`[App.js Position Menu] Positioned menu at top: ${top}px, left: ${left}px`);
    }


    /**
     * Закрывает все открытые меню (действий и пользователя) при клике вне их.
     */
    function closeAllMenusOnClickOutside() {
        closeAllActionMenus();
        closeAllUserMenus();
    }

    /**
     * Закрывает все открытые меню действий, кроме указанного.
     * @param {Element} [excludeMenu=null] - Меню, которое не нужно закрывать.
     */
    function closeAllActionMenus(excludeMenu = null) {
        document.querySelectorAll('.mp-actions-menu.visible').forEach(menu => {
            if (menu !== excludeMenu) {
                menu.classList.remove('visible');
                // menu.style.display = 'none'; // Управляется классом .visible в CSS
            }
        });
    }

     /**
     * Закрывает все открытые меню пользователя, кроме указанного.
     * @param {Element} [excludeMenu=null] - Меню, которое не нужно закрывать.
     */
     function closeAllUserMenus(excludeMenu = null) {
         document.querySelectorAll('.mp-user-menu.visible').forEach(menu => {
             if (menu !== excludeMenu) {
                 menu.classList.remove('visible');
                 // menu.style.display = 'none'; // Управляется классом .visible в CSS
             }
         });
     }


    // --- Точка входа ---
    try {
        // Проверяем, что DOM готов (хотя document-idle должен это гарантировать)
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            console.log('[App.js] DOM ready state is interactive or complete. Initializing...');
            initModernPosts();
        } else {
             console.log('[App.js] DOM not ready yet. Adding DOMContentLoaded listener...');
            document.addEventListener('DOMContentLoaded', initModernPosts, { once: true });
        }
    } catch (error) {
        console.error("[App.js] Critical error during initialization setup:", error);
         if (error.stack) {
             console.error(error.stack);
         }
    }

})();