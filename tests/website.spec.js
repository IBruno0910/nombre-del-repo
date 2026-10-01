import { test, expect } from '@playwright/test';

test('English home loads assets, all five services and Spanish translation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('A world of');
  await expect(page.locator('.service-row')).toHaveCount(5);
  await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) { img.loading = 'eager'; await img.decode(); } });
  await expect(page.locator('body')).not.toContainText(/inajet/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(el => { const r=el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).map(el => ({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right}))))).toBe(true);
  await page.screenshot({ animations: 'disabled', path: 'artifacts/owa-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('h1')).toContainText('Un mundo de');
  await expect(page.locator('.service-row').first()).toContainText('Gestión de aeronaves');
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

test('form requires valid input and charter description preserves operator distinction', async ({ page }) => {
  await page.goto('/es');
  await page.getByRole('button', { name: 'Preparar consulta' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Charter privado y soporte de vuelo — Conocer más' }).click();
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
  await expect(page.locator('h1')).toContainText('A world of');
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
  await page.locator('#main-navigation').getByRole('link', { name: 'Our services' }).click();
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
