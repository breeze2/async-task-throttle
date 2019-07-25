import { spawn, SpawnOptionsWithoutStdio } from 'child_process'
import AsyncTaskThrottle from '../index'

describe('AsyncTaskThrottle Testing', () => {
  function execute(
    command: string,
    args?: string[],
    options?: SpawnOptionsWithoutStdio
  ) {
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
    const throttleTask = AsyncTaskThrottle.create(task, size)
    const list = Array(times)
      .fill(0)
      .map(() => throttleTask())
    const results = await Promise.all(list)
    expect(results.every(result => result === results[0])).toBe(true)
  })

  it('exceeding load', async () => {
    const size = 6
    const task = () => execute('node', ['--version'])
    const throttleTask = AsyncTaskThrottle.create(task, size, -1)
    try {
      await throttleTask()
      expect(1).toBe(0)
    } catch (error) {
      expect(error.message).toBe('It is exceeding load.')
    }
  })

  it('check working count', async () => {
    const times = 24
    const size = 8
    const task = () => sleep(1)
    const throttle = new AsyncTaskThrottle(task, size)
    const throttleTask = throttle.create()
    const list = Array(times)
      .fill(0)
      .map(() => throttleTask())
    const timeId = setInterval(() => {
      const count = throttle.getWorkingCount()
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
    const task = () =>
      new Promise((resolve, reject) => {
        if (flag) {
          flag = false
          return resolve()
        } else {
          flag = true
          return reject()
        }
      })
    const throttleTask = AsyncTaskThrottle.create(task)
    for (let i = 0; i < times; i++) {
      await throttleTask()
        .then(() => successCount++)
        .catch(() => failCount++)
    }
    expect(successCount).toBe(failCount)
  })
})
