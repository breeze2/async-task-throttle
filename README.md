[![npm version](https://badge.fury.io/js/async-task-throttle.svg)](https://www.npmjs.com/async-task-throttle)
[![Build Status](https://travis-ci.org/breeze2/async-task-throttle.svg?branch=master)](https://travis-ci.org/breeze2/async-task-throttle)
[![Coverage Status](https://coveralls.io/repos/github/breeze2/async-task-throttle/badge.svg?branch=master)](https://coveralls.io/github/breeze2/async-task-throttle?branch=master)

# async-task-throttle
> A simple async task throttle.

## Install

```cmd
$ yarn add async-task-throttle
```

## Usage

### Sample

```js
import AsyncTaskThrottle from 'async-task-throttle'


function task (url) {
    return fetch(url)
}

const throttleTask = AsyncTaskThrottle.create(task, 6, 100)

// use throttleTask like task
throttleTask('https://github.com/breeze2/markdown-it-all').then(value => {
    console.log(value)
}).catch(error => {
    console.error(error)
})

```
