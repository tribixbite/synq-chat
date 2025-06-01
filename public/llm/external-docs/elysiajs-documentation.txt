This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.
The content has been processed where empty lines have been removed, content has been formatted for parsing in markdown style, security check has been disabled.

# Directory Structure
```
docs/
  eden/
    treaty/
      config.md
      legacy.md
      overview.md
      parameters.md
      response.md
      unit-test.md
      websocket.md
    fetch.md
    installation.md
    overview.md
    test.md
  essential/
    best-practice.md
    handler.md
    life-cycle.md
    plugin.md
    route.md
    structure.md
    validation.md
  patterns/
    configuration.md
    cookie.md
    deploy.md
    macro.md
    mount.md
    trace.md
    type.md
    unit-test.md
    websocket.md
  plugins/
    bearer.md
    cors.md
    cron.md
    graphql-apollo.md
    graphql-yoga.md
    html.md
    jwt.md
    opentelemetry.md
    overview.md
    server-timing.md
    static.md
    stream.md
    swagger.md
    trpc.md
```

# Files

## File: docs/eden/treaty/config.md
`````markdown
---
title: Eden Treaty Config - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Config - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Config
Eden Treaty accepts 2 parameters:
- **urlOrInstance** - URL endpoint or Elysia instance
- **options** (optional) - Customize fetch behavior

## urlOrInstance
Accept either URL endpoint as string or a literal Elysia instance.

Eden will change the behavior based on type as follows:

### URL Endpoint (string)
If URL endpoint is passed, Eden Treaty will use `fetch` or `config.fetcher` to create a network request to an Elysia instance.

```typescript
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('localhost:3000')
```

You may or may not specified a protocol for URL endpoint.

Elysia will appends the endpoints automatically as follows:
1. If protocol is specified, use the URL directly
2. If the URL is localhost and ENV is not production, use http
3. Otherwise use https

This also apply to Web Socket as well for determining between **ws://** or **wss://**.

---

### Elysia Instance
If Elysia instance is passed, Eden Treaty will create a `Request` class and pass to `Elysia.handle` directly without creating a network request.

This allows us to interact with Elysia server directly without request overhead, or the need start a server.

```typescript
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hi', 'Hi Elysia')
    .listen(3000)

const api = treaty(app)
```

If an instance is passed, generic is not needed to be pass as Eden Treaty can infers the type from a parameter directly.

This patterns is recommended for performing unit tests, or creating a type-safe reverse proxy server or micro-services.

## Options
2nd optional parameters for Eden Treaty to customize fetch behavior, accepting parameters as follows:
- [fetch](#fetch) - add default parameters to fetch intialization (RequestInit)
- [headers](#headers) - define default headers
- [fetcher](#fetcher) - custom fetch function eg. Axios, unfetch
- [onRequest](#onrequest) - Intercept and modify fetch request before firing
- [onResponse](#onresponse) - Intercept and modify fetch's response

## Fetch
Default parameters append to 2nd parameters of fetch extends type of **Fetch.RequestInit**.

```typescript
export type App = typeof app // [!code ++]
import { treaty } from '@elysiajs/eden'
// ---cut---
treaty<App>('localhost:3000', {
    fetch: {
        credentials: 'include'
    }
})
```

All parameters that passed to fetch, will be passed to fetcher, which is an equivalent to:
```typescript
fetch('http://localhost:3000', {
    credentials: 'include'
})
```

## Headers
Provide an additional default headers to fetch, a shorthand of `options.fetch.headers`.

```typescript
treaty<App>('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

All parameters that passed to fetch, will be passed to fetcher, which is an equivalent to:
```typescript twoslash
fetch('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

headers may accepts the following as parameters:
- Object
- Function

### Headers Object
If object is passed, then it will be passed to fetch directly

```typescript
treaty<App>('localhost:3000', {
    headers: {
        'X-Custom': 'Griseo'
    }
})
```

### Function
You may specify a headers as a function to return custom headers based on condition

```typescript
treaty<App>('localhost:3000', {
    headers(path, options) {
        if(path.startsWith('user'))
            return {
                authorization: 'Bearer 12345'
            }
    }
})
```

You may return object to append its value to fetch headers.

headers function accepts 2 parameters:
- path `string` - path which will be sent to parameter
  - note: hostname will be **exclude** eg. (/user/griseo)
- options `RequestInit`: Parameters that passed through 2nd parameter of fetch

### Array
You may define a headers function as an array if multiple conditions are need.

```typescript
treaty<App>('localhost:3000', {
    headers: [
      (path, options) => {
        if(path.startsWith('user'))
            return {
                authorization: 'Bearer 12345'
            }
        }
    ]
})
```

Eden Treaty will **run all functions** even if the value is already returned.

## Headers Priority
Eden Treaty will prioritize the order headers if duplicated as follows:
1. Inline method - Passed in method function directly
2. headers - Passed in `config.headers`
  - If `config.headers` is array, parameters that come after will be prioritize
3. fetch - Passed in `config.fetch.headers`

For example, for the following example:
```typescript
const api = treaty<App>('localhost:3000', {
    headers: {
        authorization: 'Bearer Aponia'
    }
})

api.profile.get({
    headers: {
        authorization: 'Bearer Griseo'
    }
})
```

This will be results in:
```typescript
fetch('http://localhost:3000', {
    headers: {
        authorization: 'Bearer Griseo'
    }
})
```

If inline function doesn't specified headers, then the result will be "**Bearer Aponia**" instead.

## Fetcher
Provide a custom fetcher function instead of using an environment's default fetch.

```typescript
treaty<App>('localhost:3000', {
    fetcher(url, options) {
        return fetch(url, options)
    }
})
```

It's recommended to replace fetch if you want to use other client other than fetch, eg. Axios, unfetch.

## OnRequest
Intercept and modify fetch request before firing.

You may return object to append the value to **RequestInit**.

```typescript
treaty<App>('localhost:3000', {
    onRequest(path, options) {
        if(path.startsWith('user'))
            return {
                headers: {
                    authorization: 'Bearer 12345'
                }
            }
    }
})
```

If value is returned, Eden Treaty will perform a **shallow merge** for returned value and `value.headers`.

**onRequest** accepts 2 parameters:
- path `string` - path which will be sent to parameter
  - note: hostname will be **exclude** eg. (/user/griseo)
- options `RequestInit`: Parameters that passed through 2nd parameter of fetch

### Array
You may define an onRequest function as an array if multiples conditions are need.

```typescript
treaty<App>('localhost:3000', {
    onRequest: [
      (path, options) => {
        if(path.startsWith('user'))
            return {
                headers: {
                    authorization: 'Bearer 12345'
                }
            }
        }
    ]
})
```

Eden Treaty will **run all functions** even if the value is already returned.

## onResponse
Intercept and modify fetch's response or return a new value.

```typescript
treaty<App>('localhost:3000', {
    onResponse(response) {
        if(response.ok)
            return response.json()
    }
})
```

**onRequest** accepts 1 parameter:
- response `Response` - Web Standard Response normally returned from `fetch`

### Array
You may define an onResponse function as an array if multiple conditions are need.

```typescript
treaty<App>('localhost:3000', {
    onResponse: [
        (response) => {
            if(response.ok)
                return response.json()
        }
    ]
})
```
Unlike [headers](#headers) and [onRequest](#onrequest), Eden Treaty will loop through functions until a returned value is found or error thrown, the returned value will be use as a new response.
`````

## File: docs/eden/treaty/legacy.md
`````markdown
---
title: Eden Treaty Legacy - ElysiaJS
search: false
head:
  - - meta
    - property: 'og:title'
      content: Eden Treaty Legacy - ElysiaJS

  - - meta
    - name: 'og:description'
      content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

  - - meta
    - name: 'og:description'
      content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Eden Treaty Legacy

::: tip NOTE
This is a documentation for Eden Treaty 1 or (edenTreaty)

For a new project, we recommended starting with Eden Treaty 2 (treaty) instead.
:::

Eden Treaty is an object-like representation of an Elysia server.

Providing accessor like a normal object with type directly from the server, helping us to move faster, and make sure that nothing break

---

To use Eden Treaty, first export your existing Elysia server type:
```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then import the server type, and consume the Elysia API on client:
```typescript
// client.ts
import { edenTreaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const app = edenTreaty<App>('http://localhost:')

// response type: 'Hi Elysia'
const { data: pong, error } = app.get()

// response type: 1895
const { data: id, error } = app.id['1895'].get()

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})
```

::: tip
Eden Treaty is fully type-safe with auto-completion support.
:::

## Anatomy
Eden Treaty will transform all existing paths to object-like representation, that can be described as:
```typescript
EdenTreaty.<1>.<2>.<n>.<method>({
    ...body,
    $query?: {},
    $fetch?: RequestInit
})
```

### Path
Eden will transform `/` into `.` which can be called with a registered `method`, for example:
- **/path** -> .path
- **/nested/path** -> .nested.path

### Path parameters
Path parameters will be mapped automatically by their name in the URL.

- **/id/:id** -> .id.`<anyThing>`
- eg: .id.hi
- eg: .id['123']

::: tip
If a path doesn't support path parameters, TypeScript will show an error.
:::

### Query
You can append queries to path with `$query`:
```typescript
app.get({
    $query: {
        name: 'Eden',
        code: 'Gold'
    }
})
```

### Fetch
Eden Treaty is a fetch wrapper, you can add any valid [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) parameters to Eden by passing it to `$fetch`:
```typescript
app.post({
    $fetch: {
        headers: {
            'x-organization': 'MANTIS'
        }
    }
})
```

## Error Handling
Eden Treaty will return a value of `data` and `error` as a result, both fully typed.
```typescript
// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            warnUser(error.value)
            break

        case 500:
        case 502:
            emergencyCallDev(error.value)
            break

        default:
            reportError(error.value)
            break
    }

    throw error
}

const { id, name } = nendoroid
```

Both **data**, and **error** will be typed as nullable until you can confirm their statuses with a type guard.

To put it simply, if fetch is successful, data will have a value and error will be null, and vice-versa.

::: tip
Error is wrapped with an `Error` with its value return from the server can be retrieve from `Error.value`
:::

### Error type based on status
Both Eden Treaty and Eden Fetch can narrow down an error type based on status code if you explicitly provided an error type in the Elysia server.

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        nendoroid: t.Object({
            id: t.Number(),
            name: t.String()
        }),
        error: t.Object({
            message: t.String()
        })
    })
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: 'nendoroid',
        response: {
            200: 'nendoroid', // [!code ++]
            400: 'error', // [!code ++]
            401: 'error' // [!code ++]
        }
    })
    .listen(3000)

export type App = typeof app
```

An on the client side:
```typescript
const { data: nendoroid, error } = app.mirror.post({
    id: 1895,
    name: 'Skadi'
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            // narrow down to type 'error' described in the server
            warnUser(error.value)
            break

        default:
            // typed as unknown
            reportError(error.value)
            break
    }

    throw error
}
```

## WebSocket
Eden supports WebSocket using the same API as a normal route.
```typescript
// Server
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/chat', {
        message(ws, message) {
            ws.send(message)
        },
        body: t.String(),
        response: t.String()
    })
    .listen(3000)

type App = typeof app
```

To start listening to real-time data, call the `.subscribe` method:
```typescript
// Client
import { edenTreaty } from '@elysiajs/eden'
const app = edenTreaty<App>('http://localhost:')

const chat = app.chat.subscribe()

chat.subscribe((message) => {
    console.log('got', message)
})

chat.send('hello from client')
```

We can use [schema](/integrations/cheat-sheet#schema) to enforce type-safety on WebSockets, just like a normal route.

---

**Eden.subscribe** returns **EdenWebSocket** which extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket) class with type-safety. The syntax is identical with the WebSocket

If more control is need, **EdenWebSocket.raw** can be accessed to interact with the native WebSocket API.

## File Upload
You may either pass one of the following to the field to attach file:
- **File**
- **FileList**
- **Blob**

Attaching a file will results **content-type** to be **multipart/form-data**

Suppose we have the server as the following:
```typescript
// server.ts
import { Elysia } from 'elysia'

const app = new Elysia()
    .post('/image', ({ body: { image, title } }) => title, {
        body: t.Object({
            title: t.String(),
            image: t.Files(),
        })
    })
    .listen(3000)

export type App = typeof app
```

We may use the client as follows:
```typescript
// client.ts
import { edenTreaty } from '@elysia/eden'
import type { Server } from './server'

export const client = edenTreaty<Server>('http://localhost:3000')

const id = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id)! as T

const { data } = await client.image.post({
    title: "Misono Mika",
    image: id<HTMLInputElement>('picture').files!,
})
```
`````

## File: docs/eden/treaty/overview.md
`````markdown
---
title: Overview - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Overview - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing end-to-end type safety and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing end-to-end type safety and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Eden Treaty

Eden Treaty is an object representation to interact with a server and features type safety, auto-completion, and error handling.

To use Eden Treaty, first export your existing Elysia server type:

```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then import the server type and consume the Elysia API on the client:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]

// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const app = treaty<App>('localhost:3000')

// response type: 'Hi Elysia'
const { data, error } = await app.hi.get()
      // ^?
```

## Tree like syntax

HTTP Path is a resource indicator for a file system tree.

File system consists of multiple levels of folders, for example:

-   /documents/elysia
-   /documents/kalpas
-   /documents/kelvin

Each level is separated by **/** (slash) and a name.

However in JavaScript, instead of using **"/"** (slash) we use **"."** (dot) to access deeper resources.

Eden Treaty turns an Elysia server into a tree-like file system that can be accessed in the JavaScript frontend instead.

| Path         | Treaty       |
| ------------ | ------------ |
| /            |              |
| /hi          | .hi          |
| /deep/nested | .deep.nested |

Combined with the HTTP method, we can interact with the Elysia server.

| Path         | Method | Treaty              |
| ------------ | ------ | ------------------- |
| /            | GET    | .get()              |
| /hi          | GET    | .hi.get()           |
| /deep/nested | GET    | .deep.nested.get()  |
| /deep/nested | POST   | .deep.nested.post() |

## Dynamic path

However, dynamic path parameters cannot be expressed using notation. If they are fully replaced, we don't know what the parameter name is supposed to be.

```typescript
// ❌ Unclear what the value is supposed to represent?
treaty.item['skadi'].get()
```

To handle this, we can specify a dynamic path using a function to provide a key value instead.

```typescript
// ✅ Clear that value is dynamic path is 'name'
treaty.item({ name: 'Skadi' }).get()
```

| Path            | Treaty                           |
| --------------- | -------------------------------- |
| /item           | .item                            |
| /item/:name     | .item({ name: 'Skadi' })         |
| /item/:name/id  | .item({ name: 'Skadi' }).id      |
`````

## File: docs/eden/treaty/parameters.md
`````markdown
---
title: Eden Treaty Parameters - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Parameters - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Parameters

We need to send a payload to server eventually.

To handle this, Eden Treaty's methods accept 2 parameters to send data to server.

Both parameters is type safe and will be guided by TypeScript automatically:

1. body
2. additional parameters
    - query
    - headers
    - fetch

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', ({ body }) => body, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.user.post({
    name: 'Elysia'
})

// ✅ also works
api.user.post({
    name: 'Elysia'
}, {
    // This is optional as not specified in schema
    headers: {
        authorization: 'Bearer 12345'
    },
    query: {
        id: 2
    }
})
```

Unless if the method doesn't accept body, then body will be omitted and left with single parameter only.

If the method **"GET"** or **"HEAD"**:

1. Additional parameters
    -   query
    -   headers
    -   fetch

```typescript
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

// ✅ works
api.hello.get({
    // This is optional as not specified in schema
    headers: {
        hello: 'world'
    }
})
```

## Empty body
If body is optional or not need but query or headers is required, you may pass the body as `null` or `undefined` instead.

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', () => 'hi', {
        query: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

api.user.post(null, {
    query: {
        name: 'Ely'
    }
})
```

## Fetch parameters

Eden Treaty is a fetch wrapper, we may add any valid [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) parameters to Eden by passing it to `$fetch`:

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/hello', () => 'hi')
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const controller = new AbortController()

const cancelRequest = setTimeout(() => {
    controller.abort()
}, 5000)

await api.hello.get({
    fetch: {
        signal: controller.signal
    }
})

clearTimeout(cancelRequest)
```

## File Upload
We may either pass one of the following to attach file(s):
- **File**
- **File[]**
- **FileList**
- **Blob**

Attaching a file will results **content-type** to be **multipart/form-data**

Suppose we have the server as the following:
```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/image', ({ body: { image, title } }) => title, {
        body: t.Object({
            title: t.String(),
            image: t.Files()
        })
    })
    .listen(3000)

export const api = treaty<typeof app>('localhost:3000')

const images = document.getElementById('images') as HTMLInputElement

const { data } = await api.image.post({
    title: "Misono Mika",
    image: images.files!,
})
```
`````

## File: docs/eden/treaty/response.md
`````markdown
---
title: Eden Treaty Response - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Response - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Response
Once the fetch method is called, Eden Treaty return a promise containing an object with the following properties:
- data - returned value of the response (2xx)
- error - returned value from the response (>= 3xx)
- response `Response` - Web Standard Response class
- status `number` - HTTP status code
- headers `FetchRequestInit['headers']` - response headers

Once returned, you must provide error handling to ensure that the response data value is unwrapped, otherwise the value will be nullable. Elysia provides a `error()` helper function to handle the error, and Eden will provide type narrowing for the error value.

```typescript
import { Elysia, t } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
    .post('/user', ({ body: { name }, status }) => {
        if(name === 'Otto')
            return status(400, 'Bad Request')

        return name
    }, {
        body: t.Object({
            name: t.String()
        })
    })
    .listen(3000)

const api = treaty<typeof app>('localhost:3000')

const submit = async (name: string) => {
    const { data, error } = await api.user.post({
        name
    })

    // type: string | null
    console.log(data)

    if (error)
        switch(error.status) {
            case 400:
                // Error type will be narrow down
                throw error.value

            default:
                throw error.value
        }

    // Once the error is handled, type will be unwrapped
    // type: string
    return data
}
```

By default, Elysia infers `error` and `response` type to TypeScript automatically, and Eden will be providing auto-completion and type narrowing for accurate behavior.

::: tip
If the server responds with an HTTP status >= 300, then value will be always be null, and `error` will have a returned value instead.

Otherwise, response will be passed to data.
:::

## Stream response
Eden will interpret a stream response as `AsyncGenerator` allowing us to use `for await` loop to consume the stream.


```typescript twoslash
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
               // ^?
```
`````

## File: docs/eden/treaty/unit-test.md
`````markdown
---
title: Eden Treaty Unit Test - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Unit Test - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# Unit Test
According to [Eden Treaty config](/eden/treaty/config.html#urlorinstance) and [Unit Test](/patterns/unit-test), we may pass an Elysia instance to Eden Treaty directly to interact with Elysia server directly without sending a network request.

We may use this patterns to create a unit test with end-to-end type safety and type-level test all at once.

```typescript twoslash
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia().get('/hello', 'hi')
const api = treaty(app)

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?

    })
})
```

## Type safety test
To perform a type safety test, simply run **tsc** to test folders.

```bash
tsc --noEmit test/**/*.ts
```

This is useful to ensure type integrity for both client and server, especially during migrations.
`````

## File: docs/eden/treaty/websocket.md
`````markdown
---
title: Eden Treaty Web Socket - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Eden Treaty Web Socket - ElysiaJS

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.

    - - meta
      - name: 'og:description'
        content: Eden Treaty is an object-like representation of an Elysia server, providing an end-to-end type safety, and a significantly improved developer experience. With Eden, we can fetch an API from Elysia server fully type-safe without code generation.
---

# WebSocket
Eden Treaty supports WebSocket using `subscribe` method.

```typescript twoslash
import { Elysia, t } from "elysia";
import { treaty } from "@elysiajs/eden";

const app = new Elysia()
  .ws("/chat", {
    body: t.String(),
    response: t.String(),
    message(ws, message) {
      ws.send(message);
    },
  })
  .listen(3000);

const api = treaty<typeof app>("localhost:3000");

const chat = api.chat.subscribe();

chat.subscribe((message) => {
  console.log("got", message);
});

chat.on("open", () => {
  chat.send("hello from client");
});
```

**.subscribe** accepts the same parameter as `get` and `head`.

## Response
**Eden.subscribe** returns **EdenWS** which extends the [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket) results in identical syntax.

If more control is need, **EdenWebSocket.raw** can be accessed to interact with the native WebSocket API.
`````

## File: docs/eden/fetch.md
`````markdown
---
title: Eden Fetch - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden Fetch - ElysiaJS

  - - meta
    - name: 'description'
      content: A fetch-like alternative to Eden Treaty with faster type inference. With Eden Fetch, you can make requests to an Elysia server with end-to-end type-safety without the need of code generation.

  - - meta
    - name: 'og:description'
      content: A fetch-like alternative to Eden Treaty with faster type inference. With Eden Fetch, you can make requests to an Elysia server with end-to-end type-safety without the need of code generation.
---

# Eden Fetch
A fetch-like alternative to Eden Treaty .

With Eden Fetch can interact with Elysia server in a type-safe manner using Fetch API.

---

First export your existing Elysia server type:
```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/hi', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app
```

Then import the server type, and consume the Elysia API on client:
```typescript
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: 'Hi Elysia'
const pong = await fetch('/hi', {})

// response type: 1895
const id = await fetch('/id/:id', {
    params: {
        id: '1895'
    }
})

// response type: { id: 1895, name: 'Skadi' }
const nendoroid = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})
```

## Error Handling
You can handle errors the same way as Eden Treaty:
```typescript
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

// response type: { id: 1895, name: 'Skadi' }
const { data: nendoroid, error } = await fetch('/mirror', {
    method: 'POST',
    body: {
        id: 1895,
        name: 'Skadi'
    }
})

if(error) {
    switch(error.status) {
        case 400:
        case 401:
            throw error.value
            break

        case 500:
        case 502:
            throw error.value
            break

        default:
            throw error.value
            break
    }
}

const { id, name } = nendoroid
```

## When should I use Eden Fetch over Eden Treaty
Unlike Elysia < 1.0, Eden Fetch is not faster than Eden Treaty anymore.

The preference is base on you and your team agreement, however we recommend to use [Eden Treaty](/eden/treaty/overview) instead.

For Elysia < 1.0:

Using Eden Treaty requires a lot of down-level iteration to map all possible types in a single go, while in contrast, Eden Fetch can be lazily executed until you pick a route.

With complex types and a lot of server routes, using Eden Treaty on a low-end development device can lead to slow type inference and auto-completion.

But as Elysia has tweaked and optimized a lot of types and inference, Eden Treaty can perform very well in the considerable amount of routes.

If your single process contains **more than 500 routes**, and you need to consume all of the routes **in a single frontend codebase**, then you might want to use Eden Fetch as it has a significantly better TypeScript performance than Eden Treaty.
`````

## File: docs/eden/installation.md
`````markdown
---
title: Eden Installation - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden Installation - ElysiaJS

  - - meta
    - name: 'description'
      content: Start by installing Eden on your frontend with "bun add elysia @elysiajs/eden", then expose your Elysia server type and then start using Eden Treaty or Eden Fetch.

  - - meta
    - name: 'og:description'
      content: Start by installing Eden on your frontend with "bun add elysia @elysiajs/eden", then expose your Elysia server type and then start using Eden Treaty or Eden Fetch.
---

# Eden Installation
Start by installing Eden on your frontend:
```bash
bun add @elysiajs/eden
bun add -d elysia
```

::: tip
Eden needs Elysia to infer utilities type.

Make sure to install Elysia with the version matching on the server.
:::

First, export your existing Elysia server type:
```typescript
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]
```

Then consume the Elysia API on client side:
```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'Hi Elysia')
    .get('/id/:id', ({ params: { id } }) => id)
    .post('/mirror', ({ body }) => body, {
        body: t.Object({
            id: t.Number(),
            name: t.String()
        })
    })
    .listen(3000)

export type App = typeof app // [!code ++]

// @filename: index.ts
// ---cut---
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server' // [!code ++]

const client = treaty<App>('localhost:3000') // [!code ++]

// response: Hi Elysia
const { data: index } = await client.get()

// response: 1895
const { data: id } = await client.id({ id: 1895 }).get()

// response: { id: 1895, name: 'Skadi' }
const { data: nendoroid } = await client.mirror.post({
    id: 1895,
    name: 'Skadi'
})

// @noErrors
client.
//     ^|
```

## Gotcha
Sometimes Eden may not infer type from Elysia correctly, the following are the most common workaround to fix Eden type inference.

### Type Strict
Make sure to enable strict mode in **tsconfig.json**
```json
{
  "compilerOptions": {
    "strict": true // [!code ++]
  }
}
```

### Unmatch Elysia version
Eden depends Elysia class to import Elysia instance and infers type correctly.

Make sure that both client and server have a matching Elysia version.

You can check it with [`npm why`](https://docs.npmjs.com/cli/v10/commands/npm-explain) command:

```bash
npm why elysia
```

And output should contain only one elysia version on top-level:

```
elysia@1.1.12
node_modules/elysia
  elysia@"1.1.25" from the root project
  peer elysia@">= 1.1.0" from @elysiajs/html@1.1.0
  node_modules/@elysiajs/html
    dev @elysiajs/html@"1.1.1" from the root project
  peer elysia@">= 1.1.0" from @elysiajs/opentelemetry@1.1.2
  node_modules/@elysiajs/opentelemetry
    dev @elysiajs/opentelemetry@"1.1.7" from the root project
  peer elysia@">= 1.1.0" from @elysiajs/swagger@1.1.0
  node_modules/@elysiajs/swagger
    dev @elysiajs/swagger@"1.1.6" from the root project
  peer elysia@">= 1.1.0" from @elysiajs/eden@1.1.2
  node_modules/@elysiajs/eden
    dev @elysiajs/eden@"1.1.3" from the root project
```


### TypeScript version
Elysia uses newer features and syntax of TypeScript to infer types in a the most performant way. Features like Const Generic and Template Literal are heavily used.

Make sure your client has a **minimum TypeScript version if >= 5.0**

### Method Chaining
To make Eden works, Elysia must be using **method chaining**

Elysia's type system is complex, methods usually introduce a new type to the instance.

Using method chaining will help save that new type reference.

For example:
```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```
Using this, **state** now returns a new **ElysiaInstance** type, introducing **build** into store and replace the current one.

Without using method chaining, Elysia doesn't save the new type when introduced, leading to no type inference.
```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

### Type Definitions
If you are using a Bun specific feature like `Bun.file` or similar API and return it from a handler, you may need to install Bun type definitions to the client as well.

```bash
bun add -d @types/bun
```

### Path alias (monorepo)
If you are using path alias in your monorepo, make sure that frontend are able to resolve the path as same as backend.

::: tip
Setting up path alias in monorepo is a bit tricky, you can fork our example template: [Kozeki Template](https://github.com/SaltyAom/kozeki-template) and modify it to your needs.
:::

For example, if you have the following path alias for your backend in **tsconfig.json**:
```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@/*": ["./src/*"]
	}
  }
}
```

And your backend code is like this:
```typescript
import { Elysia } from 'elysia'
import { a, b } from '@/controllers'

const app = new Elysia()
	.use(a)
	.use(b)
	.listen(3000)

export type app = typeof app
```

You **must** make sure that your frontend code is able to resolve the same path alias otherwise type inference will be resolved as any.

```typescript
import { treaty } from '@elysiajs/eden'
import type { app } from '@/index'

const client = treaty<app>('localhost:3000')

// This should be able to resolve the same module both frontend and backend, and not `any`
import { a, b } from '@/controllers'
```

To fix this, you must make sure that path alias is resolved to the same file in both frontend and backend.

So you must change the path alias in **tsconfig.json** to:
```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@/*": ["../apps/backend/src/*"]
	}
  }
}
```

If configured correctly, you should be able to resolve the same module in both frontend and backend.
```typescript
// This should be able to resolve the same module both frontend and backend, and not `any`
import { a, b } from '@/controllers'
```

#### Scope
We recommended to add a **scope** prefix for each modules in your monorepo to avoid any confusion and conflict that may happen.

```json
{
  "compilerOptions": {
  	"baseUrl": ".",
	"paths": {
	  "@frontend/*": ["./apps/frontend/src/*"],
	  "@backend/*": ["./apps/backend/src/*"]
	}
  }
}
```

Then you can import the module like this:
```typescript
// Should work in both frontend and backend and not return `any`
import { a, b } from '@backend/controllers'
```

We recommended creating a **single tsconfig.json** that define a `baseUrl` as the root of your repo, provide a path according to the module location, and create a **tsconfig.json** for each module that inherits the root **tsconfig.json** which has the path alias.

You may find a working example of in this [path alias example repo](https://github.com/SaltyAom/elysia-monorepo-path-alias) or [Kozeki Template](https://github.com/SaltyAom/kozeki-template)
`````

## File: docs/eden/overview.md
`````markdown
---
title: End-to-End Type Safety - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: End-to-End Type Safety - ElysiaJS

  - - meta
    - name: 'description'
      content: Elysia supports end-to-end type safety with Elysia Eden since start. End-to-end type-safety refers to a system in which every component of the system is checked for type consistency, meaning that data is passed between components only if the types of the data are compatible.

  - - meta
    - property: 'og:description'
      content: Elysia supports end-to-end type safety with Elysia Eden since start. End-to-end type-safety refers to a system in which every component of the system is checked for type consistency, meaning that data is passed between components only if the types of the data are compatible.
---

# End-to-End Type Safety
Imagine you have a toy train set.

Each piece of the train track has to fit perfectly with the next one, like puzzle pieces.

End-to-end type safety is like making sure all the pieces of the track match up correctly so the train doesn't fall off or get stuck.

For a framework to have end-to-end type safety means you can connect client and server in a type-safe manner.

Elysia provide end-to-end type safety **without code generation** out of the box with RPC-like connector, **Eden**

<video mute controls>
  <source src="/eden/eden-treaty.mp4" type="video/mp4" />
  Something went wrong trying to load video
</video>

Others framework that support e2e type safety:
- tRPC
- Remix
- SvelteKit
- Nuxt
- TS-Rest

<!-- <iframe
    id="embedded-editor"
    src="https://codesandbox.io/p/sandbox/bun-elysia-rdxljp?embed=1&codemirror=1&hidenavigation=1&hidedevtools=1&file=eden.ts"
    allow="accelerometer"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    loading="lazy"
/>

::: tip
Hover over variable and function to see type definition.
::: -->

Elysia allows you to change the type on the server and it will be instantly reflected on the client, helping with auto-completion and type-enforcement.

## Eden
Eden is a RPC-like client to connect Elysia  **end-to-end type safety** using only TypeScript's type inference instead of code generation.

Allowing you to sync client and server types effortlessly, weighing less than 2KB.

Eden is consists of 2 modules:
1. Eden Treaty **(recommended)**: an improved version RFC version of Eden Treaty
2. Eden Fetch: Fetch-like client with type safety.

Below is an overview, use-case and comparison for each module.

## Eden Treaty (Recommended)
Eden Treaty is an object-like representation of an Elysia server providing end-to-end type safety and a significantly improved developer experience.

With Eden Treaty we can connect interact Elysia server with full-type support and auto-completion, error handling with type narrowing, and creating type safe unit test.

Example usage of Eden Treaty:
```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'hi')
    .get('/users', () => 'Skadi')
    .put('/nendoroid/:id', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            from: t.String()
        })
    })
    .get('/nendoroid/:id/name', () => 'Skadi')
    .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// @noErrors
app.
//  ^|




// Call [GET] at '/'
const { data } = await app.get()

// Call [PUT] at '/nendoroid/:id'
const { data: nendoroid, error } = await app.nendoroid({ id: 1895 }).put({
    name: 'Skadi',
    from: 'Arknights'
})
```

## Eden Fetch
A fetch-like alternative to Eden Treaty for developers that prefers fetch syntax.
```typescript
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

const { data } = await fetch('/name/:name', {
    method: 'POST',
    params: {
        name: 'Saori'
    },
    body: {
        branch: 'Arius',
        type: 'Striker'
    }
})
```

::: tip NOTE
Unlike Eden Treaty, Eden Fetch doesn't provide Web Socket implementation for Elysia server
:::
`````

## File: docs/eden/test.md
`````markdown
---
title: Eden Test - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden Unit Test - ElysiaJS

  - - meta
    - name: 'description'
      content: Using Eden, we can perform unit-test to provide end-to-end type safety, and auto-completion, tracking type safety from migration

  - - meta
    - property: 'og:description'
      content: Using Eden, we can perform unit-test to provide end-to-end type safety, and auto-completion, tracking type safety from migration
---

# Eden Test
Using Eden, we can create an integration test with end-to-end type safety and auto-completion.

<video mute controls>
  <source src="/eden/eden-test.mp4" type="video/mp4" />
  Something went wrong trying to load video
</video>

> Using Eden Treaty to create tests by [irvilerodrigues on Twitter](https://twitter.com/irvilerodrigues/status/1724836632300265926)

## Setup
We can use [Bun test](https://bun.sh/guides/test/watch-mode) to create tests.

Create **test/index.test.ts** in the root of project directory with the following:

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'

import { edenTreaty } from '@elysiajs/eden'

const app = new Elysia()
    .get('/', () => 'hi')
    .listen(3000)

const api = edenTreaty<typeof app>('http://localhost:3000')

describe('Elysia', () => {
    it('return a response', async () => {
        const { data } = await api.get()

        expect(data).toBe('hi')
    })
})
```

Then we can perform tests by running **bun test**

```bash
bun test
```

This allows us to perform integration tests programmatically instead of manual fetch while supporting type checking automatically.
`````

## File: docs/essential/best-practice.md
`````markdown
---
title: Best Practice - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Best Practice - ElysiaJS

    - - meta
      - name: 'description'
        content: Elysia is pattern agnostic framework, we leave the decision up to you and your team for coding patterns to use. However, we found that there are several who are using MVC pattern (Model-View-Controller) on Elysia, and found it's hard to decouple and handling with types. This page is a guide to use Elysia with MVC pattern.

    - - meta
      - property: 'og:description'
        content: Elysia is pattern agnostic framework, we the decision up to you and your team for coding patterns to use. However, we found that there are several who are using MVC pattern (Model-View-Controller) on Elysia, and found it's hard to decouple and handling with types. This page is a guide to use Elysia with MVC pattern.
---

# Best Practice

Elysia is a pattern-agnostic framework, leaving the decision of which coding patterns to use up to you and your team.

However, there are several concern from trying to adapt an MVC pattern [(Model-View-Controller)](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) with Elysia, and found it's hard to decouple and handle types.

This page is a guide to on how to follows Elysia structure best practice combined with MVC pattern but can be adapted to any coding pattern you like.

## Method Chaining
Elysia code should always use **method chaining**.

As Elysia type system is complex, every methods in Elysia returns a new type reference.

**This is important** to ensure type integrity and inference.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

In the code above **state** returns a new **ElysiaInstance** type, adding a `build` type.

### ❌ Don't: Use Elysia without method chaining
Without using method chaining, Elysia doesn't save these new types, leading to no type inference.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

We recommend to <u>**always use method chaining**</u> to provide an accurate type inference.

## Controller
> 1 Elysia instance = 1 controller

Elysia does a lot to ensure type integrity, if you pass an entire `Context` type to a controller, these might be the problems:

1. Elysia type is complex and heavily depends on plugin and multiple level of chaining.
2. Hard to type, Elysia type could change at anytime, especially with decorators, and store
3. Type casting may lead to a loss of type integrity or an inability to ensure consistency between types and runtime code.
4. This makes it more challenging for [Sucrose](/blog/elysia-10#sucrose) *(Elysia's "kind of" compiler)* to statically analyze your code

### ❌ Don't: Create a separate controller
Don't create a separate controller, use Elysia itself as a controller instead:
```typescript
import { Elysia, t, type Context } from 'elysia'

abstract class Controller {
    static root(context: Context) {
        return Service.doStuff(context.stuff)
    }
}

// ❌ Don't
new Elysia()
    .get('/', Controller.hi)
```

By passing an entire `Controller.method` to Elysia is an equivalent of having 2 controllers passing data back and forth. It's against the design of framework and MVC pattern itself.

### ✅ Do: Use Elysia as a controller
Instead treat an Elysia instance as a controller itself instead.
```typescript
import { Elysia } from 'elysia'
import { Service } from './service'

new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)
    })
```

### Testing
You can test your controller using `handle` to directly call a function (and it's lifecycle)

```typescript
import { Elysia } from 'elysia'
import { Service } from './service'

import { describe, it, should } from 'bun:test'

const app = new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)

        return 'ok'
    })

describe('Controller', () => {
	it('should work', async () => {
		const response = await app
			.handle(new Request('http://localhost/'))
			.then((x) => x.text())

		expect(response).toBe('ok')
	})
})
```

You may find more information about testing in [Unit Test](/patterns/unit-test.html).

## Service
Service is a set of utility/helper functions decoupled as a business logic to use in a module/controller, in our case, an Elysia instance.

Any technical logic that can be decoupled from controller may live inside a **Service**.

There're 2 types of service in Elysia:
1. Non-request dependent service
2. Request dependent service

### ✅ Do: Non-request dependent service
This kind of service doesn't need to access any property from the request or `Context`, and can be initiated as a static class same as usual MVC service pattern.

```typescript
import { Elysia, t } from 'elysia'

abstract class Service {
    static fibo(number: number): number {
        if(number < 2)
            return number

        return Service.fibo(number - 1) + Service.fibo(number - 2)
    }
}

new Elysia()
    .get('/fibo', ({ body }) => {
        return Service.fibo(body)
    }, {
        body: t.Numeric()
    })
```

If your service doesn't need to store a property, you may use `abstract class` and `static` instead to avoid allocating class instance.

### Request Dependent Service
This kind of service may require some property from the request, and should be **initiated as an Elysia instance**.

### ❌ Don't: Pass entire `Context` to a service
**Context is a highly dynamic type** that can be inferred from Elysia instance.

Do not pass an entire `Context` to a service, instead use object destructuring to extract what you need and pass it to the service.
```typescript
import type { Context } from 'elysia'

class AuthService {
	constructor() {}

	// ❌ Don't do this
	isSignIn({ status, cookie: { session } }: Context) {
		if (session.value)
			return status(401)
	}
}
```

As Elysia type is complex, and heavily depends on plugin and multiple level of chaining, it can be challenging to manually type as it's highly dynamic.

### ✅ Do: Use Elysia instance as a service

We recommended to use Elysia instance as a service to ensure type integrity and inference:
```typescript
import { Elysia } from 'elysia'

// ✅ Do
const AuthService = new Elysia({ name: 'Service.Auth' })
    .derive({ as: 'scoped' }, ({ cookie: { session } }) => ({
    	// This is equivalent to dependency injection
        Auth: {
            user: session.value
        }
    }))
    .macro(({ onBeforeHandle }) => ({
     	// This is declaring a service method
        isSignIn(value: boolean) {
            onBeforeHandle(({ Auth, status }) => {
                if (!Auth?.user || !Auth.user) return status(401)
            })
        }
    }))

const UserController = new Elysia()
    .use(AuthService)
    .get('/profile', ({ Auth: { user } }) => user, {
    	isSignIn: true
    })
```

::: tip
Elysia handle [plugin deduplication](/essential/plugin.html#plugin-deduplication) by default so you don't have to worry about performance, as it's going to be Singleton if you specified a **"name"** property.
:::

### ⚠️ Infers Context from Elysia instance

In case of **absolute necessity**, you may infer the `Context` type from the Elysia instance itself:
```typescript
import { Elysia, type InferContext } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

class AuthService {
	constructor() {}

	// ✅ Do
	isSignIn({ status, cookie: { session } }: InferContext<typeof setup>) {
		if (session.value)
			return status(401)
	}
}
```

However we recommend to avoid this if possible, and use [Elysia as a service](#✅-do-use-elysia-as-a-controller) instead.

You may find more about [InferContext](/essential/handler#infercontext) in [Essential: Handler](/essential/handler).

## Model
Model or [DTO (Data Transfer Object)](https://en.wikipedia.org/wiki/Data_transfer_object) is handle by [Elysia.t (Validation)](/essential/validation.html#elysia-type).

Elysia has a validation system built-in which can infers type from your code and validate it at runtime.

### ❌ Don't: Declare a class instance as a model

Do not declare a class instance as a model:
```typescript
// ❌ Don't
class CustomBody {
	username: string
	password: string

	constructor(username: string, password: string) {
		this.username = username
		this.password = password
	}
}

// ❌ Don't
interface ICustomBody {
	username: string
	password: string
}
```

### ✅ Do: Use Elysia's validation system

Instead of declaring a class or interface, use Elysia's validation system to define a model:
```typescript twoslash
// ✅ Do
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

// Optional if you want to get the type of the model
// Usually if we didn't use the type, as it's already inferred by Elysia
type CustomBody = typeof customBody.static
    // ^?



export { customBody }
```

We can get type of model by using `typeof` with `.static` property from the model.

Then you can use the `CustomBody` type to infer the type of the request body.

```typescript twoslash
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})
// ---cut---
// ✅ Do
new Elysia()
	.post('/login', ({ body }) => {
	                 // ^?
		return body
	}, {
		body: customBody
	})
```

### ❌ Don't: Declare type separate from the model
Do not declare a type separate from the model, instead use `typeof` with `.static` property to get the type of the model.

```typescript
// ❌ Don't
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = {
	username: string
	password: string
}

// ✅ Do
const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = typeof customBody.static
```

### Group
You can group multiple models into a single object to make it more organized.

```typescript
import { Elysia, t } from 'elysia'

export const AuthModel = {
	sign: t.Object({
		username: t.String(),
		password: t.String()
	})
}

const models = AuthModel.models
```

### Model Injection
Though this is optional, if you are strictly following MVC pattern, you may want to inject like a service into a controller. We recommended using [Elysia reference model](/essential/validation#reference-model)

Using Elysia's model reference
```typescript twoslash
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

const AuthModel = new Elysia()
    .model({
        'auth.sign': customBody
    })

const models = AuthModel.models

const UserController = new Elysia({ prefix: '/auth' })
    .use(AuthModel)
    .post('/sign-in', async ({ body, cookie: { session } }) => {
                             // ^?

        return true
    }, {
        body: 'auth.sign'
    })
```

This approach provide several benefits:
1. Allow us to name a model and provide auto-completion.
2. Modify schema for later usage, or perform a [remap](/essential/handler.html#remap).
3. Show up as "models" in OpenAPI compliance client, eg. Swagger.
4. Improve TypeScript inference speed as model type will be cached during registration.

## Reuse a plugin

It's ok to reuse plugins multiple time to provide type inference.

Elysia handle plugin deduplication automatically by default, and the performance is negligible.

To create a unique plugin, you may provide a **name** or optional **seed** to an Elysia instance.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'my-plugin' })
	.decorate("type", "plugin")

const app = new Elysia()
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .listen(3000)
```

This allows Elysia to improve performance by reusing the registered plugins instead of processing the plugin over and over again.
`````

## File: docs/essential/handler.md
`````markdown
---
title: Handler - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Handler - ElysiaJS

    - - meta
      - name: 'description'
        content: handler is a function that responds to the request for each route. Accepting request information and returning a response to the client. Handler can be registered through Elysia.get / Elysia.post

    - - meta
      - property: 'og:description'
        content: handler is a function that responds to the request for each route. Accepting request information and returning a response to the client. Handler can be registered through Elysia.get / Elysia.post
---

<script setup>
import Playground from '../components/nearl/playground.vue'
import Tab from '../components/fern/tab.vue'
import { Elysia } from 'elysia'

const handler1 = new Elysia()
    .get('/', ({ path }) => path)

const handler2 = new Elysia()
    .get('/', ({ error }) => error(418, "Kirifuji Nagisa"))

const demo1 = new Elysia()
    .state('version', 1)
    .get('/a', ({ store: { version } }) => version)
    .get('/b', ({ store }) => store)
    .get('/c', () => 'still ok')

const demo2 = new Elysia()
    // @ts-expect-error
    .get('/error', ({ store }) => store.counter)
    .state('version', 1)
    .get('/', ({ store: { version } }) => version)

const demo3 = new Elysia()
    .derive(({ headers }) => {
        const auth = headers['authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer ?? '12345')

const demo4 = new Elysia()
    .state('counter', 0)
    .state('version', 1)
    .state(({ version, ...store }) => ({
        ...store,
        elysiaVersion: 1
    }))
    // ✅ Create from state remap
    .get('/elysia-version', ({ store }) => store.elysiaVersion)
    // ❌ Excluded from state remap
    .get('/version', ({ store }) => store.version)

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const demo5 = new Elysia()
    .use(
        setup
            .prefix('decorator', 'setup')
    )
    .get('/', ({ setupCarbon }) => setupCarbon)

const demo6 = new Elysia()
    .use(setup.prefix('all', 'setup'))
    .get('/', ({ setupCarbon }) => setupCarbon)

const demo7 = new Elysia()
    .state('counter', 0)
    // ✅ Using reference, value is shared
    .get('/', ({ store }) => store.counter++)
    // ❌ Creating a new variable on primitive value, the link is lost
    .get('/error', ({ store: { counter } }) => counter)
</script>

# Handler

Handler is a function that responds to the request for each route.

Accepting request information and returning a response to the client.

Altenatively, handler is also known as a **Controller** in other frameworks.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    // the function `() => 'hello world'` is a handler
    .get('/', () => 'hello world')
    .listen(3000)
```

Handler maybe a literal value, and can be inlined.

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/', 'Hello Elysia')
    .get('/video', file('kyuukurarin.mp4'))
    .listen(3000)
```

Using an inline value always returns the same value which is useful to optimize performance for static resource like file.

This allows Elysia to compile the response ahead of time to optimize performance.

::: tip
Providing an inline value is not a cache.

Static Resource value, headers and status can be mutate dynamically using lifecycle.
:::

## Context

**Context** contains a request information which unique for each request, and is not shared except for `store` <small>(global mutable state)</small>.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
	.get('/', (context) => context.path)
            // ^ This is a context
```

**Context** can be only retrieve in a route handler, consists of:

-   **path** - Pathname of the request
-   **body** - [HTTP message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages), form or file upload.
-   **query** - [Query String](https://en.wikipedia.org/wiki/Query_string), include additional parameters for search query as JavaScript Object. (Query is extracted from a value after pathname starting from '?' question mark sign)
-   **params** - Elysia's path parameters parsed as JavaScript object
-   **headers** - [HTTP Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers), additional information about the request like User-Agent, Content-Type, Cache Hint.
-   **request** - [Web Standard Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
-   **redirect** - A function to redirect a response
-   **store** - A global mutable store for Elysia instance
-   **cookie** - A global mutable signal store for interacting with Cookie (including get/set)
-   **set** - Property to apply to Response:
    -   **status** - [HTTP status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status), defaults to 200 if not set.
    -   **headers** - Response headers
    -   **redirect** - Response as a path to redirect to
-   **error** - A function to return custom status code
-   **server** - Bun server instance

## Set

**set** is a mutable property that form a response accessible via `Context.set`.

- **set.status** - Set custom status code
- **set.headers** - Append custom headers
- **set.redirect** - Append redirect

```ts twoslash
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ set, status }) => {
		set.headers = { 'X-Teapot': 'true' }

		return status(418, 'I am a teapot')
	})
	.listen(3000)
```

### status
We can return a custom status code by using either:

- **status** function (recommended)
- **set.status** (legacy)

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/error', ({ error }) => error(418, 'I am a teapot'))
	.get('/set.status', ({ set }) => {
		set.status = 418
		return 'I am a teapot'
	})
	.listen(3000)
```

### status function
A dedicated `status` function for returning status code with response.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ status }) => status(418, "Kirifuji Nagisa"))
    .listen(3000)
```

<Playground :elysia="handler2" />

It's recommend to use `error` inside main handler as it has better inference:

- allows TypeScript to check if a return value is correctly type to response schema
- autocompletion for type narrowing base on status code
- type narrowing for error handling using End-to-end type safety ([Eden](/eden/overview))

### set.status
Set a default status code if not provided.

It's recommended to use this in a plugin that only needs to return a specific status code while allowing the user to return a custom value. For example, HTTP 201/206 or 403/405, etc.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(({ set }) => {
        set.status = 418

        return 'Kirifuji Nagisa'
    })
    .get('/', () => 'hi')
    .listen(3000)
```

Unlike `error` function, `set.status` cannot infer the return value type, therefore it can't check if the return value is correctly type to response schema.

::: tip
HTTP Status indicates the type of response. If the route handler is executed successfully without error, Elysia will return the status code 200.
:::

You can also set a status code using the common name of the status code instead of using a number.

```typescript twoslash
// @errors 2322
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set }) => {
        set.status
          // ^?

        return 'Kirifuji Nagisa'
    })
    .listen(3000)
```

### set.headers
Allowing us to append or delete a response headers represent as Object.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ set }) => {
        set.headers['x-powered-by'] = 'Elysia'

        return 'a mimir'
    })
    .listen(3000)
```

::: warning
The names of headers should be lowercase to force case-sensitivity consistency for HTTP headers and auto-completion, eg. use `set-cookie` rather than `Set-Cookie`.
:::

### redirect
Redirect a request to another resource.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ redirect }) => {
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8')
    })
    .get('/custom-status', ({ redirect }) => {
        // You can also set custom status to redirect
        return redirect('https://youtu.be/whpVWVWBW4U?&t=8', 302)
    })
    .listen(3000)
```

When using redirect, returned value is not required and will be ignored. As response will be from another resource.

## Server
Server instance is accessible via `Context.server` to interact with the server.

Server could be nullable as it could be running in a different environment (test).

If server is running (allocating) using Bun, `server` will be available (not null).

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/port', ({ server }) => {
		return server?.port
	})
	.listen(3000)
```

### Request IP
We can get request IP by using `server.requestIP` method

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.get('/ip', ({ server, request }) => {
		return server?.requestIP(request)
	})
	.listen(3000)
```

## Response

Elysia is built on top of Web Standard Request/Response.

To comply with the Web Standard, a value returned from route handler will be mapped into a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) by Elysia.

Letting you focus on business logic rather than boilerplate code.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    // Equivalent to "new Response('hi')"
    .get('/', () => 'hi')
    .listen(3000)
```

If you prefer an explicit Response class, Elysia also handles that automatically.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => new Response('hi'))
    .listen(3000)
```

::: tip
Using a primitive value or `Response` has near identical performance (+- 0.1%), so pick the one you prefer, regardless of performance.
:::

## Formdata
We may return a `FormData` by using returning `form` utility directly from the handler.

```typescript
import { Elysia, form, file } from 'elysia'

new Elysia()
	.get('/', () => form({
		name: 'Tea Party',
		images: [file('nagi.web'), file('mika.webp')]
	}))
	.listen(3000)
```

This pattern is useful if even need to return a file or multipart form data.

### Return a single file
Or alternatively, you can return a single file by returning `file` directly without `form`.

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
	.get('/', file('nagi.web'))
	.listen(3000)
```

## Handle

As Elysia is built on top of Web Standard Request, we can programmatically test it using `Elysia.handle`.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'hello')
    .post('/hi', () => 'hi')
    .listen(3000)

app.handle(new Request('http://localhost/')).then(console.log)
```

**Elysia.handle** is a function to process an actual request sent to the server.

::: tip
Unlike unit test's mock, **you can expect it to behave like an actual request** sent to the server.

But also useful for simulating or creating unit tests.
:::

## Stream
To return a response streaming out of the box by using a generator function with `yield` keyword.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})
```

This this example, we may stream a response by using `yield` keyword.

### Set headers
Elysia will defers returning response headers until the first chunk is yielded.

This allows us to set headers before the response is streamed.

```typescript twoslash
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* ({ set }) {
		// This will set headers
		set.headers['x-name'] = 'Elysia'
		yield 1
		yield 2

		// This will do nothing
		set.headers['x-id'] = '1'
		yield 3
	})
```

Once the first chunk is yielded, Elysia will send the headers and the first chunk in the same response.

Setting headers after the first chunk is yielded will do nothing.

### Conditional Stream
If the response is returned without yield, Elysia will automatically convert stream to normal response instead.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
	.get('/ok', function* () {
		if (Math.random() > 0.5) return 'ok'

		yield 1
		yield 2
		yield 3
	})
```

This allows us to conditionally stream a response or return a normal response if necessary.

### Abort
While streaming a response, it's common that request may be cancelled before the response is fully streamed.

Elysia will automatically stop the generator function when the request is cancelled.

### Eden
[Eden](/eden/overview) will interpret a stream response as `AsyncGenerator` allowing us to use `for await` loop to consume the stream.

```typescript twoslash
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia()
	.get('/ok', function* () {
		yield 1
		yield 2
		yield 3
	})

const { data, error } = await treaty(app).ok.get()
if (error) throw error

for await (const chunk of data)
	console.log(chunk)
```

## Extending context

As Elysia only provides essential information, we can customize Context for our specific need for instance:
- extracting user ID as variable
- inject a common pattern repository
- add a database connection

We may extend Elysia's context by using the following APIs to customize the Context:

-   [state](#state) - a global mutable state
-   [decorate](#decorate) - additional property assigned to **Context**
-   [derive](#derive) / [resolve](#resolve) - create a new value from existing property

### When to extend context
You should only extend context when:
- A property is a global mutable state, and shared across multiple routes using [state](#state)
- A property is associated with a request or response using [decorate](#decorate)
- A property is derived from an existing property using [derive](#derive) / [resolve](#resolve)

Otherwise, we recommend defining a value or function separately than extending the context.

::: tip
It's recommended to assign properties related to request and response, or frequently used functions to Context for separation of concerns.
:::

## State

**State** is a global mutable object or state shared across the Elysia app.

Once **state** is called, value will be added to **store** property **once at call time**, and can be used in handler.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('version', 1)
    .get('/a', ({ store: { version } }) => version)
                // ^?
    .get('/b', ({ store }) => store)
    .get('/c', () => 'still ok')
    .listen(3000)
```

<Playground :elysia="demo1" />

### When to use
- When you need to share a primitive mutable value across multiple routes
- If you want to use a non-primitive or a `wrapper` value or class that mutate an internal state, use [decorate](#decorate) instead.

### Key takeaway
- **store** is a representation of a single-source-of-truth global mutable object for the entire Elysia app.
- **state** is a function to assign an initial value to **store**, which could be mutated later.
- Make sure to assign a value before using it in a handler.
```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

new Elysia()
    // ❌ TypeError: counter doesn't exist in store
    .get('/error', ({ store }) => store.counter)
    .state('counter', 0)
    // ✅ Because we assigned a counter before, we can now access it
    .get('/', ({ store }) => store.counter)
```

<Playground :elysia="demo2" />

::: tip
Beware that we cannot use a state value before assign.

Elysia registers state values into the store automatically without explicit type or additional TypeScript generic needed.
:::

## Decorate

**decorate** assigns an additional property to **Context** directly **at call time**.

```typescript twoslash
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .decorate('logger', new Logger())
    // ✅ defined from the previous line
    .get('/', ({ logger }) => {
        logger.log('hi')

        return 'hi'
    })
```

### When to use
- A constant or readonly value object to **Context**
- Non primitive value or class that may contain internal mutable state
- Additional functions, singleton, or immutable property to all handlers.

### Key takeaway
- Unlike **state**, decorated value **SHOULD NOT** be mutated although it's possible
- Make sure to assign a value before using it in a handler.

## Derive
Retrieve values from existing properties in **Context** and assign new properties.

Derive assigns when request happens **at transform lifecycle** allowing us to "derive" <small>(create new properties from existing properties)</small>.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers }) => {
        const auth = headers['authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

<Playground :elysia="demo3" />

Because **derive** is assigned once a new request starts, **derive** can access request properties like **headers**, **query**, **body** where **store**, and **decorate** can't.

### When to use
- Create a new property from existing properties in **Context** without validation or type checking
- When you need to access request properties like **headers**, **query**, **body** without validation

### Key takeaway
- Unlike **state** and **decorate** instead of assign **at call time**, **derive** is assigned once a new request starts.
- **derive is called at transform, or before validation** happens, Elysia cannot safely confirm the type of request property resulting in as **unknown**. If you want to assign a new value from typed request properties, you may want to use [resolve](#resolve) instead.

## Resolve
Same as [derive](#derive), resolve allow us to assign a new property to context.

Resolve is called at **beforeHandle** lifecycle or **after validation**, allowing us to **derive** request properties safely.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		headers: t.Object({
			bearer: t.String({
				pattern: '^Bearer .+$'
			})
		})
	})
	.resolve(({ headers }) => {
		return {
			bearer: headers.bearer.slice(7)
		}
	})
	.get('/', ({ bearer }) => bearer)
```

### When to use
- Create a new property from existing properties in **Context** with type integrity (type checked)
- When you need to access request properties like **headers**, **query**, **body** with validation

### Key takeaway
- **resolve is called at beforeHandle, or after validation** happens. Elysia can safely confirm the type of request property resulting in as **typed**.

### Error from resolve/derive
As resolve and derive is based on **transform** and **beforeHandle** lifecycle, we can return an error from resolve and derive. If error is returned from **derive**, Elysia will return early exit and return the error as response.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers, status }) => {
        const auth = headers['authorization']

        if(!auth) return status(400)

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

## Pattern

**state**, **decorate** offers a similar APIs pattern for assigning property to Context as the following:

-   key-value
-   object
-   remap

Where **derive** can be only used with **remap** because it depends on existing value.

### key-value

We can use **state**, and **decorate** to assign a value using a key-value pattern.

```typescript
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .state('counter', 0)
    .decorate('logger', new Logger())
```

This pattern is great for readability for setting a single property.

### Object

Assigning multiple properties is better contained in an object for a single assignment.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .decorate({
        logger: new Logger(),
        trace: new Trace(),
        telemetry: new Telemetry()
    })
```

The object offers a less repetitive API for setting multiple values.

### Remap

Remap is a function reassignment.

Allowing us to create a new value from existing value like renaming or removing a property.

By providing a function, and returning an entirely new object to reassign the value.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

new Elysia()
    .state('counter', 0)
    .state('version', 1)
    .state(({ version, ...store }) => ({
        ...store,
        elysiaVersion: 1
    }))
    // ✅ Create from state remap
    .get('/elysia-version', ({ store }) => store.elysiaVersion)
    // ❌ Excluded from state remap
    .get('/version', ({ store }) => store.version)
```

<Playground :elysia="demo4" />

It's a good idea to use state remap to create a new initial value from the existing value.

However, it's important to note that Elysia doesn't offer reactivity from this approach, as remap only assigns an initial value.

::: tip
Using remap, Elysia will treat a returned object as a new property, removing any property that is missing from the object.
:::

## Affix

To provide a smoother experience, some plugins might have a lot of property value which can be overwhelming to remap one-by-one.

The **Affix** function which consists of **prefix** and **suffix**, allowing us to remap all property of an instance.

```ts twoslash
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(
        setup
            .prefix('decorator', 'setup')
    )
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

<Playground :elysia="demo5" />

Allowing us to bulk remap a property of the plugin effortlessly, preventing the name collision of the plugin.

By default, **affix** will handle both runtime, type-level code automatically, remapping the property to camelCase as naming convention.

In some condition, we can also remap `all` property of the plugin:

```ts twoslash
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate({
        argon: 'a',
        boron: 'b',
        carbon: 'c'
    })

const app = new Elysia()
    .use(setup.prefix('all', 'setup')) // [!code ++]
    .get('/', ({ setupCarbon, ...rest }) => setupCarbon)
```

## Reference and value

To mutate the state, it's recommended to use **reference** to mutate rather than using an actual value.

When accessing the property from JavaScript, if we define a primitive value from an object property as a new value, the reference is lost, the value is treated as new separate value instead.

For example:

```typescript
const store = {
    counter: 0
}

store.counter++
console.log(store.counter) // ✅ 1
```

We can use **store.counter** to access and mutate the property.

However, if we define a counter as a new value

```typescript
const store = {
    counter: 0
}

let counter = store.counter

counter++
console.log(store.counter) // ❌ 0
console.log(counter) // ✅ 1
```

Once a primitive value is redefined as a new variable, the reference **"link"** will be missing, causing unexpected behavior.

This can apply to `store`, as it's a global mutable object instead.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .state('counter', 0)
    // ✅ Using reference, value is shared
    .get('/', ({ store }) => store.counter++)
    // ❌ Creating a new variable on primitive value, the link is lost
    .get('/error', ({ store: { counter } }) => counter)
```

<Playground :elysia="demo7" />

## TypeScript
Elysia automatically type context base on various of factors like store, decorators, schema.

It's recommended to leave Elysia to type context instead of manually define one.

However, Elysia also offers some utility type to help you define a handler type.
- [InferContext](#infercontext)
- [InferHandle](#inferhandler)

### InferContext
Infer context is a utility type to help you define a context type based on Elysia instance.

```typescript twoslash
import { Elysia, type InferContext } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

type Context = InferContext<typeof setup>

const handler = ({ store }: Context) => store.a
```

### InferHandler
Infer handler is a utility type to help you define a handler type based on Elysia instance, path, and schema.

```typescript twoslash
import { Elysia, type InferHandler } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

type Handler = InferHandler<
	// Elysia instance to based on
	typeof setup,
	// path
	'/path',
	// schema
	{
		body: string
		response: {
			200: string
		}
	}
>

const handler: Handler = ({ body }) => body

const app = new Elysia()
	.get('/', handler)
```

Unlike `InferContext`, `InferHandler` requires a path and schema to define a handler type and can safely ensure type safety of a return type.
`````

## File: docs/essential/life-cycle.md
`````markdown
---
title: Life Cycle - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Life Cycle - ElysiaJS

    - - meta
      - name: 'description'
        content: Lifecycle event is a concept for each stage of Elysia processing, "Life Cycle" or "Hook" is an event listener to intercept, and listen to those events cycling around. Hook allows you to transform data running through the data pipeline. With the hook, you can customize Elysia to its fullest potential.

    - - meta
      - property: 'og:description'
        content: Lifecycle event is a concept for each stage of Elysia processing, "Life Cycle" or "Hook" is an event listener to intercept, and listen to those events cycling around. Hook allows you to transform data running through the data pipeline. With the hook, you can customize Elysia to its fullest potential.
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
import Playground from '../components/nearl/playground.vue'

import { Elysia } from 'elysia'

const demo = new Elysia()
	.onError(({ code }) => {
		if (code === 418) return 'caught'
	})
    .get('/throw', ({ error }) => {
		// This will be caught by onError
		throw error(418)
	})
	.get('/return', ({ status }) => {
		// This will NOT be caught by onError
		return status(418)
	})
</script>

# Lifecycle

Life Cycle allows us to intercept an important event at the predefined point allowing us to customize the behavior of our server as needed.

Elysia's Life Cycle event can be illustrated as the following.
![Elysia Life Cycle Graph](/assets/lifecycle-chart.svg)
> Click on image to enlarge

Below are the request life cycle available in Elysia:

<Deck>
    <Card title="Request" href="#request">
        Notify new event is received
    </Card>
    <Card title="Parse" href="#parse">
        Parse body into <b>Context.body</b>
    </Card>
    <Card title="Transform" href="#transform">
        Modify <b>Context</b> before validation
    </Card>
    <Card title="Before Handle" href="#before-handle">
        Custom validation before route handler
    </Card>
    <Card title="After Handle" href="#after-handle">
        Transform returned value into a new value
    </Card>
    <Card title="Map Response" href="#map-response">
        Map returned value into a response
    </Card>
    <Card title="On Error (Error Handling)" href="#on-error-error-handling">
   		Handle error thrown in life-cycle
    </Card>
    <Card title="After Response" href="#after-response">
        Executed after response sent to the client
    </Card>
    <Card title="Trace" href="/patterns/trace">
        Audit and capture timespan of each event
    </Card>
</Deck>

## Why

Imagine we want to return some HTML.

We need to set **"Content-Type"** headers as **"text/html"** for the browser to render HTML.

Explicitly specifying that the response is HTML could be repetitive if there are a lot of handlers, say ~200 endpoints.

This can lead to a lot of duplicated code just to specify the **"text/html"** **"Content-Type"**

But what if after we send a response, we could detect that the response is an HTML string then append the header automatically?

That's when the concept of Life Cycle comes into play.

## Hook

We refer to each function that intercepts the life cycle event as **"hook"**, as the function hooks into the lifecycle event.

Hooks can be categorized into 2 types:

1. Local Hook: Execute on a specific route
2. Interceptor Hook: Execute on every route

::: tip
The hook will accept the same Context as a handler, you can imagine adding a route handler but at a specific point.
:::

## Local Hook

The local hook is executed on a specific route.

To use a local hook, you can inline hook into a route handler:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response))
                set.headers['Content-Type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path | Content-Type             |
| ---- | ------------------------ |
| /    | text/html; charset=utf8  |
| /hi  | text/plain; charset=utf8 |

## Interceptor Hook

Register hook into every handler **of the current instance** that came after.

To add an interceptor hook, you can use `.on` followed by a life cycle event in camelCase:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/none', () => '<h1>Hello World</h1>')
    .onAfterHandle(({ response, set }) => {
        if (isHtml(response))
            set.headers['Content-Type'] = 'text/html; charset=utf8'
    })
    .get('/', () => '<h1>Hello World</h1>')
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path  | Content-Type             |
| ----- | ------------------------ |
| /     | text/html; charset=utf8  |
| /hi   | text/html; charset=utf8  |
| /none | text/plain; charset=utf8 |

Events from other plugins are also applied to the route so the order of code is important.

::: tip
The code above will only apply to the current instance, not applying to parent.

See [scope](/essential/plugin#scope) to find out why
:::

## Order of code

The order of Elysia's life-cycle code is very important.

Elysia's life-cycle event is stored as a queue, aka first-in first-out. So Elysia will **always** respect the order of code from top-to-bottom followed by the order of life-cycle events.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(() => {
        console.log('1')
    })
    .onAfterHandle(() => {
        console.log('3')
    })
    .get('/', () => 'hi', {
        beforeHandle() {
            console.log('2')
        }
    })
    .listen(3000)
```

Console should log the following:

```bash
1
2
3
```

## Request

The first life-cycle event to get executed for every new request is recieved.

As `onRequest` is designed to provide only the most crucial context to reduce overhead, it is recommended to use in the following scenario:

- Caching
- Rate Limiter / IP/Region Lock
- Analytic
- Provide custom header, eg. CORS

#### Example

Below is a pseudo code to enforce rate-limit on a certain IP address.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .use(rateLimiter)
    .onRequest(({ rateLimiter, ip, set, status }) => {
        if (rateLimiter.check(ip)) return status(420, 'Enhance your calm')
    })
    .get('/', () => 'hi')
    .listen(3000)
```

If a value is returned from `onRequest`, it will be used as the response and the rest of the life-cycle will be skipped.

### Pre Context

Context's onRequest is typed as `PreContext`, a minimal representation of `Context` with the attribute on the following:
request: `Request`

- set: `Set`
- store
- decorators

Context doesn't provide `derived` value because derive is based on `onTransform` event.

## Parse

Parse is an equivalent of **body parser** in Express.

A function to parse body, the return value will be append to `Context.body`, if not, Elysia will continue iterating through additional parser functions assigned by `onParse` until either body is assigned or all parsers have been executed.

By default, Elysia will parse the body with content-type of:

- `text/plain`
- `application/json`
- `multipart/form-data`
- `application/x-www-form-urlencoded`

It's recommended to use the `onParse` event to provide a custom body parser that Elysia doesn't provide.

#### Example

Below is an example code to retrieve value based on custom headers.

```typescript
import { Elysia } from 'elysia'

new Elysia().onParse(({ request, contentType }) => {
    if (contentType === 'application/custom-type') return request.text()
})
```

The returned value will be assigned to Context.body. If not, Elysia will continue iterating through additional parser functions from **onParse** stack until either body is assigned or all parsers have been executed.

### Context

`onParse` Context is extends from `Context` with additional properties of the following:

- contentType: Content-Type header of the request

All of the context is based on normal context and can be used like normal context in route handler.

### Parser

By default, Elysia will try to determine body parsing function ahead of time and pick the most suitable function to speed up the process.

Elysia is able to determine that body function by reading `body`.

Take a look at this example:

```typescript
import { Elysia, t } from 'elysia'

new Elysia().post('/', ({ body }) => body, {
    body: t.Object({
        username: t.String(),
        password: t.String()
    })
})
```

Elysia read the body schema and found that, the type is entirely an object, so it's likely that the body will be JSON. Elysia then picks the JSON body parser function ahead of time and tries to parse the body.

Here's a criteria that Elysia uses to pick up type of body parser

- `application/json`: body typed as `t.Object`
- `multipart/form-data`: body typed as `t.Object`, and is 1 level deep with `t.File`
- `application/x-www-form-urlencoded`: body typed as `t.URLEncoded`
- `text/plain`: other primitive type

This allows Elysia to optimize body parser ahead of time, and reduce overhead in compile time.

### Explicit Parser

However, in some scenario if Elysia fails to pick the correct body parser function, we can explicitly tell Elysia to use a certain function by specifying `type`

```typescript
import { Elysia } from 'elysia'

new Elysia().post('/', ({ body }) => body, {
    // Short form of application/json
    parse: 'json'
})
```

Allowing us to control Elysia behavior for picking body parser function to fit our needs in a complex scenario.

`type` may be one of the following:

```typescript
type ContentType = |
    // Shorthand for 'text/plain'
    | 'text'
    // Shorthand for 'application/json'
    | 'json'
    // Shorthand for 'multipart/form-data'
    | 'formdata'
    // Shorthand for 'application/x-www-form-urlencoded'\
    | 'urlencoded'
    | 'text/plain'
    | 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded'
```

### Custom Parser

You can provide register a custom parser with `parser`:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .parser('custom', ({ request, contentType }) => {
        if (contentType === 'application/elysia') return request.text()
    })
    .post('/', ({ body }) => body, {
        parse: ['custom', 'json']
    })
```

## Transform

Executed just before **Validation** process, designed to mutate context to conform with the validation or appending new value.

It's recommended to use transform for the following:

- Mutate existing context to conform with validation.
- `derive` is based on `onTransform` with support for providing type.

#### Example

Below is an example of using transform to mutate params to be numeric values.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        }),
        transform({ params }) {
            const id = +params.id

            if (!Number.isNaN(id)) params.id = id
        }
    })
    .listen(3000)
```

## Derive

Append new value to context directly **before validation**. It's stored in the same stack as **transform**.

Unlike **state** and **decorate** that assigned value before the server started. **derive** assigns a property when each request happens. Allowing us to extract a piece of information into a property instead.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .derive(({ headers }) => {
        const auth = headers['Authorization']

        return {
            bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
        }
    })
    .get('/', ({ bearer }) => bearer)
```

Because **derive** is assigned once a new request starts, **derive** can access Request properties like **headers**, **query**, **body** where **store**, and **decorate** can't.

Unlike **state**, and **decorate**. Properties which assigned by **derive** is unique and not shared with another request.

### Queue

`derive` and `transform` is stored in the same queue.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onTransform(() => {
        console.log(1)
    })
    .derive(() => {
        console.log(2)

        return {}
    })
```

The console should log as the following:

```bash
1
2
```

## Before Handle

Execute after validation and before the main route handler.

Designed to provide a custom validation to provide a specific requirement before running the main handler.

If a value is returned, the route handler will be skipped.

It's recommended to use Before Handle in the following situations:

- Restricted access check: authorization, user sign-in
- Custom request requirement over data structure

#### Example

Below is an example of using the before handle to check for user sign-in.

```typescript
import { Elysia } from 'elysia'
import { validateSession } from './user'

new Elysia()
    .get('/', () => 'hi', {
        beforeHandle({ set, cookie: { session }, status }) {
            if (!validateSession(session.value)) return status(401)
        }
    })
    .listen(3000)
```

The response should be listed as follows:

| Is signed in | Response     |
| ------------ | ------------ |
| ❌           | Unauthorized |
| ✅           | Hi           |

### Guard

When we need to apply the same before handle to multiple routes, we can use `guard` to apply the same before handle to multiple routes.

```typescript
import { Elysia } from 'elysia'
import { signUp, signIn, validateSession, isUserExists } from './user'

new Elysia()
    .guard(
        {
            beforeHandle({ set, cookie: { session }, status }) {
                if (!validateSession(session.value)) return status(401)
            }
        },
        (app) =>
            app
                .get('/user/:id', ({ body }) => signUp(body))
                .post('/profile', ({ body }) => signIn(body), {
                    beforeHandle: isUserExists
                })
    )
    .get('/', () => 'hi')
    .listen(3000)
```

## Resolve

Append new value to context **after validation**. It's stored in the same stack as **beforeHandle**.

Resolve syntax is identical to [derive](#derive), below is an example of retrieving a bearer header from the Authorization plugin.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .guard(
        {
            headers: t.Object({
                authorization: t.TemplateLiteral('Bearer ${string}')
            })
        },
        (app) =>
            app
                .resolve(({ headers: { authorization } }) => {
                    return {
                        bearer: authorization.split(' ')[1]
                    }
                })
                .get('/', ({ bearer }) => bearer)
    )
    .listen(3000)
```

Using `resolve` and `onBeforeHandle` is stored in the same queue.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onBeforeHandle(() => {
        console.log(1)
    })
    .resolve(() => {
        console.log(2)

        return {}
    })
    .onBeforeHandle(() => {
        console.log(3)
    })
```

The console should log as the following:

```bash
1
2
3
```

Same as **derive**, properties which assigned by **resolve** is unique and not shared with another request.

### Guard resolve

As resolve is not available in local hook, it's recommended to use guard to encapsulate the **resolve** event.

```typescript
import { Elysia } from 'elysia'
import { isSignIn, findUserById } from './user'

new Elysia()
    .guard(
        {
            beforeHandle: isSignIn
        },
        (app) =>
            app
                .resolve(({ cookie: { session } }) => ({
                    userId: findUserById(session.value)
                }))
                .get('/profile', ({ userId }) => userId)
    )
    .listen(3000)
```

## After Handle

Execute after the main handler, for mapping a returned value of **before handle** and **route handler** into a proper response.

It's recommended to use After Handle in the following situations:

- Transform requests into a new value, eg. Compression, Event Stream
- Add custom headers based on the response value, eg. **Content-Type**

#### Example

Below is an example of using the after handle to add HTML content type to response headers.

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response))
                set.headers['content-type'] = 'text/html; charset=utf8'
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

The response should be listed as follows:

| Path | Content-Type             |
| ---- | ------------------------ |
| /    | text/html; charset=utf8  |
| /hi  | text/plain; charset=utf8 |

### Returned Value

If a value is returned After Handle will use a return value as a new response value unless the value is **undefined**

The above example could be rewritten as the following:

```typescript
import { Elysia } from 'elysia'
import { isHtml } from '@elysiajs/html'

new Elysia()
    .get('/', () => '<h1>Hello World</h1>', {
        afterHandle({ response, set }) {
            if (isHtml(response)) {
                set.headers['content-type'] = 'text/html; charset=utf8'
                return new Response(response)
            }
        }
    })
    .get('/hi', () => '<h1>Hello World</h1>')
    .listen(3000)
```

Unlike **beforeHandle**, after a value is returned from **afterHandle**, the iteration of afterHandle **will **NOT** be skipped.**

### Context

`onAfterHandle` context extends from `Context` with the additional property of `response`, which is the response to return to the client.

The `onAfterHandle` context is based on the normal context and can be used like the normal context in route handlers.

## Map Response

Executed just after **"afterHandle"**, designed to provide custom response mapping.

It's recommended to use transform for the following:

- Compression
- Map value into a Web Standard Response

#### Example

Below is an example of using mapResponse to provide Response compression.

```typescript
import { Elysia } from 'elysia'

const encoder = new TextEncoder()

new Elysia()
    .mapResponse(({ response, set }) => {
        const isJson = typeof response === 'object'

        const text = isJson
            ? JSON.stringify(response)
            : (response?.toString() ?? '')

        set.headers['Content-Encoding'] = 'gzip'

        return new Response(Bun.gzipSync(encoder.encode(text)), {
            headers: {
                'Content-Type': `${
                    isJson ? 'application/json' : 'text/plain'
                }; charset=utf-8`
            }
        })
    })
    .get('/text', () => 'mapResponse')
    .get('/json', () => ({ map: 'response' }))
    .listen(3000)
```

Like **parse** and **beforeHandle**, after a value is returned, the next iteration of **mapResponse** will be skipped.

Elysia will handle the merging process of **set.headers** from **mapResponse** automatically. We don't need to worry about appending **set.headers** to Response manually.

## On Error (Error Handling)

Designed for error-handling. It will be executed when an error is thrown in any life-cycle.

Its recommended to use on Error in the following situation:

- To provide custom error message
- Fail safe or an error handler or retrying a request
- Logging and analytic

#### Example

Elysia catches all the errors thrown in the handler, classifies the error code, and pipes them to `onError` middleware.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onError(({ code, error }) => {
        return new Response(error.toString())
    })
    .get('/', () => {
        throw new Error('Server is during maintenance')

        return 'unreachable'
    })
```

With `onError` we can catch and transform the error into a custom error message.

::: tip
It's important that `onError` must be called before the handler we want to apply it to.
:::

### Custom 404 message

For example, returning custom 404 messages:

```typescript
import { Elysia, NotFoundError } from 'elysia'

new Elysia()
    .onError(({ code, status, set }) => {
        if (code === 'NOT_FOUND') return status(404, 'Not Found :(')
    })
    .post('/', () => {
        throw new NotFoundError()
    })
    .listen(3000)
```

### Context

`onError` Context is extends from `Context` with additional properties of the following:

- **error**: A value that was thrown
- **code**: *Error Code*

### Error Code

Elysia error code consists of:

- **NOT_FOUND**
- **INTERNAL_SERVER_ERROR**
- **VALIDATION**
- **PARSE**
- **UNKNOWN**
- **number** (based on HTTP Status)

By default, the thrown error code is `UNKNOWN`.

::: tip
If no error response is returned, the error will be returned using `error.name`.
:::

### To Throw or To Return

`Elysia.error` is a shorthand for returning an error with a specific HTTP status code.

It could either be **return** or **throw** based on your specific needs.

- If an `error` is **throw**, it will be caught by `onError` middleware.
- If an `error` is **return**, it will be **NOT** caught by `onError` middleware.

See the following code:

```typescript
import { Elysia, file } from 'elysia'

new Elysia()
    .onError(({ code, error, path }) => {
        if (code === 418) return 'caught'
    })
    .get('/throw', ({ status }) => {
        // This will be caught by onError
        throw status(418)
    })
    .get('/return', ({ status }) => {
        // This will NOT be caught by onError
        return status(418)
    })
```

<Playground
    :elysia="demo"
/>

### Custom Error

Elysia supports custom error both in the type-level and implementation level.

To provide a custom error code, we can use `Elysia.error` to add a custom error code, helping us to easily classify and narrow down the error type for full type safety with auto-complete as the following:

```typescript twoslash
import { Elysia } from 'elysia'

class MyError extends Error {
    constructor(public message: string) {
        super(message)
    }
}

new Elysia()
    .error({
        MyError
    })
    .onError(({ code, error }) => {
        switch (code) {
            // With auto-completion
            case 'MyError':
                // With type narrowing
                // Hover to see error is typed as `CustomError`
                return error
        }
    })
    .get('/', () => {
        throw new MyError('Hello Error')
    })
```

Properties of `error` code is based on the properties of `error`, the said properties will be used to classify the error code.

### Local Error

Same as others life-cycle, we provide an error into an [scope](/essential/plugin.html#scope) using guard:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', () => 'Hello', {
        beforeHandle({ set, request: { headers }, error }) {
            if (!isSignIn(headers)) throw error(401)
        },
        error({ error }) {
            return 'Handled'
        }
    })
    .listen(3000)
```

## After Response

Executed after the response sent to the client.

It's recommended to use **After Response** in the following situations:

- Clean up response
- Logging and analytics

#### Example

Below is an example of using the response handle to check for user sign-in.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .onAfterResponse(() => {
        console.log('Response', performance.now())
    })
    .listen(3000)
```

Console should log as the following:

```bash
Response 0.0000
Response 0.0001
Response 0.0002
```

### Response

Similar to [Map Response](#map-resonse), `afterResponse` also accept a `response` value.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ response }) => {
		console.log(response)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```

`response` from `onAfterResponse`, is not a Web-Standard's `Response` but is a value that is returned from the handler.

To get a headers, and status returned from the handler, we can access `set` from the context.

```typescript
import { Elysia } from 'elysia'

new Elysia()
	.onAfterResponse(({ set }) => {
		console.log(set.status, set.headers)
	})
	.get('/', () => 'Hello')
	.listen(3000)
```
`````

## File: docs/essential/plugin.md
`````markdown
---
title: Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: A plugin is a way to decouple logic into smaller parts, defining reusable components across the server. Plugin can register by using `use`, registering a plugin will combine types between plugin and current instance, and the scope of hooks, and schema get merged too.

    - - meta
      - property: 'og:description'
        content: A plugin is a way to decouple logic into smaller parts, defining reusable components across the server. Plugin can register by using `use`, registering a plugin will combine types between plugin and current instance, and the scope of hooks, and schema get merged too.
---

<script setup>
import Playground from '../components/nearl/playground.vue'
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .decorate('plugin', 'hi')
    .get('/plugin', ({ plugin }) => plugin)

const demo1 = new Elysia()
    .get('/', ({ plugin }) => plugin)
    .use(plugin)

const plugin2 = (app) => {
    if ('counter' in app.store) return app

    return app
        .state('counter', 0)
        .get('/plugin', () => 'Hi')
}

const demo2 = new Elysia()
    .use(plugin2)
    .get('/counter', ({ store: { counter } }) => counter)

const version = (version = 1) => new Elysia()
        .get('/version', version)

const demo3 = new Elysia()
    .use(version(1))

const setup = new Elysia({ name: 'setup' })
    .decorate('a', 'a')

const plugin3 = (config) => new Elysia({
        name: 'my-plugin',
        seed: config,
    })
    .get(`${config.prefix}/hi`, () => 'Hi')

const demo4 = new Elysia()
    .use(
        plugin3({
            prefix: '/v2'
        })
    )

// child.ts
const child = new Elysia()
    .use(setup)
    .get('/', ({ a }) => a)

// index.ts
const demo5 = new Elysia()
    .use(child)

const _demo1 = new Elysia()
    .post('/student', 'Rikuhachima Aru')

const _plugin2 = new Elysia()
    .onBeforeHandle({ as: 'global' }, () => {
        return 'hi'
    })
    .get('/child', () => 'child')

const _demo2 = new Elysia()
    .use(plugin2)
    .get('/parent', () => 'parent')

const _mock2 = {
    '/child': {
        'GET': 'hi'
    },
    '/parent': {
        'GET': 'hi'
    }
}

const _plugin3 = new Elysia()
    .onBeforeHandle({ as: 'global' }, () => {
        return 'overwrite'
    })

const _demo3 = new Elysia()
    .guard(app => app
        .use(plugin3)
        .get('/inner', () => 'inner')
    )
    .get('/outer', () => 'outer')

const _mock3 = {
    '/inner': {
        'GET': 'overwrite'
    },
    '/outer': {
        'GET': 'outer'
    }
}
</script>

# Plugin

Plugin is a pattern that decouples functionality into smaller parts. Creating reusable components for our web server.

Defining a plugin is to define a separate instance.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .decorate('plugin', 'hi')
    .get('/plugin', ({ plugin }) => plugin)

const app = new Elysia()
    .use(plugin)
    .get('/', ({ plugin }) => plugin)
               // ^?
    .listen(3000)
```

We can use the plugin by passing an instance to **Elysia.use**.

<Playground :elysia="demo1" />

The plugin will inherit all properties of the plugin instance, including **state**, **decorate**, **derive**, **route**, **lifecycle**, etc.

Elysia will also handle the type inference automatically as well, so you can imagine as if you call all of the other instances on the main one.

::: tip
Notice that the plugin doesn't contain **.listen**, because **.listen** will allocate a port for the usage, and we only want the main instance to allocate the port.
:::

## Plugin

Every Elysia instance can be a plugin.

We can decouple our logic into a new separate Elysia instance and use it as a plugin.

First, we define an instance in a difference file:
```typescript twoslash
// plugin.ts
import { Elysia } from 'elysia'

export const plugin = new Elysia()
    .get('/plugin', () => 'hi')
```

And then we import the instance into the main file:
```typescript
import { Elysia } from 'elysia'
import { plugin } from './plugin'

const app = new Elysia()
    .use(plugin)
    .listen(3000)
```

### Config

To make the plugin more useful, allowing customization via config is recommended.

You can create a function that accepts parameters that may change the behavior of the plugin to make it more reusable.

```typescript
import { Elysia } from 'elysia'

const version = (version = 1) => new Elysia()
        .get('/version', version)

const app = new Elysia()
    .use(version(1))
    .listen(3000)
```

### Functional callback

It's recommended to define a new plugin instance instead of using a function callback.

Functional callback allows us to access the existing property of the main instance. For example, checking if specific routes or stores existed.

To define a functional callback, create a function that accepts Elysia as a parameter.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = (app: Elysia) => app
    .state('counter', 0)
    .get('/plugin', () => 'Hi')

const app = new Elysia()
    .use(plugin)
    .get('/counter', ({ store: { counter } }) => counter)
    .listen(3000)
```

<Playground :elysia="demo2" />

Once passed to `Elysia.use`, functional callback behaves as a normal plugin except the property is assigned directly to

::: tip
You shall not worry about the performance difference between a functional callback and creating an instance.

Elysia can create 10k instances in a matter of milliseconds, the new Elysia instance has even better type inference performance than the functional callback.
:::

## Plugin Deduplication

By default, Elysia will register any plugin and handle type definitions.

Some plugins may be used multiple times to provide type inference, resulting in duplication of setting initial values or routes.

Elysia avoids this by differentiating the instance by using **name** and **optional seeds** to help Elysia identify instance duplication:

```typescript
import { Elysia } from 'elysia'

const plugin = <T extends string>(config: { prefix: T }) =>
    new Elysia({
        name: 'my-plugin', // [!code ++]
        seed: config, // [!code ++]
    })
    .get(`${config.prefix}/hi`, () => 'Hi')

const app = new Elysia()
    .use(
        plugin({
            prefix: '/v2'
        })
    )
    .listen(3000)
```

<Playground :elysia="demo4" />

Elysia will use **name** and **seed** to create a checksum to identify if the instance has been registered previously or not, if so, Elysia will skip the registration of the plugin.

If seed is not provided, Elysia will only use **name** to differentiate the instance. This means that the plugin is only registered once even if you registered it multiple times.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })

const app = new Elysia()
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .use(plugin)
    .listen(3000)
```

This allows Elysia to improve performance by reusing the registered plugins instead of processing the plugin over and over again.

::: tip
Seed could be anything, varying from a string to a complex object or class.

If the provided value is class, Elysia will then try to use the `.toString` method to generate a checksum.
:::

### Service Locator
When you apply a plugin with state/decorators to an instance, the instance will gain type safety.

But if you don't apply the plugin to another instance, it will not be able to infer the type.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const child = new Elysia()
    // ❌ 'a' is missing
    .get('/', ({ a }) => a)

const main = new Elysia()
    .decorate('a', 'a')
    .use(child)
```

Elysia introduces the **Service Locator** pattern to counteract this.

Elysia will lookup the plugin checksum and get the value or register a new one. Infer the type from the plugin.

So we have to provide the plugin reference for Elysia to find the service to add type safety.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const setup = new Elysia({ name: 'setup' })
    .decorate('a', 'a')

// Without 'setup', type will be missing
const error = new Elysia()
    .get('/', ({ a }) => a)

const main = new Elysia()
	// With `setup`, type will be inferred
    .use(setup) // [!code ++]
    .get('/', ({ a }) => a)
    //           ^?
```

<Playground :elysia="demo5" />

## Guard

Guard allows us to apply hook and schema into multiple routes all at once.

```typescript twoslash
const signUp = <T>(a: T) => a
const signIn = <T>(a: T) => a
const isUserExists = <T>(a: T) => a
// ---cut---
import { Elysia, t } from 'elysia'

new Elysia()
    .guard(
        { // [!code ++]
            body: t.Object({ // [!code ++]
                username: t.String(), // [!code ++]
                password: t.String() // [!code ++]
            }) // [!code ++]
        }, // [!code ++]
        (app) => // [!code ++]
            app
                .post('/sign-up', ({ body }) => signUp(body))
                .post('/sign-in', ({ body }) => signIn(body), {
                                                     // ^?
                    beforeHandle: isUserExists
                })
    )
    .get('/', 'hi')
    .listen(3000)
```

This code applies validation for `body` to both '/sign-in' and '/sign-up' instead of inlining the schema one by one but applies not to '/'.

We can summarize the route validation as the following:
| Path | Has validation |
| ------- | ------------- |
| /sign-up | ✅ |
| /sign-in | ✅ |
| / | ❌ |

Guard accepts the same parameter as inline hook, the only difference is that you can apply hook to multiple routes in the scope.

This means that the code above is translated into:

```typescript twoslash
const signUp = <T>(a: T) => a
const signIn = <T>(a: T) => a
const isUserExists = (a: any) => a
// ---cut---
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/sign-up', ({ body }) => signUp(body), {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        beforeHandle: isUserExists,
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .get('/', () => 'hi')
    .listen(3000)
```

### Grouped Guard

We can use a group with prefixes by providing 3 parameters to the group.

1. Prefix - Route prefix
2. Guard - Schema
3. Scope - Elysia app callback

With the same API as guard apply to the 2nd parameter, instead of nesting group and guard together.

Consider the following example:
```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group('/v1', (app) =>
        app.guard(
            {
                body: t.Literal('Rikuhachima Aru')
            },
            (app) => app.post('/student', ({ body }) => body)
                                            // ^?
        )
    )
    .listen(3000)
```


From nested groupped guard, we may merge group and guard together by providing guard scope to 2nd parameter of group:
```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/v1',
        (app) => app.guard( // [!code --]
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app.post('/student', ({ body }) => body)
        ) // [!code --]
    )
    .listen(3000)
```

Which results in the follows syntax:
```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/v1',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app.post('/student', ({ body }) => body)
                                       // ^?
    )
    .listen(3000)
```

<Playground :elysia="_demo1" />

## Scope

By default, hook and schema will apply to **current instance only**.

Elysia has an encapsulation scope for to prevent unintentional side effects.

Scope type is to specify the scope of hook whether is should be encapsulated or global.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive(() => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ⚠️ Hi is missing
    .get('/parent', ({ hi }) => hi)
```

From the above code, we can see that `hi` is missing from the parent instance because the scope is local by default if not specified, and will not apply to parent.

To apply the hook to the parent instance, we can use the `as` to specify scope of the hook.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive({ as: 'scoped' }, () => { // [!code ++]
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

### Scope level
Elysia has 3 levels of scope as the following:
Scope type are as the following:
- **local** (default) - apply to only current instance and descendant only
- **scoped** - apply to parent, current instance and descendants
- **global** - apply to all instance that apply the plugin (all parents, current, and descendants)

Let's review what each scope type does by using the following example:
```typescript
import { Elysia } from 'elysia'

// ? Value base on table value provided below
const type = 'local'

const child = new Elysia()
    .get('/child', 'hi')

const current = new Elysia()
    .onBeforeHandle({ as: type }, () => { // [!code ++]
        console.log('hi')
    })
    .use(child)
    .get('/current', 'hi')

const parent = new Elysia()
    .use(current)
    .get('/parent', 'hi')

const main = new Elysia()
    .use(parent)
    .get('/main', 'hi')
```

By changing the `type` value, the result should be as follows:

| type       | child | current | parent | main |
| ---------- | ----- | ------- | ------ | ---- |
| 'local'    | ✅    | ✅       | ❌     | ❌   |
| 'scoped'    | ✅    | ✅       | ✅     | ❌   |
| 'global'   | ✅    | ✅       | ✅     | ✅   |

### Scope cast
To apply hook to parent may use one of the following:
1. `inline as` apply only to a single hook
2. `guard as` apply to all hook in a guard
3. `instance as` apply to all hook in an instance

### 1. Inline as
Every event listener will accept `as` parameter to specify the scope of the hook.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive({ as: 'scoped' }, () => { // [!code ++]
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

However, this method is apply to only a single hook, and may not be suitable for multiple hooks.

### 2. Guard as
Every event listener will accept `as` parameter to specify the scope of the hook.

```typescript
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		as: 'scoped', // [!code ++]
		response: t.String(),
		beforeHandle() {
			console.log('ok')
		}
	})
    .get('/child', 'ok')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'hello')
```

Guard alllowing us to apply `schema` and `hook` to multiple routes all at once while specifying the scope.

However, it doesn't support `derive` and `resolve` method.

### 3. Instance as
`as` will read all hooks and schema scope of the current instance, modify.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .derive(() => {
        return { hi: 'ok' }
    })
    .get('/child', ({ hi }) => hi)
    .as('scoped') // [!code ++]

const main = new Elysia()
    .use(plugin)
    // ✅ Hi is now available
    .get('/parent', ({ hi }) => hi)
```

Sometimes we want to reapply plugin to parent instance as well but as it's limited by `scoped` mechanism, it's limited to 1 parent only.

To apply to the parent instance, we need to **lift the scope up** to the parent instance, and `as` is the perfect method to do so.

Which means if you have `local` scope, and want to apply it to the parent instance, you can use `as('scoped')` to lift it up.
```typescript twoslash
// @errors: 2304 2345
import { Elysia, t } from 'elysia'

const plugin = new Elysia()
	.guard({
		response: t.String()
	})
	.onBeforeHandle(() => { console.log('called') })
	.get('/ok', () => 'ok')
	.get('/not-ok', () => 1)
	.as('scoped') // [!code ++]

const instance = new Elysia()
	.use(plugin)
	.get('/no-ok-parent', () => 2)
	.as('scoped') // [!code ++]

const parent = new Elysia()
	.use(instance)
	// This now error because `scoped` is lifted up to parent
	.get('/ok', () => 3)
```

### Descendant

By default plugin will **apply hook to itself and descendants** only.

If the hook is registered in a plugin, instances that inherit the plugin will **NOT** inherit hooks and schema.

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        console.log('hi')
    })
    .get('/child', 'log hi')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'not log hi')
```

To apply hook to globally, we need to specify hook as global.
```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia()
    .onBeforeHandle(() => {
        return 'hi'
    })
    .get('/child', 'child')
    .as('scoped')

const main = new Elysia()
    .use(plugin)
    .get('/parent', 'parent')
```

<Playground :elysia="_demo2" :mock="_mock2" />

## Lazy Load
Modules are eagerly loaded by default.

Elysia loads all modules then registers and indexes all of them before starting the server. This enforces that all the modules have loaded before it starts accepting requests.

While this is fine for most applications, it may become a bottleneck for a server running in a serverless environment or an edge function, in which the startup time is important.

Lazy-loading can help decrease startup time by deferring modules to be gradually indexed after the server start.

Lazy-loading modules are a good option when some modules are heavy and importing startup time is crucial.

By default, any async plugin without await is treated as a deferred module and the import statement as a lazy-loading module.

Both will be registered after the server is started.

### Deferred Module
The deferred module is an async plugin that can be registered after the server is started.

```typescript
// plugin.ts
import { Elysia, file } from 'elysia'
import { loadAllFiles } from './files'

export const loadStatic = async (app: Elysia) => {
    const files = await loadAllFiles()

    files.forEach((asset) => app
        .get(asset, file(file))
    )

    return app
}
```

And in the main file:
```typescript
import { Elysia } from 'elysia'
import { loadStatic } from './plugin'

const app = new Elysia()
    .use(loadStatic)
```

Elysia static plugin is also a deferred module, as it loads files and registers files path asynchronously.

### Lazy Load Module
Same as the async plugin, the lazy-load module will be registered after the server is started.

A lazy-load module can be both sync or async function, as long as the module is used with `import` the module will be lazy-loaded.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .use(import('./plugin'))
```

Using module lazy-loading is recommended when the module is computationally heavy and/or blocking.

To ensure module registration before the server starts, we can use `await` on the deferred module.

### Testing
In a test environment, we can use `await app.modules` to wait for deferred and lazy-loading modules.

```typescript
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Modules', () => {
    it('inline async', async () => {
        const app = new Elysia()
              .use(async (app) =>
                  app.get('/async', () => 'async')
              )

        await app.modules

        const res = await app
            .handle(new Request('http://localhost/async'))
            .then((r) => r.text())

        expect(res).toBe('async')
    })
})
```
`````

## File: docs/essential/route.md
`````markdown
---
title: Route - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Route - ElysiaJS

    - - meta
      - name: 'description'
        content: To determine the correct response to a client, the web server uses path and HTTP method to look up for the correct resource. This process is known as "routing". We can define a route by calling a method named after an HTTP verb like `Elysia.get`, `Elysia.post` passing a path and a function to execute when matched.

    - - meta
      - property: 'og:description'
        content: To determine the correct response to a client, the web server uses path and HTTP method to look up for the correct resource. This process is known as "routing". We can define a route by calling a method named after an HTTP verb like `Elysia.get`, `Elysia.post` passing a path and a function to execute when matched.
---

<script setup>
import Playground from '../components/nearl/playground.vue'
import { Elysia } from 'elysia'

const demo1 = new Elysia()
    .get('/', () => 'hello')
    .get('/hi', () => 'hi')

const demo2 = new Elysia()
    .get('/', () => 'hello')
    .post('/hi', () => 'hi')

const demo3 = new Elysia()
	  .get('/id', () => `id: undefined`)
    .get('/id/:id', ({ params: { id } }) => `id: ${id}`)

const demo4 = new Elysia()
    .get('/', () => 'hi')
    .post('/', () => 'hi')

const demo5 = new Elysia()
    .get('/', () => 'hello')
    .get('/hi', ({ error }) => error(404, 'Route not found :('))

const demo6 = new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/123', '123')
    .get('/id/anything', 'anything')
    .get('/id', ({ error }) => error(404))
    .get('/id/anything/test', ({ error }) => error(404))

const demo7 = new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/123', '123')
    .get('/id/anything', 'anything')
    .get('/id', ({ error }) => error(404))
    .get('/id/:id/:name', ({ params: { id, name } }) => id + ' ' + name)

const demo8 = new Elysia()
    .get('/get', () => 'hello')
    .post('/post', () => 'hi')
    .route('M-SEARCH', '/m-search', () => 'connect')

const demo9 = new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/123', '123')
    .get('/id/anything', 'anything')
    .get('/id', ({ error }) => error(404))
    .get('/id/:id/:name', ({ params: { id, name } }) => id + '/' + name)

const demo10 = new Elysia()
    .get('/id/1', () => 'static path')
    .get('/id/:id', () => 'dynamic path')
    .get('/id/*', () => 'wildcard path')

const demo11 = new Elysia()
    .post('/user/sign-in', () => 'Sign in')
    .post('/user/sign-up', () => 'Sign up')
    .post('/user/profile', () => 'Profile')

const demo12 = new Elysia()
    .group('/user', (app) =>
        app
            .post('/sign-in', () => 'Sign in')
            .post('/sign-up', () => 'Sign up')
            .post('/profile', () => 'Profile')
    )

const users = new Elysia({ prefix: '/user' })
    .post('/sign-in', () => 'Sign in')
    .post('/sign-up', () => 'Sign up')
    .post('/profile', () => 'Profile')

const demo13 = new Elysia()
    .get('/', () => 'hello world')
    .use(users)
</script>

# Routing

Web servers use the request's **path and HTTP method** to look up the correct resource, refers as **"routing"**.

We can define a route by calling a **method named after HTTP verbs**, passing a path and a function to execute when matched.

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .get('/hi', 'hi')
    .listen(3000)
```

We can access the web server by going to **http://localhost:3000**

By default, web browsers will send a GET method when visiting a page.

<Playground :elysia="demo1" />

::: tip
Using an interactive browser above, hover on a blue highlight area to see difference result between each path
:::

## Path type

Path in Elysia can be grouped into 3 types:

-   **static paths** - static string to locate the resource
-   **dynamic paths** - segment can be any value
-   **wildcards** - path until a specific point can be anything

You can use all of the path types together to compose a behavior for your web server.

The priorities are as follows:

1. static paths
2. dynamic paths
3. wildcards

If the path is resolved as the static wild dynamic path is presented, Elysia will resolve the static path rather than the dynamic path

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/1', 'static path')
    .get('/id/:id', 'dynamic path')
    .get('/id/*', 'wildcard path')
    .listen(3000)
```

<Playground
  :elysia="demo10"
    :alias="{
    '/id/:id': '/id/2',
    '/id/*': '/id/2/a'
  }"
  :mock="{
    '/id/*': {
      GET: 'wildcard path'
    }
  }"
/>

Here the server will respond as follows:

| Path    | Response      |
| ------- | ------------- |
| /id/1   | static path   |
| /id/2   | dynamic path  |
| /id/2/a | wildcard path |

## Static Path

A path or pathname is an identifier to locate resources of a server.

```bash
http://localhost:/path/page
```

Elysia uses the path and method to look up the correct resource.

<div class="bg-white rounded-lg">
    <img src="/essential/url-object.svg" alt="URL Representation" />
</div>

A path starts after the origin. Prefix with **/** and ends before search query **(?)**

We can categorize the URL and path as follows:

| URL                             | Path         |
| ------------------------------- | ------------ |
| http://example.com/                | /            |
| http://example.com/hello           | /hello       |
| http://example.com/hello/world     | /hello/world |
| http://example.com/hello?name=salt | /hello       |
| http://example.com/hello#title     | /hello       |

::: tip
If the path is not specified, the browser and web server will treat the path as '/' as a default value.
:::

Elysia will look up each request for [route](/essential/route) and response using [handler](/essential/handler) function.

## Dynamic path

URLs can be both static and dynamic.

Static paths are hardcoded strings that can be used to locate resources of the server, while dynamic paths match some part and captures the value to extract extra information.

For instance, we can extract the user ID from the pathname. For example:

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
                      // ^?
    .listen(3000)
```

<br>

Here dynamic path is created with `/id/:id` which tells Elysia to match any path up until `/id`. What comes after that is then stored as **params** object.

<Playground
  :elysia="demo6"
  :alias="{
    '/id/:id': '/id/1'
  }"
  :mock="{
    '/id/:id': {
      GET: '1'
    }
  }"
/>

When requested, the server should return the response as follows:

| Path                   | Response  |
| ---------------------- | --------- |
| /id/1                  | 1         |
| /id/123                | 123       |
| /id/anything           | anything  |
| /id/anything?name=salt | anything  |
| /id                    | Not Found |
| /id/anything/rest      | Not Found |

Dynamic paths are great to include things like IDs, which then can be used later.

We refer to the named variable path as **path parameter** or **params** for short.

## Segment

URL segments are each path that is composed into a full path.

Segments are separated by `/`.
![Representation of URL segments](/essential/url-segment.webp)

Path parameters in Elysia are represented by prefixing a segment with ':' followed by a name.
![Representation of path parameter](/essential/path-parameter.webp)

Path parameters allow Elysia to capture a specific segment of a URL.

The named path parameter will then be stored in `Context.params`.

| Route     | Path   | Params  |
| --------- | ------ | ------- |
| /id/:id   | /id/1  | id=1    |
| /id/:id   | /id/hi | id=hi   |
| /id/:name | /id/hi | name=hi |

## Multiple path parameters

You can have as many path parameters as you like, which will then be stored into a `params` object.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .get('/id/:id/:name', ({ params: { id, name } }) => id + ' ' + name)
                             // ^?
    .listen(3000)
```

<br>
<br>

<Playground
  :elysia="demo7"
  :alias="{
    '/id/:id': '/id/1',
    '/id/:id/:name': '/id/anything/rest'
  }"
  :mock="{
    '/id/:id': {
      GET: '1'
    },
    '/id/:id/:name': {
      GET: 'anything rest'
    }
  }"
/>

The server will respond as follows:

| Path                   | Response      |
| ---------------------- | ------------- |
| /id/1                  | 1             |
| /id/123                | 123           |
| /id/anything           | anything      |
| /id/anything?name=salt | anything      |
| /id                    | Not Found     |
| /id/anything/rest      | anything rest |

## Optional path parameters
Sometime we might want a static and dynamic path to resolve the same handler.

We can make a path parameter optional by adding a question mark `?` after the parameter name.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id?', ({ params: { id } }) => `id ${id}`)
                          // ^?
    .listen(3000)
```

<br>

<Playground
  :elysia="demo3"
  :alias="{
    '/id/:id': '/id/1'
  }"
  :mock="{
    '/id/:id': {
      GET: 'id 1'
    },
  }"
/>

The server will respond as follows:

| Path                   | Response      |
| ---------------------- | ------------- |
| /id                    | id undefined  |
| /id/1                  | id 1          |

## Wildcards

Dynamic paths allow capturing certain segments of the URL.

However, when you need a value of the path to be more dynamic and want to capture the rest of the URL segment, a wildcard can be used.

Wildcards can capture the value after segment regardless of amount by using "\*".

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/*', ({ params }) => params['*'])
                    // ^?
    .listen(3000)
```

<br>

<Playground
  :elysia="demo9"
  :alias="{
    '/id/:id': '/id/1',
    '/id/:id/:name': '/id/anything/rest'
  }"
  :mock="{
    '/id/:id': {
      GET: '1'
    },
    '/id/:id/:name': {
      GET: 'anything/rest'
    }
  }"
/>

In this case the server will respond as follows:

| Path                   | Response      |
| ---------------------- | ------------- |
| /id/1                  | 1             |
| /id/123                | 123           |
| /id/anything           | anything      |
| /id/anything?name=salt | anything      |
| /id                    | Not Found     |
| /id/anything/rest      | anything/rest |

Wildcards are useful for capturing a path until a specific point.

::: tip
You can use a wildcard with a path parameter.
:::

## HTTP Verb

HTTP defines a set of request methods to indicate the desired action to be performed for a given resource

There are several HTTP verbs, but the most common ones are:

### GET

Requests using GET should only retrieve data.

### POST

Submits a payload to the specified resource, often causing state change or side effect.

### PUT

Replaces all current representations of the target resource using the request's payload.

### PATCH

Applies partial modifications to a resource.

### DELETE

Deletes the specified resource.

---

To handle each of the different verbs, Elysia has a built-in API for several HTTP verbs by default, similar to `Elysia.get`

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)
```

<Playground :elysia="demo2" />

Elysia HTTP methods accepts the following parameters:

-   **path**: Pathname
-   **function**: Function to respond to the client
-   **hook**: Additional metadata

You can read more about the HTTP methods on [HTTP Request Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

## Custom Method

We can accept custom HTTP Methods with `Elysia.route`.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/get', 'hello')
    .post('/post', 'hi')
    .route('M-SEARCH', '/m-search', 'connect') // [!code ++]
    .listen(3000)
```

<Playground :elysia="demo8" />

**Elysia.route** accepts the following:

-   **method**: HTTP Verb
-   **path**: Pathname
-   **function**: Function to response to the client
-   **hook**: Additional metadata

When navigating to each method, you should see the results as the following:
| Path      | Method   | Result  |
| --------- | -------- | ------- |
| /get      | GET      | hello   |
| /post     | POST     | hi      |
| /m-search | M-SEARCH | connect |

::: tip
Based on [RFC 7231](https://www.rfc-editor.org/rfc/rfc7231#section-4.1), HTTP Verb is case-sensitive.

It's recommended to use the UPPERCASE convention for defining a custom HTTP Verb with Elysia.
:::

## Elysia.all

Elysia provides an `Elysia.all` for handling any HTTP method for a specified path using the same API like **Elysia.get** and **Elysia.post**

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .all('/', 'hi')
    .listen(3000)
```

<Playground :elysia="demo4" />

Any HTTP method that matches the path, will be handled as follows:
| Path | Method | Result |
| ---- | -------- | ------ |
| / | GET | hi |
| / | POST | hi |
| / | DELETE | hi |

## Handle

Most developers use REST clients like Postman, Insomnia or Hoppscotch to test their API.

However, Elysia can be programmatically test using `Elysia.handle`.

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', 'hello')
    .post('/hi', 'hi')
    .listen(3000)

app.handle(new Request('http://localhost/')).then(console.log)
```

**Elysia.handle** is a function to process an actual request sent to the server.

::: tip
Unlike unit test's mock, **you can expect it to behave like an actual request** sent to the server.

But also useful for simulating or creating unit tests.
:::

## 404

If no path matches the defined routes, Elysia will pass the request to [error](/essential/life-cycle.html#on-error) life cycle before returning a **"NOT_FOUND"** with an HTTP status of 404.

We can handle a custom 404 error by returning a value from `error` life cycle like this:

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'hi')
    .onError(({ code }) => {
        if (code === 'NOT_FOUND') {
            return 'Route not found :('
        }
    })
    .listen(3000)
```

<Playground :elysia="demo5" />

When navigating to your web server, you should see the result as follows:

| Path | Method | Result              |
| ---- | ------ | ------------------- |
| /    | GET    | hi                  |
| /    | POST   | Route not found :\( |
| /hi  | GET    | Route not found :\( |

You can learn more about life cycle and error handling in [Life Cycle Events](/essential/life-cycle#events) and [Error Handling](/essential/life-cycle.html#on-error).

::: tip
HTTP Status is used to indicate the type of response. By default if everything is correct, the server will return a '200 OK' status code (If a route matches and there is no error, Elysia will return 200 as default)

If the server fails to find any route to handle, like in this case, then the server shall return a '404 NOT FOUND' status code.
:::

## Group

When creating a web server, you would often have multiple routes sharing the same prefix:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .post('/user/sign-in', 'Sign in')
    .post('/user/sign-up', 'Sign up')
    .post('/user/profile', 'Profile')
    .listen(3000)
```

<Playground :elysia="demo11" />

This can be improved with `Elysia.group`, allowing us to apply prefixes to multiple routes at the same time by grouping them together:

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .group('/user', (app) =>
        app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

<Playground :elysia="demo12" />

This code behaves the same as our first example and should be structured as follows:

| Path          | Result  |
| ------------- | ------- |
| /user/sign-in | Sign in |
| /user/sign-up | Sign up |
| /user/profile | Profile |

`.group()` can also accept an optional guard parameter to reduce boilerplate of using groups and guards together:

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .group(
        '/user',
        {
            body: t.Literal('Rikuhachima Aru')
        },
        (app) => app
            .post('/sign-in', 'Sign in')
            .post('/sign-up', 'Sign up')
            .post('/profile', 'Profile')
    )
    .listen(3000)
```

You may find more information about grouped guards in [scope](/essential/plugin.html#scope).

### Prefix

We can separate a group into a separate plugin instance to reduce nesting by providing a **prefix** to the constructor.

```typescript
import { Elysia } from 'elysia'

const users = new Elysia({ prefix: '/user' })
    .post('/sign-in', 'Sign in')
    .post('/sign-up', 'Sign up')
    .post('/profile', 'Profile')

new Elysia()
    .use(users)
    .get('/', 'hello world')
    .listen(3000)
```

<Playground :elysia="demo13" />
`````

## File: docs/essential/structure.md
`````markdown
---
title: Structure - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Structure - ElysiaJS

    - - meta
      - name: 'description'
        content: Elysia is pattern agnostic framework, we leave the decision up to you and your team for coding patterns to use. However, we found that there are several who are using MVC pattern (Model-View-Controller) on Elysia, and found it's hard to decouple and handling with types. This page is a guide to use Elysia with MVC pattern.

    - - meta
      - property: 'og:description'
        content: Elysia is pattern agnostic framework, we the decision up to you and your team for coding patterns to use. However, we found that there are several who are using MVC pattern (Model-View-Controller) on Elysia, and found it's hard to decouple and handling with types. This page is a guide to use Elysia with MVC pattern.
---

#### This page has been moved to [best practice](/essential/best-practice)

# Structure

Elysia is a pattern-agnostic framework, leaving the decision of which coding patterns to use up to you and your team.

However, there are several concern from trying to adapt an MVC pattern [(Model-View-Controller)](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) with Elysia, and found it's hard to decouple and handle types.

This page is a guide to on how to follows Elysia structure best practice combined with MVC pattern but can be adapted to any coding pattern you like.

## Method Chaining
Elysia code should always use **method chaining**.

As Elysia type system is complex, every methods in Elysia returns a new type reference.

**This is important** to ensure type integrity and inference.

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
    .state('build', 1)
    // Store is strictly typed // [!code ++]
    .get('/', ({ store: { build } }) => build)
    .listen(3000)
```

In the code above **state** returns a new **ElysiaInstance** type, adding a `build` type.

### ❌ Don't: Use without method chaining
Without using method chaining, Elysia doesn't save these new types, leading to no type inference.

```typescript twoslash
// @errors: 2339
import { Elysia } from 'elysia'

const app = new Elysia()

app.state('build', 1)

app.get('/', ({ store: { build } }) => build)

app.listen(3000)
```

We recommend to <u>**always use method chaining**</u> to provide an accurate type inference.

## Controller
> 1 Elysia instance = 1 controller

Elysia does a lot to ensure type integrity, if you pass an entire `Context` type to a controller, these might be the problems:

1. Elysia type is complex and heavily depends on plugin and multiple level of chaining.
2. Hard to type, Elysia type could change at anytime, especially with decorators, and store
3. Type casting may lead to a loss of type integrity or an inability to ensure consistency between types and runtime code.
4. This makes it more challenging for [Sucrose](/blog/elysia-10#sucrose) *(Elysia's "kind of" compiler)* to statically analyze your code

### ❌ Don't: Create a separate controller
Don't create a separate controller, use Elysia itself as a controller instead:
```typescript
import { Elysia, t, type Context } from 'elysia'

abstract class Controller {
    static root(context: Context) {
        return Service.doStuff(context.stuff)
    }
}

// ❌ Don't
new Elysia()
    .get('/', Controller.hi)
```

By passing an entire `Controller.method` to Elysia is an equivalent of having 2 controllers passing data back and forth. It's against the design of framework and MVC pattern itself.

### ✅ Do: Use Elysia as a controller
Instead treat an Elysia instance as a controller itself instead.
```typescript
import { Elysia } from 'elysia'
import { Service } from './service'

new Elysia()
    .get('/', ({ stuff }) => {
        Service.doStuff(stuff)
    })
```

## Service
Service is a set of utility/helper functions decoupled as a business logic to use in a module/controller, in our case, an Elysia instance.

Any technical logic that can be decoupled from controller may live inside a **Service**.

There're 2 types of service in Elysia:
1. Non-request dependent service
2. Request dependent service

### ✅ Do: Non-request dependent service
This kind of service doesn't need to access any property from the request or `Context`, and can be initiated as a static class same as usual MVC service pattern.

```typescript
import { Elysia, t } from 'elysia'

abstract class Service {
    static fibo(number: number): number {
        if(number < 2)
            return number

        return Service.fibo(number - 1) + Service.fibo(number - 2)
    }
}

new Elysia()
    .get('/fibo', ({ body }) => {
        return Service.fibo(body)
    }, {
        body: t.Numeric()
    })
```

If your service doesn't need to store a property, you may use `abstract class` and `static` instead to avoid allocating class instance.

### Request Dependent Service
This kind of service may require some property from the request, and should be **initiated as an Elysia instance**.

### ❌ Don't: Pass entire `Context` to a service
**Context is a highly dynamic type** that can be inferred from Elysia instance.

Do not pass an entire `Context` to a service, instead use object destructuring to extract what you need and pass it to the service.
```typescript
import type { Context } from 'elysia'

class AuthService {
	constructor() {}

	// ❌ Don't do this
	isSignIn({ status, cookie: { session } }: Context) {
		if (session.value)
			return status(401)
	}
}
```

As Elysia type is complex, and heavily depends on plugin and multiple level of chaining, it can be challenging to manually type as it's highly dynamic.

### ✅ Do: Use Elysia instance as a service

We recommended to use Elysia instance as a service to ensure type integrity and inference:
```typescript
import { Elysia } from 'elysia'

// ✅ Do
const AuthService = new Elysia({ name: 'Service.Auth' })
    .derive({ as: 'scoped' }, ({ cookie: { session } }) => ({
    	// This is equivalent to dependency injection
        Auth: {
            user: session.value
        }
    }))
    .macro(({ onBeforeHandle }) => ({
     	// This is declaring a service method
        isSignIn(value: boolean) {
            onBeforeHandle(({ Auth, status }) => {
                if (!Auth?.user || !Auth.user) return status(401)
            })
        }
    }))

const UserController = new Elysia()
    .use(AuthService)
    .get('/profile', ({ Auth: { user } }) => user, {
    	isSignIn: true
    })
```

::: tip
Elysia handle [plugin deduplication](/essential/plugin.html#plugin-deduplication) by default so you don't have to worry about performance, as it's going to be Singleton if you specified a **"name"** property.
:::

### ⚠️ Infers Context from Elysia instance

In case of **absolute necessity**, you may infer the `Context` type from the Elysia instance itself:
```typescript
import { Elysia, type InferContext } from 'elysia'

const setup = new Elysia()
	.state('a', 'a')
	.decorate('b', 'b')

class AuthService {
	constructor() {}

	// ✅ Do
	isSignIn({ status, cookie: { session } }: InferContext<typeof setup>) {
		if (session.value)
			return status(401)
	}
}
```

However we recommend to avoid this if possible, and use [Elysia as a service](✅-do-use-elysia-instance-as-a-service) instead.

You may find more about [InferContext](/essential/handler#infercontext) in [Essential: Handler](/essential/handler).

## Model
Model or [DTO (Data Transfer Object)](https://en.wikipedia.org/wiki/Data_transfer_object) is handle by [Elysia.t (Validation)](/validation/overview.html#data-validation).

Elysia has a validation system built-in which can infers type from your code and validate it at runtime.

### ❌ Don't: Declare a class instance as a model

Do not declare a class instance as a model:
```typescript
// ❌ Don't
class CustomBody {
	username: string
	password: string

	constructor(username: string, password: string) {
		this.username = username
		this.password = password
	}
}

// ❌ Don't
interface ICustomBody {
	username: string
	password: string
}
```

### ✅ Do: Use Elysia's validation system

Instead of declaring a class or interface, use Elysia's validation system to define a model:
```typescript twoslash
// ✅ Do
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

// Optional if you want to get the type of the model
// Usually if we didn't use the type, as it's already inferred by Elysia
type CustomBody = typeof customBody.static
    // ^?



export { customBody }
```

We can get type of model by using `typeof` with `.static` property from the model.

Then you can use the `CustomBody` type to infer the type of the request body.

```typescript twoslash
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})
// ---cut---
// ✅ Do
new Elysia()
	.post('/login', ({ body }) => {
	                 // ^?
		return body
	}, {
		body: customBody
	})
```

### ❌ Don't: Declare type separate from the model
Do not declare a type separate from the model, instead use `typeof` with `.static` property to get the type of the model.

```typescript
// ❌ Don't
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type CustomBody = {
	username: string
	password: string
}

// ✅ Do
const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

type customBody = typeof customBody.static
```

### Group
You can group multiple models into a single object to make it more organized.

```typescript
import { Elysia, t } from 'elysia'

export const AuthModel = {
	sign: t.Object({
		username: t.String(),
		password: t.String()
	})
}
```

### Model Injection
Though this is optional, if you are strictly following MVC pattern, you may want to inject like a service into a controller. We recommended using [Elysia reference model](/essential/validation.html#reference-model)

Using Elysia's model reference
```typescript twoslash
import { Elysia, t } from 'elysia'

const customBody = t.Object({
	username: t.String(),
	password: t.String()
})

const AuthModel = new Elysia()
    .model({
        'auth.sign': customBody
    })

const UserController = new Elysia({ prefix: '/auth' })
    .use(AuthModel)
    .post('/sign-in', async ({ body, cookie: { session } }) => {
                             // ^?

        return true
    }, {
        body: 'auth.sign'
    })
```

This approach provide several benefits:
1. Allow us to name a model and provide auto-completion.
2. Modify schema for later usage, or perform [remapping](/patterns/remapping.html#remapping).
3. Show up as "models" in OpenAPI compliance client, eg. Swagger.
4. Improve TypeScript inference speed as model type will be cached during registration.

---

As mentioned, Elysia is a pattern-agnostic framework, and we only provide a recommendation guide for handling Elysia with the MVC pattern.

It’s entirely up to you and your team whether to follow this recommendation based on your preferences and agreement.
`````

## File: docs/essential/validation.md
`````markdown
---
title: Validation - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Validation - ElysiaJS

    - - meta
      - name: 'description'
        content: Schemas are strictly typed definitions, used to infer TypeScript's type and data validation of an incoming request and outgoing response. Elysia's schema validation is based on Sinclair's TypeBox, a TypeScript library for data validation.

    - - meta
      - property: 'og:description'
        content: Schemas are strictly typed definitions, used to infer TypeScript's type and data validation of an incoming request and outgoing response. Elysia's schema validation is based on Sinclair's TypeBox, a TypeScript library for data validation.
---

<script setup>
import { Elysia, t, ValidationError } from 'elysia'

import Playground from '../components/nearl/playground.vue'
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'

const demo1 = new Elysia()
    .get('/none', () => 'hi')
    .guard({
        query: t.Object({
            name: t.String()
        })
    })
    .get('/query', ({ query: { name } }) => name)

const demo2 = new Elysia()
    .get('/id/1', '1')
    .get('/id/a', () => {
        throw new ValidationError(
            'params',
            t.Object({
                id: t.Numeric()
            }),
            {
                id: 'a'
            }
        )
    })

const demo3 = new Elysia()
 	.guard({
        query: t.Object({
            name: t.Number()
        })
    })
    .get('/query?id=1', ({ query: { id } }) => id)
    .get('/query?id=salt', ({ query: { id } }) => id)

const demo4 = new Elysia()
 	.guard({
        query: t.Object({
            name: t.Array(t.String()),
            squad: t.String()
        })
    })
    .get('/query?name=rapi,anis,neon&squad=counter', ({ query: { id } }) => id)
    .get('/query?name=rapi&name=anis&name=neon&squad=counter', ({ query: { id } }) => id)
</script>

# Validation

The purpose of creating an API server is to take an input and process it.

JavaScript allows any data to be any type. Elysia provides a tool to validate data out of the box to ensure that the data is in the correct format.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id, {
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

### TypeBox

**Elysia.t** is a schema builder based on [TypeBox](https://github.com/sinclairzx81/typebox) that provides type-safety at runtime, compile-time, and for OpenAPI schemas, enabling the generation of OpenAPI/Swagger documentation.

TypeBox is a very fast, lightweight, and type-safe runtime validation library for TypeScript. Elysia extends and customizes the default behavior of TypeBox to match server-side validation requirements.

We believe that validation should be handled by the framework natively, rather than relying on the user to set up a custom type for every project.

### TypeScript
We can get a type definitions of every Elysia/TypeBox's type by accessing `static` property as follows:

```ts twoslash
import { t } from 'elysia'

const MyType = t.Object({
	hello: t.Literal('Elysia')
})

type MyType = typeof MyType.static
//    ^?
````

<br>
<br>
<br>

This allows Elysia to infer and provide type automatically, reducing the need to declare duplicate schema

A single Elysia/TypeBox schema can be used for:
- Runtime validation
- Data coercion
- TypeScript type
- OpenAPI schema

This allows us to make a schema as a **single source of truth**.

## Schema type
Elysia supports declarative schemas with the following types:

<Deck>
    <Card title="Body" href="#body">
        Validate an incoming HTTP Message
    </Card>
    <Card title="Query" href="#query">
        Query string or URL parameter
    </Card>
    <Card title="Params" href="#params">
        Path parameters
    </Card>
    <Card title="Headers" href="#headers">
        Headers of the request
    </Card>
    <Card title="Cookie" href="#cookie">
        Cookie of the request
    </Card>
    <Card title="Response" href="#response">
        Response of the request
    </Card>
</Deck>

---

These properties should be provided as the third argument of the route handler to validate the incoming request.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/id/:id', () => 'Hello World!', {
        query: t.Object({
            name: t.String()
        }),
        params: t.Object({
            id: t.Number()
        })
    })
    .listen(3000)
```

<Playground :elysia="demo1" />

The response should be as follows:
| URL | Query | Params |
| --- | --------- | ------------ |
| /id/a | ❌ | ❌ |
| /id/1?name=Elysia | ✅ | ✅ |
| /id/1?alias=Elysia | ❌ | ✅ |
| /id/a?name=Elysia | ✅ | ❌ |
| /id/a?alias=Elysia | ❌ | ❌ |

When a schema is provided, the type will be inferred from the schema automatically and an OpenAPI type will be generated for Swagger documentation, eliminating the redundant task of providing the type manually.

## Guard

Guard can be used to apply a schema to multiple handlers.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/none', ({ query }) => 'hi')
                   // ^?

    .guard({ // [!code ++]
        query: t.Object({ // [!code ++]
            name: t.String() // [!code ++]
        }) // [!code ++]
    }) // [!code ++]
    .get('/query', ({ query }) => query)
                    // ^?
    .listen(3000)
```

<br>

This code ensures that the query must have **name** with a string value for every handler after it. The response should be listed as follows:

<Playground
    :elysia="demo1"
    :mock="{
        '/query': {
            GET: 'Elysia'
        }
    }"
/>

The response should be listed as follows:

| Path          | Response |
| ------------- | -------- |
| /none         | hi       |
| /none?name=a  | hi       |
| /query        | error    |
| /query?name=a | a        |

If multiple global schemas are defined for the same property, the latest one will take precedence. If both local and global schemas are defined, the local one will take precedence.

### Guard Schema Type
Guard supports 2 types to define a validation.

### **override (default)**

Override schema if schema if schema is collide with each others.

![Elysia run with default override guard showing schema gets override](/blog/elysia-13/schema-override.webp)

### **standalone**


Separate collided schema, and runs both independently resulting in both being validated.

![Elysia run with standalone merging multiple guard together](/blog/elysia-13/schema-standalone.webp)

To define schema type of guard with `schema`:
```ts
import { Elysia } from 'elysia'

new Elysia()
	.guard({
		schema: 'standalone', // [!code ++]
		response: t.Object({
			title: t.String()
		})
	})
```

## Body
An incoming [HTTP Message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages) is the data sent to the server. It can be in the form of JSON, form-data, or any other format.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
                    // ^?




		body: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

The validation should be as follows:
| Body | Validation |
| --- | --------- |
| \{ name: 'Elysia' \} | ✅ |
| \{ name: 1 \} | ❌ |
| \{ alias: 'Elysia' \} | ❌ |
| `undefined` | ❌ |

Elysia disables body-parser for **GET** and **HEAD** messages by default, following the specs of HTTP/1.1 [RFC2616](https://www.rfc-editor.org/rfc/rfc2616#section-4.3)

> If the request method does not include defined semantics for an entity-body, then the message-body SHOULD be ignored when handling the request.

Most browsers disable the attachment of the body by default for **GET** and **HEAD** methods.

#### Specs
Validate an incoming [HTTP Message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages) (or body).

These messages are additional messages for the web server to process.

The body is provided in the same way as the `body` in `fetch` API. The content type should be set accordingly to the defined body.

```typescript
fetch('https://elysiajs.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Elysia'
    })
})
```

### File
File is a special type of body that can be used to upload files.
```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/body', ({ body }) => body, {
                    // ^?





		body: t.Object({
			file: t.File({ format: 'image/*' }),
			multipleFiles: t.Files()
		})
	})
	.listen(3000)
```

By providing a file type, Elysia will automatically assume that the content-type is `multipart/form-data`.

## Query
Query is the data sent through the URL. It can be in the form of `?key=value`.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/query', ({ query }) => query, {
                    // ^?




		query: t.Object({
			name: t.String()
		})
	})
	.listen(3000)
```

Query must be provided in the form of an object.

The validation should be as follows:
| Query | Validation |
| ---- | --------- |
| /?name=Elysia | ✅ |
| /?name=1 | ✅ |
| /?alias=Elysia | ❌ |
| /?name=ElysiaJS&alias=Elysia | ✅ |
| / | ❌ |

#### Specs

A query string is a part of the URL that starts with **?** and can contain one or more query parameters, which are key-value pairs used to convey additional information to the server, usually for customized behavior like filtering or searching.

![URL Object](/essential/url-object.svg)

Query is provided after the **?** in Fetch API.

```typescript
fetch('https://elysiajs.com/?name=Elysia')
```

When specifying query parameters, it's crucial to understand that all query parameter values must be represented as strings. This is due to how they are encoded and appended to the URL.

### Coercion
Elysia will coerce applicable schema on `query` to respective type automatically.

See [Elysia behavior](/patterns/type#elysia-behavior) for more information.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({ // [!code ++]
			name: t.Number() // [!code ++]
		}) // [!code ++]
	})
	.listen(3000)
```

<Playground
    :elysia="demo3"
    :mock="{
        '/query?id=1': {
            GET: '1'
        },
        '/query?id=salt': {
        	GET: 'string cannot be assigned to number'
        }
    }"
/>

### Array
By default, Elysia treat query parameters as a single string even if specified multiple time.

To use array, we need to explicitly declare it as an array.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ query }) => query, {
               // ^?




		query: t.Object({
			name: t.Array(t.String()) // [!code ++]
		})
	})
	.listen(3000)
```

<Playground
    :elysia="demo4"
    :mock="{
        '/query?name=rapi,anis,neon&squad=counter': {
            GET: JSON.stringify({
                name: ['rapi', 'anis', 'neon'],
                squad: 'counter'
            }, null, 4)
        },
        '/query?name=rapi&name=anis&name=neon&squad=counter': {
        	GET: JSON.stringify({
                name: ['rapi', 'anis', 'neon'],
                squad: 'counter'
            }, null, 4)
        }
    }"
/>

Once Elysia detect that a property is assignable to array, Elysia will coerce it to an array of the specified type.

By default, Elysia format query array with the following format:

#### nuqs
This format is used by [nuqs](https://nuqs.47ng.com).

By using **,** as a delimiter, a property will be treated as array.

```
http://localhost?name=rapi,anis,neon&squad=counter
{
	name: ['rapi', 'anis', 'neon'],
	squad: 'counter'
}
```

#### HTML form format
If a key is assigned multiple time, the key will be treated as an array.

This is similar to HTML form format when an input with the same name is specified multiple times.

```
http://localhost?name=rapi&name=anis&name=neon&squad=counter
// name: ['rapi', 'anis', 'neon']
```

## Params
Params or path parameters are the data sent through the URL path.

They can be in the form of `/key`.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params, {
                      // ^?




		params: t.Object({
			id: t.Number()
		})
	})
```

<Playground :elysia="demo2" />

Params must be provided in the form of an object.

The validation should be as follows:
| URL | Validation |
| --- | --------- |
| /id/1 | ✅ |
| /id/a | ❌ |

#### Specs
Path parameter <small>(not to be confused with query string or query parameter)</small>.

**This field is usually not needed as Elysia can infer types from path parameters automatically**, unless there is a need for a specific value pattern, such as a numeric value or template literal pattern.

```typescript
fetch('https://elysiajs.com/id/1')
```

### Params type inference
If a params schema is not provided, Elysia will automatically infer the type as a string.
```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/id/:id', ({ params }) => params)
                      // ^?
```

## Headers
Headers are the data sent through the request's header.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/headers', ({ headers }) => headers, {
                      // ^?




		headers: t.Object({
			authorization: t.String()
		})
	})
```

Unlike other types, headers have `additionalProperties` set to `true` by default.

This means that headers can have any key-value pair, but the value must match the schema.

#### Specs
HTTP headers let the client and the server pass additional information with an HTTP request or response, usually treated as metadata.

This field is usually used to enforce some specific header fields, for example, `Authorization`.

Headers are provided in the same way as the `body` in `fetch` API.

```typescript
fetch('https://elysiajs.com/', {
    headers: {
        authorization: 'Bearer 12345'
    }
})
```

::: tip
Elysia will parse headers as lower-case keys only.

Please make sure that you are using lower-case field names when using header validation.
:::

## Cookie
Cookie is the data sent through the request's cookie.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie, {
                     // ^?



		cookie: t.Cookie({
			cookieName: t.String()
		})
	})
```

Cookies must be provided in the form of `t.Cookie` or `t.Object`.

Same as `headers`, cookies have `additionalProperties` set to `true` by default.

#### Specs

An HTTP cookie is a small piece of data that a server sends to the client. It's data that is sent with every visit to the same web server to let the server remember client information.

In simpler terms, it's a stringified state that is sent with every request.

This field is usually used to enforce some specific cookie fields.

A cookie is a special header field that the Fetch API doesn't accept a custom value for but is managed by the browser. To send a cookie, you must use a `credentials` field instead:

```typescript
fetch('https://elysiajs.com/', {
    credentials: 'include'
})
```

### t.Cookie
`t.Cookie` is a special type that is equivalent to `t.Object` but allows to set cookie-specific options.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/cookie', ({ cookie }) => cookie.name.value, {
                      // ^?




		cookie: t.Cookie({
			name: t.String()
		}, {
			secure: true,
			httpOnly: true
		})
	})
```

## Response
Response is the data returned from the handler.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', () => {
		return {
			name: 'Jane Doe'
		}
	}, {
		response: t.Object({
			name: t.String()
		})
	})
```

### Response per status
Responses can be set per status code.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/response', ({ status }) => {
		if (Math.random() > 0.5)
			return status(400, {
				error: 'Something went wrong'
			})

		return {
			name: 'Jane Doe'
		}
	}, {
		response: {
			200: t.Object({
				name: t.String()
			}),
			400: t.Object({
				error: t.String()
			})
		}
	})
```

This is an Elysia-specific feature, allowing us to make a field optional.

## Error Provider

There are two ways to provide a custom error message when the validation fails:

1. Inline `error` property
2. Using [onError](/essential/life-cycle.html#on-error) event

### Error Property

Elysia offers an additional **error** property, allowing us to return a custom error message if the field is invalid.

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
               	error: 'x must be a number'
            })
        })
    })
    .listen(3000)
```

The following is an example of using the error property on various types:

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>Error</td>
</tr>

<tr>
<td>

```typescript
t.String({
    format: 'email',
    error: 'Invalid email :('
})
```

</td>
<td>

```
Invalid Email :(
```

</td>
</tr>

<tr>
<td>

```typescript
t.Array(
    t.String(),
    {
        error: 'All members must be a string'
    }
)
```

</td>
<td>

```
All members must be a string
```

</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number()
}, {
    error: 'Invalid object UwU'
})
```

</td>
<td>

```
Invalid object UwU
```

</td>
</tr>
<tr>
<td>

```typescript
t.Object({
    x: t.Number({
        error({ errors, type, validation, value }) {
            return 'Expected x to be a number'
        }
    })
})
```

</td>
<td>

```
Expected x to be a number
```

</td>
</tr>
</tbody>
</table>

## Custom Error

TypeBox offers an additional "**error**" property, allowing us to return a custom error message if the field is invalid.

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>Error</td>
</tr>

<tr>
<td>

```typescript
t.String({
    format: 'email',
    error: 'Invalid email :('
})
```

</td>
<td>

```
Invalid Email :(
```

</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number()
}, {
    error: 'Invalid object UwU'
})
```

</td>
<td>

```
Invalid object UwU
```

</td>
</tr>
</tbody>
</table>

### Error message as function
In addition to a string, Elysia type's error can also accept a function to programmatically return a custom error for each property.

The error function accepts the same arguments as `ValidationError`

```typescript
import { Elysia, t } from 'elysia'

new Elysia()
    .post('/', () => 'Hello World!', {
        body: t.Object({
            x: t.Number({
                error() {
                    return 'Expected x to be a number'
                }
            })
        })
    })
    .listen(3000)
```

::: tip
Hover over the `error` to see the type.
:::

### Error is Called Per Field
Please note that the error function will only be called if the field is invalid.

Please consider the following table:

<table class="md-table">
<tbody>
<tr>
<td>Code</td>
<td>Body</td>
<td>Error</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number({
        error() {
            return 'Expected x to be a number'
        }
    })
})
```

</td>
<td>

```json
{
    x: "hello"
}
```

</td>
<td>
Expected x to be a number
</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number({
        error() {
            return 'Expected x to be a number'
        }
    })
})
```

</td>
<td>

```json
"hello"
```

</td>
<td>
(default error, `t.Number.error` is not called)
</td>
</tr>

<tr>
<td>

```typescript
t.Object(
    {
        x: t.Number({
            error() {
                return 'Expected x to be a number'
            }
        })
    }, {
        error() {
            return 'Expected value to be an object'
        }
    }
)
```

</td>
<td>

```json
"hello"
```

</td>
<td>
Expected value to be an object
</td>
</tr>
</tbody>
</table>

### onError

We can customize the behavior of validation based on the [onError](/essential/life-cycle.html#on-error) event by narrowing down the error code to "**VALIDATION**".

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.onError(({ code, error }) => {
		if (code === 'VALIDATION')
		    return error.message
	})
	.listen(3000)
```

The narrowed-down error type will be typed as `ValidationError` imported from **elysia/error**.

**ValidationError** exposes a property named **validator**, typed as [TypeCheck](https://github.com/sinclairzx81/typebox#typecheck), allowing us to interact with TypeBox functionality out of the box.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .onError(({ code, error }) => {
        if (code === 'VALIDATION')
            return error.validator.Errors(error.value).First().message
    })
    .listen(3000)
```

### Error List

**ValidationError** provides a method `ValidatorError.all`, allowing us to list all of the error causes.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String(),
			age: t.Number()
		}),
		error({ code, error }) {
			switch (code) {
				case 'VALIDATION':
                    console.log(error.all)

                    // Find a specific error name (path is OpenAPI Schema compliance)
                    const name = error.all.find(
						(x) => x.summary && x.path === '/name'
					)

                    // If there is a validation error, then log it
                    if(name)
    					console.log(name)
			}
		}
	})
	.listen(3000)
```

For more information about TypeBox's validator, see [TypeCheck](https://github.com/sinclairzx81/typebox#typecheck).

## Reference Model
Sometimes you might find yourself declaring duplicate models or re-using the same model multiple times.

With a reference model, we can name our model and reuse it by referencing the name.

Let's start with a simple scenario.

Suppose we have a controller that handles sign-in with the same model.

```typescript twoslash
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        }),
        response: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

We can refactor the code by extracting the model as a variable and referencing it.
```typescript twoslash
import { Elysia, t } from 'elysia'

// Maybe in a different file eg. models.ts
const SignDTO = t.Object({
    username: t.String(),
    password: t.String()
})

const app = new Elysia()
    .post('/sign-in', ({ body }) => body, {
        body: SignDTO,
        response: SignDTO
    })
```

This method of separating concerns is an effective approach, but we might find ourselves reusing multiple models with different controllers as the app gets more complex.

We can resolve that by creating a "reference model", allowing us to name the model and use auto-completion to reference it directly in `schema` by registering the models with `model`.

```typescript twoslash
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

When we want to access the model's group, we can separate a `model` into a plugin, which when registered will provide a set of models instead of multiple imports.

```typescript
// auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

Then in an instance file:
```typescript twoslash
// @filename: auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })

// @filename: index.ts
// ---cut---
// index.ts
import { Elysia } from 'elysia'
import { authModel } from './auth.model'

const app = new Elysia()
    .use(authModel)
    .post('/sign-in', ({ body }) => body, {
        // with auto-completion for existing model name
        body: 'sign',
        response: 'sign'
    })
```

This approach not only allows us to separate concerns but also enables us to reuse the model in multiple places while integrating the model into Swagger documentation.

### Multiple Models
`model` accepts an object with the key as a model name and the value as the model definition. Multiple models are supported by default.

```typescript
// auth.model.ts
import { Elysia, t } from 'elysia'

export const authModel = new Elysia()
    .model({
        number: t.Number(),
        sign: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

### Naming Convention
Duplicate model names will cause Elysia to throw an error. To prevent declaring duplicate model names, we can use the following naming convention.

Let's say that we have all models stored at `models/<name>.ts` and declare the prefix of the model as a namespace.

```typescript
import { Elysia, t } from 'elysia'

// admin.model.ts
export const adminModels = new Elysia()
    .model({
        'admin.auth': t.Object({
            username: t.String(),
            password: t.String()
        })
    })

// user.model.ts
export const userModels = new Elysia()
    .model({
        'user.auth': t.Object({
            username: t.String(),
            password: t.String()
        })
    })
```

This can prevent naming duplication to some extent, but ultimately, it's best to let your team decide on the naming convention.

Elysia provides an opinionated option to help prevent decision fatigue.
`````

## File: docs/patterns/configuration.md
`````markdown
---
title: Config - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Config - ElysiaJS

  - - meta
    - name: 'description'
      content: Elysia can be configured by passing an object to the constructor. We can configure Elysia behavior by passing an object to the constructor.

  - - meta
    - property: 'og:description'
      content: Elysia can be configured by passing an object to the constructor. We can configure Elysia behavior by passing an object to the constructor.
---

# Config

Elysia comes with a configurable behavior, allowing us to customize various aspects of its functionality.

We can define a configuration by using a constructor.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1',
	normalize: true
})
```

## adapter

###### Since 1.1.11

Runtime adapter for using Elysia in different environments.

Default to appropriate adapter based on the environment.

```ts
import { Elysia, t } from 'elysia'
import { BunAdapter } from 'elysia/adapter/bun'

new Elysia({
	adapter: BunAdapter
})
```

## aot

###### Since 0.4.0

Ahead of Time compilation.

Elysia has a built-in JIT _"compiler"_ that can [optimize performance](/blog/elysia-04.html#ahead-of-time-complie).

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	aot: true
})
```
Disable Ahead of Time compilation

#### Options - @default `false`

- `true` - Precompile every route before starting the server

- `false` - Disable JIT entirely. Faster startup time without cost of performance

## detail

Define an OpenAPI schema for all routes of an instance.

This schema will be used to generate OpenAPI documentation for all routes of an instance.

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	detail: {
		hide: true,
		tags: ['elysia']
	}
})
```

## encodeSchema

Handle custom `t.Transform` schema with custom `Encode` before returning the response to client.

This allows us to create custom encode function for your data before sending response to the client.

```ts
import { Elysia, t } from 'elysia'

new Elysia({ encodeSchema: true })
```

#### Options - @default `true`

- `true` - Run `Encode` before sending the response to client
- `false` - Skip `Encode` entirely

## name

Define a name of an instance which is used for debugging and [Plugin Deduplication](/essential/plugin.html#plugin-deduplication)

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	name: 'service.thing'
})
```

## nativeStaticResponse
###### Since 1.1.11

Use an optimized function for handling inline value for each respective runtime.

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	nativeStaticResponse: true
})
```

#### Example

If enabled on Bun, Elysia will insert inline value into `Bun.serve.static` improving performance for static value.

```ts
import { Elysia } from 'elysia'

// This
new Elysia({
	nativeStaticResponse: true
}).get('/version', 1)

// is an equivalent to
Bun.serve({
	static: {
		'/version': new Response(1)
	}
})
```

## normalize

###### Since 1.1.0

Whether Elysia should coerce field into a specified schema.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({
	normalize: true
})
```

When unknown properties that is not specified in schema is found on either input and output, how should Elysia handle the field?

Options - @default `true`

- `true`: Elysia will coerce fields into a specified schema using [exact mirror](/blog/elysia-13.html#exact-mirror)

- `typebox`: Elysia will coerce fields into a specified schema using [TypeBox's Value.Clean](https://github.com/sinclairzx81/typebox)

- `false`: Elysia will raise an error if a request or response contains fields that are not explicitly allowed in the schema of the respective handler.

## precompile

###### Since 1.0.0

Whether should Elysia should [precompile all routes](/blog/elysia-10.html#improved-startup-time) a head of time before starting the server.

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	precompile: true
})
```

Options - @default `false`

- `true`: Run JIT on all routes before starting the server

- `false`: Dynamically compile routes on demand

It's recommended to leave it as `false`.

## prefix

Define a prefix for all routes of an instance

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({
	prefix: '/v1'
})
```

When prefix is defined, all routes will be prefixed with the given value.

#### Example

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({ prefix: '/v1' }).get('/name', 'elysia') // Path is /v1/name
```

## santize

A function or an array of function that calls and intercepts on every `t.String` while validation.

Allowing us to read and transform a string into a new value.

```ts
import { Elysia, t } from 'elysia'

new Elysia({
	santize: (value) => Bun.escapeHTML(value)
})
```

## seed

Define a value which will be used to generate checksum of an instance, used for [Plugin Deduplication](/essential/plugin.html#plugin-deduplication)

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	seed: {
		value: 'service.thing'
	}
})
```

The value could be any type not limited to string, number, or object.

## strictPath

Whether should Elysia handle path strictly.

According to [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3.3), a path should be strictly equal to the path defined in the route.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({ strictPath: true })
```

#### Options - @default `false`

- `true` - Follows [RFC 3986](https://tools.ietf.org/html/rfc3986#section-3.3) for path matching strictly
- `false` - Tolerate suffix '/' or vice-versa.

#### Example

```ts twoslash
import { Elysia, t } from 'elysia'

// Path can be either /name or /name/
new Elysia({ strictPath: false }).get('/name', 'elysia')

// Path can be only /name
new Elysia({ strictPath: true }).get('/name', 'elysia')
```

## serve

Customize HTTP server behavior.

Bun serve configuration.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		hostname: 'elysiajs.com',
		tls: {
			cert: Bun.file('cert.pem'),
			key: Bun.file('key.pem')
		}
	},
})
```

This configuration extends [Bun Serve API](https://bun.sh/docs/api/http) and [Bun TLS](https://bun.sh/docs/api/http#tls)

### Example: Max body size
We can set the maximum body size by setting [`serve.maxRequestBodySize`](#serve-maxrequestbodysize) in the `serve` configuration.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		maxRequestBodySize: 1024 * 1024 * 256 // 256MB
	}
})
```

By default the maximum request body size is 128MB (1024 * 1024 * 128).
Define body size limit.

```ts
import { Elysia } from 'elysia'

new Elysia({
	serve: {
		// Maximum message size (in bytes)
	    maxPayloadLength: 64 * 1024,
	}
})
```

### Example: HTTPS / TLS
We can enable TLS (known as successor of SSL) by passing in a value for key and cert; both are required to enable TLS.

```ts
import { Elysia, file } from 'elysia'

new Elysia({
	serve: {
		tls: {
			cert: file('cert.pem'),
			key: file('key.pem')
		}
	}
})
```

Elysia extends Bun configuration which supports TLS out of the box, powered by BoringSSL.

See [serve.tls](#serve-tls) for available configuration.

### serve.hostname
@default `0.0.0.0`

Set the hostname which the server listens on

### serve.id
Uniquely identify a server instance with an ID

This string will be used to hot reload the server without interrupting pending requests or websockets. If not provided, a value will be generated. To disable hot reloading, set this value to `null`.

### serve.maxRequestBodySize
@default `1024 * 1024 * 128` (128MB)

Set the maximum size of a request body (in bytes)

### serve.port
@default `3000`

Port to listen on

### serve.rejectUnauthorized
@default `NODE_TLS_REJECT_UNAUTHORIZED` environment variable

If set to `false`, any certificate is accepted.

### serve.reusePort
@default `true`

If the `SO_REUSEPORT` flag should be set

This allows multiple processes to bind to the same port, which is useful for load balancing

This configuration is override and turns on by default by Elysia

### serve.unix
If set, the HTTP server will listen on a unix socket instead of a port.

(Cannot be used with hostname+port)

### serve.tls
We can enable TLS (known as successor of SSL) by passing in a value for key and cert; both are required to enable TLS.

```ts
import { Elysia, file } from 'elysia'

new Elysia({
	serve: {
		tls: {
			cert: file('cert.pem'),
			key: file('key.pem')
		}
	}
})
```

Elysia extends Bun configuration which supports TLS out of the box, powered by BoringSSL.

### serve.tls.ca
Optionally override the trusted CA certificates. Default is to trust the well-known CAs curated by Mozilla.

Mozilla's CAs are completely replaced when CAs are explicitly specified using this option.

### serve.tls.cert
Cert chains in PEM format. One cert chain should be provided per private key.

Each cert chain should consist of the PEM formatted certificate for a provided private key, followed by the PEM formatted intermediate certificates (if any), in order, and not
including the root CA (the root CA must be pre-known to the peer, see ca).

When providing multiple cert chains, they do not have to be in the same order as their private keys in key.

If the intermediate certificates are not provided, the peer will not be
able to validate the certificate, and the handshake will fail.

### serve.tls.dhParamsFile
File path to a .pem file custom Diffie Helman parameters

### serve.tls.key
Private keys in PEM format. PEM allows the option of private keys being encrypted. Encrypted keys will be decrypted with options.passphrase.

Multiple keys using different algorithms can be provided either as an array of unencrypted key strings or buffers, or an array of objects in the form .

The object form can only occur in an array.

**object.passphrase** is optional. Encrypted keys will be decrypted with

**object.passphrase** if provided, or **options.passphrase** if it is not.

### serve.tls.lowMemoryMode
@default `false`

This sets `OPENSSL_RELEASE_BUFFERS` to 1.

It reduces overall performance but saves some memory.

### serve.tls.passphrase
Shared passphrase for a single private key and/or a PFX.

### serve.tls.requestCert
@default `false`

If set to `true`, the server will request a client certificate.

### serve.tls.secureOptions
Optionally affect the OpenSSL protocol behavior, which is not usually necessary.

This should be used carefully if at all!

Value is a numeric bitmask of the SSL_OP_* options from OpenSSL Options

### serve.tls.serverName
Explicitly set a server name

## tags

Define an tags for OpenAPI schema for all routes of an instance similar to [detail](#detail)

```ts twoslash
import { Elysia } from 'elysia'

new Elysia({
	tags: ['elysia']
})
```

### systemRouter

Use runtime/framework provided router if possible.

On Bun, Elysia will use [Bun.serve.routes](https://bun.sh/docs/api/http#routing) and fallback to Elysia's own router.

## websocket

Override websocket configuration

Recommended to leave this as default as Elysia will generate suitable configuration for handling WebSocket automatically

This configuration extends [Bun's WebSocket API](https://bun.sh/docs/api/websockets)

#### Example
```ts
import { Elysia } from 'elysia'

new Elysia({
	websocket: {
		// enable compression and decompression
    	perMessageDeflate: true
	}
})
```

---

<!-- <br />

# Experimental

Try out an experimental feature which might be available in the future version of Elysia. -->
`````

## File: docs/patterns/cookie.md
`````markdown
---
title: Reactive Cookie - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Reactive Cookie - ElysiaJS

  - - meta
    - name: 'description'
      content: Reactive Cookie take a more modern approach like signal to handle cookie with an ergonomic API. There's no 'getCookie', 'setCookie', everything is just a cookie object. When you want to use cookie, you just extract the name and value directly.

  - - meta
    - property: 'og:description'
      content: Reactive Cookie take a more modern approach like signal to handle cookie with an ergonomic API. There's no 'getCookie', 'setCookie', everything is just a cookie object. When you want to use cookie, you just extract the name and value directly.
---

# Cookie
To use Cookie, you can extract the cookie property and access its name and value directly.

There's no get/set, you can extract the cookie name and retrieve or update its value directly.
```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Get
        name.value

        // Set
        name.value = "New Value"
    })
```

By default, Reactive Cookie can encode/decode type of object automatically allowing us to treat cookie as an object without worrying about the encoding/decoding. **It just works**.

## Reactivity
The Elysia cookie is reactive. This means that when you change the cookie value, the cookie will be updated automatically based on approach like signal.

A single source of truth for handling cookies is provided by Elysia cookies, which have the ability to automatically set headers and sync cookie values.

Since cookies are Proxy-dependent objects by default, the extract value can never be **undefined**; instead, it will always be a value of `Cookie<unknown>`, which can be obtained by invoking the **.value** property.

We can treat the cookie jar as a regular object, iteration over it will only iterate over an already-existing cookie value.

## Cookie Attribute
To use Cookie attribute, you can either use one of the following:

1. Setting the property directly
2. Using `set` or `add` to update cookie property.

See [cookie attribute config](/patterns/cookie.html#config) for more information.

### Assign Property
You can get/set the property of a cookie like any normal object, the reactivity model synchronizes the cookie value automatically.

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // get
        name.domain

        // set
        name.domain = 'millennium.sh'
        name.httpOnly = true
    })
```

## set
**set** permits updating multiple cookie properties all at once through **reset all property** and overwrite the property with a new value.

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        name.set({
            domain: 'millennium.sh',
            httpOnly: true
        })
    })
```

## add
Like **set**, **add** allow us to update multiple cookie properties at once, but instead, will only overwrite the property defined instead of resetting.

## remove
To remove a cookie, you can use either:
1. name.remove
2. delete cookie.name

```ts
import { Elysia } from 'elysia'

new Elysia()
    .get('/', ({ cookie, cookie: { name } }) => {
        name.remove()

        delete cookie.name
    })
```

## Cookie Schema
You can strictly validate cookie type and providing type inference for cookie by using cookie schema with `t.Cookie`.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

## Nullable Cookie
To handle nullable cookie value, you can use `t.Optional` on the cookie name you want to be nullable.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { name } }) => {
        // Set
        name.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            name: t.Optional(
                t.Object({
                    id: t.Numeric(),
                    name: t.String()
                })
            )
        })
    })
```

## Cookie Signature
With an introduction of Cookie Schema, and `t.Cookie` type, we can create a unified type for handling sign/verify cookie signature automatically.

Cookie signature is a cryptographic hash appended to a cookie's value, generated using a secret key and the content of the cookie to enhance security by adding a signature to the cookie.

This make sure that the cookie value is not modified by malicious actor, helps in verifying the authenticity and integrity of the cookie data.

## Using Cookie Signature
By provide a cookie secret, and `sign` property to indicate which cookie should have a signature verification.
```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia()
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        }, {
            secrets: 'Fischl von Luftschloss Narfidort',
            sign: ['profile']
        })
    })
```

Elysia then sign and unsign cookie value automatically.

## Constructor
You can use Elysia constructor to set global cookie `secret`, and `sign` value to apply to all route globally instead of inlining to every route you need.

```ts twoslash
import { Elysia, t } from 'elysia'

new Elysia({
    cookie: {
        secrets: 'Fischl von Luftschloss Narfidort',
        sign: ['profile']
    }
})
    .get('/', ({ cookie: { profile } }) => {
        profile.value = {
            id: 617,
            name: 'Summoning 101'
        }
    }, {
        cookie: t.Cookie({
            profile: t.Object({
                id: t.Numeric(),
                name: t.String()
            })
        })
    })
```

## Cookie Rotation
Elysia handle Cookie's secret rotation automatically.

Cookie Rotation is a migration technique to sign a cookie with a newer secret, while also be able to verify the old signature of the cookie.

```ts
import { Elysia } from 'elysia'

new Elysia({
    cookie: {
        secrets: ['Vengeance will be mine', 'Fischl von Luftschloss Narfidort']
    }
})
```

## Config
Below is a cookie config accepted by Elysia.

### secret
The secret key for signing/un-signing cookies.

If an array is passed, will use Key Rotation.

Key rotation is when an encryption key is retired and replaced by generating a new cryptographic key.

---
Below is a config that extends from [cookie](https://npmjs.com/package/cookie)

### domain
Specifies the value for the [Domain Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.3).

By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.


### encode
@default `encodeURIComponent`

Specifies a function that will be used to encode a cookie's value.

Since the value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie's value.

The default function is the global `encodeURIComponent`, which will encode a JavaScript string into UTF-8 byte sequences and then URL-encode any that fall outside of the cookie range.

### expires
Specifies the Date object to be the value for the [Expires Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.1).

By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.

::: tip
The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but not all clients may obey this, so if both are set, they should point to the same date and time.
:::

### httpOnly
@default `false`

Specifies the boolean value for the [HttpOnly Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.6).

When truthy, the HttpOnly attribute is set, otherwise, it is not.

By default, the HttpOnly attribute is not set.

::: tip
be careful when setting this to true, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`.
:::

### maxAge
@default `undefined`

Specifies the number (in seconds) to be the value for the [Max-Age Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.2).

The given number will be converted to an integer by rounding down. By default, no maximum age is set.

::: tip
The [cookie storage model specification](https://tools.ietf.org/html/rfc6265#section-5.3) states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but not all clients may obey this, so if both are set, they should point to the same date and time.
:::

### path
Specifies the value for the [Path Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.4).

By default, the path handler is considered the default path.

### priority
Specifies the string to be the value for the [Priority Set-Cookie attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
`low` will set the Priority attribute to Low.
`medium` will set the Priority attribute to Medium, the default priority when not set.
`high` will set the Priority attribute to High.

More information about the different priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).

::: tip
This is an attribute that has not yet been fully standardized and may change in the future. This also means many clients may ignore this attribute until they understand it.
:::

### sameSite
Specifies the boolean or string to be the value for the [SameSite Set-Cookie attribute](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).
`true` will set the SameSite attribute to Strict for strict same-site enforcement.
`false` will not set the SameSite attribute.
`'lax'` will set the SameSite attribute to Lax for lax same-site enforcement.
`'none'` will set the SameSite attribute to None for an explicit cross-site cookie.
`'strict'` will set the SameSite attribute to Strict for strict same-site enforcement.
More information about the different enforcement levels can be found in [the specification](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-09#section-5.4.7).

::: tip
This is an attribute that has not yet been fully standardized and may change in the future. This also means many clients may ignore this attribute until they understand it.
:::

### secure
Specifies the boolean value for the [Secure Set-Cookie attribute](https://tools.ietf.org/html/rfc6265#section-5.2.5). When truthy, the Secure attribute is set, otherwise, it is not. By default, the Secure attribute is not set.

::: tip
Be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.
:::
`````

## File: docs/patterns/deploy.md
`````markdown
---
title: Deploy to Production - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Deploy to Production - ElysiaJS

  - - meta
    - name: 'description'
      content: This page

  - - meta
    - property: 'og:description'
      content: Elysia can be configured by passing an object to the constructor. We can configure Elysia behavior by passing an object to the constructor.
---

# Deploy to production
This page is a guide on how to deploy Elysia to production.

## Compile to binary
We recommended running a build command before deploying to production as it could potentially reduce memory usage and file size significantly.

We recommended compile Elysia into a single binary using the command as follows:
```bash
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts
```

This will generate a portable binary `server` which we can run to start our server.

Compiling server to binary usually significantly reduce memory usage by 2-3x compared to development environment.

This command is a bit long, so let's break it down:
1. `--compile` - Compile TypeScript to binary
2. `--minify-whitespace` - Remove unnecessary whitespace
3. `--minify-syntax` - Minify JavaScript syntax to reduce file size
4. `--target bun` - Target the `bun` platform, this can optimize the binary for the target platform
5. `--outfile server` - Output the binary as `server`
6. `./src/index.ts` - The entry file of our server (codebase)

To start our server, simly run the binary.
```bash
./server
```

Once binary is compiled, you don't need `Bun` installed on the machine to run the server.

This is great as the deployment server doesn't need to install an extra runtime to run making binary portable.

### Why not --minify
Bun does have `--minify` flag that will minify the binary.

However if we are using [OpenTelemetry](/plugins/opentelemetry), it's going to reduce a function name to a single character.

This make tracing harder than it should as OpenTelemetry rely on a function name.

However, if you're not using OpenTelemetry, you may opt in for `--minify` instead
```bash
bun build \
	--compile \
	--minify \
	--target bun \
	--outfile server \
	./src/index.ts
```

### Permission
Some Linux distro might not be able to run the binary, we suggest enable executable permission to a binary if you're on Linux:
```bash
chmod +x ./server

./server
```

### Unknown random Chinese error
If you're trying to deploy a binary to your server but unable to run with random chinese character error.

It means that the machine you're running on **doesn't support AVX2**.

Unfortunately, Bun require machine that has an `AVX2` hardware support.

There's no workaround as far as we know.

## Compile to JavaScript
If you are unable to compile to binary or you are deploying on a Windows server.

You may bundle your server to a JavaScript file instead.

```bash
bun build \
	--compile \ // [!code --]
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile ./dist/index.js \
	./src/index.ts
```

This will generate a single portable JavaScript file that you can deploy on your server.
```bash
NODE_ENV=production bun ./dist/index.js
```

## Docker
On Docker, we recommended to always compile to binary to reduce base image overhead.

Here's an example image using Distroless image using binary.
```dockerfile [Dockerfile]
FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

### OpenTelemetry
If you are using [OpenTelemetry](/integrations/opentelemetry) to deploys production server.

As OpenTelemetry rely on monkey-patching `node_modules/<library>`. It's required that make instrumentations works properly, we need to specify that libraries to be instrument is an external module to exclude it from being bundled.

For example, if you are using `@opentelemetry/instrumentation-pg` to instrument `pg` library. We need to exclude `pg` from being bundled and make sure that it is importing `node_modules/pg`.

To make this works, we may specified `pg` as an external module with `--external pg`
```bash
bun build --compile --external pg --outfile server src/index.ts
```

This tells bun to not `pg` bundled into the final output file, and will be imported from the `node_modules` directory at runtime. So on a production server, you must also keeps the `node_modules` directory.

It's recommended to specify packages that should be available in a production server as `dependencies` in `package.json` and use `bun install --production` to install only production dependencies.

```json
{
	"dependencies": {
		"pg": "^8.15.6"
	},
	"devDependencies": {
		"@elysiajs/opentelemetry": "^1.2.0",
		"@opentelemetry/instrumentation-pg": "^0.52.0",
		"@types/pg": "^8.11.14",
		"elysia": "^1.2.25"
	}
}
```

Then after running a build command, on a production server
```bash
bun install --production
```

If the node_modules directory still includes development dependencies, you may remove the node_modules directory and reinstall production dependencies again.

### Monorepo
If you are using Elysia with Monorepo, you may need to include dependent `packages`.

If you are using Turborepo, you may place a Dockerfile inside an your apps directory like **apps/server/Dockerfile**. This may apply to other monorepo manager such as Lerna, etc.

Assume that our monorepo are using Turborepo with structure as follows:
- apps
	- server
		- **Dockerfile (place a Dockerfile here)**
- packages
	- config

Then we can build our Dockerfile on monorepo root (not app root):
```bash
docker build -t elysia-mono .
```

With Dockerfile as follows:
```dockerfile [apps/server/Dockerfile]
FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages
COPY package.json package.json
COPY bun.lock bun.lock

COPY /apps/server/package.json ./apps/server/package.json
COPY /packages/config/package.json ./packages/config/package.json

RUN bun install

COPY /apps/server ./apps/server
COPY /packages/config ./packages/config

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000
```

## Railway
[Railway](https://railway.app) is one of the popular deployment platform.

Railway assign **random port** to expose for each deployment that can be access via `PORT` environment variable.

We need to modify our Elysia server to accept `PORT` environment to comply with Railway port.

Instead of a fixed port, we may use `process.env.PORT` and provide a fallback on development instead.
```ts
new Elysia()
	.listen(3000) // [!code --]
	.listen(process.env.PORT ?? 3000) // [!code ++]
```

This should allows Elysia to intercept port provided by Railway.

::: tip
Elysia assign hostname to `0.0.0.0` automatically, which works with Railway
:::
`````

## File: docs/patterns/macro.md
`````markdown
---
title: Macro - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Macro - ElysiaJS

  - - meta
    - name: 'description'
      content: Macro allows us to define a custom field to the hook.

  - - meta
    - property: 'og:description'
      content: Macro allows us to define a custom field to the hook.
---

# Macro

<script setup>
import Tab from '../components/fern/tab.vue'
</script>

Macro allows us to define a custom field to the hook.

<Tab
	id="macro"
	:names="['Macro v2', 'Macro v1']"
	:tabs="['macro2', 'macro1']"
>

<template v-slot:macro1>

Macro v1 uses functional callback with event listener function.

**Elysia.macro** allows us to compose custom heavy logic into a simple configuration available in hook, and **guard** with full type safety.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro(({ onBeforeHandle }) => ({
        hi(word: string) {
            onBeforeHandle(() => {
                console.log(word)
            })
        }
    }))

const app = new Elysia()
    .use(plugin)
    .get('/', () => 'hi', {
        hi: 'Elysia'
    })
```

Accessing the path should log **"Elysia"** as the result.

### API

**macro** should return an object, each key is reflected to the hook, and the provided value inside the hook will be sent back as the first parameter.

In previous example, we create **hi** accepting a **string**.

We then assigned **hi** to **"Elysia"**, the value was then sent back to the **hi** function, and then the function added a new event to **beforeHandle** stack.

Which is an equivalent of pushing function to **beforeHandle** as the following:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'hi', {
        beforeHandle() {
            console.log('Elysia')
        }
    })
```

**macro** shine when a logic is more complex than accepting a new function, for example creating an authorization layer for each route.

```typescript twoslash
// @filename: auth.ts
import { Elysia } from 'elysia'

export const auth = new Elysia()
    .macro(() => {
        return {
            isAuth(isAuth: boolean) {},
            role(role: 'user' | 'admin') {},
        }
    })

// @filename: index.ts
// ---cut---
import { Elysia } from 'elysia'
import { auth } from './auth'

const app = new Elysia()
    .use(auth)
    .get('/', () => 'hi', {
        isAuth: true,
        role: 'admin'
    })
```

The field can accept anything ranging from string to function, allowing us to create a custom life cycle event.

**macro** will be executed in order from top-to-bottom according to definition in hook, ensure that the stack should be handle in correct order.

### Parameters

**Elysia.macro** parameters to interact with the life cycle event as the following:

-   onParse
-   onTransform
-   onBeforeHandle
-   onAfterHandle
-   onError
-   onResponse
-   events - Life cycle store
    -   global: Life cycle of a global stack
    -   local: Life cycle of an inline hook (route)

Parameters start with **on** is a function to appends function into a life cycle stack.

While **events** is an actual stack that stores an order of the life-cycle event. You may mutate the stack directly or using the helper function provided by Elysia.

### Options

The life cycle function of an extension API accepts additional **options** to ensure control over life cycle events.

-   **options** (optional) - determine which stack
-   **function** - function to execute on the event

```typescript
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro(({ onBeforeHandle }) => {
        return {
            hi(word: string) {
                onBeforeHandle(
                    { insert: 'before' }, // [!code ++]
                    () => {
                        console.log(word)
                    }
                )
            }
        }
    })
```

**Options** may accept the following parameter:

-   **insert**
    -   Where should the function be added
    -   value: **'before' | 'after'**
    -   @default: **'after'**
-   **stack**
    -   Determine which type of stack should be added
    -   value: **'global' | 'local'**
    -   @default: **'local'**

</template>

<template v-slot:macro2>

Macro v2 use an object syntax with return lifecycle like inline hook.

**Elysia.macro** allows us to compose custom heavy logic into a simple configuration available in hook, and **guard** with full type safety.

```typescript twoslash
import { Elysia } from 'elysia'

const plugin = new Elysia({ name: 'plugin' })
    .macro({
        hi(word: string) {
            return {
	            beforeHandle() {
	                console.log(word)
	            }
            }
        }
    })

const app = new Elysia()
    .use(plugin)
    .get('/', () => 'hi', {
        hi: 'Elysia'
    })
```

Accessing the path should log **"Elysia"** as the results.

### API

**macro** has the same API as hook.

In previous example, we create a **hi** macro accepting a **string**.

We then assigned **hi** to **"Elysia"**, the value was then sent back to the **hi** function, and then the function added a new event to **beforeHandle** stack.

Which is an equivalent of pushing function to **beforeHandle** as the following:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'hi', {
        beforeHandle() {
            console.log('Elysia')
        }
    })
```

**macro** shine when a logic is more complex than accepting a new function, for example creating an authorization layer for each route.

```typescript twoslash
// @filename: auth.ts
import { Elysia } from 'elysia'

export const auth = new Elysia()
    .macro({
    	isAuth: {
      		resolve() {
     			return {
         			user: 'saltyaom'
          		}
      		}
        },
        role(role: 'admin' | 'user') {
        	return {}
        }
    })

// @filename: index.ts
// ---cut---
import { Elysia } from 'elysia'
import { auth } from './auth'

const app = new Elysia()
    .use(auth)
    .get('/', ({ user }) => user, {
                          // ^?
        isAuth: true,
        role: 'admin'
    })
```

Macro v2 can also register a new property to the context, allowing us to access the value directly from the context.

The field can accept anything ranging from string to function, allowing us to create a custom life cycle event.

**macro** will be executed in order from top-to-bottom according to definition in hook, ensure that the stack is handled in the correct order.

## Resolve

You add a property to the context by returning an object with a [**resolve**](/essential/life-cycle.html#resolve) function.

```ts twoslash
import { Elysia } from 'elysia'

new Elysia()
	.macro({
		user: (enabled: true) => ({
			resolve: () => ({
				user: 'Pardofelis'
			})
		})
	})
	.get('/', ({ user }) => user, {
                          // ^?
		user: true
	})
```

In the example above, we add a new property **user** to the context by returning an object with a **resolve** function.

Here's an example that macro resolve could be useful:
- perform authentication and add user to the context
- run an additional database query and add data to the context
- add a new property to the context

## Property shorthand
Starting from Elysia 1.2.10, each property in the macro object can be a function or an object.

If the property is an object, it will be translated to a function that accept a boolean parameter, and will be executed if the parameter is true.
```typescript
import { Elysia } from 'elysia'

export const auth = new Elysia()
    .macro({
    	// This property shorthand
    	isAuth: {
      		resolve() {
     			return {
         			user: 'saltyaom'
          		}
      		}
        },
        // is equivalent to
        isAuth(enabled: boolean) {
        	if(!enabled) return

        	return {
				resolve() {
					return {
						user
					}
				}
         	}
        }
    })
```

</template>

</Tab>
`````

## File: docs/patterns/mount.md
`````markdown
---
title: Mount - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Mount - ElysiaJS

  - - meta
    - name: 'description'
      content: Applying WinterCG interplopable code to run with Elysia or vice-versa.

  - - meta
    - property: 'og:description'
      content: Applying WinterCG interplopable code to run with Elysia or vice-versa.
---

# Mount
WinterCG is a standard for web-interoperable runtimes. Supported by Cloudflare, Deno, Vercel Edge Runtime, Netlify Function, and various others, it allows web servers to run interoperably across runtimes that use Web Standard definitions like `Fetch`, `Request`, and `Response`.

Elysia is WinterCG compliant. We are optimized to run on Bun but also openly support other runtimes if possible.

In theory, this allows any framework or code that is WinterCG compliant to be run together, allowing frameworks like Elysia, Hono, Remix, Itty Router to run together in a simple function.

Adhering to this, we implemented the same logic for Elysia by introducing `.mount` method to run with any framework or code that is WinterCG compliant.

## Mount
To use **.mount**, [simply pass a `fetch` function](https://twitter.com/saltyAom/status/1684786233594290176):
```ts
import { Elysia } from 'elysia'

const app = new Elysia()
    .get('/', () => 'Hello from Elysia')
    .mount('/hono', hono.fetch)
```

A **fetch** function is a function that accepts a Web Standard Request and returns a Web Standard Response with the definition of:
```ts
// Web Standard Request-like object
// Web Standard Response
type fetch = (request: RequestLike) => Response
```

By default, this declaration is used by:
- Bun
- Deno
- Vercel Edge Runtime
- Cloudflare Worker
- Netlify Edge Function
- Remix Function Handler
- etc.

This allows you to execute all the aforementioned code in a single server environment, making it possible to interact seamlessly with Elysia. You can also reuse existing functions within a single deployment, eliminating the need for a reverse proxy to manage multiple servers.

If the framework also supports a **.mount** function, you can deeply nest a framework that supports it.
```ts
import { Elysia } from 'elysia'
import { Hono } from 'hono'

const elysia = new Elysia()
    .get('/', () => 'Hello from Elysia inside Hono inside Elysia')

const hono = new Hono()
    .get('/', (c) => c.text('Hello from Hono!'))
    .mount('/elysia', elysia.fetch)

const main = new Elysia()
    .get('/', () => 'Hello from Elysia')
    .mount('/hono', hono.fetch)
    .listen(3000)
```

## Reusing Elysia
Moreover, you can re-use multiple existing Elysia projects on your server.

```ts
import { Elysia } from 'elysia'

import A from 'project-a/elysia'
import B from 'project-b/elysia'
import C from 'project-c/elysia'

new Elysia()
    .mount(A)
    .mount(B)
    .mount(C)
```

If an instance passed to `mount` is an Elysia instance, it will be resolved with `use` automatically, providing type-safety and support for Eden by default.

This makes the possibility of an interoperable framework and runtime a reality.
`````

## File: docs/patterns/trace.md
`````markdown
---
title: Trace - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Trace - ElysiaJS

    - - meta
      - name: 'description'
        content: Trace is an API to measure the performance of your server. Allowing us to interact with the duration span of each life-cycle events and measure the performance of each function to identify performance bottlenecks of the server.

    - - meta
      - name: 'og:description'
        content: Trace is an API to measure the performance of your server. Allowing us to interact with the duration span of each life-cycle events and measure the performance of each function to identify performance bottlenecks of the server.
---

# Trace

Performance is an important aspect for Elysia.

We don't want to be fast for benchmarking purposes, we want you to have a real fast server in real-world scenario.

There are many factors that can slow down our app - and it's hard to identify them, but **trace** can helps solve that problem by injecting start and stop code to each life-cycle.

Trace allows us to inject code to before and after of each life-cycle event, block and interact with the execution of the function.

## Trace
Trace use a callback listener to ensure that callback function is finished before moving on to the next lifecycle event.

To use `trace`, you need to call `trace` method on the Elysia instance, and pass a callback function that will be executed for each life-cycle event.

You may listen to each lifecycle by adding `on` prefix follows by life-cycle name, for example `onHandle` to listen to `handle` event.

```ts twoslash
import { Elysia } from 'elysia'

const app = new Elysia()
    .trace(async ({ onHandle }) => {
	    onHandle(({ begin, onStop }) => {
			onStop(({ end }) => {
        		console.log('handle took', end - begin, 'ms')
			})
	    })
    })
    .get('/', () => 'Hi')
    .listen(3000)
```

Please refer to [Life Cycle Events](/essential/life-cycle#events) for more information:

![Elysia Life Cycle](/assets/lifecycle-chart.svg)

## Children
Every events except `handle` have a children, which is an array of events that are executed inside for each life-cycle event.

You can use `onEvent` to listen to each child event in order

```ts twoslash
import { Elysia } from 'elysia'

const sleep = (time = 1000) =>
    new Promise((resolve) => setTimeout(resolve, time))

const app = new Elysia()
    .trace(async ({ onBeforeHandle }) => {
        onBeforeHandle(({ total, onEvent }) => {
            console.log('total children:', total)

            onEvent(({ onStop }) => {
                onStop(({ elapsed }) => {
                    console.log('child took', elapsed, 'ms')
                })
            })
        })
    })
    .get('/', () => 'Hi', {
        beforeHandle: [
            function setup() {},
            async function delay() {
                await sleep()
            }
        ]
    })
    .listen(3000)
```

In this example, total children will be `2` because there are 2 children in the `beforeHandle` event.

Then we listen to each child event by using `onEvent` and print the duration of each child event.

## Trace Parameter
When each lifecycle is called

```ts twoslash
import { Elysia } from 'elysia'

const app = new Elysia()
	// This is trace parameter
	// hover to view the type
	.trace((parameter) => {
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

`trace` accept the following parameters:

### id - `number`
Randomly generated unique id for each request

### context - `Context`
Elysia's [Context](/essential/handler.html#context), eg. `set`, `store`, `query`, `params`

### set - `Context.set`
Shortcut for `context.set`, to set a headers or status of the context

### store - `Singleton.store`
Shortcut for `context.store`, to access a data in the context

### time - `number`
Timestamp of when request is called

### on[Event] - `TraceListener`
An event listener for each life-cycle event.

You may listen to the following life-cycle:
-   **onRequest** - get notified of every new request
-   **onParse** - array of functions to parse the body
-   **onTransform** - transform request and context before validation
-   **onBeforeHandle** - custom requirement to check before the main handler, can skip the main handler if response returned.
-   **onHandle** - function assigned to the path
-   **onAfterHandle** - interact with the response before sending it back to the client
-   **onMapResponse** - map returned value into a Web Standard Response
-   **onError** - handle error thrown during processing request
-   **onAfterResponse** - cleanup function after response is sent

## Trace Listener
A listener for each life-cycle event

```ts twoslash
import { Elysia } from 'elysia'

const app = new Elysia()
	.trace(({ onBeforeHandle }) => {
		// This is trace listener
		// hover to view the type
		onBeforeHandle((parameter) => {

		})
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

Each lifecycle listener accept the following

### name - `string`
The name of the function, if the function is anonymous, the name will be `anonymous`

### begin - `number`
The time when the function is started

### end - `Promise<number>`
The time when the function is ended, will be resolved when the function is ended

### error - `Promise<Error | null>`
Error that was thrown in the lifecycle, will be resolved when the function is ended

### onStop - `callback?: (detail: TraceEndDetail) => any`
A callback that will be executed when the lifecycle is ended

```ts twoslash
import { Elysia } from 'elysia'

const app = new Elysia()
	.trace(({ onBeforeHandle, set }) => {
		onBeforeHandle(({ onStop }) => {
			onStop(({ elapsed }) => {
				set.headers['X-Elapsed'] = elapsed.toString()
			})
		})
	})
	.get('/', () => 'Hi')
	.listen(3000)
```

It's recommended to mutate context in this function as there's a lock mechanism to ensure the context is mutate successfully before moving on to the next lifecycle event

## TraceEndDetail
A parameter that passed to `onStop` callback

### end - `number`
The time when the function is ended

### error - `Error | null`
Error that was thrown in the lifecycle

### elapsed - `number`
Elapsed time of the lifecycle or `end - begin`
`````

## File: docs/patterns/type.md
`````markdown
---
title: Type - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Type - ElysiaJS

    - - meta
      - name: 'description'
        content: Schemas are strictly typed definitions, used to infer TypeScript's type and data validation of an incoming request and outgoing response. Elysia's schema validation is based on Sinclair's TypeBox, a TypeScript library for data validation.

    - - meta
      - property: 'og:description'
        content: Schemas are strictly typed definitions, used to infer TypeScript's type and data validation of an incoming request and outgoing response. Elysia's schema validation is based on Sinclair's TypeBox, a TypeScript library for data validation.
---

<script setup>
import Card from '../components/nearl/card.vue'
import Deck from '../components/nearl/card-deck.vue'
</script>

# Type

Here's a common patterns for writing validation types in Elysia.

<Deck>
    <Card title="Primitive Type" href="#primitive-type">
    	Common TypeBox API
    </Card>
    <Card title="Elysia Type" href="#elysia-type">
   		Dedicated type for Elysia and HTTP
    </Card>
    <Card title="Elysia Behavior" href="#elysia-behavior">
  		Different Elysia.t behavior from TypeBox
    </Card>
</Deck>

## Primitive Type

The TypeBox API is designed around and is similar to TypeScript types.

There are many familiar names and behaviors that intersect with TypeScript counterparts, such as **String**, **Number**, **Boolean**, and **Object**, as well as more advanced features like **Intersect**, **KeyOf**, and **Tuple** for versatility.

If you are familiar with TypeScript, creating a TypeBox schema behaves the same as writing a TypeScript type, except it provides actual type validation at runtime.

To create your first schema, import **Elysia.t** from Elysia and start with the most basic type:

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/', ({ body }) => `Hello ${body}`, {
		body: t.String()
	})
	.listen(3000)
```

This code tells Elysia to validate an incoming HTTP body, ensuring that the body is a string. If it is a string, it will be allowed to flow through the request pipeline and handler.

If the shape doesn't match, it will throw an error into the [Error Life Cycle](/essential/life-cycle.html#on-error).

![Elysia Life Cycle](/assets/lifecycle-chart.svg)

### Basic Type

TypeBox provides basic primitive types with the same behavior as TypeScript types.

The following table lists the most common basic types:

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
</tr>

<tr>
<td>

```typescript
t.String()
```

</td>
<td>

```typescript
string
```

</td>
</tr>

<tr>
<td>

```typescript
t.Number()
```

</td>
<td>

```typescript
number
```

</td>
</tr>

<tr>
<td>

```typescript
t.Boolean()
```

</td>
<td>

```typescript
boolean
```

</td>
</tr>

<tr>
<td>

```typescript
t.Array(
    t.Number()
)
```

</td>
<td>

```typescript
number[]
```

</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number()
})
```

</td>
<td>

```typescript
{
    x: number
}
```

</td>
</tr>

<tr>
<td>

```typescript
t.Null()
```

</td>
<td>

```typescript
null
```

</td>
</tr>

<tr>
<td>

```typescript
t.Literal(42)
```

</td>
<td>

```typescript
42
```

</td>
</tr>
</tbody>
</table>

Elysia extends all types from TypeBox, allowing you to reference most of the API from TypeBox for use in Elysia.

See [TypeBox's Type](https://github.com/sinclairzx81/typebox#json-types) for additional types supported by TypeBox.

### Attribute

TypeBox can accept arguments for more comprehensive behavior based on the JSON Schema 7 specification.

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
</tr>

<tr>
<td>

```typescript
t.String({
    format: 'email'
})
```

</td>
<td>

```typescript
saltyaom@elysiajs.com
```

</td>
</tr>

<tr>
<td>

```typescript
t.Number({
    minimum: 10,
    maximum: 100
})
```

</td>
<td>

```typescript
10
```

</td>
</tr>

<tr>
<td>

```typescript
t.Array(
    t.Number(),
    {
        /**
         * Minimum number of items
         */
        minItems: 1,
        /**
         * Maximum number of items
         */
        maxItems: 5
    }
)
```

</td>
<td>

```typescript
[1, 2, 3, 4, 5]
```

</td>
</tr>

<tr>
<td>

```typescript
t.Object(
    {
        x: t.Number()
    },
    {
        /**
         * @default false
         * Accept additional properties
         * that not specified in schema
         * but still match the type
         */
        additionalProperties: true
    }
)
```

</td>
<td>

```typescript
x: 100
y: 200
```

</td>
</tr>
</tbody>
</table>

See [JSON Schema 7 specification](https://json-schema.org/draft/2020-12/json-schema-validation) for more explanation of each attribute.

## Honorable Mentions

The following are common patterns often found useful when creating a schema.

### Union

Allows a field in `t.Object` to have multiple types.

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
<td>Value</td>
</tr>

<tr>
<td>

```typescript
t.Union([
    t.String(),
    t.Number()
])
```

</td>
<td>

```typescript
string | number
```

</td>

<td>

```
Hello
123
```

</td>
</tr>
</tbody>
</table>

### Optional

Allows a field in `t.Object` to be undefined or optional.

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
<td>Value</td>
</tr>

<tr>
<td>

```typescript
t.Object({
    x: t.Number(),
    y: t.Optional(t.Number())
})
```

</td>
<td>

```typescript
{
    x: number,
    y?: number
}
```

</td>

<td>

```typescript
{
    x: 123
}
```

</td>
</tr>
</tbody>
</table>

### Partial

Allows all fields in `t.Object` to be optional.

<table class="md-table">
<tbody>
<tr>
<td>TypeBox</td>
<td>TypeScript</td>
<td>Value</td>
</tr>

<tr>
<td>

```typescript
t.Partial(
    t.Object({
        x: t.Number(),
        y: t.Number()
    })
)
```

</td>
<td>

```typescript
{
    x?: number,
    y?: number
}
```

</td>

<td>

```typescript
{
    y: 123
}
```

</td>
</tr>
</tbody>
</table>

## Elysia Type

`Elysia.t` is based on TypeBox with pre-configuration for server usage, providing additional types commonly found in server-side validation.

You can find all the source code for Elysia types in `elysia/type-system`.

The following are types provided by Elysia:

<Deck>
	<Card title="UnoinEnum" href="#unionenum">
		`UnionEnum` allows the value to be one of the specified values.
    </Card>
    <Card title="File" href="#file">
        A singular file. Often useful for <strong>file upload</strong> validation
    </Card>
    <Card title="Files" href="#files">
        Extends from <a href="#file">File</a>, but adds support for an array of files in a single field
    </Card>
    <Card title="Cookie" href="#cookie">
        Object-like representation of a Cookie Jar extended from Object type
    </Card>
    <Card title="Nullable" href="#nullable">
    Allow the value to be null but not undefined
    </Card>
    <Card title="Maybe Empty" href="#maybeempty">
        Accepts empty string or null value
    </Card>
    <Card title="Form" href="#form">
    	Validate type for FormData as a return value
    </Card>
    <Card title="Numeric" href="#numeric-legacy">
        Accepts a numeric string or number and then transforms the value into a number
    </Card>
</Deck>

### UnionEnum

`UnionEnum` allows the value to be one of the specified values.

```typescript
t.UnionEnum(['rapi', 'anis', 1, true, false])
```

By default, these value will not automatically

### File

A singular file, often useful for **file upload** validation.

```typescript
t.File()
```

File extends the attributes of the base schema, with additional properties as follows:

#### type

Specifies the format of the file, such as image, video, or audio.

If an array is provided, it will attempt to validate if any of the formats are valid.

```typescript
type?: MaybeArray<string>
```

#### minSize

Minimum size of the file.

Accepts a number in bytes or a suffix of file units:

```typescript
minSize?: number | `${number}${'k' | 'm'}`
```

#### maxSize

Maximum size of the file.

Accepts a number in bytes or a suffix of file units:

```typescript
maxSize?: number | `${number}${'k' | 'm'}`
```

#### File Unit Suffix:

The following are the specifications of the file unit:
m: MegaByte (1048576 byte)
k: KiloByte (1024 byte)

### Files

Extends from [File](#file), but adds support for an array of files in a single field.

```typescript
t.Files()
```

Files extends the attributes of the base schema, array, and File.

### Cookie

Object-like representation of a Cookie Jar extended from the Object type.

```typescript
t.Cookie({
    name: t.String()
})
```

Cookie extends the attributes of [Object](https://json-schema.org/draft/2020-12/json-schema-validation#name-validation-keywords-for-obj) and [Cookie](https://github.com/jshttp/cookie#options-1) with additional properties as follows:

#### secrets

The secret key for signing cookies.

Accepts a string or an array of strings.

```typescript
secrets?: string | string[]
```

If an array is provided, [Key Rotation](https://crypto.stackexchange.com/questions/41796/whats-the-purpose-of-key-rotation) will be used. The newly signed value will use the first secret as the key.

### Nullable

Allows the value to be null but not undefined.

```typescript
t.Nullable(t.String())
```

### MaybeEmpty

Allows the value to be null and undefined.

```typescript
t.MaybeEmpty(t.String())
```

For additional information, you can find the full source code of the type system in [`elysia/type-system`](https://github.com/elysiajs/elysia/blob/main/src/type-system.ts).

### Form

A syntax sugar our `t.Object` with support for verifying return value of [form](/essential/handler.html#formdata) (FormData).

```typescript
t.FormData({
	someValue: t.File()
})
```

### Numeric (legacy)
::: warning
This is not need as Elysia type already transforms Number to Numeric automatically since 1.0
:::

Numeric accepts a numeric string or number and then transforms the value into a number.

```typescript
t.Numeric()
```

This is useful when an incoming value is a numeric string, for example, a path parameter or query string.

Numeric accepts the same attributes as [Numeric Instance](https://json-schema.org/draft/2020-12/json-schema-validation#name-validation-keywords-for-num)

## Elysia behavior

Elysia use TypeBox by default.

However, to help making handling with HTTP easier. Elysia has some dedicated type and have some behavior difference from TypeBox.

## Optional
To make a field optional, use `t.Optional`.

This will allows client to optionally provide a query parameter. This behavior also applied to `body`, `headers`.

This is different from TypeBox where optional is to mark a field of object as optional.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/optional', ({ query }) => query, {
                       // ^?




		query: t.Optional(
			t.Object({
				name: t.String()
			})
		)
	})
```

## Number to Numeric
By default, Elysia will convert a `t.Number` to [t.Numeric](#numeric-legacy) when provided as route schema.

Because parsed HTTP headers, query, url parameter is always a string. This means that even if a value is number, it will be treated as string.

Elysia override this behavior by checking if a string value looks like a number then convert it even appropriate.

This is only applied when it is used as a route schema and not in a nested `t.Object`.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/:id', ({ id }) => id, {
		params: t.Object({
			// Converted to t.Numeric()
			id: t.Number()
		}),
		body: t.Object({
			// NOT converted to t.Numeric()
			id: t.Number()
		})
	})

// NOT converted to t.Numeric()
t.Number()
```

## Boolean to BooleanString
Similar to [Number to Numeric](#number-to-numeric)

Any `t.Boolean` will be converted to `t.BooleanString`.

```ts
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/:id', ({ id }) => id, {
		params: t.Object({
			// Converted to t.Boolean()
			id: t.Boolean()
		}),
		body: t.Object({
			// NOT converted to t.Boolean()
			id: t.Boolean()
		})
	})

// NOT converted to t.BooleanString()
t.Boolean()
```
`````

## File: docs/patterns/unit-test.md
`````markdown
---
title: Testing - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Testing - ElysiaJS

    - - meta
      - name: 'description'
        content: You can use `bun:test` to create a unit test with Elysia. Elysia instance has a `handle` method that accepts `Request` and will return a `Response`, the same as creating an HTTP request.

    - - meta
      - name: 'og:description'
        content: You can use `bun:test` to create a unit test with Elysia. Elysia instance has a `handle` method that accepts `Request` and will return a `Response`, the same as creating an HTTP request.
---

# Unit Test

Being WinterCG compliant, we can use Request / Response classes to test an Elysia server.

Elysia provides the **Elysia.handle** method, which accepts a Web Standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and returns [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response), simulating an HTTP Request.

Bun includes a built-in [test runner](https://bun.sh/docs/cli/test) that offers a Jest-like API through the `bun:test` module, facilitating the creation of unit tests.

Create **test/index.test.ts** in the root of project directory with the following:

```typescript
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('Elysia', () => {
    it('return a response', async () => {
        const app = new Elysia().get('/', () => 'hi')

        const response = await app
            .handle(new Request('http://localhost/'))
            .then((res) => res.text())

        expect(response).toBe('hi')
    })
})
```

Then we can perform tests by running **bun test**

```bash
bun test
```

New requests to an Elysia server must be a fully valid URL, **NOT** a part of a URL.

The request must provide URL as the following:

| URL                   | Valid |
| --------------------- | ----- |
| http://localhost/user | ✅    |
| /user                 | ❌    |

We can also use other testing libraries like Jest to create Elysia unit tests.

## Eden Treaty test

We may use Eden Treaty to create an end-to-end type safety test for Elysia server as follows:

```typescript twoslash
// test/index.test.ts
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

const app = new Elysia().get('/hello', 'hi')

const api = treaty(app)

describe('Elysia', () => {
    it('return a response', async () => {
        const { data, error } = await api.hello.get()

        expect(data).toBe('hi')
              // ^?
    })
})
```

See [Eden Treaty Unit Test](/eden/treaty/unit-test) for setup and more information.
`````

## File: docs/patterns/websocket.md
`````markdown
---
title: WebSocket - ElysiaJS
head:
    - - meta
      - property: 'title'
        content: WebSocket - ElysiaJS

    - - meta
      - name: 'description'
        content: Elysia's WebSocket implementation. Start by declaring WebSocket route with "ws". WebSocket is a realtime protocol for communication between your client and server.

    - - meta
      - name: 'og:description'
        content: Elysia's WebSocket implementation. Start by declaring WebSocket route with "ws". WebSocket is a realtime protocol for communication between your client and server.
---

# WebSocket

WebSocket is a realtime protocol for communication between your client and server.

Unlike HTTP where our client repeatedly asking the website for information and waiting for a reply each time, WebSocket sets up a direct line where our client and server can send messages back and forth directly, making the conversation quicker and smoother without having to start over each message.

SocketIO is a popular library for WebSocket, but it is not the only one. Elysia uses [uWebSocket](https://github.com/uNetworking/uWebSockets) which Bun uses under the hood with the same API.

To use websocket, simply call `Elysia.ws()`:

```typescript
import { Elysia } from 'elysia'

new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .listen(3000)
```

## WebSocket message validation:

Same as normal route, WebSockets also accepts a **schema** object to strictly type and validate requests.

```typescript
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        // validate incoming message
        body: t.Object({
            message: t.String()
        }),
        query: t.Object({
            id: t.String()
        }),
        message(ws, { message }) {
            // Get schema from `ws.data`
            const { id } = ws.data.query
            ws.send({
                id,
                message,
                time: Date.now()
            })
        }
    })
    .listen(3000)
```

WebSocket schema can validate the following:

-   **message** - An incoming message.
-   **query** - Query string or URL parameters.
-   **params** - Path parameters.
-   **header** - Request's headers.
-   **cookie** - Request's cookie
-   **response** - Value returned from handler

By default Elysia will parse incoming stringified JSON message as Object for validation.

## Configuration

You can set Elysia constructor to set the Web Socket value.

```ts
import { Elysia } from 'elysia'

new Elysia({
    websocket: {
        idleTimeout: 30
    }
})
```

Elysia's WebSocket implementation extends Bun's WebSocket configuration, please refer to [Bun's WebSocket documentation](https://bun.sh/docs/api/websockets) for more information.

The following are a brief configuration from [Bun WebSocket](https://bun.sh/docs/api/websockets#create-a-websocket-server)

### perMessageDeflate

@default `false`

Enable compression for clients that support it.

By default, compression is disabled.

### maxPayloadLength

The maximum size of a message.

### idleTimeout

@default `120`

After a connection has not received a message for this many seconds, it will be closed.

### backpressureLimit

@default `16777216` (16MB)

The maximum number of bytes that can be buffered for a single connection.

### closeOnBackpressureLimit

@default `false`

Close the connection if the backpressure limit is reached.

## Methods

Below are the new methods that are available to the WebSocket route

## ws

Create a websocket handler

Example:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
    .ws('/ws', {
        message(ws, message) {
            ws.send(message)
        }
    })
    .listen(3000)
```

Type:

```typescript
.ws(endpoint: path, options: Partial<WebSocketHandler<Context>>): this
```

* **endpoint** - A path to exposed as websocket handler
* **options** - Customize WebSocket handler behavior

## WebSocketHandler

WebSocketHandler extends config from [config](#configuration).

Below is a config which is accepted by `ws`.

## open

Callback function for new websocket connection.

Type:

```typescript
open(ws: ServerWebSocket<{
    // uid for each connection
    id: string
    data: Context
}>): this
```

## message

Callback function for incoming websocket message.

Type:

```typescript
message(
    ws: ServerWebSocket<{
        // uid for each connection
        id: string
        data: Context
    }>,
    message: Message
): this
```

`Message` type based on `schema.message`. Default is `string`.

## close

Callback function for closing websocket connection.

Type:

```typescript
close(ws: ServerWebSocket<{
    // uid for each connection
    id: string
    data: Context
}>): this
```

## drain

Callback function for the server is ready to accept more data.

Type:

```typescript
drain(
    ws: ServerWebSocket<{
        // uid for each connection
        id: string
        data: Context
    }>,
    code: number,
    reason: string
): this
```

## parse

`Parse` middleware to parse the request before upgrading the HTTP connection to WebSocket.

## beforeHandle

`Before Handle` middleware which execute before upgrading the HTTP connection to WebSocket.

Ideal place for validation.

## transform

`Transform` middleware which execute before validation.

## transformMessage

Like `transform`, but execute before validation of WebSocket message

## header

Additional headers to add before upgrade connection to WebSocket.
`````

## File: docs/plugins/bearer.md
`````markdown
---
title: Bearer Plugin - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Bearer Plugin - ElysiaJS

  - - meta
    - name: 'description'
      content: Plugin for Elysia for retrieving Bearer token as specified in RFC6750. Start by installing the plugin with "bun add @elysiajs/bearer".

  - - meta
    - name: 'og:description'
      content: Plugin for Elysia for retrieving Bearer token as specified in RFC6750. Start by installing the plugin with "bun add @elysiajs/bearer".
---

# Bearer Plugin
Plugin for [elysia](https://github.com/elysiajs/elysia) for retrieving the Bearer token.

Install with:
```bash
bun add @elysiajs/bearer
```

Then use it:
```typescript twoslash
import { Elysia } from 'elysia'
import { bearer } from '@elysiajs/bearer'

const app = new Elysia()
    .use(bearer())
    .get('/sign', ({ bearer }) => bearer, {
        beforeHandle({ bearer, set, status }) {
            if (!bearer) {
                set.headers[
                    'WWW-Authenticate'
                ] = `Bearer realm='sign', error="invalid_request"`

                return status(400, 'Unauthorized')
            }
        }
    })
    .listen(3000)
```

This plugin is for retrieving a Bearer token specified in [RFC6750](https://www.rfc-editor.org/rfc/rfc6750#section-2).

This plugin DOES NOT handle authentication validation for your server. Instead, the plugin leaves the decision to developers to apply logic for handling validation check themselves.
`````

## File: docs/plugins/cors.md
`````markdown
---
title: CORS Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: CORS Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for customizing Cross-Origin Resource Sharing behavior. Start by installing the plugin with "bun add @elysiajs/cors".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for customizing Cross-Origin Resource Sharing behavior. Start by installing the plugin with "bun add @elysiajs/cors".
---

# CORS Plugin

This plugin adds support for customizing [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) behavior.

Install with:

```bash
bun add @elysiajs/cors
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

new Elysia().use(cors()).listen(3000)
```

This will set Elysia to accept requests from any origin.

## Config

Below is a config which is accepted by the plugin

### origin

@default `true`

Indicates whether the response can be shared with the requesting code from the given origins.

Value can be one of the following:

- **string** - Name of origin which will directly assign to [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) header.
- **boolean** - If set to true, [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) will be set to `*` (any origins)
- **RegExp** - Pattern to match request's URL, allowed if matched.
- **Function** - Custom logic to allow resource sharing, allow if `true` is returned.
    - Expected to have the type of:
    ```typescript
    cors(context: Context) => boolean | void
    ```
- **Array<string | RegExp | Function>** - iterate through all cases above in order, allowed if any of the values are `true`.

---

### methods

@default `*`

Allowed methods for cross-origin requests.

Assign [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) header.

Value can be one of the following:

- **undefined | null | ''** - Ignore all methods.
- **\*** - Allows all methods.
- **string** - Expects either a single method or a comma-delimited string
    - (eg: `'GET, PUT, POST'`)
- **string[]** - Allow multiple HTTP methods.
    - eg: `['GET', 'PUT', 'POST']`

---

### allowedHeaders

@default `*`

Allowed headers for an incoming request.

Assign [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) header.

Value can be one of the following:

- **string** - Expects either a single header or a comma-delimited string
    - eg: `'Content-Type, Authorization'`.
- **string[]** - Allow multiple HTTP headers.
    - eg: `['Content-Type', 'Authorization']`

---

### exposeHeaders

@default `*`

Response CORS with specified headers.

Assign [Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) header.

Value can be one of the following:

- **string** - Expects either a single header or a comma-delimited string.
    - eg: `'Content-Type, X-Powered-By'`.
- **string[]** - Allow multiple HTTP headers.
    - eg: `['Content-Type', 'X-Powered-By']`

---

### credentials

@default `true`

The Access-Control-Allow-Credentials response header tells browsers whether to expose the response to the frontend JavaScript code when the request's credentials mode [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) is `include`.

When a request's credentials mode [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) is `include`, browsers will only expose the response to the frontend JavaScript code if the Access-Control-Allow-Credentials value is true.

Credentials are cookies, authorization headers, or TLS client certificates.

Assign [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) header.

---

### maxAge

@default `5`

Indicates how long the results of a [preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) (that is the information contained in the [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) and [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) headers) can be cached.

Assign [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) header.

---

### preflight

The preflight request is a request sent to check if the CORS protocol is understood and if a server is aware of using specific methods and headers.

Response with **OPTIONS** request with 3 HTTP request headers:

- **Access-Control-Request-Method**
- **Access-Control-Request-Headers**
- **Origin**

This config indicates if the server should respond to preflight requests.

## Pattern

Below you can find the common patterns to use the plugin.

## Allow CORS by top-level domain

```typescript twoslash
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
	.use(
		cors({
			origin: /.*\.saltyaom\.com$/
		})
	)
	.get('/', () => 'Hi')
	.listen(3000)
```

This will allow requests from top-level domains with `saltyaom.com`
`````

## File: docs/plugins/cron.md
`````markdown
---
title: Cron Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Cron Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for running cronjob in Elysia server. Start by installing the plugin with "bun add @elysiajs/cron".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for customizing Cross-Origin Resource Sharing behavior. Start by installing the plugin with "bun add @elysiajs/cors".
---

# Cron Plugin

This plugin adds support for running cronjob in the Elysia server.

Install with:

```bash
bun add @elysiajs/cron
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'

new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: '*/10 * * * * *',
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.listen(3000)
```

The above code will log `heartbeat` every 10 seconds.

## cron

Create a cronjob for the Elysia server.

type:

```
cron(config: CronConfig, callback: (Instance['store']) => void): this
```

`CronConfig` accepts the parameters specified below:

### name

Job name to register to `store`.

This will register the cron instance to `store` with a specified name, which can be used to reference in later processes eg. stop the job.

### pattern

Time to run the job as specified by [cron syntax](https://en.wikipedia.org/wiki/Cron) specified as below:

```
┌────────────── second (optional)
│ ┌──────────── minute
│ │ ┌────────── hour
│ │ │ ┌──────── day of the month
│ │ │ │ ┌────── month
│ │ │ │ │ ┌──── day of week
│ │ │ │ │ │
* * * * * *
```

This can be generated by tools like [Crontab Guru](https://crontab.guru/)

---

This plugin extends the cron method to Elysia using [cronner](https://github.com/hexagon/croner).

Below are the configs accepted by cronner.

### timezone

Time zone in Europe/Stockholm format

### startAt

Schedule start time for the job

### stopAt

Schedule stop time for the job

### maxRuns

Maximum number of executions

### catch

Continue execution even if an unhandled error is thrown by a triggered function.

### interval

The minimum interval between executions, in seconds.

## Pattern

Below you can find the common patterns to use the plugin.

## Stop cronjob

You can stop cronjob manually by accessing the cronjob name registered to `store`.

```typescript
import { Elysia } from 'elysia'
import { cron } from '@elysiajs/cron'

const app = new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: '*/1 * * * * *',
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.get(
		'/stop',
		({
			store: {
				cron: { heartbeat }
			}
		}) => {
			heartbeat.stop()

			return 'Stop heartbeat'
		}
	)
	.listen(3000)
```

## Predefined patterns

You can use predefined patterns from `@elysiajs/cron/schedule`

```typescript
import { Elysia } from 'elysia'
import { cron, Patterns } from '@elysiajs/cron'

const app = new Elysia()
	.use(
		cron({
			name: 'heartbeat',
			pattern: Patterns.everySecond(),
			run() {
				console.log('Heartbeat')
			}
		})
	)
	.get(
		'/stop',
		({
			store: {
				cron: { heartbeat }
			}
		}) => {
			heartbeat.stop()

			return 'Stop heartbeat'
		}
	)
	.listen(3000)
```

### Functions

| Function                                 | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| `.everySeconds(2)`                       | Run the task every 2 seconds                          |
| `.everyMinutes(5)`                       | Run the task every 5 minutes                          |
| `.everyHours(3)`                         | Run the task every 3 hours                            |
| `.everyHoursAt(3, 15)`                   | Run the task every 3 hours at 15 minutes              |
| `.everyDayAt('04:19')`                   | Run the task every day at 04:19                       |
| `.everyWeekOn(Patterns.MONDAY, '19:30')` | Run the task every Monday at 19:30                    |
| `.everyWeekdayAt('17:00')`               | Run the task every day from Monday to Friday at 17:00 |
| `.everyWeekendAt('11:00')`               | Run the task on Saturday and Sunday at 11:00          |

### Function aliases to constants

| Function          | Constant                           |
| ----------------- | ---------------------------------- |
| `.everySecond()`  | EVERY_SECOND                       |
| `.everyMinute()`  | EVERY_MINUTE                       |
| `.hourly()`       | EVERY_HOUR                         |
| `.daily()`        | EVERY_DAY_AT_MIDNIGHT              |
| `.everyWeekday()` | EVERY_WEEKDAY                      |
| `.everyWeekend()` | EVERY_WEEKEND                      |
| `.weekly()`       | EVERY_WEEK                         |
| `.monthly()`      | EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT |
| `.everyQuarter()` | EVERY_QUARTER                      |
| `.yearly()`       | EVERY_YEAR                         |

### Constants

| Constant                                 | Pattern              |
| ---------------------------------------- | -------------------- |
| `.EVERY_SECOND`                          | `* * * * * *`        |
| `.EVERY_5_SECONDS`                       | `*/5 * * * * *`      |
| `.EVERY_10_SECONDS`                      | `*/10 * * * * *`     |
| `.EVERY_30_SECONDS`                      | `*/30 * * * * *`     |
| `.EVERY_MINUTE`                          | `*/1 * * * *`        |
| `.EVERY_5_MINUTES`                       | `0 */5 * * * *`      |
| `.EVERY_10_MINUTES`                      | `0 */10 * * * *`     |
| `.EVERY_30_MINUTES`                      | `0 */30 * * * *`     |
| `.EVERY_HOUR`                            | `0 0-23/1 * * *`     |
| `.EVERY_2_HOURS`                         | `0 0-23/2 * * *`     |
| `.EVERY_3_HOURS`                         | `0 0-23/3 * * *`     |
| `.EVERY_4_HOURS`                         | `0 0-23/4 * * *`     |
| `.EVERY_5_HOURS`                         | `0 0-23/5 * * *`     |
| `.EVERY_6_HOURS`                         | `0 0-23/6 * * *`     |
| `.EVERY_7_HOURS`                         | `0 0-23/7 * * *`     |
| `.EVERY_8_HOURS`                         | `0 0-23/8 * * *`     |
| `.EVERY_9_HOURS`                         | `0 0-23/9 * * *`     |
| `.EVERY_10_HOURS`                        | `0 0-23/10 * * *`    |
| `.EVERY_11_HOURS`                        | `0 0-23/11 * * *`    |
| `.EVERY_12_HOURS`                        | `0 0-23/12 * * *`    |
| `.EVERY_DAY_AT_1AM`                      | `0 01 * * *`         |
| `.EVERY_DAY_AT_2AM`                      | `0 02 * * *`         |
| `.EVERY_DAY_AT_3AM`                      | `0 03 * * *`         |
| `.EVERY_DAY_AT_4AM`                      | `0 04 * * *`         |
| `.EVERY_DAY_AT_5AM`                      | `0 05 * * *`         |
| `.EVERY_DAY_AT_6AM`                      | `0 06 * * *`         |
| `.EVERY_DAY_AT_7AM`                      | `0 07 * * *`         |
| `.EVERY_DAY_AT_8AM`                      | `0 08 * * *`         |
| `.EVERY_DAY_AT_9AM`                      | `0 09 * * *`         |
| `.EVERY_DAY_AT_10AM`                     | `0 10 * * *`         |
| `.EVERY_DAY_AT_11AM`                     | `0 11 * * *`         |
| `.EVERY_DAY_AT_NOON`                     | `0 12 * * *`         |
| `.EVERY_DAY_AT_1PM`                      | `0 13 * * *`         |
| `.EVERY_DAY_AT_2PM`                      | `0 14 * * *`         |
| `.EVERY_DAY_AT_3PM`                      | `0 15 * * *`         |
| `.EVERY_DAY_AT_4PM`                      | `0 16 * * *`         |
| `.EVERY_DAY_AT_5PM`                      | `0 17 * * *`         |
| `.EVERY_DAY_AT_6PM`                      | `0 18 * * *`         |
| `.EVERY_DAY_AT_7PM`                      | `0 19 * * *`         |
| `.EVERY_DAY_AT_8PM`                      | `0 20 * * *`         |
| `.EVERY_DAY_AT_9PM`                      | `0 21 * * *`         |
| `.EVERY_DAY_AT_10PM`                     | `0 22 * * *`         |
| `.EVERY_DAY_AT_11PM`                     | `0 23 * * *`         |
| `.EVERY_DAY_AT_MIDNIGHT`                 | `0 0 * * *`          |
| `.EVERY_WEEK`                            | `0 0 * * 0`          |
| `.EVERY_WEEKDAY`                         | `0 0 * * 1-5`        |
| `.EVERY_WEEKEND`                         | `0 0 * * 6,0`        |
| `.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT`    | `0 0 1 * *`          |
| `.EVERY_1ST_DAY_OF_MONTH_AT_NOON`        | `0 12 1 * *`         |
| `.EVERY_2ND_HOUR`                        | `0 */2 * * *`        |
| `.EVERY_2ND_HOUR_FROM_1AM_THROUGH_11PM`  | `0 1-23/2 * * *`     |
| `.EVERY_2ND_MONTH`                       | `0 0 1 */2 *`        |
| `.EVERY_QUARTER`                         | `0 0 1 */3 *`        |
| `.EVERY_6_MONTHS`                        | `0 0 1 */6 *`        |
| `.EVERY_YEAR`                            | `0 0 1 1 *`          |
| `.EVERY_30_MINUTES_BETWEEN_9AM_AND_5PM`  | `0 */30 9-17 * * *`  |
| `.EVERY_30_MINUTES_BETWEEN_9AM_AND_6PM`  | `0 */30 9-18 * * *`  |
| `.EVERY_30_MINUTES_BETWEEN_10AM_AND_7PM` | `0 */30 10-19 * * *` |
`````

## File: docs/plugins/graphql-apollo.md
`````markdown
---
title: Apollo GraphQL Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Apollo GraphQL Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for using GraphQL Apollo on the Elysia server. Start by installing the plugin with "bun add graphql @elysiajs/apollo @apollo/server".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for using GraphQL Apollo on the Elysia server. Start by installing the plugin with "bun add graphql @elysiajs/apollo @apollo/server".
---

# GraphQL Apollo Plugin

Plugin for [elysia](https://github.com/elysiajs/elysia) for using GraphQL Apollo.

Install with:

```bash
bun add graphql @elysiajs/apollo @apollo/server
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { apollo, gql } from '@elysiajs/apollo'

const app = new Elysia()
	.use(
		apollo({
			typeDefs: gql`
				type Book {
					title: String
					author: String
				}

				type Query {
					books: [Book]
				}
			`,
			resolvers: {
				Query: {
					books: () => {
						return [
							{
								title: 'Elysia',
								author: 'saltyAom'
							}
						]
					}
				}
			}
		})
	)
	.listen(3000)
```

Accessing `/graphql` should show Apollo GraphQL playground work with.

## Context

Because Elysia is based on Web Standard Request and Response which is different from Node's `HttpRequest` and `HttpResponse` that Express uses, results in `req, res` being undefined in context.

Because of this, Elysia replaces both with `context` like route parameters.

```typescript
const app = new Elysia()
	.use(
		apollo({
			typeDefs,
			resolvers,
			context: async ({ request }) => {
				const authorization = request.headers.get('Authorization')

				return {
					authorization
				}
			}
		})
	)
	.listen(3000)
```

## Config

This plugin extends Apollo's [ServerRegistration](https://www.apollographql.com/docs/apollo-server/api/apollo-server/#options) (which is `ApolloServer`'s' constructor parameter).

Below are the extended parameters for configuring Apollo Server with Elysia.

### path

@default `"/graphql"`

Path to expose Apollo Server.

### enablePlayground

@default `process.env.ENV !== 'production'`

Determine whether should Apollo should provide Apollo Playground.
`````

## File: docs/plugins/graphql-yoga.md
`````markdown
---
title: GraphQL Yoga Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: GraphQL Yoga Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for using GraphQL Yoga on the Elysia server. Start by installing the plugin with "bun add graphql graphql-yoga @elysiajs/graphql-yoga".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for using GraphQL Yoga on the Elysia server. Start by installing the plugin with "bun add graphql graphql-yoga @elysiajs/graphql-yoga".
---

# GraphQL Yoga Plugin

This plugin integrates GraphQL yoga with Elysia

Install with:

```bash
bun add @elysiajs/graphql-yoga
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'

const app = new Elysia()
	.use(
		yoga({
			typeDefs: /* GraphQL */ `
				type Query {
					hi: String
				}
			`,
			resolvers: {
				Query: {
					hi: () => 'Hello from Elysia'
				}
			}
		})
	)
	.listen(3000)
```

Accessing `/graphql` in the browser (GET request) would show you a GraphiQL instance for the GraphQL-enabled Elysia server.

optional: you can install a custom version of optional peer dependencies as well:

```bash
bun add graphql graphql-yoga
```

## Resolver

Elysia uses [Mobius](https://github.com/saltyaom/mobius) to infer type from **typeDefs** field automatically, allowing you to get full type-safety and auto-complete when typing **resolver** types.

## Context

You can add custom context to the resolver function by adding **context**

```ts
import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'

const app = new Elysia()
	.use(
		yoga({
			typeDefs: /* GraphQL */ `
				type Query {
					hi: String
				}
			`,
			context: {
				name: 'Mobius'
			},
			// If context is a function on this doesn't present
			// for some reason it won't infer context type
			useContext(_) {},
			resolvers: {
				Query: {
					hi: async (parent, args, context) => context.name
				}
			}
		})
	)
	.listen(3000)
```

## Config

This plugin extends [GraphQL Yoga's createYoga options, please refer to the GraphQL Yoga documentation](https://the-guild.dev/graphql/yoga-server/docs) with inlining `schema` config to root.

Below is a config which is accepted by the plugin

### path

@default `/graphql`

Endpoint to expose GraphQL handler
`````

## File: docs/plugins/html.md
`````markdown
---
title: HTML Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: HTML Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds shortcut support for returning HTML in the Elysia server. Start by installing the plugin with "bun add @elysiajs/html".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds shortcut support for returning HTML in the Elysia server. Start by installing the plugin with "bun add @elysiajs/html".
---

# HTML Plugin

Allows you to use [JSX](#jsx) and HTML with proper headers and support.

Install with:

```bash
bun add @elysiajs/html
```

Then use it:

```tsx twoslash
import React from 'react'
// ---cut---
import { Elysia } from 'elysia'
import { html, Html } from '@elysiajs/html'

new Elysia()
	.use(html())
	.get(
		'/html',
		() => `
            <html lang='en'>
                <head>
                    <title>Hello World</title>
                </head>
                <body>
                    <h1>Hello World</h1>
                </body>
            </html>`
	)
	.get('/jsx', () => (
		<html lang="en">
			<head>
				<title>Hello World</title>
			</head>
			<body>
				<h1>Hello World</h1>
			</body>
		</html>
	))
	.listen(3000)
```

This plugin will automatically add `Content-Type: text/html; charset=utf8` header to the response, add `<!doctype html>`, and convert it into a Response object.

## JSX

Elysia HTML is based on [@kitajs/html](https://github.com/kitajs/html) allowing us to define JSX to string in compile time to achieve high performance.

Name your file that needs to use JSX to end with affix **"x"**:

- .js -> .jsx
- .ts -> .tsx

To register the TypeScript type, please append the following to **tsconfig.json**:

```jsonc
// tsconfig.json
{
	"compilerOptions": {
		"jsx": "react",
		"jsxFactory": "Html.createElement",
		"jsxFragmentFactory": "Html.Fragment"
	}
}
```

That's it, now you can use JSX as your template engine:

```tsx twoslash
import React from 'react'
// ---cut---
import { Elysia } from 'elysia'
import { html, Html } from '@elysiajs/html' // [!code ++]

new Elysia()
	.use(html()) // [!code ++]
	.get('/', () => (
		<html lang="en">
			<head>
				<title>Hello World</title>
			</head>
			<body>
				<h1>Hello World</h1>
			</body>
		</html>
	))
	.listen(3000)
```

If the error `Cannot find name 'Html'. Did you mean 'html'?` occurs, this import must be added to the JSX template:

```tsx
import { Html } from '@elysiajs/html'
```

It is important that it is written in uppercase.

## XSS

Elysia HTML is based use of the Kita HTML plugin to detect possible XSS attacks in compile time.

You can use a dedicated `safe` attribute to sanitize user value to prevent XSS vulnerability.

```tsx
import { Elysia, t } from 'elysia'
import { html, Html } from '@elysiajs/html'

new Elysia()
	.use(html())
	.post(
		'/',
		({ body }) => (
			<html lang="en">
				<head>
					<title>Hello World</title>
				</head>
				<body>
					<h1 safe>{body}</h1>
				</body>
			</html>
		),
		{
			body: t.String()
		}
	)
	.listen(3000)
```

However, when are building a large-scale app, it's best to have a type reminder to detect possible XSS vulnerabilities in your codebase.

To add a type-safe reminder, please install:

```sh
bun add @kitajs/ts-html-plugin
```

Then appends the following **tsconfig.json**

```jsonc
// tsconfig.json
{
	"compilerOptions": {
		"jsx": "react",
		"jsxFactory": "Html.createElement",
		"jsxFragmentFactory": "Html.Fragment",
		"plugins": [{ "name": "@kitajs/ts-html-plugin" }]
	}
}
```

## Options

### contentType

- Type: `string`
- Default: `'text/html; charset=utf8'`

The content-type of the response.

### autoDetect

- Type: `boolean`
- Default: `true`

Whether to automatically detect HTML content and set the content-type.

### autoDoctype

- Type: `boolean | 'full'`
- Default: `true`

Whether to automatically add `<!doctype html>` to a response starting with `<html>`, if not found.

Use `full` to also automatically add doctypes on responses returned without this plugin

```ts
// without the plugin
app.get('/', () => '<html></html>')

// With the plugin
app.get('/', ({ html }) => html('<html></html>'))
```

### isHtml

- Type: `(value: string) => boolean`
- Default: `isHtml` (exported function)

The function is used to detect if a string is a html or not. Default implementation if length is greater than 7, starts with `<` and ends with `>`.

Keep in mind there's no real way to validate HTML, so the default implementation is a best guess.
`````

## File: docs/plugins/jwt.md
`````markdown
---
title: JWT Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: JWT Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for using JWT (JSON Web Token) in Elysia server. Start by installing the plugin with "bun add @elysiajs/jwt".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for using JWT (JSON Web Token) in Elysia server. Start by installing the plugin with "bun add @elysiajs/jwt".
---

# JWT Plugin
This plugin adds support for using JWT in Elysia handler

Install with:
```bash
bun add @elysiajs/jwt
```

Then use it:

::: code-group

```typescript [cookie]
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .get('/sign/:name', async ({ jwt, params: { name }, cookie: { auth } }) => {
    	const value = await jwt.sign({ name })

        auth.set({
            value,
            httpOnly: true,
            maxAge: 7 * 86400,
            path: '/profile',
        })

        return `Sign in as ${value}`
    })
    .get('/profile', async ({ jwt, status, cookie: { auth } }) => {
        const profile = await jwt.verify(auth.value)

        if (!profile)
            return status(401, 'Unauthorized')

        return `Hello ${profile.name}`
    })
    .listen(3000)
```

```typescript [headers]
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'Fischl von Luftschloss Narfidort'
        })
    )
    .get('/sign/:name', ({ jwt, params: { name } }) => {
    	return jwt.sign({ name })
    })
    .get('/profile', async ({ jwt, error, headers: { authorization } }) => {
        const profile = await jwt.verify(authorization)

        if (!profile)
            return status(401, 'Unauthorized')

        return `Hello ${profile.name}`
    })
    .listen(3000)
```

:::

## Config
This plugin extends config from [jose](https://github.com/panva/jose).

Below is a config that is accepted by the plugin.

### name
Name to register `jwt` function as.

For example, `jwt` function will be registered with a custom name.
```typescript
app
    .use(
        jwt({
            name: 'myJWTNamespace',
            secret: process.env.JWT_SECRETS!
        })
    )
    .get('/sign/:name', ({ myJWTNamespace, params }) => {
        return myJWTNamespace.sign(params)
    })
```

Because some might need to use multiple `jwt` with different configs in a single server, explicitly registering the JWT function with a different name is needed.

### secret
The private key to sign JWT payload with.

### schema
Type strict validation for JWT payload.

---
Below is a config that extends from [cookie](https://npmjs.com/package/cookie)

### alg
@default `HS256`

Signing Algorithm to sign JWT payload with.

Possible properties for jose are:
HS256
HS384
HS512
PS256
PS384
PS512
RS256
RS384
RS512
ES256
ES256K
ES384
ES512
EdDSA

### iss
The issuer claim identifies the principal that issued the JWT as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.1)

TLDR; is usually (the domain) name of the signer.

### sub
The subject claim identifies the principal that is the subject of the JWT.

The claims in a JWT are normally statements about the subject as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.2)

### aud
The audience claim identifies the recipients that the JWT is intended for.

Each principal intended to process the JWT MUST identify itself with a value in the audience claim as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.3)

### jti
JWT ID claim provides a unique identifier for the JWT as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.7)

### nbf
The "not before" claim identifies the time before which the JWT must not be accepted for processing as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.5)

### exp
The expiration time claim identifies the expiration time on or after which the JWT MUST NOT be accepted for processing as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4)

### iat
The "issued at" claim identifies the time at which the JWT was issued.

This claim can be used to determine the age of the JWT as per [RFC7519](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.6)

### b64
This JWS Extension Header Parameter modifies the JWS Payload representation and the JWS Signing input computation as per [RFC7797](https://www.rfc-editor.org/rfc/rfc7797).

### kid
A hint indicating which key was used to secure the JWS.

This parameter allows originators to explicitly signal a change of key to recipients as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.4)

### x5t
(X.509 certificate SHA-1 thumbprint) header parameter is a base64url-encoded SHA-1 digest of the DER encoding of the X.509 certificate [RFC5280](https://www.rfc-editor.org/rfc/rfc5280) corresponding to the key used to digitally sign the JWS as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.7)

### x5c
(X.509 certificate chain) header parameter contains the X.509 public key certificate or certificate chain [RFC5280](https://www.rfc-editor.org/rfc/rfc5280) corresponding to the key used to digitally sign the JWS as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.6)

### x5u
(X.509 URL) header parameter is a URI [RFC3986](https://www.rfc-editor.org/rfc/rfc3986) that refers to a resource for the X.509 public key certificate or certificate chain [RFC5280] corresponding to the key used to digitally sign the JWS as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.5)

### jwk
The "jku" (JWK Set URL) Header Parameter is a URI [RFC3986] that refers to a resource for a set of JSON-encoded public keys, one of which corresponds to the key used to digitally sign the JWS.

The keys MUST be encoded as a JWK Set [JWK] as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.2)

### typ
The `typ` (type) Header Parameter is used by JWS applications to declare the media type [IANA.MediaTypes] of this complete JWS.

This is intended for use by the application when more than one kind of object could be present in an application data structure that can contain a JWS as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.9)

### ctr
Content-Type parameter is used by JWS applications to declare the media type [IANA.MediaTypes] of the secured content (the payload).

This is intended for use by the application when more than one kind of object could be present in the JWS Payload as per [RFC7515](https://www.rfc-editor.org/rfc/rfc7515#section-4.1.9)

## Handler
Below are the value added to the handler.

### jwt.sign
A dynamic object of collection related to use with JWT registered by the JWT plugin.

Type:
```typescript
sign: (payload: JWTPayloadSpec): Promise<string>
```

`JWTPayloadSpec` accepts the same value as [JWT config](#config)

### jwt.verify
Verify payload with the provided JWT config

Type:
```typescript
verify(payload: string) => Promise<JWTPayloadSpec | false>
```

`JWTPayloadSpec` accepts the same value as [JWT config](#config)

## Pattern
Below you can find the common patterns to use the plugin.

## Set JWT expiration date
By default, the config is passed to `setCookie` and inherits its value.

```typescript
const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: 'kunikuzushi',
            exp: '7d'
        })
    )
    .get('/sign/:name', async ({ jwt, params }) => jwt.sign(params))
```

This will sign JWT with an expiration date of the next 7 days.
`````

## File: docs/plugins/opentelemetry.md
`````markdown
---
title: OpenTelemetry Plugin - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: OpenTelemetry Plugin - ElysiaJS

  - - meta
    - name: 'description'
      content: Plugin for Elysia that adds support for OpenTelemetry. Start by installing the plugin with "bun add @elysiajs/opentelemetry".

  - - meta
    - name: 'og:description'
      content: Plugin for Elysia that adds support for OpenTelemetry. Start by installing the plugin with "bun add @elysiajs/opentelemetry".
---

# OpenTelemetry

::: tip
This page is a **config reference** for **OpenTelemetry**, if you're looking to setup and integrate with OpenTelemetry, we recommended taking a look at [Integrate with OpenTelemetry](/integrations/opentelemetry) instead.
:::

To start using OpenTelemetry, install `@elysiajs/opentelemetry` and apply plugin to any instance.

```typescript twoslash
import { Elysia } from 'elysia'
import { opentelemetry } from '@elysiajs/opentelemetry'

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

new Elysia()
	.use(
		opentelemetry({
			spanProcessors: [
				new BatchSpanProcessor(
					new OTLPTraceExporter()
				)
			]
		})
	)
```

![jaeger showing collected trace automatically](/blog/elysia-11/jaeger.webp)

Elysia OpenTelemetry is will **collect span of any library compatible OpenTelemetry standard**, and will apply parent and child span automatically.

## Usage
See [opentelemetry](/integrations/opentelemetry) for usage and utilities

## Config
This plugin extends OpenTelemetry SDK parameters options.

Below is a config which is accepted by the plugin

### autoDetectResources - boolean
Detect resources automatically from the environment using the default resource detectors.

default: `true`

### contextManager - ContextManager
Use a custom context manager.

default: `AsyncHooksContextManager`

### textMapPropagator - TextMapPropagator
Use a custom propagator.

default: `CompositePropagator` using W3C Trace Context and Baggage

### metricReader - MetricReader
Add a MetricReader that will be passed to the MeterProvider.

### views - View[]
A list of views to be passed to the MeterProvider.

Accepts an array of View-instances. This parameter can be used to configure explicit bucket sizes of histogram metrics.

### instrumentations - (Instrumentation | Instrumentation[])[]
Configure instrumentations.

By default `getNodeAutoInstrumentations` is enabled, if you want to enable them you can use either metapackage or configure each instrumentation individually.

default: `getNodeAutoInstrumentations()`

### resource - IResource
Configure a resource.

Resources may also be detected by using the autoDetectResources method of the SDK.

### resourceDetectors - Array<Detector | DetectorSync>
Configure resource detectors. By default, the resource detectors are [envDetector, processDetector, hostDetector]. NOTE: In order to enable the detection, the parameter autoDetectResources has to be true.

If resourceDetectors was not set, you can also use the environment variable OTEL_NODE_RESOURCE_DETECTORS to enable only certain detectors, or completely disable them:

- env
- host
- os
- process
- serviceinstance (experimental)
- all - enable all resource detectors above
- none - disable resource detection

For example, to enable only the env, host detectors:

```bash
export OTEL_NODE_RESOURCE_DETECTORS="env,host"
```

### sampler - Sampler
Configure a custom sampler. By default, all traces will be sampled.

### serviceName - string
Namespace to be identify as.

### spanProcessors - SpanProcessor[]
An array of span processors to register to the tracer provider.

### traceExporter - SpanExporter
Configure a trace exporter. If an exporter is configured, it will be used with a `BatchSpanProcessor`.

If an exporter OR span processor is not configured programmatically, this package will auto setup the default otlp exporter with http/protobuf protocol with a BatchSpanProcessor.

### spanLimits - SpanLimits
Configure tracing parameters. These are the same trace parameters used to configure a tracer.
`````

## File: docs/plugins/overview.md
`````markdown
---
title: Plugin Overview - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Swagger Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Elysia is designed to be modular and lightweight, which is why Elysia includes pre-built plugins involving common patterns for convenient developer usage. Elysia is enhanced by community plugins which customize it even further.

    - - meta
      - name: 'og:description'
        content: Elysia is designed to be modular and lightweight, which is why Elysia includes pre-built plugins involving common patterns for convenient developer usage. Elysia is enhanced by community plugins which customize it even further.
---

# Overview

Elysia is designed to be modular and lightweight.

Following the same idea as Arch Linux (btw, I use Arch):

> Design decisions are made on a case-by-case basis through developer consensus

This is to ensure developers end up with a performant web server they intend to create. By extension, Elysia includes pre-built common pattern plugins for convenient developer usage:

## Official plugins:

-   [Bearer](/plugins/bearer) - retrieve [Bearer](https://swagger.io/docs/specification/authentication/bearer-authentication/) token automatically
-   [CORS](/plugins/cors) - set up [Cross-origin resource sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
-   [Cron](/plugins/cron) - set up [cron](https://en.wikipedia.org/wiki/Cron) job
-   [Eden](/eden/overview) - end-to-end type safety client for Elysia
-   [GraphQL Apollo](/plugins/graphql-apollo) - run [Apollo GraphQL](https://www.apollographql.com/) on Elysia
-   [GraphQL Yoga](/plugins/graphql-yoga) - run [GraphQL Yoga](https://github.com/dotansimha/graphql-yoga) on Elysia
-   [HTML](/plugins/html) - handle HTML responses
-   [JWT](/plugins/jwt) - authenticate with [JWTs](https://jwt.io/)
-   [OpenTelemetry](/plugins/opentelemetry) - add support for OpenTelemetry
-   [Server Timing](/plugins/server-timing) - audit performance bottlenecks with the [Server-Timing API](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)
-   [Static](/plugins/static) - serve static files/folders
-   [Stream](/plugins/stream) - integrate response streaming and [server-sent events (SSEs)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
-   [Swagger](/plugins/swagger) - generate [Swagger](https://swagger.io/) documentation
-   [tRPC](/plugins/trpc) - support [tRPC](https://trpc.io/)
-   [WebSocket](/patterns/websocket) - support [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## Community plugins:

-   [BunSai](https://github.com/nikiskaarup/bunsai2) - full-stack agnostic framework for the web, built upon Bun and Elysia
-   [Create ElysiaJS](https://github.com/kravetsone/create-elysiajs) - scaffolding your Elysia project with the environment with easy (help with ORM, Linters and Plugins)!
-   [Lucia Auth](https://github.com/pilcrowOnPaper/lucia) - authentication, simple and clean
-   [Elysia Clerk](https://github.com/wobsoriano/elysia-clerk) - unofficial Clerk authentication plugin
-   [Elysia Polyfills](https://github.com/bogeychan/elysia-polyfills) - run Elysia ecosystem on Node.js and Deno
-   [Vite server](https://github.com/kravetsone/elysia-vite-server) - plugin which start and decorate [`vite`](https://vitejs.dev/) dev server in `development` and in `production` mode serve static (if it needed)
-   [Vite](https://github.com/timnghg/elysia-vite) - serve entry HTML file with Vite's scripts injected
-   [Nuxt](https://github.com/trylovetom/elysiajs-nuxt) - easily integrate elysia with nuxt!
-   [Remix](https://github.com/kravetsone/elysia-remix) - use [Remix](https://remix.run/) with `HMR` support (powered by [`vite`](https://vitejs.dev/))! Close a really long-standing plugin request [#12](https://github.com/elysiajs/elysia/issues/12)
-   [Sync](https://github.com/johnny-woodtke/elysiajs-sync) - a lightweight offline-first data synchronization framework powered by [Dexie.js](https://dexie.org/)
-   [Connect middleware](https://github.com/kravetsone/elysia-connect-middleware) - plugin which allows you to use [`express`](https://www.npmjs.com/package/express)/[`connect`](https://www.npmjs.com/package/connect) middleware directly in Elysia!
-   [Elysia Helmet](https://github.com/DevTobias/elysia-helmet) - secure Elysia apps with various HTTP headers
-   [Vite Plugin SSR](https://github.com/timnghg/elysia-vite-plugin-ssr) - Vite SSR plugin using Elysia server
-   [OAuth 2.0](https://github.com/kravetsone/elysia-oauth2) - a plugin for [OAuth 2.0](https://en.wikipedia.org/wiki/OAuth) Authorization Flow with more than **42** providers and **type-safety**!
-   [OAuth2](https://github.com/bogeychan/elysia-oauth2) - handle OAuth 2.0 authorization code flow
-   [OAuth2 Resource Server](https://github.com/ap-1/elysia-oauth2-resource-server) - a plugin for validating JWT tokens from OAuth2 providers against JWKS endpoints with support for issuer, audience, and scope verification
-   [Elysia OpenID Client](https://github.com/macropygia/elysia-openid-client) - OpenID client based on [openid-client](https://github.com/panva/node-openid-client)
-   [Rate Limit](https://github.com/rayriffy/elysia-rate-limit) - simple, lightweight rate limiter
-   [Logysia](https://github.com/tristanisham/logysia) - classic logging middleware
-   [Logestic](https://github.com/cybercoder-naj/logestic) - an advanced and customisable logging library for ElysiaJS
-   [Logger](https://github.com/bogeychan/elysia-logger) - [pino](https://github.com/pinojs/pino)-based logging middleware
-   [Elylog](https://github.com/eajr/elylog) - simple stdout logging library with some customization
-   [Logify for Elysia.js](https://github.com/0xrasla/logify) - a beautiful, fast, and type-safe logging middleware for Elysia.js applications
-   [Nice Logger](https://github.com/tanishqmanuja/nice-logger) - not the nicest, but a pretty nice and sweet logger for Elysia.
-   [Sentry](https://github.com/johnny-woodtke/elysiajs-sentry) - capture traces and errors with this [Sentry](https://docs.sentry.io/) plugin
-   [Elysia Lambda](https://github.com/TotalTechGeek/elysia-lambda) - deploy on AWS Lambda
-   [Decorators](https://github.com/gaurishhs/elysia-decorators) - use TypeScript decorators
-   [Autoload](https://github.com/kravetsone/elysia-autoload) - filesystem router based on a directory structure that generates types for [Eden](https://elysiajs.com/eden/overview.html) with [`Bun.build`](https://github.com/kravetsone/elysia-autoload?tab=readme-ov-file#bun-build-usage) support
-   [Msgpack](https://github.com/kravetsone/elysia-msgpack) - allows you to work with [MessagePack](https://msgpack.org)
-   [XML](https://github.com/kravetsone/elysia-xml) - allows you to work with XML
-   [Autoroutes](https://github.com/wobsoriano/elysia-autoroutes) - filesystem routes
-   [Group Router](https://github.com/itsyoboieltr/elysia-group-router) - filesystem and folder-based router for groups
-   [Basic Auth](https://github.com/itsyoboieltr/elysia-basic-auth) - basic HTTP authentication
-   [ETag](https://github.com/bogeychan/elysia-etag) - automatic HTTP [ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) generation
-   [Basic Auth](https://github.com/eelkevdbos/elysia-basic-auth) - basic HTTP authentication (using `request` event)
-   [i18n](https://github.com/eelkevdbos/elysia-i18next) - [i18n](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n) wrapper based on [i18next](https://www.i18next.com/)
-   [Elysia Request ID](https://github.com/gtramontina/elysia-requestid) - add/forward request IDs (`X-Request-ID` or custom)
-   [Elysia HTMX](https://github.com/gtramontina/elysia-htmx) - context helpers for [HTMX](https://htmx.org/)
-   [Elysia HMR HTML](https://github.com/gtrabanco/elysia-hmr-html) - reload HTML files when changing any file in a directory
-   [Elysia Inject HTML](https://github.com/gtrabanco/elysia-inject-html) - inject HTML code in HTML files
-   [Elysia HTTP Error](https://github.com/yfrans/elysia-http-error) - return HTTP errors from Elysia handlers
-   [Elysia Http Status Code](https://github.com/sylvain12/elysia-http-status-code) - integrate HTTP status codes
-   [NoCache](https://github.com/gaurishhs/elysia-nocache) - disable caching
-   [Elysia Tailwind](https://github.com/gtramontina/elysia-tailwind) - compile [Tailwindcss](https://tailwindcss.com/) in a plugin.
-   [Elysia Compression](https://github.com/gusb3ll/elysia-compression) - compress response
-   [Elysia IP](https://github.com/gaurishhs/elysia-ip) - get the IP Address
-   [OAuth2 Server](https://github.com/myazarc/elysia-oauth2-server) - developing an OAuth2 Server with Elysia
-   [Elysia Flash Messages](https://github.com/gtramontina/elysia-flash-messages) - enable flash messages
-   [Elysia AuthKit](https://github.com/gtramontina/elysia-authkit) - unnoficial [WorkOS' AuthKit](https://www.authkit.com/) authentication
-   [Elysia Error Handler](https://github.com/gtramontina/elysia-error-handler) - simpler error handling
-   [Elysia env](https://github.com/yolk-oss/elysia-env) - typesafe environment variables with typebox
-   [Elysia Drizzle Schema](https://github.com/Edsol/elysia-drizzle-schema) - helps to use Drizzle ORM schema inside elysia swagger model.
-   [Unify-Elysia](https://github.com/qlaffont/unify-elysia) - unify error code for Elysia
-   [Unify-Elysia-GQL](https://github.com/qlaffont/unify-elysia-gql) - unify error code for Elysia GraphQL Server (Yoga & Apollo)
-   [Elysia Auth Drizzle](https://github.com/qlaffont/elysia-auth-drizzle) - library who handle authentification with JWT (Header/Cookie/QueryParam).
-   [graceful-server-elysia](https://github.com/qlaffont/graceful-server-elysia) - library inspired by [graceful-server](https://github.com/gquittet/graceful-server).
-   [Logixlysia](https://github.com/PunGrumpy/logixlysia) - a beautiful and simple logging middleware for ElysiaJS with colors and timestamps.
-   [Elysia Fault](https://github.com/vitorpldev/elysia-fault) - a simple and customizable error handling middleware with the possibility of creating your own HTTP errors
-   [Elysia Compress](https://github.com/vermaysha/elysia-compress) - ElysiaJS plugin to compress responses inspired by [@fastify/compress](https://github.com/fastify/fastify-compress)
-   [@labzzhq/compressor](https://github.com/labzzhq/compressor/) - Compact Brilliance, Expansive Results: HTTP Compressor for Elysia and Bunnyhop with gzip, deflate and brotli support.
-   [Elysia Accepts](https://github.com/morigs/elysia-accepts) - Elysia plugin for accept headers parsing and content negotiation
-   [Elysia Compression](https://github.com/chneau/elysia-compression) - Elysia plugin for compressing responses
-   [Elysia Logger](https://github.com/chneau/elysia-logger) - Elysia plugin for logging HTTP requests and responses inspired by [hono/logger](https://hono.dev/docs/middleware/builtin/logger)
-   [Elysia CQRS](https://github.com/jassix/elysia-cqrs) - Elysia plugin for CQRS pattern
-   [Elysia Supabase](https://github.com/mastermakrela/elysia-supabase) - Seamlessly integrate [Supabase](https://supabase.com/) authentication and database functionality into Elysia, allowing easy access to authenticated user data and Supabase client instance. Especially useful for [Edge Functions](https://supabase.com/docs/guides/functions).
-   [Elysia XSS](https://www.npmjs.com/package/elysia-xss) - a plugin for Elysia.js that provides XSS (Cross-Site Scripting) protection by sanitizing request body data.
-   [Elysiajs Helmet](https://www.npmjs.com/package/elysiajs-helmet) - a comprehensive security middleware for Elysia.js applications that helps secure your apps by setting various HTTP headers.
-   [Decorators for Elysia.js](https://github.com/Ateeb-Khan-97/better-elysia) - seamlessly develop and integrate APIs, Websocket and Streaming APIs with this small library.
-   [Elysia Protobuf](https://github.com/ilyhalight/elysia-protobuf) - support protobuf for Elysia.
-   [Elysia Prometheus](https://github.com/m1handr/elysia-prometheus) - Elysia plugin for exposing HTTP metrics for Prometheus.
-   [Elysia Remote DTS](https://github.com/rayriffy/elysia-remote-dts) - A plugin that provide .d.ts types remotely for Eden Treaty to consume.

## Complementary projects:
-   [prismabox](https://github.com/m1212e/prismabox) - Generator for typebox schemes based on your database models, works well with elysia

---

If you have a plugin written for Elysia, feel free to add your plugin to the list by **clicking <i>Edit this page on GitHub</i>** below 👇
`````

## File: docs/plugins/server-timing.md
`````markdown
---
title: Server Timing Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Server Timing Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia for performance audit via Server Timing API. Start by installing the plugin with "bun add @elysiajs/server-timing".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia for performance audit via Server Timing API. Start by installing the plugin with "bun add @elysiajs/server-timing".
---

# Server Timing Plugin
This plugin adds support for auditing performance bottlenecks with Server Timing API

Install with:
```bash
bun add @elysiajs/server-timing
```

Then use it:
```typescript twoslash
import { Elysia } from 'elysia'
import { serverTiming } from '@elysiajs/server-timing'

new Elysia()
    .use(serverTiming())
    .get('/', () => 'hello')
    .listen(3000)
```

Server Timing then will append header 'Server-Timing' with log duration, function name, and detail for each life-cycle function.

To inspect, open browser developer tools > Network > [Request made through Elysia server] > Timing.

![Developer tools showing Server Timing screenshot](/assets/server-timing.webp)

Now you can effortlessly audit the performance bottleneck of your server.

## Config
Below is a config which is accepted by the plugin

### enabled
@default `NODE_ENV !== 'production'`

Determine whether or not Server Timing should be enabled

### allow
@default `undefined`

A condition whether server timing should be log

### trace
@default `undefined`

Allow Server Timing to log specified life-cycle events:

Trace accepts objects of the following:
- request: capture duration from request
- parse: capture duration from parse
- transform: capture duration from transform
- beforeHandle: capture duration from beforeHandle
- handle: capture duration from the handle
- afterHandle: capture duration from afterHandle
- total: capture total duration from start to finish

## Pattern
Below you can find the common patterns to use the plugin.

- [Allow Condition](#allow-condition)

## Allow Condition
You may disable Server Timing on specific routes via `allow` property

```ts twoslash
import { Elysia } from 'elysia'
import { serverTiming } from '@elysiajs/server-timing'

new Elysia()
    .use(
        serverTiming({
            allow: ({ request }) => {
                return new URL(request.url).pathname !== '/no-trace'
            }
        })
    )
```
`````

## File: docs/plugins/static.md
`````markdown
---
title: Static Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Static Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for serving static files/folders for Elysia Server. Start by installing the plugin with "bun add @elysiajs/static".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for serving static files/folders for Elysia Server. Start by installing the plugin with "bun add @elysiajs/static".
---

# Static Plugin
This plugin can serve static files/folders for Elysia Server

Install with:
```bash
bun add @elysiajs/static
```

Then use it:
```typescript twoslash
import { Elysia } from 'elysia'
import { staticPlugin } from '@elysiajs/static'

new Elysia()
    .use(staticPlugin())
    .listen(3000)
```

By default, the static plugin default folder is `public`, and registered with `/public` prefix.

Suppose your project structure is:
```
| - src
  | - index.ts
| - public
  | - takodachi.png
  | - nested
    | - takodachi.png
```

The available path will become:
- /public/takodachi.png
- /public/nested/takodachi.png

## Config
Below is a config which is accepted by the plugin

### assets
@default `"public"`

Path to the folder to expose as static

### prefix
@default `"/public"`

Path prefix to register public files

### ignorePatterns
@default `[]`

List of files to ignore from serving as static files

### staticLimit
@default `1024`

By default, the static plugin will register paths to the Router with a static name, if the limits are exceeded, paths will be lazily added to the Router to reduce memory usage.
Tradeoff memory with performance.

### alwaysStatic
@default `false`

If set to true, static files path will be registered to Router skipping the `staticLimits`.

### headers
@default `{}`

Set response headers of files

### indexHTML
@default `false`

If set to true, the `index.html` file from the static directory will be served for any request that is matching neither a route nor any existing static file.

## Pattern
Below you can find the common patterns to use the plugin.

- [Single File](#single-file)

## Single file
Suppose you want to return just a single file, you can use `file` instead of using the static plugin
```typescript twoslash
import { Elysia, file } from 'elysia'

new Elysia()
    .get('/file', file('public/takodachi.png'))
```
`````

## File: docs/plugins/stream.md
`````markdown
---
title: Stream Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Stream Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for streaming response and Server-Sent Events, eg. OpenAI integration. Start by installing the plugin with "bun add @elysiajs/stream".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for streaming response and Server-Sent Events, eg. OpenAI integration. Start by installing the plugin with "bun add @elysiajs/stream".
---

# Stream Plugin

::: warning
This plugin is in maintenance mode and will not receive new features. We recommend using the [Generator Stream instead](/essential/handler#stream)
:::

This plugin adds support for streaming response or sending Server-Sent Event back to the client.

Install with:
```bash
bun add @elysiajs/stream
```

Then use it:
```typescript
import { Elysia } from 'elysia'
import { Stream } from '@elysiajs/stream'

new Elysia()
    .get('/', () => new Stream(async (stream) => {
        stream.send('hello')

        await stream.wait(1000)
        stream.send('world')

        stream.close()
    }))
    .listen(3000)
```

By default, `Stream` will return `Response` with `content-type` of `text/event-stream; charset=utf8`.

## Constructor
Below is the constructor parameter accepted by `Stream`:
1. Stream:
    - Automatic: Automatically stream response from a provided value
        - Iterable
        - AsyncIterable
        - ReadableStream
        - Response
    - Manual: Callback of `(stream: this) => unknown` or `undefined`
2. Options: `StreamOptions`
    - [event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event): A string identifying the type of event described
    - [retry](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#retry): The reconnection time in milliseconds

## Method
Below is the method provided by `Stream`:

### send
Enqueue data to stream to send back to the client

### close
Close the stream

### wait
Return a promise that resolves in the provided value in ms

### value
Inner value of the `ReadableStream`

## Pattern
Below you can find the common patterns to use the plugin.
- [OpenAI](#openai)
- [Fetch Stream](#fetch-stream)
- [Server Sent Event](#server-sent-event)

## OpenAI
Automatic mode is triggered when the parameter is either `Iterable` or `AsyncIterable` streaming the response back to the client automatically.

Below is an example of integrating ChatGPT into Elysia.

```ts
new Elysia()
    .get(
        '/ai',
        ({ query: { prompt } }) =>
            new Stream(
                openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    stream: true,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            )
    )
```

By default [openai](https://npmjs.com/package/openai) chatGPT completion returns `AsyncIterable` so you should be able to wrap the OpenAI in `Stream`.

## Fetch Stream
You can pass a fetch from an endpoint that returns the stream to proxy a stream.

This is useful for those endpoints that use AI text generation since you can proxy it directly, eg. [Cloudflare AI](https://developers.cloudflare.com/workers-ai/models/llm/#examples---chat-style-with-system-prompt-preferred).
```ts
const model = '@cf/meta/llama-2-7b-chat-int8'
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT_ID}/ai/run/${model}`

new Elysia()
    .get('/ai', ({ query: { prompt } }) =>
        fetch(endpoint, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${API_TOKEN}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a friendly assistant' },
                    { role: 'user', content: prompt }
                ]
            })
        })
    )
```

## Server Sent Event
Manual mode is triggered when the parameter is either `callback` or `undefined`, allowing you to control the stream.

### callback-based
Below is an example of creating a Server-Sent Event endpoint using a constructor callback

```ts
new Elysia()
    .get('/source', () =>
        new Stream((stream) => {
            const interval = setInterval(() => {
                stream.send('hello world')
            }, 500)

            setTimeout(() => {
                clearInterval(interval)
                stream.close()
            }, 3000)
        })
    )
```

### value-based
Below is an example of creating a Server-Sent Event endpoint using a value-based

```ts
new Elysia()
    .get('/source', () => {
        const stream = new Stream()

        const interval = setInterval(() => {
            stream.send('hello world')
        }, 500)

        setTimeout(() => {
            clearInterval(interval)
            stream.close()
        }, 3000)

        return stream
    })
```

Both callback-based and value-based streams work in the same way but with different syntax for your preference.
`````

## File: docs/plugins/swagger.md
`````markdown
---
title: Swagger Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: Swagger Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for generating Swagger API documentation for Elysia Server. Start by installing the plugin with "bun add @elysiajs/swagger".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for generating Swagger API documentation for Elysia Server. Start by installing the plugin with "bun add @elysiajs/swagger".
---

# Swagger Plugin

This plugin generates a Swagger endpoint for an Elysia server

Install with:

```bash
bun add @elysiajs/swagger
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(swagger())
    .get('/', () => 'hi')
    .post('/hello', () => 'world')
    .listen(3000)
```

Accessing `/swagger` would show you a Scalar UI with the generated endpoint documentation from the Elysia server. You can also access the raw OpenAPI spec at `/swagger/json`.

## Config

Below is a config which is accepted by the plugin

### provider

@default `scalar`

UI Provider for documentation. Default to Scalar.

### scalar

Configuration for customizing Scalar.

Please refer to the [Scalar config](https://github.com/scalar/scalar/blob/main/documentation/configuration.md)

### swagger

Configuration for customizing Swagger.

Please refer to the [Swagger specification](https://swagger.io/specification/v2/).

### excludeStaticFile

@default `true`

Determine if Swagger should exclude static files.

### path

@default `/swagger`

Endpoint to expose Swagger

### exclude

Paths to exclude from Swagger documentation.

Value can be one of the following:

-   **string**
-   **RegExp**
-   **Array<string | RegExp>**

## Pattern

Below you can find the common patterns to use the plugin.

## Change Swagger Endpoint

You can change the swagger endpoint by setting [path](#path) in the plugin config.

```typescript twoslash
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(
        swagger({
            path: '/v2/swagger'
        })
    )
    .listen(3000)
```

## Customize Swagger info

```typescript twoslash
import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'

new Elysia()
    .use(
        swagger({
            documentation: {
                info: {
                    title: 'Elysia Documentation',
                    version: '1.0.0'
                }
            }
        })
    )
    .listen(3000)
```

## Using Tags

Elysia can separate the endpoints into groups by using the Swaggers tag system

Firstly define the available tags in the swagger config object

```typescript
app.use(
    swagger({
        documentation: {
            tags: [
                { name: 'App', description: 'General endpoints' },
                { name: 'Auth', description: 'Authentication endpoints' }
            ]
        }
    })
)
```

Then use the details property of the endpoint configuration section to assign that endpoint to the group

```typescript
app.get('/', () => 'Hello Elysia', {
    detail: {
        tags: ['App']
    }
})

app.group('/auth', (app) =>
    app.post(
        '/sign-up',
        async ({ body }) =>
            db.user.create({
                data: body,
                select: {
                    id: true,
                    username: true
                }
            }),
        {
            detail: {
                tags: ['Auth']
            }
        }
    )
)
```

Which will produce a swagger page like the following
<img width="1446" alt="image" src="/assets/swagger-demo.webp">

## Security Configuration

To secure your API endpoints, you can define security schemes in the Swagger configuration. The example below demonstrates how to use Bearer Authentication (JWT) to protect your endpoints:

```typescript
app.use(
    swagger({
        documentation: {
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    })
)

export const addressController = new Elysia({
    prefix: '/address',
    detail: {
        tags: ['Address'],
        security: [
            {
                bearerAuth: []
            }
        ]
    }
})
```

This configuration ensures that all endpoints under the `/address` prefix require a valid JWT token for access.
`````

## File: docs/plugins/trpc.md
`````markdown
---
title: tRPC Plugin - ElysiaJS
head:
    - - meta
      - property: 'og:title'
        content: tRPC Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for using tRPC on Bun with Elysia Server. Start by installing the plugin with "bun add @elysiajs/trpc".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for using tRPC on Bun with Elysia Server. Start by installing the plugin with "bun add @elysiajs/trpc".
---

# tRPC Plugin

This plugin adds support for using [tRPC](https://trpc.io/)

Install with:

```bash
bun add @elysiajs/trpc @trpc/server @elysiajs/websocket
```

Then use it:

```typescript
import { Elysia, t as T } from 'elysia'

import { initTRPC } from '@trpc/server'
import { compile as c, trpc } from '@elysiajs/trpc'

const t = initTRPC.create()
const p = t.procedure

const router = t.router({
	greet: p
		// 💡 Using Zod
		//.input(z.string())
		// 💡 Using Elysia's T
		.input(c(T.String()))
		.query(({ input }) => input)
})

export type Router = typeof router

const app = new Elysia().use(trpc(router)).listen(3000)
```

## trpc

Accept the tRPC router and register to Elysia's handler.

````ts
trpc(
	router: Router,
	option?: {
	    endpoint?: string
	}
): this
```

`Router` is the TRPC Router instance.

### endpoint

The path to the exposed TRPC endpoint.
````
`````
