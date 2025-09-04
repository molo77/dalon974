import { test, expect } from '@playwright/test'

test.describe('Page d\'accueil', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/dalon974/i)
    
    // Vérifier la présence d'éléments clés
    await expect(page.locator('h1')).toBeVisible()
    
    // Vérifier la navigation
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('should display annonces list', async ({ page }) => {
    await page.goto('/')
    
    // Attendre que les annonces se chargent
    await page.waitForSelector('[data-testid="annonce-card"]', { timeout: 10000 })
    
    // Vérifier qu'il y a des annonces
    const annonceCards = page.locator('[data-testid="annonce-card"]')
    await expect(annonceCards).toHaveCount.greaterThan(0)
  })

  test('should filter annonces by price', async ({ page }) => {
    await page.goto('/')
    
    // Attendre que les filtres soient visibles
    await page.waitForSelector('input[name="prixMax"]')
    
    // Saisir un prix maximum
    await page.fill('input[name="prixMax"]', '500')
    
    // Cliquer sur le bouton de recherche
    await page.click('button[type="submit"]')
    
    // Vérifier que les résultats sont filtrés
    await page.waitForTimeout(2000) // Attendre le rechargement
    
    const annonceCards = page.locator('[data-testid="annonce-card"]')
    await expect(annonceCards).toHaveCount.greaterThan(0)
  })

  test('should reset filters', async ({ page }) => {
    await page.goto('/')
    
    // Remplir des filtres
    await page.fill('input[name="prixMax"]', '500')
    await page.fill('input[name="surfaceMin"]', '20')
    
    // Cliquer sur réinitialiser
    await page.click('button:has-text("Réinitialiser")')
    
    // Vérifier que les champs sont vides
    await expect(page.locator('input[name="prixMax"]')).toHaveValue('')
    await expect(page.locator('input[name="surfaceMin"]')).toHaveValue('')
  })

  test('should navigate to annonce detail', async ({ page }) => {
    await page.goto('/')
    
    // Attendre qu'une annonce soit visible
    await page.waitForSelector('[data-testid="annonce-card"]')
    
    // Cliquer sur la première annonce
    const firstAnnonce = page.locator('[data-testid="annonce-card"]').first()
    await firstAnnonce.click()
    
    // Vérifier qu'un modal ou une page de détail s'ouvre
    await expect(page.locator('[data-testid="annonce-detail"]')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate to dashboard when clicking Messages', async ({ page }) => {
    await page.goto('/')
    
    // Cliquer sur Messages dans le header
    await page.click('a:has-text("Messages")')
    
    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/.*dashboard.*tab=messages/)
  })

  test('should navigate to dashboard when clicking Match', async ({ page }) => {
    await page.goto('/')
    
    // Cliquer sur Match dans le header
    await page.click('a:has-text("Match")')
    
    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL(/.*dashboard.*tab=match/)
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile', async ({ page }) => {
    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Vérifier que la page se charge correctement
    await expect(page.locator('h1')).toBeVisible()
    
    // Vérifier que le menu mobile fonctionne
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    }
  })
})
