export type ITask<R = any> = (...args: any[]) => Promise<R>
export interface IAsyncTaskOptions {
  args: any[]
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}

export default class AsyncTaskPool<S extends ITask> {
  public static create<T extends ITask>(task: T, size?: number, max?: number) {
    const pool = new AsyncTaskPool(task, size, max)
    function asyncTask(...args: any[]) {
      return new Promise((resolve, reject) => {
        pool.push({
          args,
          reject,
          resolve,
        })
      })
    }
    return asyncTask as T
  }

  private _queue: IAsyncTaskOptions[] = []
  private _queueLength: number
  private _workerCount: number
  private _task: S
  private _workingCount: number

  public constructor(task: S, workerCount?: number, queueLength?: number) {
    this._task = task
    this._workerCount = workerCount || 6
    this._queueLength = queueLength || Infinity
    this._workingCount = 0
  }

  public getWorkingCount() {
    return this._workingCount
  }

  public create() {
    const asyncTask = (...args: any[]) => {
      return new Promise((resolve, reject) => {
        this.push({
          args,
          reject,
          resolve,
        })
      })
    }
    return asyncTask as S
  }

  public push(options: IAsyncTaskOptions) {
    if (this._queue.length < this._queueLength) {
      this._queue.push(options)
      this.work()
    } else {
      options.reject(new Error('The async task pool is full'))
    }
  }

  private work() {
    if (this._workingCount < this._workerCount) {
      const options = this._queue.shift()
      if (options) {
        this._workingCount++
        this._task(...options.args)
          .then(value => {
            options.resolve(value)
          })
          .catch(error => {
            options.reject(error)
          })
          .then(() => {
            this._workingCount--
            this.work()
          })
      }
    }
  }
}
