        dayjs.extend(dayjs_plugin_relativeTime);
        dayjs.locale('id');

        const noteIconSVGs = [
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
            `<svg class="note-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
        ];

        const sunSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

        const ACCESS_TOKEN_KEY = 'np_access_token';
        const EMAIL_KEY = 'np_email';

        function notepadApp() {
            const BASE_URL = 'https://api.binery.my.id'; // untuk API (tanpa trailing slash)
          const FRONTEND_URL = 'https://binery.my.id'; // untuk share link
            const API = BASE_URL + '/api/notes';
            return {
                view: 'home',
                darkMode: false,
                menuOpen: false,
                showPassword: false,
                saving: false,
                toastMsg: '',
                toastType: 'success',
                searchKey: '',
                recentPublic: [],
                notes: [],
                listOffset: 0,
                form: { title: '', content: '', mode: 'public', password: '', pendingPhotos: [] },
                resultNote: null,
                viewedNote: null,
                viewedPhotos: [],
                loadingPhotos: false,
                uploadingPhotos: false,
                lockedNote: null,
                unlockPassword: '',
                editingNote: null,
                editForm: { title: '', content: '', password: '', photos: [], pendingPhotos: [] },
                noteIcons: noteIconSVGs,
                sunSVG,
                moonSVG,
                accessToken: null,
                userEmail: '',
                avatarUrl: '',
                authLoading: false,
                googleLoading: false,
                authRedirectView: null,
                loginForm: { email: '', password: '' },
                registerForm: { email: '', password: '', confirm: '' },
                lightboxUrl: null,
                _lastUnlockPassword: '',
                cropper: {
                    open: false, file: null, imgSrc: '', imgW: 0, imgH: 0,
                    stageSize: 320, minScale: 1, scale: 1, zoom: 1,
                    offsetX: 0, offsetY: 0, dragging: false, startX: 0, startY: 0,
                    startOffsetX: 0, startOffsetY: 0, uploading: false, lastDist: null
                },

                // ===== state loading baru =====
                initialLoading: true,
                initialProgress: 10,
                loadingRecent: false,
                loadingList: false,

                get isAuthed() { return !!this.accessToken; },

                async init() {
    clearTimeout(this._splashTimer);
    const finishSplash = () => {
        this.initialProgress = 100;
        clearTimeout(this._splashTimer);
        this._splashTimer = setTimeout(() => {
            this.initialLoading = false;
        }, 500);
    };

    try {
        this.initialProgress = 20;
        const saved = localStorage.getItem('notepad-theme');
        this.darkMode = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

        try {
            this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            this.userEmail = localStorage.getItem(EMAIL_KEY) || '';
        } catch (e) {}

        this.initialProgress = 45;
        if (!this.accessToken) await this.silentRefresh();
        if (this.isAuthed) this.fetchMe();
        this.initialProgress = 70;

        // Cek share link
        if (this.handleShareLink()) {
            finishSplash();
            return;
        }

        // ===== TANGANI CALLBACK GOOGLE (backend redirect dgn ?login=google_success) =====
        const urlParams = new URLSearchParams(window.location.search);
        const loginStatus = urlParams.get('login');

        if (loginStatus === 'google_success') {
            console.log('🔄 Google callback detected, refreshing token...');
            try {
                const accessToken = await this.silentRefresh();
                if (accessToken) {
                    this.toast('Berhasil masuk dengan Google! 🎉', 'success');
                    this.view = 'home';
                    this.fetchMe();
                    await this.fetchRecentPublic();
                } else {
                    throw new Error('No token received');
                }
            } catch (e) {
                console.error('Google callback error:', e);
                this.toast('Gagal login dengan Google. Silakan coba lagi.', 'error');
                this.view = 'login';
            } finally {
                // Selalu bersihkan query param dari URL, sukses maupun gagal
                window.history.replaceState(null, '', '/');
            }
            finishSplash();
            return;
        }

        if (loginStatus === 'google_failed') {
            this.toast('Login dengan Google gagal atau dibatalkan.', 'error');
            window.history.replaceState(null, '', '/');
            this.view = 'login';
            finishSplash();
            return;
        }

        // Normal load
        if (this.view === 'home') await this.fetchRecentPublic();
        finishSplash();
    } catch (e) {
        console.error('Init error:', e);
        this.toast('Terjadi masalah saat memuat data', 'error');
        finishSplash();
    }
},
                setSession(accessToken, email) {
    this.accessToken = accessToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (email) {
        this.userEmail = email;
        localStorage.setItem(EMAIL_KEY, email);
    }
    // refresh token tidak disimpan di localStorage
},
                clearSession() {
    this.accessToken = null;
    this.userEmail = '';
    this.avatarUrl = '';
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    // tidak ada refresh token di localStorage
},
                async fetchMe() {
    try {
        const res = await this.authFetch(BASE_URL + '/api/auth/me');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        this.avatarUrl = data.avatar_url || '';
        if (data.email) { this.userEmail = data.email; localStorage.setItem(EMAIL_KEY, data.email); }
    } catch (e) {
        // gagal ambil profil bukan error fatal, abaikan
    }
},
                async silentRefresh() {
    try {
        const res = await fetch(BASE_URL + '/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // kirim cookie httpOnly
        });
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        // Hanya simpan access_token dan email (refresh token tetap di cookie)
        this.setSession(data.access_token, data.email);
        return data.access_token;
    } catch (e) {
        this.clearSession();
        return null;
    }
},
                async authFetch(url, options = {}) {
                    let token = this.accessToken;
                    if (!token) token = await this.silentRefresh();
                    if (!token) { this.requireLogin(); throw new Error('belum login'); }
                    const withAuth = (opts, t) => ({ ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
                    let res = await fetch(url, withAuth(options, token));
                    if (res.status === 401) {
                        token = await this.silentRefresh();
                        if (!token) { this.requireLogin(); throw new Error('session habis, silakan login lagi'); }
                        res = await fetch(url, withAuth(options, token));
                    }
                    return res;
                },
                
                requireLogin() { this.clearSession(); this.toast('Masuk dulu untuk melanjutkan', 'error'); this.view = 'login'; },
                goLogin(redirectView = null) { this.authRedirectView = redirectView; this.loginForm = { email: '', password: '' }; this.view = 'login'; },
                goRegister(redirectView = null) { this.authRedirectView = redirectView; this.registerForm = { email: '', password: '', confirm: '' }; this.view = 'register'; },
                goProtected(targetView) { if (!this.isAuthed) { this.goLogin(targetView); return; } this.view = targetView; if (targetView === 'list' || targetView === 'share') this.fetchList(); },
                afterAuthSuccess() { const target = this.authRedirectView || 'home'; this.authRedirectView = null; this.view = target; this.fetchMe(); if (target === 'home') this.fetchRecentPublic(); if (target === 'list' || target === 'share') this.fetchList(); },
                async submitLogin() {
                    const email = this.loginForm.email.trim();
                    const password = this.loginForm.password; 
                    if (!email || !password) return this.toast('Isi email dan password terlebih dahulu', 'error');
                    this.authLoading = true;
                    let data;
                    try {
                        const res = await fetch(BASE_URL + '/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include', // WAJIB: agar cookie refresh_token dari backend tersimpan
                            body: JSON.stringify({ email, password })
                        });
                        data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Gagal masuk');
                        this.setSession(data.access_token, email);
                        this.toast('Berhasil masuk!');
                        this.afterAuthSuccess();
                    } catch (e) {
                        if (data && data.error && data.error.includes('Google')) {
                            this.toast('Akun ini hanya terdaftar via Google. Silakan login dengan tombol "Login dengan Google".', 'error');
                        } else {
                            this.toast(e.message || 'Gagal masuk', 'error');
                        }
                    } finally {
                        this.authLoading = false;
                    }
                },
                async submitRegister() {
                    const email = this.registerForm.email.trim();
                    const password = this.registerForm.password;
                    const confirm = this.registerForm.confirm;
                    if (!email || !password) return this.toast('Isi email dan password terlebih dahulu', 'error');
                    if (password.length < 8) return this.toast('Password minimal 8 karakter', 'error');
                    if (password !== confirm) return this.toast('Konfirmasi password tidak cocok', 'error');
                    this.authLoading = true;
                    let data;
                    try {
                        const res = await fetch(BASE_URL + '/api/auth/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include', // WAJIB: agar cookie refresh_token dari backend tersimpan
                            body: JSON.stringify({ email, password })
                        });
                        data = await res.json();
                        if (res.status === 202) {
                            this.toast('Email ini sudah terdaftar lewat Google. Cek inbox untuk mengaktifkan login dengan password.', 'success');
                            this.authLoading = false;
                            this.view = 'home';
                            return;
                        }
                        if (!res.ok) throw new Error(data.error || 'Gagal mendaftar');
                        this.setSession(data.access_token, email);
                        this.toast('Akun berhasil dibuat!');
                        this.afterAuthSuccess();
                    } catch (e) {
                        this.toast(e.message || 'Gagal mendaftar', 'error');
                    } finally {
                        this.authLoading = false;
                    }
                },
                async logout() {
    try {
        await fetch(BASE_URL + '/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {}
    this.clearSession();
    this.recentPublic = [];
    this.notes = [];
    this.menuOpen = false;
    this.toast('Berhasil keluar');
    this.view = 'home';
},
                toggleDark() { this.darkMode = !this.darkMode; localStorage.setItem('notepad-theme', this.darkMode ? 'dark' : 'light'); },
                toast(msg, type = 'success') { this.toastMsg = msg; this.toastType = type; clearTimeout(this._toastTimer); this._toastTimer = setTimeout(() => this.toastMsg = '', 3000); },
                loginWithGoogle() {
                    this.googleLoading = true;
                    window.location.href = BASE_URL + '/api/auth/google/login';
                    setTimeout(() => {
                        this.googleLoading = false;
                        this.toast('Gagal terhubung ke Google, coba lagi', 'error');
                    }, 10000);
                },
                timeAgo(dateStr) { return dayjs(dateStr).fromNow(); },
                shareUrl(id) { return FRONTEND_URL + '/n/' + id; },
                copyToClipboard(text) { if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => this.toast('Link disalin!')).catch(() => this.toast('Gagal menyalin', 'error')); } else { const input = document.createElement('input'); input.value = text; document.body.appendChild(input); input.select(); try { document.execCommand('copy'); this.toast('Link disalin!'); } catch (e) { this.toast('Gagal menyalin', 'error'); } document.body.removeChild(input); } },
                setMode(mode) { this.form.mode = mode; },
                resetForm() { this.form.pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl)); this.form = { title: '', content: '', mode: 'public', password: '', pendingPhotos: [] }; this.resultNote = null; this.showPassword = false; this.uploadingPhotos = false; },
                async fetchRecentPublic() {
                    if (!this.isAuthed) { this.recentPublic = []; return; }
                    this.loadingRecent = true;
                    try {
                        const res = await this.authFetch(`${API}?limit=50&offset=0`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        this.recentPublic = (data.notes || []).filter(n => n.mode === 'public');
                        // ambil konten untuk 4 catatan pertama, jangan sampai error menghentikan seluruhnya
                        for (let n of this.recentPublic.slice(0, 4)) {
                            try {
                                const r2 = await fetch(`${API}/${n.id}`);
                                const d2 = await r2.json();
                                n.content = d2.content || '';
                            } catch (e) {
                                n.content = 'Gagal memuat isi catatan';
                            }
                        }
                    } catch (e) {
                        this.recentPublic = [];
                        if (e.message !== 'belum login') this.toast(e.message, 'error');
                    } finally {
                        this.loadingRecent = false;
                    }
                },
                async fetchList() {
                    if (!this.isAuthed) { this.notes = []; this.goLogin(this.view); return; }
                    this.loadingList = true;
                    try {
                        const res = await this.authFetch(`${API}?limit=20&offset=${this.listOffset}`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        this.notes = data.notes || [];
                    } catch (e) {
                        this.notes = [];
                        if (e.message !== 'belum login') this.toast(e.message, 'error');
                    } finally {
                        this.loadingList = false;
                    }
                },
                nextPage() { this.listOffset += 20; this.fetchList(); },
                prevPage() { this.listOffset = Math.max(0, this.listOffset - 20); this.fetchList(); },
                async createNote() {
                    if (!this.isAuthed) return this.goLogin('create');
                    if (!this.form.content.trim()) return this.toast('Isi catatan tidak boleh kosong', 'error');
                    if (this.form.mode === 'private' && this.form.password.length < 4) return this.toast('Password minimal 4 karakter', 'error');
                    this.saving = true;
                    try {
                        const payload = { mode: this.form.mode, title: this.form.title || 'Catatan tanpa judul', content: this.form.content };
                        if (this.form.mode === 'private') payload.password = this.form.password;
                        const res = await this.authFetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        data.photos = [];
                        this.resultNote = data;
                        const pending = this.form.pendingPhotos;
                        const mode = this.form.mode;
                        const password = this.form.password;
                        this.form.title = ''; this.form.content = ''; this.form.password = ''; this.form.pendingPhotos = [];
                        this.toast('Catatan berhasil dibuat!');
                        if (pending.length) {
                            this.uploadingPhotos = true;
                            for (const p of pending) {
                                try {
                                    const photo = await this.uploadNotePhoto(data.id, p.file, mode, password);
                                    this.resultNote.photos.push({ ...photo, previewUrl: p.previewUrl });
                                } catch (e) {
                                    this.toast('Gagal unggah salah satu foto: ' + e.message, 'error');
                                } finally {
                                    URL.revokeObjectURL(p.previewUrl);
                                }
                            }
                            this.uploadingPhotos = false;
                        }
                    } catch (e) {
                        this.toast(e.message, 'error');
                    } finally {
                        this.saving = false;
                    }
                },
                openByKey() { const key = this.searchKey.trim(); if (!key) return this.toast('Masukkan kode catatan', 'error'); this.viewNote(key); },
                async viewNote(id) {
                    this.view = 'view'; this.viewedNote = null; this.lockedNote = null; this.editingNote = null; this.viewedPhotos = []; this._lastUnlockPassword = '';
                    try {
                        const res = await fetch(`${API}/${id}`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        if (data.locked) { this.lockedNote = data; return; }
                        this.viewedNote = data;
                        this.loadNotePhotosForView(id, '');
                    } catch (e) { this.toast(e.message, 'error'); this.view = 'home'; }
                },
                async unlockNote(id) {
                    if (!this.unlockPassword) return this.toast('Masukkan password', 'error');
                    const password = this.unlockPassword;
                    try {
                        const res = await fetch(`${API}/${id}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        data.mode = 'private';
                        this.viewedNote = data;
                        this.lockedNote = null;
                        this.unlockPassword = '';
                        this._lastUnlockPassword = password;
                        this.toast('Catatan terbuka!');
                        this.loadNotePhotosForView(id, password);
                    } catch (e) { this.toast(e.message, 'error'); }
                },
                async loadNotePhotosForView(noteId, password) {
                    this.viewedPhotos = [];
                    this.loadingPhotos = true;
                    try {
                        const attachments = await this.fetchNotePhotos(noteId);
                        for (const a of attachments) {
                            if (!a.encrypted) { this.viewedPhotos.push({ id: a.id, url: a.url }); continue; }
                            if (!password) { this.viewedPhotos.push({ id: a.id, url: null }); continue; }
                            try {
                                const url = await this.downloadPrivateAttachment(a.id, password);
                                this.viewedPhotos.push({ id: a.id, url });
                            } catch (e) { /* lewati foto yang gagal dibuka */ }
                        }
                    } catch (e) {
                        // gagal memuat foto, note tetap tampil tanpa foto
                    } finally {
                        this.loadingPhotos = false;
                    }
                },
                async editNote(id) {
                    const note = this.viewedNote; if (!note) return;
                    this.editingNote = note;
                    this.editForm = { title: note.title, content: note.content, password: '', photos: [], pendingPhotos: [] };
                    this.viewedNote = null;
                    await this.loadEditFormPhotos(note.id);
                },
                async editNoteFromCard(id) {
                    if (!this.isAuthed) return this.goLogin('list');
                    try {
                        const res = await fetch(`${API}/${id}`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        if (data.locked) { this.viewNote(id); return; }
                        this.editingNote = data;
                        this.editForm = { title: data.title, content: data.content, password: '', photos: [], pendingPhotos: [] };
                        this.viewedNote = null;
                        this.lockedNote = null;
                        this.view = 'view';
                        await this.loadEditFormPhotos(id);
                    } catch (e) { this.toast(e.message, 'error'); }
                },
                async loadEditFormPhotos(noteId) {
                    try {
                        const attachments = await this.fetchNotePhotos(noteId);
                        this.editForm.photos = attachments.map(a => ({ id: a.id, url: a.encrypted ? null : a.url, encrypted: a.encrypted, loading: false }));
                    } catch (e) { /* biarkan kosong jika gagal */ }
                },
                cancelEdit() {
                    this.editForm.pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
                    if (this.editingNote) { this.viewNote(this.editingNote.id); }
                    this.editingNote = null;
                },
                async unlockEditPhoto(photo) {
                    if (photo.url || photo.loading) return;
                    const password = this.editForm.password || prompt('Masukkan password note untuk membuka foto ini:');
                    if (!password) return;
                    photo.loading = true;
                    try {
                        photo.url = await this.downloadPrivateAttachment(photo.id, password);
                    } catch (e) { this.toast(e.message, 'error'); }
                    photo.loading = false;
                },
                async deleteExistingPhoto(photo) {
                    if (!confirm('Hapus foto ini?')) return;
                    const note = this.editingNote;
                    let password = null;
                    if (note && note.mode === 'private') {
                        password = this.editForm.password || prompt('Masukkan password note untuk hapus foto:');
                        if (!password) return;
                    }
                    try {
                        const res = await this.authFetch(`${API}/attachments/${photo.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(password ? { password } : {}) });
                        if (!res.ok) throw new Error((await res.json()).error);
                        this.editForm.photos = this.editForm.photos.filter(p => p.id !== photo.id);
                        this.toast('Foto berhasil dihapus');
                    } catch (e) { this.toast(e.message, 'error'); }
                },
                async saveEdit() {
                    const note = this.editingNote; if (!note) return;
                    if (!this.editForm.content.trim()) return this.toast('Isi catatan tidak boleh kosong', 'error');
                    const payload = { title: this.editForm.title || 'Catatan tanpa judul', content: this.editForm.content };
                    if (note.mode === 'private') {
                        if (!this.editForm.password) return this.toast('Masukkan password untuk verifikasi', 'error');
                        payload.password = this.editForm.password;
                    }
                    const totalPhotos = this.editForm.photos.length + this.editForm.pendingPhotos.length;
                    if (totalPhotos > 5) return this.toast('Maksimal 5 foto per catatan', 'error');
                    try {
                        const res = await this.authFetch(`${API}/${note.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        const pending = this.editForm.pendingPhotos;
                        if (pending.length) {
                            for (const p of pending) {
                                p.uploading = true;
                                try {
                                    await this.uploadNotePhoto(note.id, p.file, note.mode, this.editForm.password);
                                } catch (e) {
                                    this.toast('Gagal unggah salah satu foto: ' + e.message, 'error');
                                } finally {
                                    URL.revokeObjectURL(p.previewUrl);
                                }
                            }
                        }
                        this.toast('Catatan berhasil diupdate!');
                        this.editingNote = null;
                        this.viewNote(note.id);
                    } catch (e) { this.toast(e.message, 'error'); }
                },
                async deleteNote(id) { if (!confirm('Yakin ingin menghapus catatan ini?')) return; let password = null; try { const res = await fetch(`${API}/${id}`); const data = await res.json(); if (data.locked || data.mode === 'private') { password = prompt('Masukkan password untuk menghapus:'); if (!password) return; } } catch (e) { return this.toast(e.message, 'error'); } try { const res = await this.authFetch(`${API}/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(password ? { password } : {}) }); if (!res.ok) throw new Error((await res.json()).error); this.toast('Catatan berhasil dihapus'); if (this.view === 'list' || this.view === 'share') { this.fetchList(); } else { this.view = 'home'; this.fetchRecentPublic(); } } catch (e) { this.toast(e.message, 'error'); } },
                shareNote(id) { const url = this.shareUrl(id); if (navigator.share) { navigator.share({ title: 'Notepad Sharing', url }).catch(() => {}); } else { this.copyToClipboard(url); } },
                handleShareLink() {
                    const match = window.location.pathname.match(/\/n\/([a-zA-Z0-9]+)(?:\/|$)/);
                    if (match) { this.viewNote(match[1]); return true; }
                    return false;
                },

                // ===================== FOTO NOTE =====================
                async fetchNotePhotos(noteId) {
                    const res = await fetch(`${API}/${noteId}/attachments`);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Gagal memuat foto');
                    return (data.attachments || []).filter(a => a.kind === 'image');
                },
                async fetchCardPhotos(n) {
                    if (n.photos !== undefined) return;
                    n.photos = [];
                    try {
                        const attachments = await this.fetchNotePhotos(n.id);
                        n.photos = attachments.filter(a => !a.encrypted && a.url).map(a => ({ id: a.id, url: a.url }));
                    } catch (e) { /* biarkan strip kosong jika gagal */ }
                },
                async downloadPrivateAttachment(attachmentId, password) {
                    const res = await fetch(`${API}/attachments/${attachmentId}/download`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    });
                    if (!res.ok) {
                        let msg = 'Gagal membuka foto';
                        try { msg = (await res.json()).error || msg; } catch (e) {}
                        throw new Error(msg);
                    }
                    const blob = await res.blob();
                    return URL.createObjectURL(blob);
                },
                async uploadNotePhoto(noteId, file, mode, password) {
                    if (mode === 'private') {
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('kind', 'image');
                        fd.append('password', password || '');
                        const res = await this.authFetch(`${API}/${noteId}/attachments/private`, { method: 'POST', body: fd });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Gagal unggah foto');
                        return { id: data.id, kind: data.kind, content_type: data.content_type, file_size: data.file_size, url: null, encrypted: true };
                    }
                    const presignRes = await this.authFetch(`${API}/${noteId}/attachments/presign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content_type: file.type, file_size: file.size, kind: 'image' })
                    });
                    const presignData = await presignRes.json();
                    if (!presignRes.ok) throw new Error(presignData.error || 'Gagal presign upload');
                    const putRes = await fetch(presignData.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                    if (!putRes.ok) throw new Error('Gagal mengunggah file ke storage');
                    const confirmRes = await this.authFetch(`${API}/${noteId}/attachments/confirm`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: presignData.key, kind: 'image' })
                    });
                    const confirmData = await confirmRes.json();
                    if (!confirmRes.ok) throw new Error(confirmData.error || 'Gagal konfirmasi upload');
                    return { id: confirmData.id, kind: confirmData.kind, content_type: confirmData.content_type, file_size: confirmData.file_size, url: confirmData.url, encrypted: false };
                },
                addPendingPhotos(event, targetKey) {
                    const target = targetKey === 'editForm' ? this.editForm : this.form;
                    const existingCount = (target.photos ? target.photos.length : 0) + target.pendingPhotos.length;
                    const files = Array.from(event.target.files || []);
                    event.target.value = '';
                    const room = 5 - existingCount;
                    if (room <= 0) { this.toast('Maksimal 5 foto per catatan', 'error'); return; }
                    const toAdd = files.slice(0, room);
                    if (files.length > toAdd.length) this.toast('Hanya ' + toAdd.length + ' foto ditambahkan (maks 5 per catatan)', 'error');
                    for (const file of toAdd) {
                        if (!file.type.startsWith('image/')) { this.toast(file.name + ' bukan file gambar', 'error'); continue; }
                        if (file.size > 10 * 1024 * 1024) { this.toast(file.name + ' melebihi 10MB', 'error'); continue; }
                        target.pendingPhotos.push({ file, previewUrl: URL.createObjectURL(file), uploading: false });
                    }
                },
                removePendingPhoto(targetKey, idx) {
                    const target = targetKey === 'editForm' ? this.editForm : this.form;
                    const [removed] = target.pendingPhotos.splice(idx, 1);
                    if (removed) URL.revokeObjectURL(removed.previewUrl);
                },

                // ===================== AVATAR CROPPER =====================
                openAvatarPicker() { this.$refs.avatarFileInput.click(); },
                onAvatarFileSelected(event) {
                    const file = event.target.files[0];
                    event.target.value = '';
                    if (!file) return;
                    if (!file.type.startsWith('image/')) return this.toast('File harus berupa gambar', 'error');
                    if (file.size > 12 * 1024 * 1024) return this.toast('Ukuran file maksimal 12MB', 'error');
                    const img = new Image();
                    const src = URL.createObjectURL(file);
                    img.onload = () => {
                        this.cropper.file = file;
                        this.cropper.imgSrc = src;
                        this.cropper.imgW = img.naturalWidth;
                        this.cropper.imgH = img.naturalHeight;
                        this.cropper.open = true;
                        this.$nextTick(() => {
                            const stage = this.$refs.cropperStage;
                            const size = stage ? stage.clientWidth : 320;
                            this.cropper.stageSize = size;
                            const minScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
                            this.cropper.minScale = minScale;
                            this.cropper.zoom = 1;
                            this.cropper.scale = minScale;
                            this.cropper.offsetX = (size - img.naturalWidth * minScale) / 2;
                            this.cropper.offsetY = (size - img.naturalHeight * minScale) / 2;
                        });
                    };
                    img.src = src;
                },
                cropperClampOffsets() {
                    const c = this.cropper;
                    const w = c.imgW * c.scale, h = c.imgH * c.scale;
                    const minX = Math.min(0, c.stageSize - w), maxX = 0;
                    const minY = Math.min(0, c.stageSize - h), maxY = 0;
                    c.offsetX = Math.max(minX, Math.min(maxX, c.offsetX));
                    c.offsetY = Math.max(minY, Math.min(maxY, c.offsetY));
                },
                cropperSetZoom(zoom) {
                    const c = this.cropper;
                    const oldScale = c.scale;
                    const newScale = c.minScale * zoom;
                    const centerX = c.stageSize / 2, centerY = c.stageSize / 2;
                    const imgX = (centerX - c.offsetX) / oldScale;
                    const imgY = (centerY - c.offsetY) / oldScale;
                    c.scale = newScale;
                    c.offsetX = centerX - imgX * newScale;
                    c.offsetY = centerY - imgY * newScale;
                    this.cropperClampOffsets();
                },
                cropperWheelZoom(event) {
                    const delta = event.deltaY > 0 ? -0.08 : 0.08;
                    this.cropper.zoom = Math.max(1, Math.min(3, this.cropper.zoom + delta));
                    this.cropperSetZoom(this.cropper.zoom);
                },
                cropperEventPoint(event) {
                    if (event.touches && event.touches.length) return { x: event.touches[0].clientX, y: event.touches[0].clientY };
                    return { x: event.clientX, y: event.clientY };
                },
                cropperDragStart(event) {
                    const pt = this.cropperEventPoint(event);
                    this.cropper.dragging = true;
                    this.cropper.startX = pt.x;
                    this.cropper.startY = pt.y;
                    this.cropper.startOffsetX = this.cropper.offsetX;
                    this.cropper.startOffsetY = this.cropper.offsetY;
                },
                cropperDragMove(event) {
                    if (!this.cropper.dragging) return;
                    const pt = this.cropperEventPoint(event);
                    this.cropper.offsetX = this.cropper.startOffsetX + (pt.x - this.cropper.startX);
                    this.cropper.offsetY = this.cropper.startOffsetY + (pt.y - this.cropper.startY);
                    this.cropperClampOffsets();
                },
                cropperDragEnd() { this.cropper.dragging = false; },
                closeAvatarCropper() {
                    if (this.cropper.imgSrc) URL.revokeObjectURL(this.cropper.imgSrc);
                    this.cropper.open = false;
                    this.cropper.file = null;
                    this.cropper.imgSrc = '';
                },
                async confirmAvatarCrop() {
                    const c = this.cropper;
                    if (!c.file) return;
                    c.uploading = true;
                    try {
                        const OUTPUT = 512;
                        const canvas = document.createElement('canvas');
                        canvas.width = OUTPUT; canvas.height = OUTPUT;
                        const ctx = canvas.getContext('2d');
                        const img = this.$refs.cropperImg;
                        const sx = -c.offsetX / c.scale, sy = -c.offsetY / c.scale;
                        const sSize = c.stageSize / c.scale;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
                        ctx.restore();
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
                        await this.uploadAvatar(blob);
                        this.closeAvatarCropper();
                    } catch (e) {
                        this.toast('Gagal memproses foto: ' + e.message, 'error');
                    } finally {
                        c.uploading = false;
                    }
                },
                async uploadAvatar(blob) {
                    const presignRes = await this.authFetch(BASE_URL + '/api/users/avatar/presign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content_type: 'image/jpeg', file_size: blob.size })
                    });
                    const presignData = await presignRes.json();
                    if (!presignRes.ok) throw new Error(presignData.error || 'Gagal presign avatar');
                    const putRes = await fetch(presignData.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
                    if (!putRes.ok) throw new Error('Gagal mengunggah foto ke storage');
                    const confirmRes = await this.authFetch(BASE_URL + '/api/users/avatar/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: presignData.key })
                    });
                    const confirmData = await confirmRes.json();
                    if (!confirmRes.ok) throw new Error(confirmData.error || 'Gagal konfirmasi avatar');
                    this.avatarUrl = confirmData.avatar_url || this.avatarUrl;
                    this.toast('Foto profil berhasil diperbarui!');
                }
            };
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW register failed', err));
            });
        }
