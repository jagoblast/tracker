import { createRoute } from 'honox/factory'
import { hashPassword } from '../../utils/hash'

export const POST = createRoute(async (c) => {
  // 1. Kunci Halaman: Jika admin sudah ada, tolak eksekusi POST
  const checkUser = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
  if (checkUser?.value) return c.redirect('/admin/login')

  const body = await c.req.parseBody()
  const username = (body.username as string).trim()
  const password = (body.password as string).trim()
  const secret = c.env.JWT_SECRET || 'kunci_rahasia_cadangan_123'

  // 2. Hash Password menggunakan JWT_SECRET
  const hashedPassword = await hashPassword(password, secret)

  // 3. Simpan ke D1
  await c.env.DB.prepare('INSERT INTO admin_settings (key, value) VALUES ("admin_username", ?)').bind(username).run()
  await c.env.DB.prepare('INSERT INTO admin_settings (key, value) VALUES ("admin_password", ?)').bind(hashedPassword).run()

  return c.redirect('/admin/login')
})

export default createRoute(async (c) => {
  // Kunci Halaman: Jika admin sudah ada, tendang ke login
  const checkUser = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
  if (checkUser?.value) return c.redirect('/admin/login')

  return c.render(
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Instalasi Admin</h2>
        <p className="text-sm text-gray-500 mb-6">Buat akun admin pertama Anda. Halaman ini aman dan hanya muncul satu kali.</p>
        <form method="POST" className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username Baru</label>
            <input type="text" name="username" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
            <input type="password" name="password" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors">Generate & Simpan Keamanan</button>
        </form>
      </div>
    </div>
  )
})
