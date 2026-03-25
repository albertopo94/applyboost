
import { test, expect } from '@playwright/test';

test('Wizard handles SCRAPER_BLOCKED error from API', async ({ page }) => {
  // Mock the API response for 403
  await page.route('**/api/generate', async (route) => {
    const json = { 
      error: { 
        code: 'SCRAPER_BLOCKED', 
        message: 'No pudimos leer los detalles del empleo desde este enlace. Por favor, pega la descripción manualmente abajo.' 
      } 
    };
    await route.fulfill({ 
      status: 403, 
      contentType: 'application/json', 
      body: JSON.stringify(json) 
    });
  });

  await page.goto('http://localhost:3000');

  // Fill CV (required for form submission)
  const cvTextarea = page.locator('textarea[placeholder*="CV"]');
  await cvTextarea.fill('This is my test CV with enough content to pass local validation.');

  // Fill URL
  const urlInput = page.locator('input[placeholder*="URL"]');
  await urlInput.fill('https://linkedin.com/jobs/view/blocked');

  // Click Submit
  const submitBtn = page.locator('button:has-text("Optimizar")');
  await submitBtn.click();

  // Verify Error Message
  const errorMsg = page.locator('div:has-text("No pudimos leer los detalles")');
  await expect(errorMsg).toBeVisible();

  // Verify Focus on Job Textarea
  const jobTextarea = page.locator('textarea[placeholder*="descripción"]');
  await expect(jobTextarea).toBeFocused();
});
