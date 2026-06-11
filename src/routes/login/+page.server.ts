import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '$env/static/private';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string | null;
		const password = data.get('password') as string | null;

		// Validasi kecocokan dengan data di .env
		if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
			// Jika sukses, buat session cookie selama 7 hari
			cookies.set('session_admin', 'authenticated', {
				path: '/',
				httpOnly: true, // Amankan dari serangan XSS JavaScript browser
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7
			});

			// Redirect ke halaman utama perpustakaan
			throw redirect(303, '/');
		}

		// Jika salah, kirim sinyal eror kembali ke tampilan
		return fail(400, {
			username: username || '',
			error: '❌ Username atau password salah!'
		});
	}
};
