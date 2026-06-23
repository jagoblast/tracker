import { createRoute } from 'honox/factory'
import { AdminShell } from '../../components/AdminShell'

export default createRoute(async (c) => {
  let successMsg = ''
  
  if (c.req.method === 'POST') {
    const body = await c.req.parseBody()
    let slug = (body.slug as string).replace(/^\/+|\/+$/g, '')
    await c.env.DB.prepare('INSERT INTO links (slug, target_url, og_title, og_description, og_image_url) VALUES (?, ?, ?, ?, ?)')
      .bind(slug, body.target_url as string, body.og_title as string, body.og_description as string, body.og_image_url as string).run()
    successMsg = 'Tautan afiliasi baru berhasil dibuat!'
  }

  const linksList = await c.env.DB.prepare('SELECT id, slug, og_title FROM links ORDER BY id DESC').all<{id: number, slug: string, og_title: string}>()

  return c.render(
    <AdminShell activePage="links">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Tautan Afiliasi</h1>
      </div>

      {successMsg && (
        <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '${successMsg}', showConfirmButton: false, timer: 3000, timerProgressBar: true });`}} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Kolom Form Kiri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Buat Tautan Pintar</h2>
          <form method="POST" className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Slug (Gunakan '/')</label>
              <input type="text" name="slug" placeholder="promo/sepatu" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target URL Afiliasi</label>
              <input type="url" name="target_url" placeholder="https://shopee..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Open Graph</label>
              <input type="text" name="og_title" id="input-title" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Open Graph</label>
              <input type="text" name="og_description" id="input-desc" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL Gambar</label>
              <input type="url" name="og_image_url" id="input-img" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition">Simpan Tautan</button>
          </form>
        </div>

        {/* Kolom Kanan: Preview & Tabel */}
        <div className="flex flex-col gap-8">
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 border-dashed">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Live Facebook Preview</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm max-w-[500px]">
              <img id="prev-img" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%25%22%20height%3D%22261%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f2f5%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23bcc0c4%22%20dy%3D%22.3em%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%3EPratinjau Gambar%3C%2Ftext%3E%3C%2Fsvg%3E" className="w-full h-[261px] object-cover bg-gray-50" />
              <div className="p-3 bg-[#f2f3f5]">
                <span className="text-[12px] text-[#606770] uppercase block mb-1">DOMAIN.PAGES.DEV</span>
                <div id="prev-title" className="text-[16px] font-semibold text-[#1d2129] leading-tight truncate">Judul Menarik Di Sini</div>
                <div id="prev-desc" className="text-[14px] text-[#606770] mt-1 line-clamp-2">Deskripsi singkat penawaran...</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">Daftar Tautan</h3></div>
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b text-gray-500"><th className="p-4">Slug</th><th className="p-4">Judul OG</th><th className="p-4">Aksi</th></tr></thead>
              <tbody className="divide-y">
                {linksList.results.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">/{l.slug}</span></td>
                    <td className="p-4 truncate max-w-[150px]">{l.og_title}</td>
                    <td className="p-4"><a href={`/admin/links/${l.id}`} className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-xs font-semibold">Edit</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function upd() {
          document.getElementById('prev-title').innerText = document.getElementById('input-title').value || 'Judul Menarik Di Sini';
          document.getElementById('prev-desc').innerText = document.getElementById('input-desc').value || 'Deskripsi singkat penawaran...';
          const i = document.getElementById('input-img').value;
          if(i) document.getElementById('prev-img').src = i;
        }
        ['input-title','input-desc','input-img'].forEach(id => document.getElementById(id)?.addEventListener('input', upd));
      `}} />
    </AdminShell>,
    { title: 'Manajemen Links' }
  )
})
