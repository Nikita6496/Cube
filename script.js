// ===== Управление модальным окном =====
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

function openModal(contentHTML) {
    modalContent.innerHTML = contentHTML;
    modalOverlay.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
    const form = modalContent.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Заявка отправлена! (Демо)');
            closeModal();
        });
    }
}

function closeModal() {
    modalOverlay.classList.remove('modal--open');
    document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

modalClose.addEventListener('click', closeModal);

// ===== Открытие разных типов модалок =====

// 1. Клик по фото в "Почему выбирают нас" и "Как проходит наш день"
document.querySelectorAll('.advantages__item, .portfolio__item').forEach(item => {
    item.addEventListener('click', () => {
        const title = item.getAttribute('data-title');
        const desc = item.getAttribute('data-desc');
        const img = item.getAttribute('data-img');
        
        // Улучшенная структура с классом modal__content для красивого оформления
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

// 2. Клик по фиолетовой кнопке в "Наши развлечения" (Галерея)
document.querySelectorAll('.catalog__card-button').forEach(btn => {
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

// 3. Клик по кнопке "Зарегистрироваться" внизу
document.querySelectorAll('[data-modal-open="form"]').forEach(btn => {
    btn.addEventListener('click', () => {
        const content = `
            <h2>Регистрация</h2>
            <form>
                <fieldset class="form-fieldset">
                    <legend class="form-legend">Какой у вас повод?</legend>
                    <div class="form-group">
                        <label><input type="radio" name="event"> Отдых с друзьями</label>
                        <label><input type="radio" name="event"> День рождения</label>
                        <label><input type="radio" name="event"> Работа/Учёба</label>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend class="form-legend">Что вам интересно?</legend>
                    <div class="form-group">
                        <label><input type="checkbox"> Игры</label>
                        <label><input type="checkbox"> Кино</label>
                        <label><input type="checkbox"> VR</label>
                    </div>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend class="form-legend">Когда вас ждать?</legend>
                    <input type="date" class="form-input" required>
                </fieldset>

                <fieldset class="form-fieldset">
                    <legend class="form-legend">Ваше имя и номер телефона</legend>
                    <div class="form-group">
                        <input type="text" placeholder="Ваше имя" class="form-input" required>
                        <input type="tel" placeholder="Номер телефона" class="form-input" required>
                    </div>
                </fieldset>

                <button type="submit" class="form-submit">Отправить заявку</button>
            </form>
        `;
        openModal(content);
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

// ===== Кнопка "Наверх" =====
const toTopBtn = document.getElementById('to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        toTopBtn.classList.add('to-top--visible');
    } else {
        toTopBtn.classList.remove('to-top--visible');
    }
});

toTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===== FAQ (Аккордеон) =====
document.querySelectorAll('.faq__question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('faq__item--active');
    });
});

// ===== Переключение темы =====
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    if (document.body.classList.contains('light-theme')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
});