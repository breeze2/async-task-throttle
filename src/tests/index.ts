import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import AsyncTaskPool from '../index'

describe('AsyncTaskPool Testing', () => {
  function execute(command: string, args?: string[], options?: SpawnOptionsWithoutStdio) {
    return new Promise<string>((resolve, reject) => {
      const proc = spawn(command, args, options)
      let info = ''
      let error = ''
      proc.stdout.on('data', (data: string) => {
        info += data
      })

      proc.stderr.on('data', (data: string) => {
        error += data
      })

      proc.on('close', (code: number) => {
        if (code !== 0 && error !== '') {
          // console.error(command, args, error)
          return reject(new Error(error))
        }
        // console.info(command, args, info)
        return resolve(info)
      })
    })
  }

  function sleep(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
  }

  it('node version x100', async () => {
    const times = 100
    const size = 6
    const task = () => execute('node', ['--version'])
    const poolTask = AsyncTaskPool.create(task, size)
    const list = Array(times).fill(0).map(() => poolTask())
    const results = await Promise.all(list)
    expect(results.every(result => result === results[0])).toBe(true)
  })

  it('pool is full', async () => {
    const size = 6
    const task = () => execute('node', ['--version'])
    const poolTask = AsyncTaskPool.create(task, size, -1)
    try {
      await poolTask()
      expect(1).toBe(0)
    } catch (error) {
      expect(error.message).toBe('The async task pool is full')
    }
  })

  it('check working count', async () => {
    const times = 24
    const size = 8
    const task = () => sleep(1)
    const pool = new AsyncTaskPool(task, size)
    const poolTask = pool.create()
    const list = Array(times).fill(0).map(() => poolTask())
    const timeId = setInterval(() => {
      const count = pool.getWorkingCount()
      if (count === 0) {
        clearInterval(timeId)
      } else {
        expect(count).toBeLessThanOrEqual(size)
      }
    }, 400)
    const results = await Promise.all(list)
    expect(results.every(result => result === results[0])).toBe(true)
  })

  it('check resolve and reject', async () => {
    let flag = true
    let successCount = 0
    let failCount = 0
    const times = 24
    const task = () => new Promise((resolve, reject) => {
      if (flag) {
        flag = false
        return resolve()
      } else {
        flag = true
        return reject()
      }
    })
    const poolTask = AsyncTaskPool.create(task)
    for (let i = 0; i < times; i++) {
      await poolTask().then(() => successCount++).catch(() => failCount++)
    }
    expect(successCount).toBe(failCount)
  })

})
