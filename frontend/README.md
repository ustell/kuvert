# Frontend — исчерпывающий аудит (kuvert frontend)

Документ содержит полный перечень файлов и краткое описание назначения каждого файла/папки в каталоге `frontend` проекта.

> Примечание: описания основаны на прочитанных файлах и здравых предположениях по именам и стандартным практикам в Vue 3 + TypeScript проектах.

## Быстрая сводка

- Стек: Vue 3 (script-setup + TypeScript), Pinia, Vue Router, Vite, TailwindCSS.
- Главная точка входа: `src/main.ts`.
- Архитектура: SPA со сторами (Pinia), сервисом первичной загрузки (`services/boot.ts`), набором переиспользуемых UI-компонентов в `components/`, утилитами в `libs/` и `utils/`, хук-композициями в `composables/`.
- Сетевой слой: `src/libs/http.ts` — обёртка над fetch, возвращающая {ok,status,data,error}.
- Хранение токена: `src/libs/token.ts` — localStorage fallback + декод JWT.

## Как запустить (локально)

В корне `frontend`:

```bash
# установить зависимости
npm install
# запуск dev сервера
npm run dev
# сборка
npm run build
# превью собранного
npm run preview
```

(команды взяты из `package.json`)

---

## Дерево `frontend/src` и описание файлов

> Формат: `путь` — краткое назначение.

### В корне `src`

- `main.ts` — монтирование Vue приложение; подключение Pinia и Router; вызов `boot()` (предзагрузка данных) и скрытие прелоадера (`#boot`).
- `App.vue` — основной layout приложения: <RouterView/>, ToastHost (тоасты) и BottomNav (нижняя навигация).
- `style.css` — глобальные стили (Tailwind + кастомные правила).
- `vite-env.d.ts` — Vite/TS объявления типов.

### `src/api`

- `http.ts` — (вероятно) вспомогательный клиент для API; возможно thin wrapper для `libs/http` или старые / совместимые вызовы.

### `src/assets`

- Статические ресурсы (иконки, изображения и т.п.).

### `src/components`

- `Badge.vue` — маленькая метка/чип.
- `BottomNav.vue` — нижняя панель навигации (мобильная/фиксированная).
- `Button.vue` — базовая кнопка с общими стилями и вариантами.
- `Card.vue` — карточка для отображения сущностей.
- `IconBtn.vue` — кнопка с иконкой.
- `index.ts` — реэкспорт компонентов/утилит для удобного импорта.
- `ListItem.vue` — строка списка/элемент списка.
- `Options.vue` — опции/меню (вспомогательный компонент).
- `RowCard.vue` — карточка в строковом формате.
- `ToastHost.vue` — хост для всплывающих уведомлений/тоастов (интерфейс для `notify` store).
- `uiCart.vue` — компонент корзины/быстрого просмотра (имя предполагает cart-ui).

Подпапки:

- `common/`

  - `EmptyState.vue` — состояние, когда список/страница пусты.
  - `LoadingList.vue` — индикатор загрузки списка.

- `list/`

  - `ToolbarSearchStatus.vue` — панель поиска + фильтр по статусу + кнопка обновить; эмитит `update:modelValue`, `update:status`, `refresh`.

- `modal/`

  - `Modal.vue` — базовая модалка.
  - `GiveGoodsModal.vue`, `GoodModal.vue`, `TransferModal.vue`, `UserModal.vue` — специализированные модалки для операций: дать/редактировать товар/перевод/пользователь.

- `transfer/`

  - `IncomingTransferCard.vue` — карточка входящего перевода.
  - `TransferDetailsCard.vue` — подробности перевода.
  - `TransferItemRow.vue` — строка с позицией в переводе.
  - `TransferItemsCard.vue` — карточка со списком позиций перевода.
  - `TransferRecentCard.vue` — недавние переводы.

- `ui/select/` — кастомный селект (вложенные компоненты):
  - `index.ts` — реэкспорт селекта.
  - `Select.vue`, `SelectTrigger.vue`, `SelectValue.vue`, `SelectContent.vue`, `SelectItem.vue`, `SelectItemText.vue`, `SelectGroup.vue`, `SelectLabel.vue`, `SelectSeparator.vue`, `SelectScrollUpButton.vue`, `SelectScrollDownButton.vue` — реализация кастомного dropdown/select (возможно основана на библиотеках или собственный Radix-like компонент).

### `src/composables`

- `useAction.ts` — (по имени) хук для выполнения асинхронных действий с индикацией загрузки и обработкой ошибок/нотификаций.
- `useBusySet.ts` — управляет множественным состоянием busy (набор флагов), полезно для параллельных операций UI.
- `useConfirmDelete.ts` — показывает подтверждение удаления и возвращает промис/результат подтверждения.
- `useDebouncedRef.ts` — (прочитано) возвращает {raw, debounced} refs; useful для поиска.
- `useFormat.ts` — вспомогательные форматирования (даты, суммы, локализация и т.п.).

### `src/lib`

- `utils.ts` — общие утилиты для проекта (форматирование, мелкие функции), используются в разных компонентах.

### `src/libs`

- `api.ts` — утилиты для нормализации ответов API: `HttpList<T>` тип, `unwrapList`, `unwrapOne`, `errText`. Помогают компонентам и сторам работать с разными формами ответов.
- `http.ts` — (прочитано) универсальная обертка над `fetch` с таймаутом/AbortController, поддержкой FormData, чтением JSON/text и стандартизованным результатом `HttpResult`. Возвращает {ok, status, data, error}.
- `token.ts` — (прочитано) tokenStorage: set/get/clear/has и `decodeJwtPayload`. Использует localStorage, fallback в память. Безопасный base64-url декодер для JWT payload.

### `src/routers`

- `index.ts` — конфигурация маршрутов (Vue Router), lazy-loading view-компонентов и защита маршрутов (guards).

### `src/services`

- `boot.ts` — (прочитано) сервис первичной загрузки данных (вызов store.me(), users, items, transfers). Возвращает `{ok, errors}`.
- `bootGate.ts` — синхронизатор/гейт для состояния boot (в `main.ts` используется `setBootReady`). Возвращает/принимает промис готовности.

### `src/stores`

- `_utils.ts` — внутренние утилиты для стора (мелкие хелперы).
- `auth.ts` — (прочитано) Pinia store для авторизации: `login`, `me`, `logout`; хранение `users` (текущий пользователь), `loading`, `error`. Взаимодействует с `libs/http` и `libs/token`.
- `index.ts` — реэкспорт сто
- `item.ts` — store для предметов/товаров: list, fetchItems, create/update/delete операций, фильтры.
- `notify.ts` — store/механизм появления нотификаций/тоастов.
- `pinia.ts` — инициализация/плагины Pinia (возможно добавляет persist или logger).
- `transfer.ts` — store для переводов: fetchItems, accept/reject transfers и т.д.
- `user.ts` — store для пользователей (getUser, list, roles).

### `src/types`

- `api.ts` — типы, связанные с API (HttpResult, HttpList и т.п.).
- `domain.ts` — доменные типы: `User`, `Item`, `Transfer`, `Role` и т.д.
- `DTO.ts` — типы DTO (request/response payloads) для форм и API.

### `src/utils`

- `issueFormatter.ts` — форматирование ошибок/вопросов/валидации для UI.
- `item.ts` — вспомогательные функции для работы с item (статусы, отображение полей).
- `usersApi.ts` — helper wrappers для user-API (тонкая абстракция над `http`).

### `src/views`

- `AcceptPage.vue` — page для принятия товаров/переводов.
- `AdminPage.vue` — административная панель.
- `CreatePage.vue` (+ `CreatePage copy.vue`) — страницы создания сущности (товар/перевод и т.д.).
- `DashboardPage.vue` — основная дашборд страница для пользователя.
- `LoginPage.vue` — страница логина (форма и логика).

- `admin/`
  - `AdminGoods.vue` — админ-страница для управления товарами.
  - `AdminTransfer.vue` — админ-интерфейс для переводов.
  - `AdminUsers.vue` — админ-интерфейс пользователей.

### `public`

- Статические публичные файлы: фавикон, manifest, прочие файлы, доступные без сборки.

---

## Детализированный список `src/libs`, `src/composables`, `src/stores` (короткие контракты)

### `src/libs/http.ts` — контракт

- Вход: (method: 'GET'|'POST'|..., url: string, body?: any, opts?: OptionsHttp)
- Выход: Promise<{ok:boolean, status:number, data:any|null, error:string|null}>.
- Особенности: таймаут через AbortController (опция `delay`), поддержка FormData, определение Content-Type, аккуратная сериализация ошибок.

### `src/libs/api.ts` — контракт

- unwrapList<T>(raw: any): T[] — возвращает массив корректно, если API возвращает {data:{items:[]}} или {items:[]} или прямой массив.
- unwrapOne<T>(raw: any): T | null — извлечение единственной сущности (data.user или data).
- errText(res): читаемый текст ошибки по HTTP коду.

### `src/libs/token.ts` — контракт

- tokenStorage.set(token|null)
- tokenStorage.get(): string|null
- tokenStorage.clear()
- tokenStorage.has()
- tokenStorage.getPayload(): object|null
- decodeJwtPayload(token): object|null

### `src/composables/useDebouncedRef.ts`

- useDebouncedRef<T>(initial: T, delay=200) => { raw: Ref<T>, debounced: Ref<T> }
- Полезен для реализации поисковых инпутов, чтобы не дергать API на каждое изменение.

### `src/stores/auth.ts` — контракт

- state: { users: User|null, loading: boolean, error: string|null, isFetchingMe: boolean }
- getters: isAutorizited
- actions:
  - authHeaders(): { Authorization?: string }
  - login(phone, password, remember=true)
  - me(signal?) — получает текущего пользователя, очищает токен при 401/403
  - logout(localOnly=false)

---

## Замечания, найденные в коде

1. Несоответствие имён опций таймаута: в `libs/http.ts` используется `delay` (опция) а в `auth.ts` в примерах вызовов встречается `timeoutMs`. Рекомендация: унифицировать опцию (например `timeout` или `delay`) и добавить backward-compat.
2. `ToolbarSearchStatus.vue` эмитит нужные события и совместим с v-model, но можно добавить aria-атрибуты, names и встроить debounce внутри компонента (или оставить в родителе) — в проекте уже есть `useDebouncedRef`.
3. `token.ts` аккуратно делает fallback на память — хорошая практика для SSR/tests.

---

## Рекомендации / следующие шаги (коротко)

- Добавить README.md в корень `frontend` (сделано) — этот файл.
- (Небольшое улучшение) Убедиться, что все вызовы `http()` используют одно имя таймаута (вынести в `OptionsHttp` тип).
- (UX) Добавить aria-label к интерактивным элементам в компонентах списка и модалок.
- (Тесты) Покрыть `libs/token.ts` и `libs/http.ts` простыми unit-тестами (vitest).

---

Если нужно, могу:

- 1. автоматически внести правку для унификации опции таймаута (и прогнать сборку/tsc).
- 2. отрефакторить `ToolbarSearchStatus.vue` (v-model-friendly, aria, optional debounce prop).
- 3. сгенерировать отдельный детальный файл `FRONTEND_AUDIT.md` в корне с тем же содержанием.

Готов выполнить следующий шаг — скажи, что предпочитаешь.
