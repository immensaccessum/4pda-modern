(function() {
    'use strict';

    console.log("[App.js] Modern Theme App.js starting...");

    // --- Функция createPostHtml (без изменений) ---
    function createPostHtml(postData) {
        const defaultAvatar = 'https://st.4pda.to/wp-content/themes/4pda-blog/img/icon/avatar_default.png';
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

    // --- Функция extractPostData (без изменений) ---
    function extractPostData(originalPostTable) {
        try {
            const postId = originalPostTable.dataset.post;
            if (!postId) return null;

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
                canModerate: false,
            };

            // Ник, ID, Ссылки профиля/ЛС
            const nickLink = originalPostTable.querySelector(`#post-member-${postId} span.normalname a`);
            const userMenuContainer = document.getElementById(`post-member-${postId}_menu`);
            if (nickLink) {
                data.authorNick = nickLink.textContent.trim();
                data.authorProfileUrl = nickLink.href;
                const userIdMatch = data.authorProfileUrl.match(/showuser=(\d+)/);
                if (userIdMatch) {
                    data.authorId = userIdMatch[1];
                }
                if (userMenuContainer) {
                    const pmLink = userMenuContainer.querySelector('a[href*="act=qms"]');
                    if (pmLink) data.authorPmUrl = pmLink.href;
                } else {
                     const buttonsRow = originalPostTable.querySelector(`#pb-${postId}-r3 td.formbuttonrow:last-child`);
                     if (buttonsRow){
                         const qmsButton = buttonsRow.querySelector(`a[href*="act=qms&mid=${data.authorId}"]`);
                         if(qmsButton) data.authorPmUrl = qmsButton.href;
                     }
                }
            }

            // Левая колонка пользователя
            const userInfoCell = originalPostTable.querySelector(`#pb-${postId}-r2 td.post1:first-child`);
            if (userInfoCell) {
                 const avatarImg = userInfoCell.querySelector('.user-avatar img');
                 if (avatarImg) data.avatarUrl = avatarImg.src;
                 const statusElem = userInfoCell.querySelector('.mem-title');
                 if (statusElem) data.authorStatus = statusElem.textContent.trim();
                 const groupElem = Array.from(userInfoCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Группа:'));
                 if (groupElem) {
                     const groupSpan = groupElem.nextElementSibling;
                     if(groupSpan) data.authorWarnings = groupSpan.textContent.trim();
                 }
                 const repLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"] span[data-member-rep]');
                 if (repLink) data.reputation = repLink.textContent.trim();
                 const repHistoryLink = userInfoCell.querySelector('a[href*="act=rep"][title*="репутацию"]');
                 if (repHistoryLink) data.repHistoryUrl = repHistoryLink.href;
                 const repPlusAnchor = userInfoCell.querySelector('a[href*="act=rep&do=plus"]'); // Ищем ссылку для плюса
                 if (repPlusAnchor) data.repPlusUrl = repPlusAnchor.href;

                 const ipLink = userInfoCell.querySelector('.post-field-ip a');
                 if (ipLink) data.ipAddress = ipLink.title || ipLink.textContent.trim();
            }

             // Верхняя строка поста
             const postMetaCell = originalPostTable.querySelector(`#ph-${postId}-d2`);
             if (postMetaCell) {
                 const postNumLink = postMetaCell.querySelector('div[style="float:right"] a[onclick*="link_to_post"]');
                 if (postNumLink) data.postNumber = postNumLink.textContent.trim().replace('#','');
                 const dateNode = Array.from(postMetaCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().match(/(\d{1,2}\.\d{1,2}\.\d{2,4}|\Сегодня|\Вчера)/));
                 if (dateNode) data.creationDate = dateNode.textContent.trim();
                 if (postMetaCell.querySelector('label.secheck input[name="selectedpids[]"]')) {
                     data.canModerate = true;
                 }
             }

            // Тело поста
            const postBodyCell = originalPostTable.querySelector(`#post-main-${postId}`);
            if (postBodyCell) {
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
                        editSpan.remove();
                    }
                    const signatureDiv = clonedContent.querySelector('div.signature');
                    if(signatureDiv) signatureDiv.remove();
                    data.postBodyHtml = clonedContent.innerHTML;
                }
            }

            // Кнопки действий
            const buttonsCell = originalPostTable.querySelector(`#pb-${postId}-r3 td.formbuttonrow:last-child`);
            if (buttonsCell) {
                buttonsCell.querySelectorAll('a.g-btn').forEach(button => {
                    const btnText = button.textContent.trim();
                    const btnOnClick = button.getAttribute('onclick');
                    const btnHref = button.href || '#';

                    if (btnText === 'ИМЯ') return;
                    if (btnText === 'В ШАПКУ' || btnText === 'УЖЕ В ШАПКЕ') return;
                    if (button.classList.contains('pinlink')) return;
                    if (btnOnClick && (btnOnClick.includes('--seMODhide') || btnOnClick.includes('--seMODdel'))) return;

                    let actionText = btnText;
                    let actionUrl = btnHref;
                    let actionOnClick = btnOnClick ? btnOnClick.replace(/"/g, "'") : null; // Заменяем кавычки сразу

                    if (button.matches('[data-quote-link]')) {
                        actionText = 'Цитировать';
                        actionUrl = '#';
                        const onMouseOver = button.getAttribute('onmouseover');
                         if (onMouseOver && onMouseOver.includes('copyQ')) {
                             actionOnClick = `${onMouseOver.replace('copyQ', 'window.copyQ').replace(/"/g, "'")} window.pasteQ(); return false;`;
                         } else {
                             actionOnClick = 'window.pasteQ(); return false;';
                         }
                    } else if (button.id && button.id.startsWith('edit-but-')) {
                         actionText = 'Изменить';
                         const quickEditLink = document.querySelector(`#${button.id}_menu a[onclick*='ajax_prep_for_edit']`);
                         if (quickEditLink) {
                              actionOnClick = quickEditLink.getAttribute('onclick').replace(/"/g, "'");
                              actionUrl = '#';
                         } else {
                              actionUrl = button.href;
                              actionOnClick = null;
                         }
                    } else if (btnText === 'ЖАЛОБА') {
                          actionText = 'Жалоба';
                          actionUrl = button.href;
                          actionOnClick = null;
                    } else if (!actionText && button.title) {
                         // Если текста нет, но есть title (например, для иконочных кнопок)
                         actionText = button.title;
                    }

                    if (actionText && (actionUrl !== '#' || actionOnClick)) {
                        data.actions.push({ text: actionText, url: actionUrl, onclick: actionOnClick });
                    }
                });
            }

            return data;

        } catch (error) {
            console.error(`[App.js] Error extracting data for post table ID ${originalPostTable?.dataset?.post}:`, originalPostTable, error);
            return null;
        }
    }


    /**
     * Инициализирует замену старых постов на новые.
     */
    function initModernPosts() {
        console.log("[App.js] initModernPosts called");

        // --- НОВЫЕ, БОЛЕЕ ПРОСТЫЕ СЕЛЕКТОРЫ ---
        const pinnedPostSelector = '#topic-pin-content > table.ipbtable[data-post]'; // Закрепленный пост
        // Находим ВСЕ таблицы с data-post, а потом отфильтруем закрепленный, если он есть
        const allPostTables = document.querySelectorAll('table.ipbtable[data-post]');
        // ----------------------------------------

        const pinnedPostElement = document.querySelector(pinnedPostSelector);
        let originalPosts = Array.from(allPostTables);

        // Если есть закрепленный пост, убедимся, что он первый в списке и остальные не включают его
        if (pinnedPostElement) {
            originalPosts = originalPosts.filter(el => el !== pinnedPostElement); // Убираем его из основного списка
            originalPosts.unshift(pinnedPostElement); // Ставим его в начало
            console.log(`[App.js] Found pinned post ID: ${pinnedPostElement.dataset.post}`);
        }

        console.log(`[App.js] Found ${originalPosts.length} total post tables to process.`);

        if (originalPosts.length === 0) {
            console.warn("[App.js] No post tables found with 'data-post' attribute. The page structure might have changed or the selectors are still incorrect.");
            return;
        }

        const postsToReplace = []; // Собираем пары [оригинал, новый]

        originalPosts.forEach((originalPostTable, index) => {
             console.log(`[App.js] Processing post table ${index + 1}/${originalPosts.length}, ID: ${originalPostTable.dataset.post}`);

            // --- Извлекаем реальные данные ---
            const postData = extractPostData(originalPostTable);

            if (!postData) {
                 console.warn(`[App.js] Failed to extract data for post table ${index + 1} (ID: ${originalPostTable.dataset.post}), skipping replacement.`);
                 // Показываем оригинал, если не смогли извлечь данные
                 originalPostTable.style.display = '';
                 originalPostTable.style.visibility = 'visible';
                 return; // Переходим к следующему посту
            }
            // ---------------------------------

            // Генерируем HTML нового поста
            const newPostHtml = createPostHtml(postData);
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = newPostHtml;
            const newPostElement = tempContainer.firstElementChild;

            if (newPostElement) {
                postsToReplace.push({ original: originalPostTable, new: newPostElement });
            } else {
                console.error("[App.js] Failed to create new post element for post ID:", postData.postId);
                // Показываем оригинал, если не смогли создать новый
                originalPostTable.style.display = '';
                originalPostTable.style.visibility = 'visible';
            }
        });

        // Выполняем замену всех постов за один проход (чуть лучше для рендеринга)
        console.log(`[App.js] Replacing ${postsToReplace.length} posts...`);
        postsToReplace.forEach(pair => {
            if (pair.original.parentNode) {
                pair.original.replaceWith(pair.new);
                // console.log(`[App.js] Replaced post table ${pair.new.dataset.postId}.`);
            } else {
                 console.warn(`[App.js] Original post table ID ${pair.original.dataset.post} has no parentNode, cannot replace.`);
            }
        });
        console.log(`[App.js] Replacement finished.`);


        // После добавления всех постов, навешиваем обработчики событий
        addEventListeners();
    }

    // --- Функции addEventListeners, handleActionMenuToggle, handleUserMenuToggle, createUserMenu, positionMenu, closeAllMenusOnClickOutside, closeAllActionMenus, closeAllUserMenus (без изменений) ---
    function addEventListeners() {
        console.log("[App.js] Adding event listeners...");

        // Меню действий
        document.querySelectorAll('.mp-actions-trigger').forEach(trigger => {
            trigger.addEventListener('click', handleActionMenuToggle);
        });

        // Меню пользователя
         document.querySelectorAll('.mp-author-nick').forEach(nickLink => {
             // Убираем предыдущий листенер, если он был (на всякий случай)
             nickLink.removeEventListener('click', handleUserMenuToggle);
             nickLink.addEventListener('click', handleUserMenuToggle);
         });

        // Закрытие меню
        document.removeEventListener('click', closeAllMenusOnClickOutside); // Убираем старый, если был
        document.addEventListener('click', closeAllMenusOnClickOutside);

        // Остановка всплытия
        document.querySelectorAll('.mp-actions-menu, .mp-user-menu').forEach(menu => {
             menu.removeEventListener('click', stopPropagation); // Убираем старый
             menu.addEventListener('click', stopPropagation);
        });

         // Спойлеры
         document.querySelectorAll('.mp-body .sp-head').forEach(header => {
             header.removeEventListener('click', handleSpoilerToggle); // Убираем старый
             header.addEventListener('click', handleSpoilerToggle);
         });

        console.log("[App.js] Event listeners added/updated.");
    }

    function stopPropagation(e) {
         e.stopPropagation();
    }

    function handleSpoilerToggle(e){
        const header = e.currentTarget;
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody && spoilerBody.classList.contains('sp-body')) {
            const isOpen = spoilerBody.classList.toggle('open');
            header.classList.toggle('open', isOpen);
            spoilerBody.style.display = isOpen ? 'block' : 'none';
        }
    }

    function handleActionMenuToggle(e) {
        e.stopPropagation();
        const trigger = e.currentTarget;
        const menu = trigger.closest('.mp-actions-menu-container')?.querySelector('.mp-actions-menu');
        if (!menu) return;
        const isVisible = menu.classList.contains('visible');
        closeAllMenusOnClickOutside(); // Закрываем все перед открытием/закрытием текущего
        if (!isVisible) { // Если было закрыто, открываем
             menu.classList.add('visible');
             positionMenu(trigger, menu); // Позиционируем при открытии
        }
    }

    function handleUserMenuToggle(e) {
         e.preventDefault();
         e.stopPropagation();
         const nickLink = e.currentTarget;
         const postElement = nickLink.closest('.mp-post');
         if (!postElement) return;

         let userMenu = postElement.querySelector('.mp-user-menu');
         const isVisible = userMenu && userMenu.classList.contains('visible');

         closeAllMenusOnClickOutside(); // Закрываем все перед открытием/закрытием текущего

         if (!isVisible) { // Если было закрыто или не существует
             if (!userMenu) { // Создаем, если не существует
                 console.log("[App.js] Creating user menu for user ID:", nickLink.dataset.userId);
                 userMenu = createUserMenu(postElement);
                 if (userMenu) {
                    // Вставляем не после ника, а в конец .mp-author-details для лучшего позиционирования
                    const detailsContainer = nickLink.closest('.mp-author-details');
                    if (detailsContainer) {
                        detailsContainer.style.position = 'relative'; // Родитель должен быть позиционирован
                        detailsContainer.appendChild(userMenu);
                    } else {
                        // Запасной вариант - вставить после ника (менее надежно для позиционирования)
                        nickLink.after(userMenu);
                    }

                 } else {
                      console.error("[App.js] Failed to create user menu.");
                      return; // Нечего показывать
                 }
             }
              // Позиционируем и показываем
             positionMenu(nickLink, userMenu);
             setTimeout(() => { // Небольшая задержка для рендеринга перед показом
                 userMenu.classList.add('visible');
             }, 0);
         }
    }

    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId;
        const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#';
        const authorNick = nickElement?.textContent || '';
        // Извлекаем данные о репутации из .mp-rep внутри поста
        const repElement = postElement.querySelector('.mp-rep');
        const reputation = repElement?.textContent.match(/⭐\s*([\d\.\,]+)/)?.[1] || '0'; // Учитываем разделители
        const repHistoryUrl = repElement?.querySelector('a[title*="История"]')?.href || '#';
        const repPlusUrl = repElement?.querySelector('a.rep-plus')?.href || '#';


        if (!authorId) return null;

        const menu = document.createElement('ul');
        menu.className = 'mp-user-menu';
        // Используем URL поиска с ID автора, так как ссылка на ЛС может быть сложной
        menu.innerHTML = `
            <li><a href="${profileUrl}">Профиль</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li>
            <li><a href="https://4pda.to/forum/index.php?act=search&source=top&search_author=${encodeURIComponent(authorNick)}&result=topics&noform=1" target="_blank">Найти темы</a></li>
            <hr>
            <li class="rep-item">
                <span class="rep-value"><a href="${repHistoryUrl}" title="История репутации">⭐ ${reputation}</a></span>
                ${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}
            </li>
        `;
         const plusButton = menu.querySelector('.rep-plus');
         if (plusButton) {
             plusButton.removeEventListener('click', handleRepPlusClick); // Убираем старый листенер
             plusButton.addEventListener('click', handleRepPlusClick);
         }

        return menu;
     }

     function handleRepPlusClick(e) {
         e.preventDefault();
         e.stopPropagation();
         const button = e.currentTarget;
         const authorId = button.closest('.mp-post')?.dataset?.authorId;
         // Открываем в новом окне
         window.open(button.href, `rep_${authorId || Math.random()}`, 'width=500,height=300,resizable=yes,scrollbars=yes');
         closeAllMenusOnClickOutside(); // Закрыть меню
     }

    function positionMenu(triggerElement, menuElement) {
         const triggerRect = triggerElement.getBoundingClientRect();
         const container = menuElement.offsetParent || document.body; // Родитель, относительно которого позиционируем
         const containerRect = container.getBoundingClientRect();

         // Сбрасываем стили перед расчетом
         menuElement.style.position = 'absolute';
         menuElement.style.top = 'auto';
         menuElement.style.left = 'auto';
         menuElement.style.right = 'auto';
         menuElement.style.bottom = 'auto';
         menuElement.style.display = 'block'; // Показываем для расчета размеров

         const menuHeight = menuElement.offsetHeight;
         const menuWidth = menuElement.offsetWidth;

         // По умолчанию - под триггером, слева
         let top = triggerRect.bottom - containerRect.top + window.scrollY + 2; // +2px отступ
         let left = triggerRect.left - containerRect.left + window.scrollX;

         // Проверяем, влезает ли по высоте снизу
         if (top + menuHeight > window.innerHeight + window.scrollY) {
             // Если не влезает, пытаемся разместить сверху
             top = triggerRect.top - containerRect.top + window.scrollY - menuHeight - 2;
         }

         // Проверяем, влезает ли по ширине справа
         if (left + menuWidth > window.innerWidth + window.scrollX) {
              // Если не влезает, выравниваем по правому краю триггера
              left = triggerRect.right - containerRect.left + window.scrollX - menuWidth;
         }

         // Применяем рассчитанные координаты
         menuElement.style.top = `${top}px`;
         menuElement.style.left = `${left}px`;

         // Скрываем обратно перед применением класса 'visible'
         menuElement.style.display = 'none';
    }


    function closeAllMenusOnClickOutside(e) {
        // Если клик был по триггеру, не закрываем (обработчик триггера сам разберется)
        if (e && e.target.closest('.mp-actions-trigger, .mp-author-nick')) {
             return;
        }
        // Если клик был внутри меню, тоже не закрываем
        if (e && e.target.closest('.mp-actions-menu, .mp-user-menu')) {
            return;
        }
        // Иначе закрываем все
        closeAllActionMenus();
        closeAllUserMenus();
    }

    function closeAllActionMenus(excludeMenu = null) {
        document.querySelectorAll('.mp-actions-menu.visible').forEach(menu => {
            if (menu !== excludeMenu) {
                menu.classList.remove('visible');
                menu.style.display = 'none'; // Дополнительно скрываем
            }
        });
    }

     function closeAllUserMenus(excludeMenu = null) {
         document.querySelectorAll('.mp-user-menu.visible').forEach(menu => {
             if (menu !== excludeMenu) {
                 menu.classList.remove('visible');
                 menu.style.display = 'none'; // Дополнительно скрываем
             }
         });
     }


    // --- Точка входа ---
    try {
        // Проверяем, что DOM готов (хотя document-idle должен это гарантировать)
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            initModernPosts();
        } else {
            document.addEventListener('DOMContentLoaded', initModernPosts, { once: true });
        }
    } catch (error) {
        console.error("[App.js] Critical error during initialization setup:", error);
         if (error.stack) {
             console.error(error.stack);
         }
    }

})();