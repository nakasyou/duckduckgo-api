import { Hono } from 'hono'
import { DOMParser } from '@b-fuze/deno-dom'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'

const app = new Hono()

app.use(cors(), prettyJSON())

app.get('*', async c => {
  const searchUrl = new URL('https://html.duckduckgo.com/html')
  searchUrl.searchParams.set('q', c.req.query('q') ?? '')

  const html = await fetch(searchUrl).then(res => res.text())
  const dom = new DOMParser().parseFromString(html, 'text/html')

  const resultElems = dom.getElementsByClassName('result')

  const result: {
    url: string
    title: string
    description: string
  }[] = []
  for (const resultElem of resultElems) {
    const a = resultElem.querySelector('.result__a')
    if (!a) {
      continue
    }
    const href = new URL(a.getAttribute('href') ?? '', searchUrl)
    const url = href.searchParams.get('uddg') ?? ''

    const titleElem = resultElem.querySelector('.result__title')
    const descElem = resultElem.querySelector('.result__snippet')
    if (!titleElem || !descElem) {
      continue
    }
    const title = titleElem.textContent.trim()
    const description = descElem.textContent.trim()
    
    result.push({
      url,
      title,
      description
    })
  }

  c.header('Content-Type', 'application/json; charset=UTF-8')
  return c.body(JSON.stringify(result))
})

export default app
