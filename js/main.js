/* ============================================
   LOCKOUT TAGOUT — Основной JavaScript
   ============================================ */

'use strict';

/* --- Утилиты --- */

function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(num));
}

/* --- Всплывающее уведомление (тост) --- */

function showToast(message, type) {
  // Удаляем предыдущий тост, если есть
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = 'position:fixed;top:2rem;left:50%;transform:translateX(-50%) translateY(-20px);z-index:10000;'
    + 'padding:1rem 1.5rem;border-radius:12px;font-family:var(--font-stack);font-weight:600;font-size:0.95rem;'
    + 'max-width:90vw;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);opacity:0;'
    + 'transition:opacity 0.3s ease,transform 0.3s ease;display:flex;align-items:center;gap:0.6rem;';

  if (type === 'success') {
    toast.style.background = '#fff';
    toast.style.color = '#166534';
    toast.style.border = '2px solid #22c55e';
    toast.innerHTML = '<i class="ri-checkbox-circle-fill" style="font-size:1.4rem;color:#22c55e"></i>' + message;
  } else {
    toast.style.background = '#fff';
    toast.style.color = '#991b1b';
    toast.style.border = '2px solid #ef4444';
    toast.innerHTML = '<i class="ri-error-warning-fill" style="font-size:1.4rem;color:#ef4444"></i>' + message;
  }

  document.body.appendChild(toast);

  // Появление
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Автоскрытие
  const duration = type === 'success' ? 4000 : 5000;
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getRecaptchaToken(formEl) {
  if (typeof grecaptcha === 'undefined' || !formEl) return '';
  const widget = formEl.querySelector('.g-recaptcha');
  if (!widget) return '';
  const widgetId = widget.getAttribute('data-widget-id');
  if (widgetId === null || widgetId === '') return '';
  return grecaptcha.getResponse(Number(widgetId));
}

function resetRecaptcha(formEl) {
  if (typeof grecaptcha === 'undefined' || !formEl) return;
  const widget = formEl.querySelector('.g-recaptcha');
  if (!widget) return;
  const widgetId = widget.getAttribute('data-widget-id');
  if (widgetId === null || widgetId === '') return;
  grecaptcha.reset(Number(widgetId));
}

/**
 * Отправка формы на сервер
 */
async function submitForm(formData, onSuccess) {
  try {
    const response = await fetch('send_email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();

    if (result.success) {
      showToast('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
      if (onSuccess) onSuccess();
    } else {
      showToast(result.message || 'Ошибка при отправке заявки. Попробуйте позже.', 'error');
    }
  } catch (error) {
    console.error('Form submit error:', error);
    showToast('Ошибка при отправке заявки. Попробуйте позже.', 'error');
  }
}


/* --- Калькулятор стоимости простоя --- */

let calculatorGoalSent = false;

function calculateDowntime() {
  const dailyRevenue = parseFloat(document.getElementById('daily-revenue').value) || 0;
  const workingDays = parseFloat(document.getElementById('working-days').value) || 22;
  const lotoCost = 50000;
  const monthlyRevenue = dailyRevenue * workingDays;
  const hourlyCost = monthlyRevenue / (workingDays * 8);
  const cost8h = hourlyCost * 8;
  const roi = lotoCost > 0 ? ((cost8h / lotoCost) * 100) : 0;

  document.getElementById('hourly-cost').textContent = formatNumber(hourlyCost) + ' ₽';
  document.getElementById('cost-1h').textContent = formatNumber(hourlyCost) + ' ₽';
  document.getElementById('cost-8h').textContent = formatNumber(cost8h) + ' ₽';
  document.getElementById('cost-24h').textContent = formatNumber(hourlyCost * 24) + ' ₽';
  document.getElementById('cost-7d').textContent = formatNumber(hourlyCost * 24 * 7) + ' ₽';
  document.getElementById('roi-value').textContent = formatNumber(roi) + '%';

  // Яндекс.Метрика — цель при первом взаимодействии
  if (typeof ym !== 'undefined' && dailyRevenue > 0 && !calculatorGoalSent) {
    ym(105638591, 'reachGoal', 'calculator_interaction');
    calculatorGoalSent = true;
  }
}


/* --- Мобильное меню --- */

function initMobileMenu() {
  const menuButton = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const closeBtn = document.getElementById('mobile-menu-close');

  if (!menuButton || !menu || !overlay || !closeBtn) return;

  function openMenu() {
    menu.classList.remove('hidden', 'mobile-menu-hidden');
    menu.classList.add('mobile-menu-hidden');
    void menu.offsetWidth; // force reflow
    requestAnimationFrame(() => {
      menu.classList.add('mobile-menu-visible');
    });
    overlay.classList.remove('hidden', 'opacity-0');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('mobile-menu-visible');
    menu.classList.add('mobile-menu-hidden');
    overlay.classList.add('opacity-0');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
      menu.classList.add('hidden');
      overlay.classList.add('hidden');
    }, 400);
  }

  menuButton.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  // Закрываем меню при клике по навигационным ссылкам
  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}


/* --- FAQ --- */

function initFAQ() {
  document.querySelectorAll('[data-faq-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      const icon = button.querySelector('i');
      const isOpen = answer.classList.contains('show');

      // Закрываем все открытые
      document.querySelectorAll('.faq-answer.show').forEach(openAnswer => {
        openAnswer.classList.remove('show');
        const openIcon = openAnswer.previousElementSibling?.querySelector('i');
        if (openIcon) {
          openIcon.classList.remove('ri-subtract-line');
          openIcon.classList.add('ri-add-line');
        }
      });

      // Открываем текущий (если был закрыт)
      if (!isOpen) {
        answer.classList.add('show');
        if (icon) {
          icon.classList.remove('ri-add-line');
          icon.classList.add('ri-subtract-line');
        }
      }
    });
  });
}


/* --- Scroll Reveal (IntersectionObserver) --- */

function initScrollReveal() {
  const items = document.querySelectorAll('.fade-in');
  if (!items.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    items.forEach(item => observer.observe(item));
  } else {
    items.forEach(item => item.classList.add('in-view'));
  }
}


/* --- Счётчики статистики --- */

function initStatsCountUp() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;

  function animateNumber(el) {
    const target = Number(el.getAttribute('data-target')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1200;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${target}${suffix}`;
      }
    }

    requestAnimationFrame(update);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    statNumbers.forEach(item => observer.observe(item));
  } else {
    statNumbers.forEach(item => animateNumber(item));
  }
}


/* --- Модальные окна --- */

function openModal(modalEl) {
  if (!modalEl) return;
  const content = modalEl.querySelector('.modal-content');
  modalEl.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (content) {
    content.classList.remove('modal-exit', 'modal-exit-active');
    content.classList.add('modal-enter');
    requestAnimationFrame(() => {
      content.classList.add('modal-enter-active');
    });
  }
}

function closeModal(modalEl) {
  if (!modalEl) return;
  const content = modalEl.querySelector('.modal-content');
  if (content) {
    content.classList.remove('modal-enter-active');
    content.classList.add('modal-exit');
    requestAnimationFrame(() => {
      content.classList.add('modal-exit-active');
    });
  }
  setTimeout(() => {
    modalEl.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (content) {
      content.classList.remove('modal-enter', 'modal-enter-active', 'modal-exit', 'modal-exit-active');
      content.classList.add('modal-enter');
    }
  }, 220);
}


/* --- Модальное окно кейсов --- */

function initCaseModal() {
  const modal = document.getElementById('case-modal');
  const closeBtn = document.getElementById('close-case-modal');
  const titleEl = document.getElementById('case-modal-title');
  const imageEl = document.getElementById('case-modal-image');
  const imageContainer = document.getElementById('case-modal-image-container');
  const happenedEl = document.getElementById('case-modal-happened');
  const didEl = document.getElementById('case-modal-did');
  const resultEl = document.getElementById('case-modal-result');
  const risksEl = document.getElementById('case-modal-risks');

  if (!modal) return;

  function formatCaseContent(text) {
    if (!text) return '';
    const trimmed = text.trim();
    const hasBullets = trimmed.includes('•');
    const hasColon = trimmed.includes(':');
    const hasSemicolons = trimmed.includes(';');

    if (hasBullets) {
      const [intro, ...items] = trimmed.split('•');
      const introHtml = intro.trim() ? `<p class="font-mulish-regular text-gray-700">${intro.trim()}</p>` : '';
      const listItems = items.map(i => i.trim()).filter(Boolean).map(i => `<li>${i}</li>`).join('');
      return `${introHtml}<ul class="list-disc pl-5 space-y-2 font-mulish-regular text-gray-700">${listItems}</ul>`;
    }

    if (hasColon && hasSemicolons) {
      const [intro, rest] = trimmed.split(':');
      const introHtml = intro.trim() ? `<p class="font-mulish-regular text-gray-700">${intro.trim()}:</p>` : '';
      const listItems = rest.split(';').map(i => i.trim()).filter(Boolean).map(i => `<li>${i}</li>`).join('');
      return `${introHtml}<ul class="list-disc pl-5 space-y-2 font-mulish-regular text-gray-700">${listItems}</ul>`;
    }

    return `<p class="font-mulish-regular text-gray-700">${trimmed.replace(/\n+/g, '<br>')}</p>`;
  }

  document.querySelectorAll('[data-case-card]').forEach(card => {
    card.addEventListener('click', () => {
      titleEl.textContent = card.dataset.caseTitle || 'Кейс';

      if (card.dataset.caseImage && imageEl && imageContainer) {
        imageEl.src = card.dataset.caseImage;
        imageEl.alt = card.dataset.caseTitle || '';
        imageContainer.style.display = 'block';
      } else if (imageContainer) {
        imageContainer.style.display = 'none';
      }

      happenedEl.innerHTML = formatCaseContent(card.dataset.caseHappened || '');
      didEl.innerHTML = formatCaseContent(card.dataset.caseDid || '');
      resultEl.innerHTML = formatCaseContent(card.dataset.caseResult || '');
      risksEl.innerHTML = formatCaseContent(card.dataset.caseRisks || '');
      openModal(modal);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(modal));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
}


/* --- Быстрый заказ (модальное окно) --- */

function initQuickOrderModal() {
  const modal = document.getElementById('quick-order-modal');
  const closeBtn = document.getElementById('close-modal');
  const form = document.getElementById('quick-order-form');
  const titleEl = document.getElementById('modal-title');
  const subjectInput = document.getElementById('quick-subject');

  if (!modal || !form) return;

  function closeQuickOrder() {
    closeModal(modal);
    form.reset();
    resetRecaptcha(form);
  }

  // Открытие модалки из любой кнопки [data-quick-order]
  document.querySelectorAll('[data-quick-order]').forEach(button => {
    button.addEventListener('click', function () {
      const subject = this.getAttribute('data-subject') || 'Заявка с сайта';
      titleEl.textContent = subject;
      subjectInput.value = subject;
      openModal(modal);
    });
  });

  closeBtn.addEventListener('click', closeQuickOrder);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeQuickOrder();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getRecaptchaToken(form);
    if (!token) {
      showToast('Пожалуйста, подтвердите, что вы не робот', 'error');
      return;
    }

    const formData = {
      form_type: 'quick',
      'quick-subject': document.getElementById('quick-subject').value,
      'quick-name': document.getElementById('quick-name').value,
      'quick-phone': document.getElementById('quick-phone').value,
      'quick-company': document.getElementById('quick-company').value,
      'quick-email': document.getElementById('quick-email').value,
      'quick-position': document.getElementById('quick-position').value,
      recaptcha_token: token,
    };

    await submitForm(formData, () => {
      form.reset();
      closeQuickOrder();
    });

    resetRecaptcha(form);
  });
}


/* --- Форма калькулятора --- */

function initCalculatorForm() {
  const form = document.getElementById('calculator-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getRecaptchaToken(form);
    if (!token) {
      showToast('Пожалуйста, подтвердите, что вы не робот', 'error');
      return;
    }

    const formData = {
      form_type: 'main',
      'company-name': document.getElementById('calc-company').value,
      'contact-person': document.getElementById('calc-name').value,
      'phone': document.getElementById('calc-phone').value,
      'email': document.getElementById('calc-email').value,
      'position': document.getElementById('calc-position').value,
      recaptcha_token: token,
    };

    await submitForm(formData, () => form.reset());
    resetRecaptcha(form);
  });
}


/* --- Инлайн CTA-форма --- */

function initInlineForm() {
  const form = document.getElementById('quick-order-form-inline');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getRecaptchaToken(form);
    if (!token) {
      showToast('Пожалуйста, подтвердите, что вы не робот', 'error');
      return;
    }

    const formData = {
      form_type: 'quick',
      'quick-subject': form.querySelector('input[name="quick-subject"]').value,
      'quick-phone': document.getElementById('cta-phone').value,
      'quick-email': document.getElementById('cta-email').value,
      'quick-name': document.getElementById('cta-name').value,
      'quick-company': document.getElementById('cta-company').value,
      'quick-position': document.getElementById('cta-position').value,
      recaptcha_token: token,
    };

    await submitForm(formData, () => form.reset());
    resetRecaptcha(form);
  });
}


/* --- Яндекс.Метрика (отложенная загрузка) --- */

function initYandexMetrika() {
  window.addEventListener('load', function () {
    setTimeout(function () {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t);
        a = e.getElementsByTagName(t)[0];
        k.async = 1;
        k.src = r;
        a.parentNode.insertBefore(k, a);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      ym(105638591, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    }, 2000);
  });
}


/* --- Инициализация калькулятора простоя --- */

function initDowntimeCalculator() {
  const revenueInput = document.getElementById('daily-revenue');
  const daysInput = document.getElementById('working-days');
  const calcBtn = document.getElementById('calculate-btn');
  if (!revenueInput || !daysInput) return;

  revenueInput.addEventListener('input', calculateDowntime);
  daysInput.addEventListener('input', calculateDowntime);
  if (calcBtn) calcBtn.addEventListener('click', calculateDowntime);
}


/* --- Маска телефона +7 (___) ___-__-__ --- */

function initPhoneMasks() {
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', handlePhoneInput);
    input.addEventListener('focus', handlePhoneFocus);
    input.addEventListener('keydown', handlePhoneKeydown);
  });
}

function formatPhone(digits) {
  // digits — только цифры после 7 (максимум 10 штук)
  let result = '+7';
  if (digits.length === 0) return result;
  result += ' (' + digits.substring(0, 3);
  if (digits.length >= 3) result += ')';
  if (digits.length > 3) result += ' ' + digits.substring(3, 6);
  if (digits.length > 6) result += '-' + digits.substring(6, 8);
  if (digits.length > 8) result += '-' + digits.substring(8, 10);
  return result;
}

function extractDigitsAfter7(value) {
  const allDigits = value.replace(/\D/g, '');
  // Если начинается с 7 или 8 — отбрасываем первую цифру
  if (allDigits.length > 0 && (allDigits[0] === '7' || allDigits[0] === '8')) {
    return allDigits.substring(1, 11);
  }
  return allDigits.substring(0, 10);
}

function handlePhoneInput(e) {
  const input = e.target;
  const digits = extractDigitsAfter7(input.value);
  const formatted = formatPhone(digits);
  // Сохраняем позицию курсора относительно конца
  input.value = formatted;
  // Курсор в конец
  input.setSelectionRange(formatted.length, formatted.length);
}

function handlePhoneFocus(e) {
  const input = e.target;
  if (!input.value || input.value.trim() === '') {
    input.value = '+7';
    setTimeout(() => input.setSelectionRange(2, 2), 0);
  }
}

function handlePhoneKeydown(e) {
  const input = e.target;
  // Разрешаем: стрелки, Tab, Ctrl+A/C/V/X, Delete
  if (['ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;

  // Backspace — удаляем последнюю цифру
  if (e.key === 'Backspace') {
    e.preventDefault();
    const digits = extractDigitsAfter7(input.value);
    if (digits.length > 0) {
      input.value = formatPhone(digits.slice(0, -1));
    } else {
      input.value = '+7';
    }
    input.setSelectionRange(input.value.length, input.value.length);
    return;
  }

  // Только цифры
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }

  // Максимум 10 цифр после 7
  const digits = extractDigitsAfter7(input.value);
  if (digits.length >= 10) {
    e.preventDefault();
  }
}


/* ============================================
   ЗАПУСК
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initFAQ();
  initScrollReveal();
  initStatsCountUp();
  initCaseModal();
  initQuickOrderModal();
  initCalculatorForm();
  initInlineForm();
  initDowntimeCalculator();
  initPhoneMasks();
  initYandexMetrika();
});
