import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import AsyncTaskPool from '../index'

describe('AsyncTaskPool Testing', () => {
  function asyncProcess(command: string, args?: string[], options?: SpawnOptionsWithoutStdio) {
    return new Promise<string>((resolve, reject) => {
      const process = spawn(command, args, options)
      let info = ''
      let error = ''
      process.stdout.on('data', (data: string) => {
        info += data
      })

      process.stderr.on('data', (data: string) => {
        error += data
      })

      process.on('close', (code: number) => {
        if (code !== 0 && error !== '') {
          // console.error(command, args, error)
          return reject(new Error(error))
        }
        // console.info(command, args, info)
        return resolve(info)
      })
    })
  }

  it('node version x100', async () => {
    const times = 100
    const size = 6
    const task = () => asyncProcess('node', ['--version'])
    const poolTask = AsyncTaskPool.create(task, size, times)
    const list = Array(times).fill(0).map(() => poolTask())
    const results = await Promise.all(list)
    expect(results.every(result => result === results[0])).toBe(true)
  })

  it('pool is full', async () => {
    const times = 100
    const size = 6
    const task = () => asyncProcess('node', ['--version'])
    const poolTask = AsyncTaskPool.create(task, size, -1)
    const list = Array(times).fill(0).map(() => poolTask())
    try {
      const results = await Promise.all(list)
      expect(results.every(result => result === results[0])).toBe(true)
    } catch (error) {
      expect(error.message).toBe('The async task pool is full')
    }
  })

  it('check working count', async () => {
    const times = 100
    const size = 6
    const task = () => asyncProcess('node', ['--version'])
    const pool = new AsyncTaskPool(task, size)
    const poolTask = pool.create()
    const list = Array(times).fill(0).map(() => poolTask())
    const results = await Promise.all(list)
    expect(results.every(result => result === results[0])).toBe(true)
  })
})
