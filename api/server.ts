// server.ts
import app from './app'
import { env } from './lib/env'

const port = env.PORT ?? 3000
if (!app) { throw new Error('app is undefined (check exports in app.ts)') }

app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
})
