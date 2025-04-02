(function() {
    'use strict';

    const SCRIPT_NAME = '4pda Modern Theme App';
    const SCRIPT_VERSION = '2.0-mockup'; // Версия для отладки UI болванки
    const LOG_PREFIX = `[${SCRIPT_NAME} v${SCRIPT_VERSION}]`;

    console.log(`${LOG_PREFIX} Script starting... Running MOCKUP version.`);

    /**
     * ========================================================================
     * ДАННЫЕ-ЗАГЛУШКИ (Mock Data)
     * ========================================================================
     */
    const mockPostDataArray = [
        {
            postId: 'mock1', authorNick: 'Тестер_1', authorId: '1001', authorProfileUrl: '#user1', authorPmUrl: '#pm1',
            avatarUrl: null, // Будет SVG заглушка
            authorStatus: 'Гуру', authorGroup: 'Модератор', reputation: '1024',
            repHistoryUrl: '#hist1', repPlusUrl: '#plus1', ipAddress: '192.168.0.1', postNumber: '1',
            postBodyHtml: `<p>Это тело первого поста-заглушки.</p><p>Содержит <b>форматирование</b> и <a href="#">ссылку</a>.</p><div class="spoiler"><button class="sp-head"><span><span>Спойлер (Нажми меня)</span></span></button><div class="sp-body" style="display: none;"><p>Скрытое содержимое спойлера.</p></div></div><p>Текст после спойлера.</p>`,
            creationDate: 'Сегодня, 10:00', isEdited: false, editClass: '', editTooltip: '', editReason: '',
            actions: [ { text: 'Хорошо!', url: '#', onclick: "alert('Karma+')" }, { text: 'Изменить', url: '#edit1', onclick: null }, { text: 'Жалоба', url: '#report1', onclick: null } ],
            canModerate: true,
        },
        {
            postId: 'mock2', authorNick: 'Другой_Юзер', authorId: '1002', authorProfileUrl: '#user2', authorPmUrl: '#pm2',
            avatarUrl: 'https://placekitten.com/40/40', // Картинка-заглушка
            authorStatus: 'Активный', authorGroup: '', /* Нет группы */ reputation: '-5',
            repHistoryUrl: '#hist2', repPlusUrl: '#plus2', ipAddress: '10.0.0.1', postNumber: '2',
            postBodyHtml: `<p>Второй пост для проверки.</p><blockquote><span class="quote_header">Цитата</span><p>Это цитата внутри поста.</p></blockquote><p>После цитаты.</p><div class="spoiler"><button class="sp-head open"><span><span>Открытый спойлер</span></span></button><div class="sp-body" style="display: block;"><p>Содержимое сразу видно.</p></div></div>`,
            creationDate: 'Вчера, 15:30', isEdited: true, editClass: 'edited-by-other', editTooltip: 'Отредактировано Модератором', editReason: 'Оффтоп',
            actions: [ { text: 'Хорошо!', url: '#', onclick: "alert('Karma+')" }, { text: 'Жалоба', url: '#report2', onclick: null } ], // Нет кнопки "Изменить"
            canModerate: false,
        },
        {
            postId: 'mock3', authorNick: 'Новичок', authorId: '1003', authorProfileUrl: '#user3', authorPmUrl: '#pm3',
            avatarUrl: null,
            authorStatus: 'Пользователь', authorGroup: 'Друзья 4PDA', reputation: '0',
            repHistoryUrl: '#', repPlusUrl: '#', /* Нет ссылки на плюс */ ipAddress: '172.16.0.1', postNumber: '3',
            postBodyHtml: `<p>Третий пост. Без спойлеров и цитат.</p>`,
            creationDate: '01.01.2024, 00:01', isEdited: true, editClass: 'edited-by-self', editTooltip: 'Отредактировано автором', editReason: '', // Нет причины
            actions: [ { text: 'Хорошо!', url: '#', onclick: "alert('Karma+')" }, { text: 'Изменить', url: '#edit3', onclick: null }, { text: 'Жалоба', url: '#report3', onclick: null } ],
            canModerate: false,
        },
    ];

    /**
     * ========================================================================
     * ШАБЛОН НОВОГО ПОСТА (HTML Generation) v2.0
     * ========================================================================
     */
    function createPostHtml(postData) {
        const defaultAvatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2328a745'/%3E%3C/svg%3E`;
        const actionsHtml = postData.actions.map(action =>
            `<li><a href="${action.url}" ${action.onclick ? `onclick="${action.onclick}"` : ''}>${action.text}</a></li>`
        ).join('');
        const repHtml = `<span class="mp-rep" title="Репутация: ${postData.reputation}">⭐ ${postData.reputation}</span>`;

        // ВАЖНО: Для спойлеров используем стандартную структуру 4pda (<button class="sp-head"><span><span>...</span></span></button><div class="sp-body">...),
        // чтобы стили и JS могли их правильно обработать.
        // В mockData postBodyHtml уже содержит эту структуру.

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
     * ИНИЦИАЛИЗАЦИЯ И ВСТАВКА БОЛВАНОК (Mockup Injection) v2.0
     * ========================================================================
     */
    function initMockupPosts() {
        console.log(`${LOG_PREFIX} initMockupPosts running...`);

        // Находим основной контейнер, куда вставлять посты
        // Ищем первый `.borderwrap` после `#navstrip`
        const navstrip = document.querySelector('#navstrip');
        let postContainer = navstrip?.nextElementSibling;
        while(postContainer && !postContainer.matches('.borderwrap')) {
            postContainer = postContainer.nextElementSibling;
        }

        if (!postContainer) {
            console.error(`${LOG_PREFIX} ❌ Could not find main post container (.borderwrap after #navstrip). Cannot inject mockups.`);
            // Пробуем вставить просто в body как fallback
            postContainer = document.createElement('div');
            postContainer.id = 'mockup-fallback-container';
            document.body.appendChild(postContainer);
            console.warn(`${LOG_PREFIX} Injected posts into a fallback container in body.`);
        } else {
            console.log(`${LOG_PREFIX} ✅ Found post container:`, postContainer);
            // Очищаем контейнер от оригинального содержимого (осторожно!)
            // Пока просто добавляем, не очищая
            // postContainer.innerHTML = '<h2>Mock Posts Below:</h2>';
        }

        // Генерируем и вставляем посты-заглушки
        mockPostDataArray.forEach(postData => {
            const newPostHtml = createPostHtml(postData);
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = newPostHtml;
            const newPostElement = tempContainer.firstElementChild;
            if (newPostElement) {
                postContainer.appendChild(newPostElement); // Добавляем в конец контейнера
            }
        });

        console.log(`${LOG_PREFIX} Injected ${mockPostDataArray.length} mock posts.`);

        addEventListeners(); // Добавляем обработчики к новым постам
    }

    /**
     * ========================================================================
     * ДОБАВЛЕНИЕ ИНТЕРАКТИВНОСТИ (Event Listeners) v2.0 - Новая логика меню
     * ========================================================================
     */
    const listenerState = { added: false };
    let activeMenu = null; // Храним ссылку на текущее открытое меню

    function addEventListeners() {
        const container = document.body;
        if (listenerState.added) return;

        // Используем 'click' для основного делегирования
        container.addEventListener('click', handleDelegatedClick_v2);
        listenerState.added = true;
        console.log(`${LOG_PREFIX} Added delegated Click listener to body.`);
    }

    /** Универсальный обработчик кликов v2.0 */
    function handleDelegatedClick_v2(event) {
        const target = event.target;
        let menuToToggle = null;
        let triggerElement = null;

        // --- Определяем, был ли клик на триггере ---
        const actionTrigger = target.closest('.mp-actions-trigger');
        const nickLink = target.closest('.mp-author-nick');

        if (actionTrigger) {
            triggerElement = actionTrigger;
            const menuContainer = actionTrigger.closest('.mp-actions-menu-container');
            menuToToggle = menuContainer?.querySelector('.mp-actions-menu');
            event.stopPropagation(); // Останавливаем всплытие, если клик на триггере
        } else if (nickLink) {
            triggerElement = nickLink;
            const detailsContainer = nickLink.closest('.mp-author-details');
            if (detailsContainer) {
                menuToToggle = detailsContainer.querySelector('.mp-user-menu');
                // Создаем меню пользователя, если его нет
                if (!menuToToggle) {
                     const postElement = nickLink.closest('.mp-post');
                     if (postElement) menuToToggle = createUserMenu(postElement);
                     if (menuToToggle) detailsContainer.appendChild(menuToToggle);
                     else { console.error(`${LOG_PREFIX} Failed to create user menu.`); return; }
                }
            }
            event.preventDefault(); // Предотвращаем переход по ссылке
            event.stopPropagation(); // Останавливаем всплытие
        }

        // --- Логика переключения меню ---
        if (menuToToggle) {
             // Кликнули на триггер
             if (menuToToggle === activeMenu) { // Если это меню уже активно
                 closeMenu(activeMenu); // Закрываем его
                 activeMenu = null;
             } else { // Если кликнули на триггер другого или закрытого меню
                 closeMenu(activeMenu); // Закрываем предыдущее активное (если было)
                 openMenu(menuToToggle, triggerElement); // Открываем новое
                 activeMenu = menuToToggle; // Запоминаем новое активное меню
             }
             return; // Завершаем обработку, так как клик был на триггере
        }

        // --- Обработка кликов ВНУТРИ МЕНЮ ---
        const insideMenu = target.closest('.mp-actions-menu, .mp-user-menu');
        if (insideMenu) {
             // Клик на кнопке "+" репутации
             const repPlusButton = target.closest('.mp-user-menu .rep-plus');
             if (repPlusButton) {
                 handleRepPlusClick(event, repPlusButton); // Обрабатываем, закрываем меню
                 activeMenu = null; // Сбрасываем активное меню
                 return; // Завершаем
             }
             // Клик по обычной ссылке в меню
             if (target.tagName === 'A' && target.href && !target.onclick) {
                 // Не останавливаем всплытие (stopPropagation), чтобы ссылка сработала
                 // Закрываем меню с небольшой задержкой
                 setTimeout(() => { closeMenu(activeMenu); activeMenu = null; }, 100);
                 return; // Завершаем
             }
             // Клик по элементу с onclick (например, карма "Хорошо")
             if (target.onclick) {
                  // Не останавливаем всплытие, чтобы onclick сработал
                 setTimeout(() => { closeMenu(activeMenu); activeMenu = null; }, 100); // Закрываем после отработки onclick
                  return; // Завершаем
             }

             // Любой другой клик внутри меню - просто останавливаем всплытие
             event.stopPropagation();
             return; // Завершаем
        }

        // --- Обработка клика на СПОЙЛЕР ---
        const spoilerHead = target.closest('.mp-body .sp-head');
        if (spoilerHead) {
             handleSpoilerToggle(spoilerHead);
             // НЕ останавливаем всплытие, чтобы клик по спойлеру закрыл меню
             // НЕ устанавливаем consumed = true
        }

        // --- Если клик был НЕ на триггере и НЕ внутри меню ---
        // Закрываем активное меню (если оно есть)
        if (activeMenu) {
             // console.log(`${LOG_PREFIX} Click outside detected, closing active menu.`);
             closeMenu(activeMenu);
             activeMenu = null;
        }
    }


    // --- Функции открытия/закрытия/позиционирования меню (v2.0 - Absolute) ---
    function openMenu(menuElement, triggerElement) {
        if (!menuElement || !triggerElement) return;
        positionMenu(triggerElement, menuElement); // Позиционируем перед показом
        menuElement.classList.add('visible');
        // console.log(`${LOG_PREFIX} Opened menu:`, menuElement);
    }

    function closeMenu(menuElement) {
        if (!menuElement) return;
        menuElement.classList.remove('visible');
        // console.log(`${LOG_PREFIX} Closed menu:`, menuElement);
    }

    // Позиционирование с position: absolute
    function positionMenu(triggerElement, menuElement) {
        if (!menuElement || !triggerElement) return;

        const container = menuElement.parentElement; // Родительский контейнер (.mp-actions-menu-container или .mp-author-details)
        if (!container) return;

        // Убедимся, что контейнер позиционирован
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        menuElement.style.position = 'absolute';
        menuElement.style.display = 'block'; // Для расчета размеров

        const menuRect = menuElement.getBoundingClientRect(); // Размеры самого меню
        const triggerRect = triggerElement.getBoundingClientRect(); // Позиция триггера относительно viewport
        const containerRect = container.getBoundingClientRect(); // Позиция контейнера относительно viewport

        let top = triggerRect.bottom - containerRect.top + 2; // Снизу триггера, относительно контейнера
        let left = 'auto';
        let right = 'auto';

        // Выбор позиционирования по горизонтали
        if (menuElement.classList.contains('mp-actions-menu')) {
            right = '0px'; // Меню действий выравниваем по правому краю контейнера
        } else {
            left = triggerRect.left - containerRect.left; // Меню юзера по левому краю ника
            // Проверка выхода за правый край контейнера (или viewport)
             if (left + menuRect.width > containerRect.width) {
                 left = 'auto';
                 right = '0px'; // Если не влезает, прижать к правому краю контейнера
             }
             // Проверка выхода за левый край контейнера
             if (left < 0) { left = '0px'; }
        }

        // Проверка выхода за нижний край контейнера (или viewport)
        if (top + menuRect.height > containerRect.height && (triggerRect.top - containerRect.top) > menuRect.height) {
            // Если вылазит снизу и есть место сверху над триггером внутри контейнера
            top = triggerRect.top - containerRect.top - menuRect.height - 2;
        }

        menuElement.style.top = `${top}px`;
        menuElement.style.left = typeof left === 'string' ? left : `${left}px`;
        menuElement.style.right = typeof right === 'string' ? right : `${right}px`;
        menuElement.style.bottom = 'auto';

        // console.log(`${LOG_PREFIX} Positioned ABSOLUTE menu at T:${top}px, L:${left}, R:${right}`);
    }

    // --- Остальные обработчики (v2.0) ---
    function handleSpoilerToggle(header) {
        const spoilerBody = header.nextElementSibling;
        if (spoilerBody?.classList.contains('sp-body')) {
            const isOpen = header.classList.toggle('open');
            spoilerBody.classList.toggle('open', isOpen); // Синхронизируем класс
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
         closeMenu(button.closest('.mp-user-menu')); // Закрываем только это меню
         activeMenu = null; // Сбрасываем активное меню
     }

    /** Создает DOM элемент меню пользователя v2.0 */
    function createUserMenu(postElement) {
        const authorId = postElement.dataset.authorId; const nickElement = postElement.querySelector('.mp-author-nick');
        const profileUrl = nickElement?.href || '#'; const authorNick = nickElement?.textContent.trim() || '';
        // Берем данные репутации из ЗАГЛУШКИ в этом режиме
        const mockData = mockPostDataArray.find(d => d.postId === postElement.dataset.postId);
        const reputation = mockData?.reputation || '0';
        const repHistoryUrl = mockData?.repHistoryUrl || '#';
        const repPlusUrl = mockData?.repPlusUrl || '#'; // URL из заглушки

        if (!authorId) return null;
        const menu = document.createElement('ul'); menu.className = 'mp-user-menu';
        menu.innerHTML = `<li><a href="${profileUrl}" target="_blank">Профиль</a></li><li><a href="https://4pda.to/forum/index.php?act=qms&mid=${authorId}" target="qms_${authorId}" onclick="window.open(this.href,this.target,'width=480,height=600,resizable=yes,scrollbars=yes'); return false;">Сообщения</a></li><li><a href="https://4pda.to/forum/index.php?act=search&author_id=${authorId}&noform=1" target="_blank">Найти сообщения</a></li><hr><li class="rep-item"><span class="rep-value"><a href="${repHistoryUrl}" title="История репутации" target="_blank">⭐ ${reputation}</a></span>${repPlusUrl !== '#' ? `<a href="${repPlusUrl}" class="rep-plus" title="Поднять репутацию">+</a>` : ''}</li>`;
        return menu;
     }

    /**
     * ========================================================================
     * ТОЧКА ВХОДА (Initialization) v2.0
     * ========================================================================
     */
    try {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            initMockupPosts(); // Запускаем вставку болванок
        } else {
            document.addEventListener('DOMContentLoaded', initMockupPosts, { once: true });
        }
    } catch (error) { console.error(`${LOG_PREFIX} Critical error during initialization setup:`, error); if (error.stack) console.error(error.stack); }

})(); // Конец основной IIFE