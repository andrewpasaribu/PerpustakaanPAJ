import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Ambil status cookie login
	const session = event.cookies.get('session_admin');

	// Jika user belum login dan mencoba mengakses halaman selain '/login', tendang ke '/login'
	if (!session && !event.url.pathname.startsWith('/login')) {
		throw redirect(303, '/login');
	}

	// Jika user SUDAH login dan malah mencoba membuka halaman '/login', arahkan langsung ke dashboard utama
	if (session && event.url.pathname.startsWith('/login')) {
		throw redirect(303, '/');
	}

	// Jika semuanya aman, lanjutkan request halaman seperti biasa
	const response = await resolve(event);
	return response;
};
