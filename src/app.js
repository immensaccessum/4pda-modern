(function() {
    'use strict';

    console.log("[App.js] Modern Theme App.js starting...");

    /**
     * Создает HTML-строку для одного поста на основе предоставленных данных.
     * @param {object} postData - Объект с данными поста.
     * @returns {string} HTML-строка нового поста.
     */
    function createPostHtml(postData) {
        const defaultAvatar = 'https://st.4pda.to/wp-content/themes/4pda-blog/img/icon/avatar_default.png'; // Стандартная аватарка

        // Генерируем список действий для меню
        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');

        return `
            <article class="mp-post" data-post-id="${postData.postId}" data-author-id="${postData.authorId}">

              <header class="mp-header">
                <div class="mp-author-info">
                  <img class="mp-avatar" src="${postData.avatarUrl || defaultAvatar}" alt="Аватар ${postData.authorNick}" loading="lazy" onerror="this.src='${defaultAvatar}'; this.onerror=null;">
                  <div class="mp-author-details">
                    <div class="mp-author-line1">
                       <a class="mp-author-nick" href="${postData.authorProfileUrl}" data-user-id="${postData.authorId}">${postData.authorNick}</a>
                       <!-- Меню пользователя будет добавлено JS -->
                       <span class="mp-rep" title="Репутация: ${postData.reputation}"><a href="${postData.repHistoryUrl}" title="История репутации">⭐ ${postData.reputation}</a> <a href="${postData.repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a></span>
                    </div>
                    <div class="mp-author-line2">
                       <span class="mp-author-status" title="Статус">${postData.authorStatus}</span> |
                       <span class="mp-author-warnings" title="Предупреждения">${postData.authorWarnings}</span>
                    </div>
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
     * @param {Element} originalPostTable - Элемент <table> оригинального поста.
     * @returns {object|null} Объект с данными поста или null, если извлечь не удалось.
     */
     function extractPostData(originalPostTable) {
        try {
            const postId = originalPostTable.dataset.post;
            if (!postId) return null; // Необходим ID поста

            const data = {
                postId: postId,
                authorNick: '?',
                authorId: null,
                authorProfileUrl: '#',
                authorPmUrl: '#',
                avatarUrl: null,
                authorStatus: '',
                authorWarnings: '',
                reputation: '0',
                repHistoryUrl: '#',
                repPlusUrl: '#',
                ipAddress: '',
                postNumber: '?',
                postBodyHtml: '<p>Не удалось извлечь содержимое поста.</p>',
                creationDate: '',
                isEdited: false,
                editClass: '',
                editTooltip: '',
                actions: [],
                canModerate: false, // По умолчанию
            };

            // --- Извлечение данных ---

            // Ник, ID, Ссылки профиля/ЛС (из меню ника)
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            const userMenuContainer = document.getElementById(`post-member-${postId}_menu`); // Меню часто генерируется позже
            if (nickLink) {
                data.authorNick = nickLink.textContent.trim();
                data.authorProfileUrl = nickLink.href;
                // Пытаемся извлечь ID из ссылки профиля
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/);
                if (userIdMatch) {
                    data.authorId = userIdMatch[1];
                }
                // Пытаемся найти ссылки на ЛС и прочее в меню (если оно есть)
                if (userMenuContainer) {
                    const pmLink = userMenuContainer.querySelector('a[href*="act=qms"]');
                    if (pmLink) data.authorPmUrl = pmLink.href;
                } else {
                     // Альтернативный поиск ссылки на ЛС, если меню не найдено (менее надежно)
                     const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3 td.formbuttonrow:last-child`);
                     if (buttonsRow){
                         const qmsButton = buttonsRow.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`);
                         if(qmsButton) data.authorPmUrl = qmsButton.href;
                     }
                }

            }

            // Левая колонка пользователя (td.post1 первая)
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td.post1:first-child`);
            if (userInfoCell) {
                 // Аватар
                 const avatarImg = userInfoCell.querySelector('.user-avatar img');
                 if (avatarImg) data.avatarUrl = avatarImg.src;
                 // Статус/звание
                 const statusElem = userInfoCell.querySelector('.mem-title');
                 if (statusElem) data.authorStatus = statusElem.textContent.trim();
                 // Предупреждения - нет явного элемента в настольной версии? Используем Группу?
                 const groupElem = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Группа:'));
                 if (groupElem) {
                     const groupSpan = groupElem.nextElementSibling; // <span style="...">
                     if(groupSpan) data.authorWarnings = groupSpan.textContent.trim(); // Используем группу как Warnings пока
                 }
                 // Репутация
                 const repLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"] span[data-member-rep]');
                 if (repLink) data.reputation = repLink.textContent.trim();
                 const repHistoryLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"]');
                 if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
                 const repPlusImg = userInfoCell.querySelector('a[href*="act=rep&do=plus"] img[alt="+"]'); // Проверяем по alt
                 if (repPlusImg && repPlusImg.parentNode.tagName === 'A') data.repPlusUrl = repPlusImg.parentNode.href;

                 // IP Адрес
                 const ipLink = userInfoCell.querySelector('.post-field-ip a');
                 if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent.trim();
            }

             // Верхняя строка поста (td.row2 вторая)
             const postMetaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
             if (postMetaCell) {
                 // Номер поста
                 const postNumLink = postMetaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]');
                 if (postNumLink) data.postNumber = postNumLink.textContent.trim().replace('#','');
                 // Дата/Время
                 const dateNode = Array.from(postMetaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/));
                 if (dateNode) data.creationDate = dateNode.textContent.trim();
                 // Возможность модерировать (наличие чекбокса)
                 if (postMetaCell.querySelector('label.secheck input[name="selectedpids[]"]')) {
                     data.canModerate = true;
                 }
             }

            // Тело поста (td.post1 вторая)
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            if (postBodyCell) {
                const postContentDiv = postBodyCell.querySelector(`div.postcolor[id="post-${postId}"]`);
                if (postContentDiv) {
                    // Клонируем, чтобы не изменять оригинал
                    const clonedContent = postContentDiv.cloneNode(true);
                     // Проверяем и обрабатываем информацию о редактировании
                    const editSpan = clonedContent.querySelector('span.edit');
                    if (editSpan) {
                        data.isEdited = true;
                        data.editTooltip = editSpan.textContent.trim();
                        // Пытаемся определить, кем отредактировано
                        const editLink = editSpan.querySelector('a');
                        if (editLink && editLink.href.includes(`showuser=${data.authorId}`)) {
                            data.editClass = 'edited-by-self';
                        } else {
                             data.editClass = 'edited-by-other';
                        }
                        editSpan.remove(); // Удаляем span из основного контента
                    }
                    // Удаляем подпись из основного контента
                    const signatureDiv = clonedContent.querySelector('div.signature');
                    if(signatureDiv) signatureDiv.remove();

                    data.postBodyHtml = clonedContent.innerHTML; // Берем innerHTML без span.edit и signature
                }
            }

            // Кнопки действий (td.formbuttonrow вторая)
            const buttonsCell = originalPostTable.querySelector(`#pb-${postId}-r3 td.formbuttonrow:last-child`);
            if (buttonsCell) {
                buttonsCell.querySelectorAll('a.g-btn').forEach(button => {
                     // Пропускаем кнопки модерации, которые не нужны в меню
                    const btnText = button.textContent.trim();
                    const btnOnClick = button.getAttribute('onclick');
                    const btnHref = button.href || '#';

                    if (btnText === 'ИМЯ') return; // Пропускаем "Имя"
                    if (btnText === 'В ШАПКУ' || btnText === 'УЖЕ В ШАПКЕ') return;
                    if (button.classList.contains('pinlink')) return; // Пропускаем кнопку Пина
                    if (btnOnClick && (btnOnClick.includes('--seMODhide') || btnOnClick.includes('--seMODdel'))) return; // Пропускаем Скрыть/Удалить (модераторские)

                    let actionText = btnText;
                    let actionUrl = btnHref;
                    let actionOnClick = btnOnClick;

                    // Особая обработка "Цитировать"
                    if (button.matches('[data-quote-link]')) {
                        actionText = 'Цитировать';
                        actionUrl = '#'; // Ссылка не нужна, есть JS
                        // Нам нужен оригинальный onclick для pasteQ(), но он в onmouseover
                        const onMouseOver = button.getAttribute('onmouseover');
                         if (onMouseOver && onMouseOver.includes('copyQ')) {
                            // Вызываем copyQ сразу при клике и потом pasteQ
                             actionOnClick = `${onMouseOver.replace('copyQ', 'window.copyQ')} window.pasteQ(); return false;`;
                         } else {
                             actionOnClick = 'window.pasteQ(); return false;' // Запасной вариант
                         }
                    }
                     // Особая обработка "Изменить"
                     else if (button.id && button.id.startsWith('edit-but-')) {
                         actionText = 'Изменить';
                         // Проверяем, есть ли быстрое редактирование
                         const quickEditLink = document.querySelector(`#${button.id}_menu a[onclick*='ajax_prep_for_edit']`);
                         if (quickEditLink) {
                              actionOnClick = quickEditLink.getAttribute('onclick'); // Берем onclick быстрой редакции
                              actionUrl = '#';
                         } else {
                              // Если быстрого нет, берем ссылку на полное
                              actionUrl = button.href;
                              actionOnClick = null;
                         }

                     }
                     // Кнопка "Жалоба"
                      else if (btnText === 'ЖАЛОБА') {
                          actionText = 'Жалоба';
                          actionUrl = button.href;
                          actionOnClick = null;
                      }
                     // Другие кнопки (если появятся)
                      else {
                          actionText = btnText || button.title || 'Действие';
                      }


                    // Добавляем только валидные действия
                    if (actionText && (actionUrl !== '#' || actionOnClick)) {
                        data.actions.push({
                             text: actionText,
                             url: actionUrl,
                             onclick: actionOnClick ? actionOnClick.replace(/"/g, "'") : null // Заменяем кавычки для HTML атрибута
                        });
                    }

                });
            }


            return data;

        } catch (error) {
            console.error(`Error extracting data for post table:`, originalPostTable, error);
            return null; // Возвращаем null в случае ошибки
        }
    }


    /**
     * Инициализирует замену старых постов на новые.
     */
    function initModernPosts() {
        console.log("[App.js] initModernPosts called");

        // Селекторы для настольной версии
        const mainPostsSelector = 'body > div#ipbwrapper table.ipbtable[data-post]:not(#topic-pin-content table.ipbtable[data-post])'; // Основные посты (исключая вложенные в закреп)
        const pinnedPostSelector = 'body > div#ipbwrapper #topic-pin-content > table.ipbtable[data-post]'; // Закрепленный пост

        // Объединяем результаты поиска
        const originalPosts = Array.from(document.querySelectorAll(`${pinnedPostSelector}, ${mainPostsSelector}`));

        console.log(`[App.js] Found ${originalPosts.length} original post tables.`);

        if (originalPosts.length === 0) {
            console.warn("[App.js] No original posts (tables with data-post) found on the page. Target selectors might need adjustment.");
            return;
        }

        const fragment = document.createDocumentFragment(); // Используем фрагмент для производительности

        originalPosts.forEach((originalPostTable, index) => {
             console.log(`[App.js] Processing post table ${index + 1}/${originalPosts.length}, ID: ${originalPostTable.dataset.post}`);

            // --- Извлекаем реальные данные ---
            const postData = extractPostData(originalPostTable);

            if (!postData) {
                 console.warn(`[App.js] Failed to extract data for post table ${index + 1}, skipping.`);
                 // Можно оставить оригинальный пост видимым в случае ошибки
                 originalPostTable.style.display = '';
                 originalPostTable.style.visibility = 'visible';
                 return; // Переходим к следующему посту
            }
            // ---------------------------------


            // Генерируем HTML нового поста
            const newPostHtml = createPostHtml(postData);

            // Создаем DOM-элемент из HTML-строки
            // Безопаснее создавать контейнер и вставлять HTML в него
            const tempContainer = document.createElement('div'); // Временный контейнер
            tempContainer.innerHTML = newPostHtml; // Парсер браузера создаст DOM внутри
            const newPostElement = tempContainer.firstElementChild; // Берем наш <article>

            // Заменяем ОРИГИНАЛЬНУЮ ТАБЛИЦУ поста на наш новый элемент <article>
            if (newPostElement && originalPostTable.parentNode) {
                originalPostTable.replaceWith(newPostElement); // Современный метод замены
                 console.log(`[App.js] Replaced post table ${postData.postId} with new article.`);
            } else {
                console.error("[App.js] Failed to create or replace new post element for post ID:", postData.postId);
                 // Если не удалось заменить, показываем оригинал
                 originalPostTable.style.display = '';
                 originalPostTable.style.visibility = 'visible';
            }
        });

        // После добавления всех постов, навешиваем обработчики событий
        addEventListeners();
    }

    /**
     * Добавляет обработчики событий к новым элементам.
     */
    function addEventListeners() {
        console.log("[App.js] Adding event listeners...");

        // Обработка клика на триггер меню действий
        document.querySelectorAll('.mp-actions-trigger').forEach(trigger => {
            trigger.addEventListener('click', handleActionMenuToggle);
        });

        // Обработка клика на ник для меню пользователя
         document.querySelectorAll('.mp-author-nick').forEach(nickLink => {
             nickLink.addEventListener('click', handleUserMenuToggle);
         });

        // Глобальный обработчик для закрытия меню по клику вне их
        document.addEventListener('click', closeAllMenusOnClickOutside);

        // Остановка всплытия клика внутри меню, чтобы оно не закрывалось
        document.querySelectorAll('.mp-actions-menu, .mp-user-menu').forEach(menu => {
             menu.addEventListener('click', (e) => e.stopPropagation());
        });

         // Обработчик для спойлеров
         document.querySelectorAll('.mp-body .sp-head').forEach(header => {
            header.addEventListener('click', () => {
                const spoilerBody = header.nextElementSibling;
                if (spoilerBody && spoilerBody.classList.contains('sp-body')) {
                    spoilerBody.classList.toggle('open');
                    header.classList.toggle('open'); // Можно добавить класс и к шапке для стилизации
                    // Меняем стиль display напрямую
                    spoilerBody.style.display = spoilerBody.classList.contains('open') ? 'block' : 'none';
                }
            });
         });

        console.log("[App.js] Event listeners added.");
    }

    /**
     * Обработчик клика на триггер меню действий.
     * @param {Event} e - Событие клика.
     */
    function handleActionMenuToggle(e) {
        e.stopPropagation();
        const trigger = e.currentTarget;
        const menu = trigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
        if (!menu) return;

        closeAllUserMenus(); // Закрываем меню пользователя
        closeAllActionMenus(menu); // Закрываем другие меню действий
        menu.classList.toggle('visible');
    }

    /**
     * Обработчик клика на ник пользователя для показа меню.
     * @param {Event} e - Событие клика.
     */
    function handleUserMenuToggle(e) {
         e.preventDefault(); // Предотвращаем переход по ссылке ника
         e.stopPropagation();
         const nickLink = e.currentTarget;
         const postElement = nickLink.closest('.mp-post');
         if (!postElement) return;

         closeAllActionMenus(); // Закрываем меню действий

         let userMenu = postElement.querySelector('.mp-user-menu');

         if (userMenu) {
             // Если меню уже есть, просто переключаем видимость
             userMenu.classList.toggle('visible');
             positionMenu(nickLink, userMenu); // Позиционируем при каждом открытии
         } else {
             // Если меню нет, создаем его
             console.log("[App.js] Creating user menu for user ID:", nickLink.dataset.userId);
             userMenu = createUserMenu(postElement); // Функция создания меню
             if (userMenu) {
                 nickLink.after(userMenu); // Вставляем меню после ссылки на ник
                 positionMenu(nickLink, userMenu); // Позиционируем
                 // Небольшая задержка перед добавлением класса visible, чтобы сработало позиционирование
                 setTimeout(() => {
                    userMenu.classList.add('visible');
                 }, 0);
             }
         }

         // Закрываем другие меню пользователя
         closeAllUserMenus(userMenu);
    }


     /**
     * Создает DOM элемент меню пользователя.
     * @param {Element} postElement - Элемент поста <article>.
     * @returns {Element|null} - Сгенерированный элемент <ul> меню или null.
     */
     function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId;
        const profileUrl = postElement.querySelector('.mp-author-nick')?.href || '#';
        const pmUrl = '#'; // TODO: Извлечь реальную ссылку на ЛС
        const repElement = postElement.querySelector('.mp-rep');
        const reputation = repElement?.textContent.match(/⭐\s*(\d+)/)?.[1] || '0';
        const repHistoryUrl = repElement?.querySelector('a[title*="История"]')?.href || '#';
        const repPlusUrl = repElement?.querySelector('a.rep-plus')?.href || '#';


        if (!authorId) return null;

        const menu = document.createElement('ul');
        menu.className = 'mp-user-menu';
        menu.innerHTML = `
            <li><a href="${profileUrl}">Профиль</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="_blank">Сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1">Найти сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&source=top&username=${encodeURIComponent(postElement.querySelector('.mp-author-nick')?.textContent || '')}&result=topics&noform=1">Найти темы</a></li>
            <hr>
            <li class="rep-item">
                <span class="rep-value"><a href="${repHistoryUrl}" title="История репутации">⭐ ${reputation}</a></span>
                ${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}
            </li>
        `;
         // Добавляем обработчик для кнопки "+" репутации, если она есть
         const plusButton = menu.querySelector('.rep-plus');
         if (plusButton) {
             plusButton.addEventListener('click', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 // TODO: Возможно, открыть ссылку в маленьком окне или просто перейти?
                 window.open(plusButton.href, `rep_${authorId}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
                 closeAllMenusOnClickOutside(); // Закрыть меню после клика
             });
         }

        return menu;
     }


    /**
     * Позиционирует меню относительно элемента-триггера.
     * @param {Element} triggerElement - Элемент, вызвавший меню (ник, кнопка).
     * @param {Element} menuElement - Элемент меню.
     */
    function positionMenu(triggerElement, menuElement) {
         const triggerRect = triggerElement.getBoundingClientRect();
         menuElement.style.position = 'absolute'; // Убедимся, что позиционирование абсолютное
         menuElement.style.top = `${triggerRect.height + 2}px`; // Под триггером с отступом
         menuElement.style.left = `0px`; // По левому краю триггера
         menuElement.style.display = ''; // Убираем display: none, если был
    }


    /**
     * Закрывает все открытые меню (действий и пользователя) при клике вне их.
     * @param {Event} e - Событие клика.
     */
    function closeAllMenusOnClickOutside(e) {
        // Проверяем, был ли клик ВНУТРИ какого-либо меню или триггера
        if (e && (e.target.closest('.mp-actions-menu, .mp-user-menu, .mp-actions-trigger, .mp-author-nick'))) {
             return; // Если клик внутри, ничего не делаем
        }
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
             }
         });
     }


    // --- Точка входа ---
    // Используем @run-at document-idle в лоадере, так что DOM точно готов.
    // Дополнительно обернем в try...catch на всякий случай.
    try {
        initModernPosts();
    } catch (error) {
        console.error("[App.js] Critical error during initialization:", error);
         if (error.stack) {
             console.error(error.stack);
         }
    }

})();