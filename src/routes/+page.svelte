<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition'; // 1. TAMBAHKAN INI agar transisi fade aktif
	import type { PageData, ActionData } from './$types';

	// Menerima data kiriman dari +page.server.ts (Supabase realtime data)
	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Memetakan data dari database ke variabel lokal menggunakan Svelte 5 Runes reactive
	let daftarKategori = $derived(data.daftarKategori);
	let daftarBuku = $derived(data.daftarBuku);
	let daftarAnggota = $derived(data.daftarAnggota);
	let riwayatTransaksi = $derived(data.riwayatTransaksi);

	let activeTab = $state<'dashboard' | 'buku' | 'pinjam' | 'anggota'>('dashboard');

	// Derived state untuk hitung total buku cloud
	let totalBukuKeseluruhan = $derived(
		daftarBuku.reduce((sum: number, b: any) => sum + b.stok + b.dipinjam, 0)
	);

	// State bantuan untuk interaksi UI Form lokal
	let isEditingAnggota = $state(false);
	let editNoAnggota = $state('');
	let editNamaLengkap = $state('');
	let editKelas = $state('');
	let editNoHp = $state('');
	let editAlamat = $state('');

	// State lokal khusus untuk menangani status animasi Fade Out Notifikasi
	let notif = $state({ muncul: false, teks: '', sukses: true });

	// 2. TAMBAHKAN LOGIKA EFFECT INI untuk mengatur timer hilangnya pop-up
	$effect(() => {
		if (form?.success || form?.error) {
			notif.muncul = true;
			notif.teks = (form.success || form.error) as string;
			notif.sukses = !!form.success;

			// Otomatis ubah status menjadi false setelah 3 detik (memicu transisi fade out)
			const timer = setTimeout(() => {
				notif.muncul = false;
			}, 3000);

			return () => clearTimeout(timer);
		}
	});

	function pemicuEditAnggota(ang: any) {
		isEditingAnggota = true;
		editNoAnggota = ang.no_anggota;
		editNamaLengkap = ang.nama_lengkap;
		editKelas = ang.kelas;
		editNoHp = ang.no_hp || '';
		editAlamat = ang.alamat || '';
	}

	function batalkanEditAnggota() {
		isEditingAnggota = false;
		editNoAnggota = '';
		editNamaLengkap = '';
		editKelas = '';
		editNoHp = '';
		editAlamat = '';
	}

	function cekStatusOtomatis(tglKembali: string, currentStatus: string) {
		if (currentStatus === 'Kembali') return 'Kembali';
		const hariIni = new Date().toISOString().split('T')[0];
		if (hariIni > tglKembali) return 'Terlambat';
		return 'Dipinjam';
	}
</script>

<main class="max-w-6xl mx-auto p-6 font-sans">
	<div class="flex justify-between items-center border-b pb-4 mb-6">
		<h1 class="text-2xl font-bold text-gray-800">📚 Perpustakaan PAJ One Jakarta</h1>
		<span class="bg-green-100 text-green-800 text-xs px-3 py-1 rounded font-mono font-bold"
			>Perpustakaan Online System</span
		>
	</div>

	{#if notif.muncul}
		<div
			transition:fade={{ duration: 300 }}
			class="mb-4 p-3 border text-sm font-semibold rounded-xl text-center shadow-sm transition-all
        {notif.sukses
				? 'bg-green-50 text-green-700 border-green-200 shadow-green-100/50'
				: 'bg-red-50 text-red-700 border-red-200 shadow-red-100/50'}"
		>
			{notif.teks}
		</div>
	{/if}

	<div class="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl max-w-2xl">
		<button
			onclick={() => (activeTab = 'dashboard')}
			class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all {activeTab ===
			'dashboard'
				? 'bg-white text-blue-600 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}">🏠 Dashboard</button
		>
		<button
			onclick={() => (activeTab = 'buku')}
			class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all {activeTab === 'buku'
				? 'bg-white text-blue-600 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}">📖 Daftar Buku</button
		>
		<button
			onclick={() => (activeTab = 'pinjam')}
			class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all {activeTab ===
			'pinjam'
				? 'bg-white text-blue-600 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}">⏳ Pinjam Buku</button
		>
		<button
			onclick={() => (activeTab = 'anggota')}
			class="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all {activeTab ===
			'anggota'
				? 'bg-white text-blue-600 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'}">👥 Anggota</button
		>
	</div>

	{#if activeTab === 'dashboard'}
		<div class="max-w-md mx-auto mt-12 text-center">
			<div
				class="bg-gradient-to-br from-green-500 to-teal-600 text-white p-8 rounded-2xl shadow-md border border-teal-400"
			>
				<p class="text-sm uppercase tracking-widest font-semibold opacity-80 mb-2">
					Jumlah Buku di Library
				</p>
				<h2 class="text-6xl font-black">{totalBukuKeseluruhan}</h2>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
			{#if activeTab === 'buku'}
				<div class="xl:col-span-2 space-y-6">
					<div class="bg-white p-6 rounded-xl border shadow-sm">
						<h3 class="text-lg font-bold mb-4 text-gray-800">Katalog Buku Cloud</h3>
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="bg-gray-50 border-b text-gray-600 font-semibold">
									<th class="p-3">Kode Buku</th>
									<th class="p-3">Judul Buku</th>
									<th class="p-3">Kategori</th>
									<th class="p-3 text-center">Stok</th>
									<th class="p-3 text-center">Dipinjam</th>
									<th class="p-3 text-center">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y text-gray-600">
								{#each daftarBuku as b}
									<tr class="hover:bg-gray-50">
										<td class="p-3 font-mono font-bold text-gray-800 text-xs">{b.id}</td>
										<td class="p-3 font-medium text-gray-900">{b.judul}</td>
										<td class="p-3 text-xs"
											><span class="bg-gray-100 px-2 py-0.5 rounded text-gray-600"
												>{daftarKategori.find((k: any) => k.id === b.kategori_id)?.nama ||
													'Umum'}</span
											></td
										>
										<td
											class="p-3 text-center font-bold {b.stok === 0
												? 'text-red-500'
												: 'text-green-600'}">{b.stok}</td
										>
										<td class="p-3 text-center">{b.dipinjam}</td>
										<td class="p-3 text-center">
											{#if b.dipinjam === 0}
												<form method="POST" action="?/hapusBuku" use:enhance>
													<input type="hidden" name="id" value={b.id} />
													<button
														type="submit"
														class="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200"
														>Hapus</button
													>
												</form>
											{:else}
												<span class="text-xs text-gray-400">Locked</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="space-y-6">
					<div class="bg-white p-5 rounded-xl border shadow-sm">
						<h4 class="font-bold text-gray-800 mb-3">1. Tambah Kategori</h4>
						<form method="POST" action="?/tambahKategori" use:enhance class="flex gap-2">
							<input
								type="text"
								name="nama"
								required
								placeholder="Nama Kategori Baru"
								class="flex-1 p-2 border rounded-lg text-sm outline-none"
							/>
							<button
								type="submit"
								class="bg-gray-800 text-white text-xs px-4 py-2 rounded-lg font-semibold"
								>Simpan</button
							>
						</form>
					</div>
					<div class="bg-white p-5 rounded-xl border shadow-sm">
						<h4 class="font-bold text-gray-800 mb-3">2. Detail Input Buku</h4>
						<form method="POST" action="?/tambahBuku" use:enhance class="space-y-3">
							<div>
								<label class="block text-xs font-semibold text-gray-500 mb-1"
									>Kode Buku (Manual)</label
								>
								<input
									type="text"
									name="id"
									required
									placeholder="Contoh: INF-01"
									class="w-full p-2 border rounded-lg text-sm outline-none font-mono"
								/>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 mb-1">Pilih Kategori</label>
								<select
									name="kategoriId"
									required
									class="w-full p-2 border rounded-lg text-sm bg-white outline-none"
								>
									{#each daftarKategori as kat}
										<option value={kat.id}>{kat.nama}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 mb-1">Judul Buku</label>
								<input
									type="text"
									name="judul"
									required
									placeholder="Judul Buku"
									class="w-full p-2 border rounded-lg text-sm outline-none"
								/>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 mb-1"
									>Jumlah Stok Fisik</label
								>
								<input
									type="number"
									name="stok"
									min="1"
									value="1"
									class="w-full p-2 border rounded-lg text-sm outline-none"
								/>
							</div>
							<button
								type="submit"
								class="w-full bg-blue-600 text-white p-2.5 rounded-lg text-xs font-bold"
								>MASUKKAN DETAIL BUKU</button
							>
						</form>
					</div>
				</div>
			{:else if activeTab === 'pinjam'}
				<div class="xl:col-span-2 space-y-6">
					<div class="bg-white p-6 rounded-xl border shadow-sm">
						<h3 class="text-lg font-bold mb-4 text-gray-800">Daftar Peminjam Aktif</h3>
						<table class="w-full text-left text-xs whitespace-nowrap">
							<thead>
								<tr class="bg-gray-50 border-b text-gray-600 font-semibold">
									<th class="p-3">ID Log</th>
									<th class="p-3">No. Anggota</th>
									<th class="p-3">Nama</th>
									<th class="p-3">Kode Buku</th>
									<th class="p-3">Judul Buku</th>
									<th class="p-3">Tgl Pinjam</th>
									<th class="p-3">Tgl Kembali</th>
									<th class="p-3 text-center">Status</th>
									<th class="p-3 text-center">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y text-gray-600">
								{#each riwayatTransaksi as trx}
									{@const statusSekarang = cekStatusOtomatis(trx.tanggal_kembali, trx.status)}
									<tr class="hover:bg-gray-50">
										<td class="p-3 font-mono">{trx.id}</td>
										<td class="p-3 font-mono font-bold">{trx.no_anggota}</td>
										<td class="p-3 font-medium text-gray-900">{trx.nama_peminjam}</td>
										<td class="p-3 font-mono text-blue-600">{trx.kode_buku}</td>
										<td class="p-3">{trx.judul_buku}</td>
										<td class="p-3 font-mono">{trx.tanggal_pinjam}</td>
										<td class="p-3 font-mono">{trx.tanggal_kembali}</td>
										<td class="p-3 text-center">
											<span
												class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        {statusSekarang === 'Kembali' ? 'bg-green-100 text-green-700' : ''}
                        {statusSekarang === 'Dipinjam' ? 'bg-blue-100 text-blue-700' : ''}
                        {statusSekarang === 'Terlambat'
													? 'bg-red-100 text-red-700 animate-pulse'
													: ''}
                      "
											>
												{statusSekarang}
											</span>
										</td>
										<td class="p-3 text-center">
											{#if statusSekarang !== 'Kembali'}
												<form method="POST" action="?/kembalikanBuku" use:enhance>
													<input type="hidden" name="trxId" value={trx.id} />
													<button
														type="submit"
														class="text-xs bg-green-600 text-white px-2 py-1 rounded shadow-sm"
														>Kembalikan</button
													>
												</form>
											{:else}
												<span class="text-gray-400">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="bg-white p-5 rounded-xl border shadow-sm h-fit">
					<h4 class="font-bold text-gray-800 border-b pb-2 mb-4">Tambah Peminjam</h4>
					<form method="POST" action="?/eksekusiPeminjaman" use:enhance class="space-y-4">
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">No Anggota</label>
							<select
								name="noAnggota"
								required
								class="w-full p-2 border rounded-lg text-sm bg-white outline-none"
							>
								{#each daftarAnggota as ang}
									<option value={ang.no_anggota}>{ang.no_anggota} - {ang.nama_lengkap}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">Pilih Buku</label>
							<select
								name="kodeBuku"
								required
								class="w-full p-2 border rounded-lg text-sm bg-white outline-none"
							>
								{#each daftarBuku as b}
									<option value={b.id} disabled={b.stok === 0}>{b.id} - {b.judul}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1"
								>Durasi Pinjam (Hari)</label
							>
							<input
								type="number"
								name="lamaPinjam"
								min="1"
								value="7"
								class="w-full p-2 border rounded-lg text-sm outline-none"
							/>
						</div>
						<button
							type="submit"
							class="w-full bg-blue-600 text-white p-2.5 rounded-lg text-xs font-bold"
							>SIMPAN TRANSAKSI PINJAM</button
						>
					</form>
				</div>
			{:else if activeTab === 'anggota'}
				<div class="xl:col-span-2 space-y-6">
					<div class="bg-white p-6 rounded-xl border shadow-sm">
						<h3 class="text-lg font-bold mb-4 text-gray-800">Daftar Anggota Cloud</h3>
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="bg-gray-50 border-b text-gray-600 font-semibold">
									<th class="p-3">No Anggota</th>
									<th class="p-3">Nama Lengkap</th>
									<th class="p-3">Kelas</th>
									<th class="p-3">No. HP</th>
									<th class="p-3 text-center">Aksi</th>
								</tr>
							</thead>
							<tbody class="divide-y text-gray-600">
								{#each daftarAnggota as ang}
									<tr class="hover:bg-gray-50">
										<td class="p-3 font-mono font-bold text-gray-800">{ang.no_anggota}</td>
										<td class="p-3 font-semibold text-gray-900">{ang.nama_lengkap}</td>
										<td class="p-3">{ang.kelas}</td>
										<td class="p-3 font-mono">{ang.no_hp || '-'}</td>
										<td class="p-3 text-center space-x-1 whitespace-nowrap">
											<button
												onclick={() => pemicuEditAnggota(ang)}
												class="text-xs bg-amber-500 text-white px-2 py-1 rounded">Edit</button
											>

											<form method="POST" action="?/hapusAnggota" use:enhance class="inline">
												<input type="hidden" name="noAnggota" value={ang.no_anggota} />
												<button
													type="submit"
													onclick={(e) => {
														if (!confirm('Hapus anggota ini?')) e.preventDefault();
													}}
													class="text-xs bg-red-600 text-white px-2 py-1 rounded"
												>
													Hapus
												</button>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div class="bg-white p-5 rounded-xl border shadow-sm h-fit">
					<h4 class="font-bold text-gray-800 border-b pb-2 mb-3">
						{isEditingAnggota ? '📝 Edit Anggota' : '➕ Registrasi Anggota'}
					</h4>
					<form
						method="POST"
						action="?/simpanAnggota"
						use:enhance
						class="space-y-3"
						onsubmit={() => (isEditingAnggota = false)}
					>
						<input type="hidden" name="isEdit" value={isEditingAnggota ? 'true' : 'false'} />
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1"
								>No. Anggota (Manual)</label
							>
							<input
								type="text"
								name="noAnggota"
								required
								bind:value={editNoAnggota}
								readonly={isEditingAnggota}
								placeholder="Contoh: 2026001"
								class="w-full p-2 border rounded-lg text-sm outline-none font-mono readonly:bg-gray-100"
							/>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">Nama Lengkap</label>
							<input
								type="text"
								name="namaLengkap"
								required
								bind:value={editNamaLengkap}
								placeholder="Nama Lengkap"
								class="w-full p-2 border rounded-lg text-sm outline-none"
							/>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">Kelas</label>
							<input
								type="text"
								name="kelas"
								required
								bind:value={editKelas}
								placeholder="Contoh: IF-3"
								class="w-full p-2 border rounded-lg text-sm outline-none"
							/>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">No HP/WA</label>
							<input
								type="text"
								name="noHp"
								bind:value={editNoHp}
								placeholder="08xxxx"
								class="w-full p-2 border rounded-lg text-sm outline-none"
							/>
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 mb-1">Alamat</label>
							<textarea
								name="alamat"
								bind:value={editAlamat}
								placeholder="Alamat rumah"
								rows="2"
								class="w-full p-2 border rounded-lg text-sm outline-none resize-none"
							></textarea>
						</div>
						<div class="flex gap-2 pt-2">
							{#if isEditingAnggota}
								<button
									type="button"
									onclick={batalkanEditAnggota}
									class="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg text-xs font-bold"
									>Batal</button
								>
							{/if}
							<button
								type="submit"
								class="flex-1 bg-blue-600 text-white p-2 rounded-lg text-xs font-bold"
							>
								{isEditingAnggota ? 'PERBARUI DATA' : 'REGISTRASI'}
							</button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	{/if}
</main>
