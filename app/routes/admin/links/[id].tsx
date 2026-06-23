import { createRoute } from 'honox/factory'
import { AdminShell } from '../../../components/AdminShell'

export default createRoute(async (c) => {
  const id = c.req.param('id')
  let successMsg = ''

  if (c.req.method === 'POST') {
    const body = await c.req.parseBody()
    if (body._action === 'UPDATE') {
      let slug = (body.slug as string).replace(/^\/+|\/+$/g, '')
      await c.env.DB.prepare('UPDATE links SET name=?, slug=?, target_url=?, og_title=?, og_description=?, og_image_url=?, og_site_name=? WHERE id=?')
        .bind(body.name as string, slug, body.target_url as string, body.og_title as string, body.og_description as string, body.og_image_url as string, body.og_site_name as string, id).run()
      successMsg = 'Tautan berhasil diperbarui!'
    } else if (body._action === 'DELETE') {
      await c.env.DB.prepare('DELETE FROM links WHERE id=?').bind(id).run()
      return c.redirect('/admin/links')
    }
  }

  const link = await c.env.DB.prepare('SELECT * FROM links WHERE id=?').bind(id).first<any>()
  if (!link) return c.text('Link tidak ditemukan', 404)

  return c.render(
    <AdminShell activePage="links">
      <div className="mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Edit: {link.name}</h1>
        <a href="/admin/links" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold text-sm">← Kembali</a>
      </div>

      {successMsg && <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '${successMsg}', showConfirmButton: false, timer: 3000 });`}} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form method="POST" className="flex flex-col gap-4">
            <input type="hidden" name="_action" value="UPDATE" />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Internal Link</label>
              <input type="text" name="name" defaultValue={link.name} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-blue-50" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Slug</label>
              <input type="text" name="slug" defaultValue={link.slug} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target URL Afiliasi</label>
              <input type="url" name="target_url" defaultValue={link.target_url} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Situs / Domain</label>
              <input type="text" name="og_site_name" id="input-domain" defaultValue={link.og_site_name} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Open Graph</label>
              <input type="text" name="og_title" id="input-title" defaultValue={link.og_title} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Open Graph</label>
              <input type="text" name="og_description" id="input-desc" defaultValue={link.og_description} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL Gambar Akhir</label>
              <input type="url" name="og_image_url" id="input-img" defaultValue={link.og_image_url} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition">Update Data Tautan</button>
          </form>

          <form id="deleteForm" method="POST" className="mt-4 border-t pt-4">
            <input type="hidden" name="_action" value="DELETE" />
            <button type="button" onClick="confirmDelete()" className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold py-2.5 rounded-lg border border-red-200 transition">Hapus Permanen Tautan Ini</button>
          </form>
        </div>

        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 border-dashed">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Live Facebook Preview</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm max-w-[500px]">
            <img id="prev-img" src={link.og_image_url} className="w-full h-[261px] object-cover bg-gray-50" />
            <div className="p-3 bg-[#f2f3f5]">
              <span id="prev-domain" className="text-[12px] text-[#606770] uppercase block mb-1"></span>
              <div id="prev-title" className="text-[16px] font-semibold text-[#1d2129] leading-tight truncate">{link.og_title}</div>
              <div id="prev-desc" className="text-[14px] text-[#606770] mt-1 line-clamp-2">{link.og_description}</div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function upd() {
          document.getElementById('prev-title').innerText = document.getElementById('input-title').value || 'Judul Menarik Di Sini';
          document.getElementById('prev-desc').innerText = document.getElementById('input-desc').value || 'Deskripsi singkat penawaran...';
          const domainInput = document.getElementById('input-domain').value;
          document.getElementById('prev-domain').innerText = (domainInput || window.location.hostname).toUpperCase();
          const i = document.getElementById('input-img').value;
          if(i) document.getElementById('prev-img').src = i;
        }
        document.addEventListener('DOMContentLoaded', upd);
        ['input-title','input-desc','input-domain','input-img'].forEach(id => document.getElementById(id)?.addEventListener('input', upd));

        function confirmDelete() {
          Swal.fire({
            title: 'Hapus Tautan?', text: "Tindakan ini tidak bisa dibatalkan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Ya, Hapus!'
          }).then((result) => {
            if (result.isConfirmed) document.getElementById('deleteForm').submit();
          })
        }
      `}} />
    </AdminShell>,
    { title: \`Edit \${link.name}\` }
  )
})
