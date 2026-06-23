import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c, next) => {
  if (c.req.path.startsWith('/admin/login')) {
    return await next()
  }
  
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.redirect('/admin/login')
  }
  
  try {
    const secret = c.env.JWT_SECRET || 'kunci_rahasia_cadangan_123'
    await verify(token, secret)
    return await next()
  } catch (err) {
    return c.redirect('/admin/login')
  }
})
