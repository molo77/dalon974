import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Aller au dashboard (nécessite une authentification)
    await page.goto('/dashboard')
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard tabs', async ({ page }) => {
    // Vérifier la présence des onglets
    await expect(page.locator('button:has-text("Annonces")')).toBeVisible()
    await expect(page.locator('button:has-text("Messages")')).toBeVisible()
    await expect(page.locator('button:has-text("Coloc")')).toBeVisible()
    await expect(page.locator('button:has-text("Match")')).toBeVisible()
  })

  test('should switch between tabs', async ({ page }) => {
    // Cliquer sur l'onglet Messages
    await page.click('button:has-text("Messages")')
    await expect(page.locator('[data-testid="messages-section"]')).toBeVisible()
    
    // Cliquer sur l'onglet Match
    await page.click('button:has-text("Match")')
    await expect(page.locator('[data-testid="match-section"]')).toBeVisible()
    
    // Cliquer sur l'onglet Coloc
    await page.click('button:has-text("Coloc")')
    await expect(page.locator('[data-testid="coloc-section"]')).toBeVisible()
  })

  test('should display match results', async ({ page }) => {
    // Aller à l'onglet Match
    await page.click('button:has-text("Match")')
    
    // Vérifier la présence des sélecteurs de type de match
    await expect(page.locator('button:has-text("Annonces pour mon profil")')).toBeVisible()
    await expect(page.locator('button:has-text("Profils pour mes annonces")')).toBeVisible()
  })

  test('should show compatibility scores', async ({ page }) => {
    // Aller à l'onglet Match
    await page.click('button:has-text("Match")')
    
    // Attendre que les résultats se chargent
    await page.waitForSelector('[data-testid="compatibility-score"]', { timeout: 10000 })
    
    // Vérifier la présence des scores de compatibilité
    const scores = page.locator('[data-testid="compatibility-score"]')
    await expect(scores).toHaveCount.greaterThan(0)
  })

  test('should display matching annonces for profiles', async ({ page }) => {
    // Aller à l'onglet Match
    await page.click('button:has-text("Match")')
    
    // Sélectionner "Profils pour mes annonces"
    await page.click('button:has-text("Profils pour mes annonces")')
    
    // Attendre que les profils se chargent
    await page.waitForSelector('[data-testid="profile-card"]', { timeout: 10000 })
    
    // Vérifier la présence des badges d'annonces correspondantes
    const matchingBadges = page.locator('[data-testid="matching-annonce-badge"]')
    await expect(matchingBadges).toHaveCount.greaterThan(0)
  })
})

test.describe('Dashboard - URL Parameters', () => {
  test('should open messages tab from URL parameter', async ({ page }) => {
    await page.goto('/dashboard?tab=messages')
    
    // Vérifier que l'onglet Messages est actif
    await expect(page.locator('button:has-text("Messages")[data-active="true"]')).toBeVisible()
    await expect(page.locator('[data-testid="messages-section"]')).toBeVisible()
  })

  test('should open match tab from URL parameter', async ({ page }) => {
    await page.goto('/dashboard?tab=match')
    
    // Vérifier que l'onglet Match est actif
    await expect(page.locator('button:has-text("Match")[data-active="true"]')).toBeVisible()
    await expect(page.locator('[data-testid="match-section"]')).toBeVisible()
  })
})
