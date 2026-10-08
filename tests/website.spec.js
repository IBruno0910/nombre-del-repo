import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('owa-intro-seen', 'true'));
});

test('English home loads assets, all five services and Spanish translation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('A world of possibilities in aviation');
  await expect(page.locator('.hero-copy > p')).toHaveText('We combine experience, expertise, and a global network to deliver the right solution for every aircraft, every operation, and every client.');
  await expect(page.locator('.service-row')).toHaveCount(5);
  await expect(page.locator('.aviation-panorama')).toHaveCount(0);
  await expect(page.locator('.service-photo img')).toHaveCount(5);
  expect(new Set(await page.locator('.service-photo img').evaluateAll(images => images.map(image => image.getAttribute('src')))).size).toBe(5);
  await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { img.loading = 'eager'; await img.decode(); } });
  await expect(page.locator('body')).not.toContainText(/inajet/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el => { const r=el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).map(el => ({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right}))))).toBe(true);
  await page.screenshot({ animations: 'disabled', path: 'artifacts/owa-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('h1')).toHaveText('Un mundo de posibilidades en la aviación');
  await expect(page.locator('.hero-copy > p')).toHaveText('Combinamos experiencia, conocimiento y una red global para ofrecer la solución adecuada para cada aeronave, cada operación y cada cliente.');
  await expect(page.locator('#main-navigation')).toContainText('Servicios');
  await expect(page.locator('#main-navigation')).toContainText('Quiénes somos');
  await expect(page.locator('#main-navigation')).toContainText('Cómo trabajamos');
  await expect(page.locator('.header-contact')).toContainText('Contacto');
  await expect(page.locator('.service-row').first()).toContainText('Compra y venta de aeronaves');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(errors).toEqual([]);
});

test('service inquiry submits to the API and confirms only after acceptance', async ({ page }) => {
  let payload;
  await page.route('**/api/inquiries', async route => {
    payload=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,receipt:'accepted'})});
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Aircraft sales and acquisitions — Learn more' }).click();
  await expect(page.getByRole('dialog')).toContainText('pre-purchase inspection coordination');
  await page.getByRole('button', { name: 'Ask about this service' }).click();
  const form=page.locator('.contact-form');
  await expect(form.getByLabel('Service of interest')).toHaveValue('2');
  await form.getByLabel('Full name').fill('Test Client');
  await form.getByLabel('Email', {exact:true}).fill('client@example.com');
  await form.getByLabel('Company').fill('Test Company');
  await form.getByLabel('How can we help?').fill('Aircraft acquisition inquiry.');
  await form.getByRole('button', {name:'Prepare inquiry'}).click();
  await expect(page.getByRole('dialog')).toContainText('Aircraft acquisition inquiry.');
  await expect(page.getByRole('dialog')).not.toContainText('We received your inquiry');
  await page.getByRole('button',{name:'Send inquiry',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('get in touch');
  await expect(page.getByRole('status')).toContainText('acknowledgment');
  expect(payload.kind).toBe('contact');expect(payload.service).toBe(2);expect(payload.email).toBe('client@example.com');
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await expect(form.getByLabel('Full name')).toHaveValue('');
});

for (const lang of ['es', 'en']) {
  test(`reordered services keep their details, selection and review identity in ${lang}`, async ({ page }) => {
    test.setTimeout(45000);
    let submissions = 0;
    await page.route('**/api/inquiries', route => { submissions++; return route.abort(); });
    const expected = {
      es: [
        [2, 'Compra y venta de aeronaves', 'inspecciones precompra'],
        [0, 'Gestión de aeronaves', 'supervisión de mantenimiento'],
        [1, 'Vuelos privados', 'operadores calificados'],
        [3, 'Soluciones corporativas', 'evaluación de pistas e infraestructura'],
        [4, 'Soporte y logística', 'aeronave está fuera de servicio'],
      ],
      en: [
        [2, 'Aircraft sales and acquisitions', 'pre-purchase inspection coordination'],
        [0, 'Aircraft management', 'maintenance oversight'],
        [1, 'Private flights', 'qualified operators'],
        [3, 'Corporate solutions', 'runway and infrastructure assessment'],
        [4, 'Support and logistics', 'aircraft is out of service'],
      ],
    };
    await page.goto(`/${lang}`);
    const titles = expected[lang].map(([, title]) => title);
    const form = page.locator('.contact-form');
    await expect(page.locator('.service-row h3')).toHaveText(titles);
    await expect(form.locator('option:not([disabled])')).toHaveText(titles);
    for (const [id, title, detail] of expected[lang]) {
      await page.getByRole('button', { name: `${title} — ${lang === 'es' ? 'Conocer más' : 'Learn more'}` }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading')).toHaveText(title);
      await expect(dialog).toContainText(detail);
      await expect(dialog.locator('.form-notice')).toHaveCount(id === 1 ? 1 : 0);
      await dialog.getByRole('button', { name: lang === 'es' ? 'Consultar por este servicio' : 'Ask about this service' }).click();
      await expect(form.locator('select')).toHaveValue(String(id));
      // A language change must preserve the selected service, even after reordering.
      await page.getByRole('button', { name: lang === 'es' ? 'Switch to English' : 'Cambiar a español' }).click();
      await expect(form.locator('select')).toHaveValue(String(id));
      await page.getByRole('button', { name: lang === 'es' ? 'Cambiar a español' : 'Switch to English' }).click();
      await form.locator('[name="name"]').fill('Editorial review');
      await form.locator('[name="email"]').fill('review@example.com');
      await form.locator('[name="message"]').fill('Service identity review');
      await form.getByRole('button', { name: lang === 'es' ? 'Preparar consulta' : 'Prepare inquiry' }).click();
      await expect(dialog.getByRole('heading')).toHaveText(lang === 'es' ? 'Su consulta, lista para revisar' : 'Your inquiry, ready to review');
      await expect(dialog.locator('.inquiry-summary strong')).toHaveText(title);
      await expect(dialog).toContainText(lang === 'es' ? 'Su consulta todavía no se ha enviado.' : 'Your inquiry has not been sent yet.');
      await dialog.getByRole('button', { name: lang === 'es' ? 'Editar datos' : 'Edit details' }).click();
      await expect(form.locator('[name="message"]')).toHaveValue('Service identity review');
    }
    expect(submissions).toBe(0);
  });
}

test('approved bilingual headings, metadata, navigation and public contact links are complete', async ({ page }) => {
  for (const [lang, heading, nav] of [
    ['es', 'Un mundo de posibilidades en la aviación', ['Servicios', 'Quiénes somos', 'Cómo trabajamos']],
    ['en', 'A world of possibilities in aviation', ['Services', 'About us', 'How we work']],
  ]) {
    await page.goto(`/${lang}`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(heading);
    await expect(page).toHaveTitle(`Open World Aviation | ${heading}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', lang === 'es'
      ? 'Compra y venta de aeronaves, gestión, vuelos privados, soluciones corporativas y soporte logístico. Experiencia y coordinación global.'
      : 'Aircraft sales and acquisitions, management, private flights, corporate solutions and logistics support. Experience and global coordination.');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    for (const [i, anchor] of ['services', 'perspective', 'approach'].entries()) {
      const link = page.locator('#main-navigation').getByRole('link', { name: nav[i], exact: true });
      await expect(link).toHaveAttribute('href', `#${anchor}`);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
      await expect(page.locator(`#${anchor}`)).toBeInViewport();
    }
    await expect(page.locator('.header-contact')).toHaveText(lang === 'es' ? 'Contacto' : 'Contact');
    const links = page.locator('.contact-links');
    for (const [label, href] of [
      ['fernando@openworldaviation.com', 'mailto:fernando@openworldaviation.com'],
      ['contact@openworldaviation.com', 'mailto:contact@openworldaviation.com'],
      ['+1 (305) 430-5398', 'tel:+13054305398'],
      ['+54 (9 11) 6801-5259', 'tel:+5491168015259'],
      ['openworldaviation.com', 'https://openworldaviation.com/'],
    ]) await expect(links.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href);
    await expect(page.locator('.segment-strip')).toHaveCount(0);
    await expect(page.locator('#services .eyebrow, .service-number, #perspective .eyebrow, #approach .eyebrow, #contact .eyebrow')).toHaveCount(0);
    await page.locator('.service-row').first().click();
    await page.getByRole('dialog').getByRole('link', { name: lang === 'es' ? 'Volver al inicio' : 'Back to home' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#home')).toBeInViewport();
  }
});

test('form requires valid input and charter description preserves operator distinction', async ({ page }) => {
  await page.goto('/es');
  await page.getByRole('button', { name: 'Preparar consulta' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Vuelos privados — Conocer más' }).click();
  await expect(page.getByRole('dialog')).toContainText('operadores calificados');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('localized legal URLs retain language and publish completed privacy and terms', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(`/es${path}`);
    await expect(page.locator('.draft-notice')).toHaveCount(0);
    await expect(page.locator('.legal-page mark')).toHaveCount(0);
    await expect(page.locator('.legal-page')).toContainText('Open World Aviation LLC');
    await expect(page.locator('.legal-page')).toContainText('contact@openworldaviation.com');
    await expect(page.locator('footer nav a')).toHaveCount(4);
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page).toHaveURL(new RegExp(`/en${path}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.locator('h1')).toContainText('A world of possibilities in aviation');
});

test('WhatsApp and Instagram links use the published business contacts', async ({ page }) => {
  await page.goto('/es');
  const whatsapp = page.getByRole('link', { name: 'Contactar a Open World Aviation por WhatsApp' });
  await expect(whatsapp).toBeVisible();
  await expect(whatsapp).toHaveAttribute('href', /wa\.me\/13054305398\?text=Hola/);
  await expect(page.getByRole('link', { name: 'Open World Aviation on Instagram' })).toHaveAttribute('href', /instagram\.com\/openworldaviation/);
});

test('mobile menu and dialogs are usable at 390px and 320px without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { img.loading = 'eager'; await img.decode(); } });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/owa-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('#main-navigation')).toBeVisible();
  await page.locator('#main-navigation').getByRole('link', { name: 'Services' }).click();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.service-row').last().click();
  await expect(page.getByRole('dialog')).toContainText('AOG support coordination');
  await page.screenshot({ animations: 'disabled', path: 'artifacts/owa-mobile-dialog.png' });
  await page.keyboard.press('Escape');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el => { const r=el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).map(el => ({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right}))))).toBe(true);
  }
});

const nextDate = days => new Date(Date.now()+days*86400000).toISOString().slice(0,10);

test('flight itinerary validation and round-trip submission include dates and passengers',async({page})=>{
  let payload;
  await page.route('**/api/inquiries',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,receipt:'accepted'})});});
  await page.goto('/es');
  const planner=page.locator('#flights');
  await planner.getByLabel('Ida y vuelta',{exact:true}).check();
  await planner.getByLabel('Origen',{exact:true}).fill('Buenos Aires');
  await planner.getByLabel('Destino',{exact:true}).fill('Buenos Aires');
  await planner.getByLabel('Salida',{exact:true}).fill(nextDate(2));
  await planner.getByLabel('Regreso',{exact:true}).fill(nextDate(1));
  expect(await planner.getByLabel('Regreso',{exact:true}).evaluate(el=>el.validity.rangeUnderflow)).toBe(true);
  await planner.getByLabel('Regreso',{exact:true}).fill(nextDate(5));
  await planner.getByRole('button',{name:'Solicitar vuelo'}).click();
  await expect(planner.getByRole('alert')).toContainText('destino diferente');
  await planner.getByLabel('Destino',{exact:true}).fill('Mendoza');
  await planner.getByLabel('Pasajeros',{exact:true}).fill('6');
  await planner.getByRole('button',{name:'Solicitar vuelo'}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Nombre y apellido').fill('Prueba de vuelo');
  await dialog.getByLabel('Email',{exact:true}).fill('flight@example.com');
  await dialog.getByRole('button',{name:'Revisar consulta'}).click();
  await expect(page.getByRole('dialog')).toContainText('Buenos Aires → Mendoza');
  await page.getByRole('button',{name:'Enviar consulta',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('se pondrá en contacto');
  expect(payload.flight.returnDate).toBe(nextDate(5));expect(payload.flight.passengers).toBe(6);expect(payload.kind).toBe('flight');
  await page.getByRole('button',{name:'Listo',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('multi-city planner adds, removes and preserves itinerary details',async({page})=>{
  await page.goto('/');const planner=page.locator('#flights');
  await planner.getByLabel('Multi-city',{exact:true}).check();
  await planner.getByLabel('From',{exact:true}).fill('Miami');
  await planner.getByLabel('To',{exact:true}).fill('Nassau');
  await planner.getByLabel('Departure',{exact:true}).fill(nextDate(2));
  await planner.getByLabel('From 2',{exact:true}).fill('Nassau');
  await planner.getByLabel('To 2',{exact:true}).fill('New York');
  await planner.getByLabel('Departure 2',{exact:true}).fill(nextDate(4));
  await planner.getByRole('button',{name:'Add flight',exact:true}).click();
  await expect(planner.getByLabel('From 3',{exact:true})).toHaveValue('New York');
  await planner.getByRole('button',{name:'Remove flight 3'}).click();
  await planner.getByRole('button',{name:'Request a flight'}).click();
  await page.getByRole('dialog').getByLabel('Full name').fill('Flight Test');
  await page.getByRole('dialog').getByLabel('Email',{exact:true}).fill('flight@example.com');
  await page.getByRole('button',{name:'Review your inquiry'}).click();
  await expect(page.getByRole('dialog')).toContainText('Nassau → New York');
  await page.getByRole('button',{name:'Edit details'}).click();
  await expect(page.getByRole('dialog').getByLabel('Full name')).toHaveValue('Flight Test');
});

test('mail failures preserve inquiry and retry identity without false confirmation',async({page})=>{
  const ids=[];
  await page.route('**/api/inquiries',async route=>{ids.push(route.request().postDataJSON().requestId);await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'not_configured'})});});
  await page.goto('/');const form=page.locator('.contact-form');
  await form.getByLabel('Full name').fill('Retry Test');await form.getByLabel('Email',{exact:true}).fill('test@example.com');
  await form.getByLabel('Service of interest').selectOption('0');await form.getByLabel('How can we help?').fill('An inquiry to retry');
  await form.getByRole('button',{name:'Prepare inquiry'}).click();
  await page.getByRole('button',{name:'Send inquiry',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('has not been sent');
  await expect(page.getByRole('dialog')).not.toContainText('We received your inquiry');
  await page.getByRole('button',{name:'Send inquiry',exact:true}).click();
  expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);
  await page.getByRole('button',{name:'Edit details'}).click();await expect(form.getByLabel('Full name')).toHaveValue('Retry Test');
});

test('local API is mounted and rejects invalid input without sending mail',async({request})=>{
  const response=await request.post('/api/inquiries',{headers:{Origin:'http://127.0.0.1:5173'},data:{kind:'contact'}});
  expect(response.status()).toBe(400);expect((await response.json()).code).toBe('invalid');
  expect((await request.get('/api/inquiries')).status()).toBe(405);
});
