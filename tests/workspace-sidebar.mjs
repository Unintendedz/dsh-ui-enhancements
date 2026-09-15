import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as client from '../src/client.js'

function fixture() {
  assert.equal(typeof client.workspaceGroupOrder, 'function', 'workspace recency ordering is missing')
  const workspaces = [
    { workspaceId: 'a', createdAt: '2026-01-01T00:00:00Z', sessionIds: ['a1', 'a2'] },
    { workspaceId: 'b', createdAt: '2026-01-02T00:00:00Z', sessionIds: ['b1'] },
  ]
  const list = { ids: ['a1', 'a2', 'b1', 'loose'], byId: {
    a1: { id: 'a1', updatedAt: 100, blank: false },
    a2: { id: 'a2', updatedAt: 150, blank: false },
    b1: { id: 'b1', updatedAt: 200, blank: false },
    loose: { id: 'loose', updatedAt: 300, blank: false },
  } }
  return { list, workspaces, order: (archived = [], mode = 'updated') => client.workspaceGroupOrder(list, workspaces, archived, mode) }
}

test('workspace groups and no-workspace conversations share one newest-first order', () => {
  const f = fixture()
  assert.deepEqual(f.order(), ['', 'b', 'a'])
  f.list.byId.a1.updatedAt = 400
  assert.deepEqual(f.order(), ['a', '', 'b'])
  f.list.byId.b1.updatedAt = 500
  assert.deepEqual(f.order(), ['b', 'a', ''])
  assert.deepEqual(f.workspaces.map(item => item.workspaceId), ['a', 'b'], 'host order must not be mutated')
})

test('archived conversations, hidden drafts, and subagents do not promote a group', () => {
  const f = fixture()
  f.list.byId.a2.updatedAt = 999
  assert.deepEqual(f.order(['a2']), ['', 'b', 'a'])
  f.list.byId.a2.blank = true
  assert.deepEqual(f.order(), ['', 'b', 'a'])
  f.list.current = 'a2'
  assert.deepEqual(f.order(), ['a', '', 'b'], 'the visible current draft counts as activity')
  f.list.byId.a2.origin = 'subagent'
  assert.deepEqual(f.order(), ['', 'b', 'a'])
})

test('removing or moving the newest conversation recalculates both affected groups', () => {
  const f = fixture()
  assert.deepEqual(f.order(['loose']), ['b', 'a'])
  f.workspaces[0].sessionIds.push('loose')
  assert.deepEqual(f.order(), ['a', 'b'])
  f.workspaces[0].sessionIds.pop()
  delete f.list.byId.loose
  assert.deepEqual(f.order(), ['b', 'a'])
})

test('ties keep host order and manual mode keeps the original group order', () => {
  const f = fixture()
  f.list.byId.a1.updatedAt = 300
  f.list.byId.b1.updatedAt = 300
  assert.deepEqual(f.order(), ['a', 'b', ''])
  f.list.byId.loose.updatedAt = 999
  assert.deepEqual(f.order([], 'manual'), ['a', 'b', ''])
})

test('empty workspaces fall back to creation time; invalid dates remain stable', () => {
  const f = fixture()
  f.workspaces.push({workspaceId: 'empty', sessionIds: [], createdAt: '2026-01-03T00:00:00Z'})
  assert.equal(f.order()[0], 'empty')
  f.workspaces[2].createdAt = 'unknown'
  assert.equal(f.order().at(-1), 'empty')
})
