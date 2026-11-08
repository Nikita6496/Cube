// ===== Модальное окно =====
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

function openModal(contentHTML, onFormSubmit) {
    modalContent.innerHTML = contentHTML;
    modalOverlay.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    const form = modalContent.querySelector('form');
    if (form && onFormSubmit) {
        form.addEventListener('submit', onFormSubmit);
    }
}

function closeModal() {
    modalOverlay.classList.remove('modal--open');
    document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});
modalClose.addEventListener('click', closeModal);

// ===== Данные (статичный fallback, если API недоступен) =====
let hallsData = [
    {
        id: 1,
        name: "Основной зал",
        capacity: 30,
        description: "Большой зал для вечеринок, квизов и дней рождения. Есть проектор и колонки.",
        price_per_hour: 1500,
        image_url: "images/hall-1.jpg"
    },
    {
        id: 2,
        name: "VIP-зал",
        capacity: 10,
        description: "Уютный зал для небольших встреч и переговоров. Мягкие диваны и приглушённый свет.",
        price_per_hour: 2000,
        image_url: "images/hall-2.jpg"
    }
];

// ===== Модалка для «Почему выбирают нас» / «Как проходит наш день» =====
document.querySelectorAll('.advantages__item, .portfolio__item').forEach(item => {
    item.addEventListener('click', () => {
        const title = item.getAttribute('data-title');
        const desc = item.getAttribute('data-desc');
        const img = item.getAttribute('data-img');

        const content = `
            <div class="modal__content">
                <h2>${title}</h2>
                <img src="${img}" alt="${title}">
                <p>${desc}</p>
            </div>
        `;
        openModal(content);
    });
});

// ===== Галерея карточек развлечений =====
function bindGalleryButtons() {
    document.querySelectorAll('.catalog__card-button').forEach(btn => {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';

        btn.addEventListener('click', () => {
            const card = btn.closest('.catalog__card');
            const imgMain = card.querySelector('.catalog__card-image');
            const title = imgMain.getAttribute('data-title');
            const desc = imgMain.getAttribute('data-desc');
            const galleryStr = imgMain.getAttribute('data-gallery');

            const images = galleryStr ? galleryStr.split('|') : [imgMain.src];

            let thumbnailsHTML = '';
            images.forEach((imgSrc, index) => {
                thumbnailsHTML += `<img src="${imgSrc}" class="gallery-thumb ${index === 0 ? 'gallery-thumb--active' : ''}" data-index="${index}">`;
            });

            const content = `
                <div class="modal__content">
                    <h2>${title}</h2>
                    <img src="${images[0]}" class="gallery-main" id="gallery-main">
                    <p>${desc}</p>
                    <div class="gallery-thumbnails" id="gallery-thumbs">
                        ${thumbnailsHTML}
                    </div>
                </div>
            `;

            openModal(content);

            const mainImage = document.getElementById('gallery-main');
            const thumbs = document.querySelectorAll('.gallery-thumb');
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    thumbs.forEach(t => t.classList.remove('gallery-thumb--active'));
                    thumb.classList.add('gallery-thumb--active');
                    mainImage.src = thumb.src;
                });
            });
        });
    });
}

// ===== Модалка для залов (с галереей) =====
function bindHallCards() {
    document.querySelectorAll('.feature__item').forEach(item => {
        if (item.dataset.bound === '1') return;
        item.dataset.bound = '1';

        item.addEventListener('click', () => {
            const title = item.getAttribute('data-title');
            const desc = item.getAttribute('data-desc');
            const galleryStr = item.getAttribute('data-gallery') || item.getAttribute('data-img');
            const capacity = item.getAttribute('data-capacity');
            const price = item.getAttribute('data-price');
            const images = galleryStr ? galleryStr.split('|') : [];

            const meta = [];
            if (capacity) meta.push(`<p><strong>Вместимость:</strong> до ${capacity} чел.</p>`);
            if (price) meta.push(`<p><strong>Цена:</strong> ${price} ₽/час</p>`);

            let thumbnailsHTML = '';
            images.forEach((imgSrc, index) => {
                thumbnailsHTML += `<img src="${imgSrc}" class="gallery-thumb ${index === 0 ? 'gallery-thumb--active' : ''}" data-index="${index}">`;
            });

            const content = `
                <div class="modal__content">
                    <h2>${title}</h2>
                    <img src="${images[0] || 'images/hall-1.jpg'}" class="gallery-main" id="gallery-main">
                    <p>${desc}</p>
                    ${meta.join('')}
                    ${images.length > 1 ? `<div class="gallery-thumbnails" id="gallery-thumbs">${thumbnailsHTML}</div>` : ''}
                    <button class="catalog__card-button modal__cta" id="hall-book-btn">Забронировать этот зал</button>
                </div>
            `;
            openModal(content);

            const mainImage = document.getElementById('gallery-main');
            const thumbs = document.querySelectorAll('.gallery-thumb');
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    thumbs.forEach(t => t.classList.remove('gallery-thumb--active'));
                    thumb.classList.add('gallery-thumb--active');
                    mainImage.src = thumb.src;
                });
            });

            document.getElementById('hall-book-btn').addEventListener('click', () => {
                closeModal();
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
            });
        });
    });
}

// ===== Рендер развлечений из API =====
async function loadEntertainments() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    try {
        const res = await fetch('/entertainments');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) return;

        grid.innerHTML = items.map(item => {
            const imgs = (item.images && item.images.length)
                ? item.images
                : (item.image_url ? [item.image_url] : ['images/hero-bg.jpg']);
            const main = imgs[0];
            const gallery = imgs.join('|');
            const desc = (item.description || '').replace(/"/g, '&quot;');
            
            // Формируем красивую цену
            const priceHTML = item.price > 0 
                ? `<div class="catalog__card-price">${item.price} ₽</div>` 
                : `<div class="catalog__card-price">Включено</div>`;

            return `
                <article class="catalog__card">
                    <img src="${main}" alt="${item.name}" class="catalog__card-image"
                         data-gallery="${gallery}"
                         data-title="${item.name}"
                         data-desc="${desc}">
                    <div class="catalog__card-content">
                        <h3 class="catalog__card-title">${item.name}</h3>
                        ${priceHTML} <!-- Вставляем цену -->
                        <p class="catalog__card-text">${item.description || ''}</p>
                        <button class="catalog__card-button" data-gallery-open>Подробнее</button>
                    </div>
                </article>
            `;
        }).join('');

        bindGalleryButtons();
    } catch (e) {
        console.warn('БД недоступна, показываем статичные карточки:', e.message);
    }
}

// ===== Рендер залов из API =====
async function loadHalls() {
    const grid = document.getElementById('halls-grid');
    if (!grid) return;

    try {
        const res = await fetch('/halls');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) return;

        hallsData = items;

        grid.innerHTML = items.map(item => {
            const imgs = (item.images && item.images.length)
                ? item.images
                : (item.image_url ? [item.image_url] : ['images/hall-1.jpg']);
            const main = imgs[0];
            const gallery = imgs.join('|');
            const desc = (item.description || '').replace(/"/g, '&quot;');

            return `
                <div class="feature__item"
                     data-title="${item.name}"
                     data-desc="${desc}"
                     data-img="${main}"
                     data-gallery="${gallery}"
                     data-capacity="${item.capacity}"
                     data-price="${item.price_per_hour}">
                    <img src="${main}" alt="${item.name}">
                </div>
            `;
        }).join('');

        bindHallCards();
    } catch (e) {
        console.warn('БД недоступна, показываем статичные залы:', e.message);
    }
}

// ===== Форма бронирования =====
function buildFormHTML() {
    const hallOptions = hallsData.map(h =>
        `<option value="${h.id}">${h.name} (до ${h.capacity} чел., ${h.price_per_hour} ₽/час)</option>`
    ).join('');

    const today = new Date().toISOString().split('T')[0];

    return `
        <h2>Забронировать визит</h2>
        <form id="booking-form" novalidate>
            <fieldset class="form-fieldset">
                <legend class="form-legend">Какой у вас повод?</legend>
                <div class="form-group">
                    <label class="form-label"><input type="radio" name="event_type" value="Отдых с друзьями" checked> Отдых с друзьями</label>
                    <label class="form-label"><input type="radio" name="event_type" value="День рождения"> День рождения</label>
                    <label class="form-label"><input type="radio" name="event_type" value="Работа/Учёба"> Работа/Учёба</label>
                </div>
            </fieldset>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Что вам интересно?</legend>
                <div class="form-group">
                    <label class="form-label"><input type="checkbox" name="interests" value="Игры"> Игры</label>
                    <label class="form-label"><input type="checkbox" name="interests" value="Кино"> Кино</label>
                    <label class="form-label"><input type="checkbox" name="interests" value="VR"> VR</label>
                </div>
            </fieldset>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Дата и время</legend>
                <div class="form-group">
                    <input type="date" name="booking_date" class="form-input" min="${today}" required>
                </div>
                <div class="form-group">
                    <input type="time" name="start_time" class="form-input" value="18:00" required>
                    <input type="time" name="end_time" class="form-input" value="20:00" required>
                </div>
            </fieldset>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Сколько вас будет?</legend>
                <input type="number" name="guests_count" class="form-input" min="1" value="2" required>
            </fieldset>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Нужен ли зал?</legend>
                <select name="hall_id" class="form-input">
                    <option value="">Без зала (общая зона)</option>
                    ${hallOptions}
                </select>
            </fieldset>

            <fieldset class="form-fieldset">
                <legend class="form-legend">Ваши контакты</legend>
                <div class="form-group">
                    <input type="text" name="name" class="form-input" placeholder="Ваше имя" required>
                    <input type="tel" name="phone" class="form-input" placeholder="Номер телефона" required>
                </div>
                <div class="form-group">
                    <input type="email" name="email" class="form-input" placeholder="Email (необязательно)">
                </div>
            </fieldset>

            <button type="submit" class="form-submit">Отправить заявку</button>
        </form>
    `;
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    const payload = {
        event_type: fd.get('event_type'),
        interests: fd.getAll('interests').join(', '),
        booking_date: fd.get('booking_date'),
        start_time: fd.get('start_time'),
        end_time: fd.get('end_time'),
        guests_count: parseInt(fd.get('guests_count'), 10),
        hall_id: fd.get('hall_id') ? parseInt(fd.get('hall_id'), 10) : null,
        name: (fd.get('name') || '').toString().trim(),
        phone: (fd.get('phone') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim() || null
    };

    if (!payload.name || !payload.phone || !payload.booking_date
        || !payload.start_time || !payload.end_time || !payload.guests_count) {
        alert('Пожалуйста, заполните имя, телефон, дату, время и количество гостей.');
        return;
    }

    if (payload.start_time >= payload.end_time) {
        alert('Время окончания должно быть позже времени начала.');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';

    try {
        const res = await fetch('/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || ('HTTP ' + res.status));
        }
        await res.json();
        alert('Заявка отправлена! Мы свяжемся с вами в течение 10 минут.');
        closeModal();
    } catch (err) {
        console.warn('Бэкенд недоступен:', err.message);
        alert('Заявка отправлена! (Демо-режим: бэкенд не подключён, данные не сохранены.)');
        closeModal();
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
    }
}

document.querySelectorAll('[data-modal-open="form"]').forEach(btn => {
    btn.addEventListener('click', () => {
        openModal(buildFormHTML(), handleBookingSubmit);
    });
});

// ===== Бургер-меню =====
const burger = document.getElementById('burger');
const nav = document.querySelector('.header__nav');

burger.addEventListener('click', () => {
    nav.classList.toggle('header__nav--open');
    burger.classList.toggle('burger--active');
});

document.querySelectorAll('.header__nav-link').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('header__nav--open');
        burger.classList.remove('burger--active');
    });
});

// ===== Кнопка «Наверх» =====
const toTopBtn = document.getElementById('to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        toTopBtn.classList.add('to-top--visible');
    } else {
        toTopBtn.classList.remove('to-top--visible');
    }
});

toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== FAQ =====
document.querySelectorAll('.faq__question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('faq__item--active');
    });
});

// ===== Тема =====
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
});

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
    bindGalleryButtons();
    bindHallCards();
    loadEntertainments();
    loadHalls();
});