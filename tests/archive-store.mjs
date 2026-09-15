import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as stores from '../src/archive-store.js'
const item = id => ({ sessionId: id, title: id, cwd: '/synthetic', available: true, titlePending: false, createdAt: 1 })
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b }); return {promise,resolve,reject} }

test('single-row deletion retains query and surviving objects without refetching the archive list', async () => {
  let calls=0
  const store=stores.createArchiveStore({listArchived:async()=>{calls++;return {items:[item('a'),item('b')]}},delete:async id=>({sessionId:id,deleted:true,archivedSessionIds:['b']})},()=>{})
  await store.load()
  store.setQuery('synthetic')
  const survivor=store.getSnapshot().items[1]
  await store.remove('a')
  assert.equal(calls,1)
  assert.equal(store.getSnapshot().query,'synthetic')
  assert.equal(store.getSnapshot().items[0],survivor)
})

test('refresh retains visible rows, deduplicates requests, and cannot resurrect a deleted row', async () => {
  let gate;let calls=0
  const store=stores.createArchiveStore({listArchived:async()=>{calls++;return gate?gate.promise:{items:[item('a'),item('b')]}},delete:async id=>({sessionId:id,deleted:true,archivedSessionIds:['b']})},()=>{})
  await store.load();gate=deferred()
  const refresh=store.load();const duplicate=store.load()
  assert.equal(calls,2)
  assert.equal(store.getSnapshot().items.length,2)
  await store.remove('a')
  gate.resolve({items:[item('a'),item('b')]});await Promise.all([refresh,duplicate])
  assert.deepEqual(store.getSnapshot().items.map(x=>x.sessionId),['b'])
})

test('failed row operation leaves the row and allows retry without reloading', async () => {
  let fail=true
  const store=stores.createArchiveStore({listArchived:async()=>({items:[item('a')]}),restore:async()=>{if(fail)throw Error('offline');return {archivedSessionIds:[]}}},()=>{})
  await store.load();await assert.rejects(store.restore('a'),/offline/)
  assert.equal(store.getSnapshot().items.length,1)
  assert.equal(store.getSnapshot().pending.size,0)
  fail=false;await store.restore('a');assert.equal(store.getSnapshot().items.length,0)
})

test('slow title hydration never delays inventory and cannot add a removed archive', async () => {
  const gate=deferred()
  const store=stores.createArchiveStore({listArchived:async()=>({items:[{...item('a'),titlePending:true},item('b')]}),resolveArchivedTitles:()=>gate.promise,delete:async id=>({sessionId:id,deleted:true,archivedSessionIds:['b']})},()=>{})
  await store.load();assert.equal(store.getSnapshot().items.length,2)
  assert.equal(store.getSnapshot().loading,false)
  await store.remove('a');gate.resolve({items:[{...item('a'),title:'Resolved'}]})
  await new Promise(resolve=>setImmediate(resolve))
  assert.deepEqual(store.getSnapshot().items.map(x=>x.sessionId),['b'])
})

test('late preview responses never replace the currently selected conversation', async () => {
  const gate=deferred()
  const store=stores.createArchiveStore({listArchived:async()=>({items:[item('a'),item('b')]}),readArchived:id=>id==='a'?gate.promise:Promise.resolve({messages:[{role:'user',text:'B'}]})},()=>{})
  await store.load();const first=store.select('a');await store.select('b')
  gate.resolve({messages:[{role:'user',text:'A'}]});await first
  assert.equal(store.getSnapshot().selectedId,'b')
  assert.equal(store.getSnapshot().preview.messages[0].text,'B')
})

test('revalidation preserves a known title while the restarted host rebuilds its fallback cache', async () => {
  let first=true
  const gate=deferred()
  const store=stores.createArchiveStore({listArchived:async()=>({items:[first?{...item('a'),title:'Known title'}:{...item('a'),titlePending:true}]}),resolveArchivedTitles:()=>gate.promise},()=>{})
  await store.load();first=false;await store.load()
  assert.equal(store.getSnapshot().items[0].title,'Known title')
  gate.resolve({items:[{...item('a'),title:'Edited title'}]})
  await new Promise(resolve=>setImmediate(resolve))
  assert.equal(store.getSnapshot().items[0].title,'Edited title')
})
