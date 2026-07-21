# Architectural Render QC

MVP-застосунок для автоматичної перевірки відповідності архітектурних рендерів кресленням — **семантично**, без порівняння розмірів, масштабу чи координат. Питання, на яке відповідає система: *"Чи присутні на рендері ті самі архітектурні елементи, що й на кресленні, і чи відповідають вони йому за типом/конфігурацією?"*

> **Статус MVP:** повний робочий каркас (backend API + БД + frontend + TP/FP/FN review workflow + метрики + експорт + історія) з **мок-логікою порівняння** замість реального vision-пайплайна. Мок генерує правдоподібні, різноманітні невідповідності (missing/extra/wrong_type/orientation/count/design mismatch) по всій таксономії елементів — цього достатньо, щоб продемонструвати і протестувати весь інтерфейс і workflow. Заміна на реальний AI — це один файл (`backend/app/services/mock_ai.py`), решта застосунку не зміниться (див. "Дорожня карта").

## Чому мок, а не реальний AI одразу

Немає підключених API-ключів (Anthropic/OpenAI/Google) в цьому середовищі, і немає локального Python/Docker для перевірки живого інференсу. Мок-сервіс детермінований на рівні run_id, тож демо стабільне, але дає різні знахідки для різних прогонів — так само як реагувала б справжня модель на різні вхідні дані.

## Швидкий перегляд — без встановлення нічого

**[index.html](index.html)** — та сама логіка (проєкти, upload, review з TP/FP/FN, метрики, історія, CSV-експорт), але одним файлом на чистому JS без збірки чи бекенда. Дані живуть у `localStorage` браузера, мок-порівняння — той самий алгоритм, що й у `backend/app/services/mock_ai.py`, портований у JS.

Просто відкрийте `index.html` у браузері (подвійний клік або перетягнути у вкладку) і натисніть «✨ Завантажити демо-проєкт» на головній сторінці — одразу з'явиться проєкт з двома тестовими зображеннями та можна пройти весь workflow перевірки.

Це основний спосіб побачити й обговорити UI/UX прямо зараз. FastAPI+React каркас (`backend/`, `frontend/`) лишається шляхом до продакшн-версії з реальним AI-пайплайном (див. розділ AI/CV вище) — обидва варіанти сумісні за структурою даних і термінологією.

---

## Стек технологій

| Шар | Вибір | Чому |
|---|---|---|
| Backend | **FastAPI (Python)** | Уся екосистема CV/vision (ultralytics YOLO, SAM2, Grounding DINO, transformers/Florence-2, openai/anthropic/google SDK) — Python-native. Уникаємо межі Python↔інша мова для AI pipeline. |
| БД | **SQLite → Postgres** | SQLite для MVP (нуль інфраструктури), схема через SQLAlchemy ORM — перехід на Postgres це заміна `DATABASE_URL`. |
| Frontend | **React + Vite + TypeScript + Tailwind** | Потрібен canvas/SVG-overlay для bbox на зображеннях, інтерактивний review-workflow з частими локальними оновленнями стану — React тут природніший за serverside-рендеринг. |
| Файли | Локальний диск (`backend/uploads`) → S3/Blob | Для MVP досить volume в Docker; продакшн — object storage. |
| Контейнеризація | Docker + docker-compose | Два сервіси (backend, frontend/nginx), відповідає патерну вже прийнятому в інших проєктах команди (nginx:alpine). |

## AI / Computer Vision — рекомендації для реального pipeline

Задача складається з двох принципово різних під-задач, і для кожної потрібна своя модель:

**1. Локалізація елементів (object detection / grounding) на фасаді:**
- **Grounding DINO** — open-vocabulary detector: можна детектувати "window", "garage door", "dormer" і т.д. текстовим промптом без перенавчання. Найкращий баланс точності й гнучкості для довільної таксономії фасадних елементів.
- **SAM2** (Segment Anything 2) — після grounding-боксів дає точні маски елементів (корисно для вирізання фрагмента для показу користувачу "фрагмент креслення / фрагмент рендера").
- **YOLO (fine-tuned)** — якщо з часом назбирається розмічений датасет власних проєктів, fine-tuned YOLO буде швидшим і дешевшим за inference, ніж promptable-моделі. Розумний шлях: почати з Grounding DINO+SAM2 (zero-shot), паралельно збирати TP/FP/FN розмітку через цей самий UI, і на її основі дотренувати YOLO.

**2. Семантичне порівняння "чи відповідає елемент кресленню" (reasoning про тип/орієнтацію/дизайн):**
- **Claude Vision (Sonnet/Opus)** або **GPT-4.1/4o Vision** — для порівняння вирізаних фрагментів (drawing crop vs render crop) і структурованого висновку (JSON: element, error_type, confidence, comment). Ключова перевага над чистим CV — можуть "прочитати" контекст (напрямок відкривання, тип оздоблення, конфігурацію панелей), а не лише geometry/class.
- **Gemini 1.5/2.0 Pro Vision** — альтернатива з великим контекстним вікном, корисна коли потрібно подати кілька елевацій одразу для крос-перевірки.
- **Florence-2** — легша open-source модель для captioning/grounding, підходить як дешевий перший фільтр перед дорожчим LLM-vision reasoning кроком.

**Рекомендована пайплайн-архітектура (2 стадії):**
1. **Extraction stage** (детермінований CV): Grounding DINO + SAM2 → структурована object model кожного зображення (список елементів з типом, bbox, маскою). Однаково прогоняється і для креслення, і для рендера.
2. **Comparison stage** (LLM reasoning): парні елементи (matched by spatial + semantic similarity) передаються в Claude/GPT-4V з інструкцією порівняти **тільки семантику** (тип, орієнтація, конфігурація) — модель явно інструктується ігнорувати розмір/масштаб/зміщення. Немає матчу → `missing`/`extra`.

Це узгоджується з вимогою "спочатку об'єктна модель, потім порівняння моделей" з брифу — а не pixel-diff.

**Для DWG:** ODA File Converter (безкоштовний, CLI) або `ezdxf`/LibreCAD headless конвертують DWG→DXF/PDF, з якого потім рендеряться потрібні елевації в PNG для того самого vision pipeline. DWG не подається в AI напряму.

Схожі публічні приклади для орієнтиру: `IDEA-Research/GroundingDINO`, `facebookresearch/sam2`, `microsoft/Florence-2` на GitHub; є кілька відкритих repo "facade parsing" / "building defect detection with VLM", що підтверджують життєздатність підходу "detect → crop → VLM compare".

---

## Архітектура

```
                 ┌─────────────┐        ┌───────────────────┐
   Upload        │  React SPA  │  REST  │   FastAPI backend  │
   Render/       │  (Vite,     │◄──────►│                    │
   Drawing       │  Tailwind)  │  /api  │  routers/          │
                 └─────────────┘        │   projects, assets,│
                                         │   analysis,        │
                                         │   discrepancies,   │
                                         │   metrics          │
                                         │                    │
                                         │  services/         │
                                         │   mock_ai.py  ◄────┼── (замінити на
                                         │   (→ extraction +  │     real pipeline)
                                         │      comparison)   │
                                         └─────────┬──────────┘
                                                    │ SQLAlchemy
                                            ┌───────▼────────┐
                                            │ SQLite/Postgres │
                                            └─────────────────┘
```

### Логіка роботи
1. Користувач створює проєкт, завантажує один або кілька рендерів і креслень (`POST /projects/{id}/assets`).
2. Обирає пару render+drawing → `POST /projects/{id}/analysis` створює `AnalysisRun`.
3. Сервіс порівняння (зараз мок, у продакшені — 2-стадійний CV+LLM pipeline) повертає список `Discrepancy` — записуються в БД зі статусом `unreviewed`.
4. Review UI показує обидва зображення з bbox-оверлеями кольором за статусом, список карток з кнопками ✅TP / ❌FP, і форму ➕ для ручного додавання FN.
5. Метрики (`precision/recall/f1`) рахуються на льоту з поточних `review_status` записів.
6. Історія (`/projects/{id}/history`) показує всі прогони проєкту з метриками — для трекінгу якості AI в часі.

### Структура БД

- **Project** — id, name, created_at
- **Asset** — id, project_id, kind(render|drawing), original_filename, stored_filename, uploaded_at
- **AnalysisRun** — id, project_id, render_asset_id, drawing_asset_id, status, created_at
- **Discrepancy** — id, run_id, element_name, element_type (таксономія), error_type (missing/extra/wrong_type/orientation_mismatch/count_mismatch/design_mismatch), description, confidence, drawing_bbox, render_bbox, review_status (unreviewed/tp/fp/fn), is_user_added, created_at, reviewed_at

### API (стисло)

```
POST   /projects                          створити проєкт
GET    /projects                          список проєктів
GET    /projects/{id}/history             історія прогонів
POST   /projects/{id}/assets              завантажити render/drawing (multipart)
GET    /projects/{id}/assets              список файлів
POST   /projects/{id}/analysis            запустити порівняння (render+drawing → run)
GET    /runs/{id}                         деталі прогону
GET    /runs/{id}/discrepancies           список невідповідностей (+ фільтри element_type/review_status)
POST   /runs/{id}/discrepancies           додати FN вручну
PATCH  /discrepancies/{id}                позначити tp/fp/fn
GET    /runs/{id}/metrics                 precision/recall/f1/tp/fp/fn
GET    /runs/{id}/export                  CSV-звіт (розширюється до Excel/PDF)
GET    /meta/taxonomy                     список типів елементів/помилок для UI
```

### Структура проєкту

```
architectural-render-qc/
├── backend/
│   ├── app/
│   │   ├── main.py, database.py, models.py, schemas.py, taxonomy.py
│   │   ├── routers/        projects, assets, analysis, discrepancies, metrics, meta
│   │   └── services/       mock_ai.py  ← точка заміни на реальний pipeline
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/          ProjectsPage, UploadPage, ReviewPage, HistoryPage
│   │   ├── components/     ImageCanvas (bbox overlay), DiscrepancyCard,
│   │   │                   FilterBar, MetricsPanel, AddDiscrepancyModal
│   │   └── api/client.ts
│   └── Dockerfile / nginx.conf
└── docker-compose.yml
```

---

## Як запустити

```bash
docker compose up --build
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000/docs (Swagger)
```

Або окремо для розробки:

```bash
# backend
cd backend
python -m venv .venv && .venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend (в іншому терміналі)
cd frontend
npm install
npm run dev   # http://localhost:5173, проксіює /api на :8000
```

> Не перевірено запуском у цьому середовищі — на машині, де це створювалось, немає встановлених Python/Docker. Перед реальним використанням запустіть локально і повідомте про помилки.

---

## 10 напрямків дизайну (на вибір, для майбутньої стилізації UI)

Поточна реалізація — чистий світлий SaaS-дашборд (варіант 1 нижче). Інші напрямки не реалізовані, але легко накладаються поверх існуючої структури компонентів (Tailwind-класи + палітра):

1. **Clean SaaS Light** (реалізовано) — білий фон, синій акцент, картки з тонкими бордерами, як Linear/Notion.
2. **Dark Studio** — темна тема (slate-900 фон), неонові акценти для TP/FP/FN, орієнтація на "робочу станцію QA вночі".
3. **Blueprint** — палітра cyan-on-navy, що імітує самі архітектурні креслення; сітка-канва як фон.
4. **Archivizer Brand** — під корпоративний стиль Archivizer (якщо є брендбук — логотип, фірмові кольори, шрифти).
5. **Minimal Mono** — чорно-білий, без кольорових акцентів окрім статусних міток TP/FP/FN.
6. **Split-Screen Inspector** — фокус на максимально великому порівнянні зображень (render/drawing на весь екран), сайдбар згортається.
7. **Card Gallery** — проєкти й прогони як картки з превʼю-зображеннями (Pinterest-style grid), менш табличний підхід.
8. **Timeline-First** — акцент на історії/трендах якості AI (графік F1 у часі як головний екран), review — другорядний.
9. **Dense Data Grid** — табличний, Excel-подібний вигляд для power-users/QA з великою кількістю прогонів одночасно.
10. **Mobile-First Review** — вертикальний stacked-layout (drawing зверху, render знизу, картки під ними) для перевірки з планшета на майданчику/зустрічі з клієнтом.

Скажіть, який напрямок цікавий — зроблю тему поверх поточної структури.

---

## Дорожня карта до продакшн-версії

1. **Реальний extraction pipeline**: інтеграція Grounding DINO + SAM2 (self-hosted, GPU) для локалізації елементів.
2. **Реальний comparison step**: виклик Claude/GPT-4V API на парах crop'ів з explicit-інструкцією ігнорувати геометрію/масштаб.
3. **DWG→PNG конвертація**: ODA File Converter або ezdxf у backend job перед аналізом.
4. **Підсвітка на зображеннях** — вже реалізовано (SVG bbox overlay), потребує лише реальних координат від AI замість мок-рандому.
5. **Excel/PDF експорт** — зараз CSV; додати `openpyxl`/`reportlab` в `metrics.py`.
6. **Кілька рендерів на проєкт** — модель БД вже це підтримує (Asset list), UI для порівняння кількох рендерів з одним кресленням — наступний крок.
7. **Auth** — зараз немає розмежування користувачів; додати перед публічним/командним використанням.
