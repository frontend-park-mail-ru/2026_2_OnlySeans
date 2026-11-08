# 2026_2_OnlySeans

### Локальный запуск и сборка

- `npm ci` — установить зависимости из lock-файла.
- `npm run dev` — запустить Webpack Dev Server на `http://localhost:3000`.
- `npm run build` — собрать приложение в `dist/` через Webpack и Babel.
- `npm start` — раздавать собранное приложение из `dist/` на `http://localhost:8000` (порт можно изменить через `PORT`). Перед запуском выполните сборку.
- `npm run lint` и `npm run typecheck` — проверки кода. Проверка TypeScript настроена для будущих `.ts`-файлов; проверка типов JavaScript отключена (`checkJs: false`).

Сервис-воркер регистрируется только в production-сборке. Он кеширует оболочку приложения, стили, шаблоны и другие статические ресурсы после их загрузки; API-запросы не кешируются. Для работы нужен HTTPS или localhost.

Webpack включает Handlebars в bundle, выпускает `.hbs` и стили компонентов, загружаемые через `new URL(..., import.meta.url)`, как отдельные файлы. Изображения, на которые эти стили ссылаются относительными путями, копируются с сохранением структуры каталогов.
Репозиторий команды OnlySeans. Проект Кинопоиск

### [Деплой фронтенда]()  
### [Деплой бекенда]()  
### [Репозиторий бекенда](https://github.com/go-park-mail-ru/2026_2_OnlySeans)  
### [Макет]()  


### Состав команды:
- [Яковлева Светлана](https://github.com/Svetlana17yak)
- [Ушакова Полина](https://github.com/polinauss)
- [Городов Егор](https://github.com/Pom1dorka-Salat1k)
- [Нестеров Георгий](https://github.com/GeR017)

### Менторы:
- [Шахмар Абдуллаев](https://github.com/abdullShah) - Frontend
- [Антон Самойлов](https://github.com/samantonio28) - Backend
- [Айбек Шомуродов]() - UX
- [???]() - Database
