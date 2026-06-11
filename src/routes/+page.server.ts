import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { PageServerLoad, Actions } from './$types';

// 1. LOAD DATA DARI SUPABASE SAAT HALAMAN DIBUKA
export const load: PageServerLoad = async () => {
	const { data: kategori } = await supabase.from('kategori').select('*');
	const { data: buku } = await supabase.from('buku').select('*').order('id', { ascending: true });
	const { data: anggota } = await supabase
		.from('anggota')
		.select('*')
		.order('no_anggota', { ascending: true });
	const { data: transaksi } = await supabase
		.from('transaksi')
		.select('*')
		.order('id', { ascending: false });

	return {
		daftarKategori: kategori || [],
		daftarBuku: buku || [],
		daftarAnggota: anggota || [],
		riwayatTransaksi: transaksi || []
	};
};

// 2. SERVER ACTIONS (PENGGANTI LOGIKA UTAMA/MACRO KE DATABASE)
export const actions: Actions = {
	tambahKategori: async ({ request }) => {
		const data = await request.formData();
		const nama = data.get('nama') as string;

		// Ambil data untuk auto ID kategori (K01, K02...)
		const { data: list } = await supabase.from('kategori').select('id');
		const id = `K${String((list?.length || 0) + 1).padStart(2, '0')}`;

		const { error } = await supabase.from('kategori').insert([{ id, nama }]);
		if (error) return fail(400, { error: 'Gagal menambahkan kategori' });
		return { success: 'Kategori berhasil ditambahkan!' };
	},

	tambahBuku: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string).toUpperCase();
		const judul = data.get('judul') as string;
		const kategoriId = data.get('kategoriId') as string;
		const stok = parseInt(data.get('stok') as string);

		const { error } = await supabase
			.from('buku')
			.insert([{ id, judul, kategori_id: kategoriId, stok, dipinjam: 0 }]);
		if (error) return fail(400, { error: 'Gagal/Kode Buku sudah ada!' });
		return { success: 'Buku berhasil dimasukkan!' };
	},

	hapusBuku: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		const { error } = await supabase.from('buku').delete().eq('id', id);
		if (error) return fail(400, { error: 'Gagal menghapus buku' });
		return { success: 'Buku berhasil dihapus' };
	},

	simpanAnggota: async ({ request }) => {
		const data = await request.formData();
		const no_anggota = (data.get('noAnggota') as string).toUpperCase();
		const nama_lengkap = data.get('namaLengkap') as string;
		const kelas = data.get('kelas') as string;
		const no_hp = data.get('noHp') as string;
		const alamat = data.get('alamat') as string;
		const isEdit = data.get('isEdit') === 'true';

		if (isEdit) {
			const { error } = await supabase
				.from('anggota')
				.update({ nama_lengkap, kelas, no_hp, alamat })
				.eq('no_anggota', no_anggota);
			if (error) return fail(400, { error: 'Gagal memperbarui anggota' });
		} else {
			const { error } = await supabase
				.from('anggota')
				.insert([{ no_anggota, nama_lengkap, kelas, no_hp, alamat }]);
			if (error) return fail(400, { error: 'Gagal/Nomor Anggota sudah terdaftar!' });
		}
		return { success: 'Data anggota berhasil disimpan' };
	},

	hapusAnggota: async ({ request }) => {
		const data = await request.formData();
		const no_anggota = data.get('noAnggota') as string;

		const { error } = await supabase.from('anggota').delete().eq('no_anggota', no_anggota);
		if (error) return fail(400, { error: 'Gagal menghapus anggota' });
		return { success: 'Anggota berhasil dihapus' };
	},

	eksekusiPeminjaman: async ({ request }) => {
		const data = await request.formData();
		const noAnggota = data.get('noAnggota') as string;
		const kodeBuku = data.get('kodeBuku') as string;
		const lamaPinjam = parseInt(data.get('lamaPinjam') as string);

		// Ambil data nama anggota & judul buku
		const { data: member } = await supabase
			.from('anggota')
			.select('nama_lengkap')
			.eq('no_anggota', noAnggota)
			.single();
		const { data: book } = await supabase
			.from('buku')
			.select('judul, stok, dipinjam')
			.eq('id', kodeBuku)
			.single();

		if (!member || !book || book.stok <= 0)
			return fail(400, { error: 'Validasi gagal/Stok habis!' });

		// Update stok buku di Supabase
		await supabase
			.from('buku')
			.update({ stok: book.stok - 1, dipinjam: book.dipinjam + 1 })
			.eq('id', kodeBuku);

		// Hitung Tanggal
		const hariIni = new Date();
		const tglPinjamStr = hariIni.toISOString().split('T')[0];
		hariIni.setDate(hariIni.getDate() + lamaPinjam);
		const tglKembaliStr = hariIni.toISOString().split('T')[0];

		// Buat ID Transaksi otomatis
		const { data: listTrx } = await supabase.from('transaksi').select('id');
		const idTrx = `T${String((listTrx?.length || 0) + 1).padStart(3, '0')}`;

		await supabase.from('transaksi').insert([
			{
				id: idTrx,
				no_anggota: noAnggota,
				nama_peminjam: member.nama_lengkap,
				kode_buku: kodeBuku,
				judul_buku: book.judul,
				tanggal_pinjam: tglPinjamStr,
				tanggal_kembali: tglKembaliStr,
				status: 'Dipinjam'
			}
		]);

		return { success: 'Peminjaman berhasil dicatat!' };
	},

	kembalikanBuku: async ({ request }) => {
		const data = await request.formData();
		const trxId = data.get('trxId') as string;

		const { data: trx } = await supabase.from('transaksi').select('*').eq('id', trxId).single();
		if (trx && trx.status !== 'Kembali') {
			const { data: book } = await supabase
				.from('buku')
				.select('stok, dipinjam')
				.eq('id', trx.kode_buku)
				.single();
			if (book) {
				await supabase
					.from('buku')
					.update({ stok: book.stok + 1, dipinjam: book.dipinjam - 1 })
					.eq('id', trx.kode_buku);
			}
			await supabase.from('transaksi').update({ status: 'Kembali' }).eq('id', trxId);
		}
		return { success: 'Buku berhasil dikembalikan!' };
	}
};
