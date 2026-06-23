import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createMiddleware(async (c, next) => {
  // Biarkan halaman login bisa diakses tanpa token
  if (c.req.path === '/admin/login') {
    await next()
    return // Berhenti di sini, biarkan route login yang memproses Response
  }
  
  const token = getCookie(c, 'auth_token')
  
  if (!token) {
    return c.redirect('/admin/login')
  }
  
  try {
    await verify(token, c.env.JWT_SECRET)
    await next()
  } catch (err) {
    return c.redirect('/admin/login')
  }
})
