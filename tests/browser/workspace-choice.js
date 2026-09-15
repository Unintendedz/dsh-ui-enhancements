// Run with playwright-cli in a fresh synthetic DSH profile with Alpha Workspace
// and Beta Workspace fixtures. Refuse the user's live profile before any clicks.
async page => {
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const origin = page.url().split('/').slice(0, 3).join('/')
  assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) && !origin.endsWith(':33080'), 'isolated loopback instance required')
  const response = await page.request.post(origin + '/api/projectlessConversations/info', {
    data: { type: 'client-request', rpcId: 'synthetic-choice-check', method: 'projectlessConversations/info', payload: { args: {} } },
    headers: { Origin: origin },
  })
  const info = (await response.json()).result
  assert(info.ok && info.value.root.includes('/dsh-workspace-choice-test-'), 'fresh synthetic DSH_HOME required')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const chip = page.getByRole('button', { name: 'Choose workspace', exact: true })
  const input = page.locator('[data-composer-input=true]')
  const clear = page.getByRole('button', { name: 'Switch to No workspace', exact: true })
  const header = title => page.locator('[data-dsh-workspace-group]').filter({ has: page.getByText(title, { exact: true }) }).locator('[role=treeitem][aria-expanded]').first()
  const loose = page.locator('[data-dsh-workspace-group=""] [role=treeitem][aria-expanded]').first()
  const pick = async title => { await chip.click(); await page.getByRole('menuitem', { name: title, exact: true }).click(); await chip.filter({ hasText: title }).waitFor() }
  const current = async row => {
    await page.waitForFunction(() => document.querySelectorAll('.dsh-workspace-group-row[aria-current=true]').length === 1)
    assert(await row.getAttribute('aria-current') === 'true', 'highlight must follow the current workspace')
  }
  await page.setViewportSize({ width: 1280, height: 840 })
  await page.getByRole('button', { name: 'New session', exact: true }).last().click()
  await chip.filter({ hasText: 'No workspace' }).waitFor()
  await pick('Alpha Workspace')
  await chip.hover()
  assert(await clear.count() === 1, 'workspace chip needs a one-click clear action')
  assert(await clear.evaluate(el => getComputedStyle(el).opacity) === '1', 'clear action must appear on hover')
  await current(header('Alpha Workspace'))
  await page.mouse.move(1200, 20)
  assert(await loose.evaluate(el => getComputedStyle(el).backgroundColor) === 'rgba(0, 0, 0, 0)', 'inactive No workspace must not look selected')
  await input.fill('Keep this draft across workspace choices.')
  await chip.hover()
  await clear.click()
  await chip.filter({ hasText: 'No workspace' }).waitFor()
  assert(await page.getByRole('menu').count() === 0, 'clear must switch directly without opening a menu')
  assert(await chip.locator('[data-dsh-projectless-icon]').count() === 1, 'No workspace chip needs its own chat icon')
  assert(await clear.count() === 0, 'No workspace has nothing to clear')
  assert((await input.innerText()).includes('Keep this draft'), 'clear must preserve the draft')
  await current(loose)
  await chip.click()
  assert(await page.getByRole('menuitem', { name: 'No workspace', exact: true }).locator('[data-dsh-projectless-icon]').count() === 1, 'picker and chip must share the chat icon')
  await page.getByRole('menuitem', { name: 'Beta Workspace', exact: true }).click()
  await chip.filter({ hasText: 'Beta Workspace' }).waitFor()
  await current(header('Beta Workspace'))
  assert((await input.innerText()).includes('Keep this draft'), 'switching back must preserve the draft')
  await header('Beta Workspace').click()
  await current(header('Beta Workspace'))
  await page.mouse.move(1200, 20)
  await clear.focus()
  assert(await clear.evaluate(el => getComputedStyle(el).opacity) === '1', 'keyboard focus must reveal the clear action')
  await page.keyboard.press('Enter')
  await chip.filter({ hasText: 'No workspace' }).waitFor()
  assert((await input.innerText()).includes('Keep this draft'), 'keyboard clear must preserve the draft')
  await current(loose)
  assert(errors.length === 0, 'browser errors: ' + errors.join('; '))
  return { oneClickClear: true, sharedIcon: true, selectionHighlight: true, collapsedCurrentGroup: true, draftCarriedBothWays: true, keyboardClear: true, errors }
}
