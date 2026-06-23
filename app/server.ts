import { createApp } from 'honox/server'

const app = createApp()

app.use('/*', async (c, next) => {
  const path = c.req.path
  
  if (path.startsWith('/admin') || path === '/' || path.startsWith('/static')) {
    return await next()
  }

  const lookupSlug = path.substring(1)
  
  const link = await c.env.DB.prepare('SELECT * FROM links WHERE slug = ?').bind(lookupSlug).first<{
    target_url: string, og_title: string, og_description: string, og_image_url: string, og_site_name: string
  }>()

  if (!link) return c.text('Link tidak ditemukan', 404)

  const userAgent = c.req.header('user-agent') || ''
  const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Pinterest|LinkedInBot|TelegramBot/i.test(userAgent)

  // PERBAIKAN: Tambahkan cek "c.req.query('debug') === '1'"
  if (isBot || c.req.query('debug') === '1') {
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
        
        ${link.og_site_name ? `<meta property="og:site_name" content="${link.og_site_name}" />` : ''}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${link.og_title}" />
        <meta name="twitter:description" content="${link.og_description}" />
        <meta name="twitter:image" content="${link.og_image_url}" />
      </head>
      <body style="background:#f3f4f6; padding: 2rem; font-family: sans-serif;">
        <h2>Mode Debug Aktif</h2>
        <p>Nilai og_site_name dari database adalah: <b>${link.og_site_name || 'KOSONG / UNDEFINED'}</b></p>
        <p>Silakan klik kanan dan pilih <b>"View Page Source"</b> untuk melihat struktur tag meta-nya.</p>
      </body>
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
