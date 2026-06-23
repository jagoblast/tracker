import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { createApp } from 'honox/server'

const app = createApp()

// Middleware Autentikasi Admin
app.use('/admin/*', async (c, next) => {
  if (c.req.path === '/admin/login') return await next()
  
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/admin/login')
  
  try {
    await verify(token, c.env.JWT_SECRET)
    await next()
  } catch (err) {
    return c.redirect('/admin/login')
  }
})

// Smart Catch-All Redirector
app.get('/*', async (c, next) => {
  const path = c.req.path
  if (path.startsWith('/admin') || path === '/' || path.startsWith('/static')) {
    return await next()
  }

  const lookupSlug = path.substring(1)
  const link = await c.env.DB.prepare('SELECT * FROM links WHERE slug = ?').bind(lookupSlug).first<{
    target_url: string, og_title: string, og_description: string, og_image_url: string
  }>()

  if (!link) return c.text('Link tidak ditemukan', 404)

  const userAgent = c.req.header('user-agent') || ''
  const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Pinterest|LinkedInBot|TelegramBot/i.test(userAgent)

  if (isBot) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${link.og_title}</title>
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${c.req.url}" />
        <meta property="og:title" content="${link.og_title}" />
        <meta property="og:description" content="${link.og_description}" />
        <meta property="og:image" content="${link.og_image_url}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${link.og_title}" />
        <meta name="twitter:description" content="${link.og_description}" />
        <meta name="twitter:image" content="${link.og_image_url}" />
      </head>
      <body>Mengarahkan...</body>
      </html>
    `)
  }

  if (c.env.ANALYTICS) {
    try {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [lookupSlug, c.req.header('cf-ipcountry') || 'Unknown', userAgent],
        doubles: [1]
      })
    } catch (e) {}
  }

  return c.redirect(link.target_url, 302)
})

export default app
