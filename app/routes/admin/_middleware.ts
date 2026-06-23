import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c, next) => {
  // Biarkan halaman login bisa diakses tanpa token
  if (c.req.path === '/admin/login') {
    return await next()
  }
  
  const token = getCookie(c, 'auth_token')
  
  // Jika tidak ada token (belum login), tendang ke halaman login
  if (!token) {
    return c.redirect('/admin/login')
  }
  
  try {
    // Verifikasi keaslian JWT Token
    await verify(token, c.env.JWT_SECRET)
    await next()
  } catch (err) {
    // Jika token kedaluwarsa atau tidak valid (palsu)
    return c.redirect('/admin/login')
  }
})
