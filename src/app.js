(function() {
    'use strict';

    console.log("Modern Theme App.js starting...");

    /**
     * Создает HTML-строку для одного поста на основе предоставленных данных.
     * @param {object} postData - Объект с данными поста.
     * @returns {string} HTML-строка нового поста.
     */
    function createPostHtml(postData) {
        // !! ВАЖНО: Это пока ЗАГЛУШКА, реальные данные будут извлекаться позже !!
        const defaultAvatar = 'https://st.4pda.to/wp-content/themes/4pda-blog/img/icon/avatar_default.png'; // Стандартная аватарка

        // Генерируем список действий для меню
        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');

        return `
            <article class="mp-post" data-post-id="${postData.postId}" data-author-id="${postData.authorId}">

              <header class="mp-header">
                <div class="mp-author-info">
                  <img class="mp-avatar" src="${postData.avatarUrl || defaultAvatar}" alt="Аватар ${postData.authorNick}" loading="lazy">
                  <div class="mp-author-details">
                    <div class="mp-author-line1">
                       <a class="mp-author-nick" href="${postData.authorProfileUrl}" data-user-id="${postData.authorId}">${postData.authorNick}</a>
                       <!-- Меню пользователя будет добавлено JS -->
                       <span class="mp-rep" title="Репутация: ${postData.reputation}">⭐ ${postData.reputation}</span> <!-- Временно репутацию сюда -->
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
                      <label class="mp-secheck" style="${postData.canModerate ? 'display: inline-block;' : ''}"><input type="checkbox" name="selectedpids[]" value="${postData.postId}"><i class="check"></i></label>
                   </div>
                   <div class="mp-actions-menu-container">
                      <button class="mp-actions-trigger" aria-label="Действия с постом" title="Действия">⋮</button>
                      <ul class="mp-actions-menu">${actionsHtml}</ul>
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
     * Инициализирует замену старых постов на новые.
     */
    function initModernPosts() {
        console.log("initModernPosts called");
        const originalPosts = document.querySelectorAll('div.post_container[data-post]');
        console.log(`Found ${originalPosts.length} original posts.`);

        if (originalPosts.length === 0) {
            console.warn("No original posts found on the page.");
            // Возможно, стоит скрыть индикатор загрузки или показать сообщение
            return;
        }

        // Пока нет парсера, используем заглушки для первого поста для теста
        let postCounter = 1;
        originalPosts.forEach(originalPost => {
            // !!! НАЧАЛО БЛОКА ЗАГЛУШЕК ДАННЫХ !!!
            // В будущем здесь будет код извлечения реальных данных из originalPost
            const placeholderData = {
                postId: originalPost.dataset.post || `fake${postCounter}`,
                authorNick: `Автор ${postCounter}`,
                authorId: `1234${postCounter}`,
                authorProfileUrl: '#author-profile',
                authorPmUrl: '#author-pm',
                avatarUrl: null, // Будет использована дефолтная
                authorStatus: 'Пользователь',
                authorWarnings: '(0%)',
                reputation: postCounter * 5,
                repHistoryUrl: '#rep-history',
                repPlusUrl: '#rep-plus',
                ipAddress: '127.0.0.1',
                postNumber: postCounter,
                postBodyHtml: `<p>Это текст поста номер ${postCounter}. Здесь может быть <b>форматирование</b>, <a href="#">ссылки</a> и прочее.</p><blockquote><p>А это цитата внутри поста.</p></blockquote>`,
                creationDate: `Сегодня, 1${postCounter}:00`,
                isEdited: postCounter % 3 === 0, // Редактирован каждый 3й пост для примера
                editClass: postCounter % 3 === 0 ? (postCounter % 2 === 0 ? 'edited-by-other' : 'edited-by-self') : '',
                editTooltip: postCounter % 3 === 0 ? `Отредактировано ${postCounter % 2 === 0 ? 'Модератором' : 'Автором'} вчера` : '',
                actions: [
                    { text: 'Цитировать', url: '#quote', onclick: null },
                    { text: 'Редактировать', url: '#edit', onclick: null },
                    { text: 'Жалоба', url: '#report', onclick: null },
                ],
                canModerate: postCounter % 5 === 0 // Показываем чекбокс каждому 5-му
            };
            // !!! КОНЕЦ БЛОКА ЗАГЛУШЕК ДАННЫХ !!!

            const postData = placeholderData; // Пока используем заглушку
            postCounter++;

            // Генерируем HTML нового поста
            const newPostHtml = createPostHtml(postData);

            // Создаем DOM-элемент из HTML-строки
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newPostHtml.trim();
            const newPostElement = tempDiv.firstChild;

            // Заменяем старый пост новым
            if (newPostElement) {
                originalPost.parentNode.replaceChild(newPostElement, originalPost);
            } else {
                console.error("Failed to create new post element for post ID:", postData.postId);
            }
        });

        // После добавления всех постов, навешиваем обработчики событий
        addEventListeners();
    }

    /**
     * Добавляет обработчики событий к новым элементам.
     */
    function addEventListeners() {
        console.log("Adding event listeners...");

        // Обработка клика на триггер меню действий
        document.querySelectorAll('.mp-actions-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем закрытие по клику на сам триггер
                const menu = trigger.nextElementSibling; // Находим меню (.mp-actions-menu)
                if (menu) {
                    // Закрываем все другие открытые меню действий
                    closeAllActionMenus(menu);
                    // Переключаем видимость текущего меню
                    menu.classList.toggle('visible');
                }
            });
        });

        // TODO: Добавить обработчик для меню пользователя (по клику на ник?)

        // Глобальный обработчик для закрытия меню по клику вне его
        document.addEventListener('click', (e) => {
            closeAllActionMenus();
            // TODO: Закрывать и меню пользователя
        });

        // Остановка всплытия клика внутри меню, чтобы оно не закрывалось
        document.querySelectorAll('.mp-actions-menu').forEach(menu => {
             menu.addEventListener('click', (e) => e.stopPropagation());
        });
         // TODO: Остановка всплытия и для меню пользователя
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


    // --- Точка входа ---
    // Дожидаемся полной загрузки страницы (включая стили и картинки),
    // хотя initModernPosts может запуститься и раньше (по DOMContentLoaded из лоадера)
    // Если стили из лоадера применились, можно запускать замену постов.
    // Если лоадер использует DOMContentLoaded, то этот код тоже выполнится после него.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModernPosts);
    } else {
        // DOM уже загружен
        initModernPosts();
    }

})();