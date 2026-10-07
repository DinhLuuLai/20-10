// admin.js - Bảng điều khiển quản trị viên bí mật tích hợp ngay trên cùng 1 URL
// Nâng cấp toàn diện: Quản lý Thư Cây 3D (Thêm/Sửa/Xóa), Thư Ngỏ Hoàng Gia,
// Quản lý Avatar (Live Preview + Nén ảnh HD Canvas chống đầy bộ nhớ), Lời chúc, Album Kỷ niệm và Lưu tức thì.

class AdminManager {
  constructor() {
    this.isAuthenticated = false;
    this.keySequence = "";
    this.keyTimer = null;
    this.logoClickCount = 0;
    this.logoClickTimer = null;

    // Trạng thái chỉnh sửa item
    this.editingTreeLetterIdx = null;
    this.editingWishIdx = null;
    this.editingMemIdx = null;

    // Danh sách avatar mẫu xinh xắn để đổi nhanh
    this.avatarPresets = [
      "images/avatar.png",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
    ];
    this.presetAvatarIndex = 0;

    this.initTriggers();
    this.bindEvents();
  }

  // --- NÉN ẢNH CANVAS CLIENT-SIDE (TRÁNH QUOTA_EXCEEDED_ERR CỦA LOCALSTORAGE) ---
  compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("File tải lên không phải là ảnh hợp lệ!"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Không thể đọc file ảnh!"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Ảnh bị lỗi hoặc không hỗ trợ định dạng này!"));
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  initTriggers() {
    // 1. Phím tắt: Ctrl + Shift + A hoặc Alt + A
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) ||
          (e.altKey && (e.key === "A" || e.key === "a"))) {
        e.preventDefault();
        this.openAdminPrompt();
        return;
      }

      // 2. Gõ chữ "admin" hoặc "vip" trên bàn phím
      clearTimeout(this.keyTimer);
      this.keySequence += e.key.toLowerCase();
      if (this.keySequence.includes("admin") || this.keySequence.includes("2010")) {
        this.keySequence = "";
        this.openAdminPrompt();
        return;
      }
      this.keyTimer = setTimeout(() => {
        this.keySequence = "";
      }, 1500);
    });

    // 3. Click 3 lần vào logo / diamond watermark
    const logoTrigger = document.getElementById("admin-secret-logo-trigger");
    if (logoTrigger) {
      logoTrigger.addEventListener("click", () => {
        this.logoClickCount++;
        clearTimeout(this.logoClickTimer);
        window.audioManager.playSfx("pop");

        if (this.logoClickCount >= 3) {
          this.logoClickCount = 0;
          this.openAdminPrompt();
        } else {
          this.logoClickTimer = setTimeout(() => {
            this.logoClickCount = 0;
          }, 1000);
        }
      });
    }

    // 4. Click vào icon ổ khóa bí mật ở footer
    const footerTrigger = document.getElementById("admin-secret-footer-trigger");
    if (footerTrigger) {
      footerTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.openAdminPrompt();
      });
    }
  }

  openAdminPrompt() {
    if (this.isAuthenticated) {
      this.openDashboard();
      return;
    }

    const pinModal = document.getElementById("admin-pin-modal");
    const pinInput = document.getElementById("admin-pin-input");
    const errorMsg = document.getElementById("admin-pin-error");
    if (pinModal) {
      pinModal.classList.add("active");
      if (errorMsg) errorMsg.textContent = "";
      if (pinInput) {
        pinInput.value = "";
        setTimeout(() => pinInput.focus(), 200);
      }
      window.audioManager.playSfx("woosh");
    }
  }

  closePinModal() {
    const pinModal = document.getElementById("admin-pin-modal");
    if (pinModal) {
      pinModal.classList.remove("active");
    }
  }

  verifyPin(inputPin) {
    const config = window.appStore.get();
    const correctPin = config.security.pin || "2010";

    if (inputPin.trim() === correctPin.trim()) {
      this.isAuthenticated = true;
      this.closePinModal();
      window.audioManager.playSfx("fanfare");
      this.showToast("Đăng nhập Admin thành công!", "success");
      this.openDashboard();
    } else {
      const errorMsg = document.getElementById("admin-pin-error");
      if (errorMsg) {
        errorMsg.textContent = "Mã PIN không đúng! Vui lòng thử lại.";
      }
      window.audioManager.playSfx("pop");
      const pinBox = document.querySelector(".pin-card");
      if (pinBox) {
        pinBox.classList.add("shake-anim");
        setTimeout(() => pinBox.classList.remove("shake-anim"), 500);
      }
    }
  }

  openDashboard() {
    const dashboard = document.getElementById("admin-dashboard-modal");
    if (dashboard) {
      this.populateFormFields();
      if (window.appStore && typeof window.appStore.updateDbStatusBadge === "function") {
        window.appStore.updateDbStatusBadge(window.appStore.dbConnected);
      }
      dashboard.classList.add("active");
      window.audioManager.playSfx("woosh");
    }
  }

  closeDashboard() {
    const dashboard = document.getElementById("admin-dashboard-modal");
    if (dashboard) {
      dashboard.classList.remove("active");
    }
  }

  populateFormFields() {
    const config = window.appStore.get();

    // Tab 1: Recipient & Avatar & Audience Mode
    if (document.getElementById("cfg-audience-mode")) {
      document.getElementById("cfg-audience-mode").value = config.audienceMode || "crush";
    }
    document.getElementById("cfg-recipient-name").value = config.recipient.name || "";
    document.getElementById("cfg-recipient-nickname").value = config.recipient.nickname || "";
    document.getElementById("cfg-recipient-occasion").value = config.recipient.occasion || "";
    document.getElementById("cfg-recipient-badge").value = config.recipient.headerBadge || "";
    document.getElementById("cfg-recipient-subgreeting").value = config.recipient.subGreeting || "";
    document.getElementById("cfg-recipient-avatar").value = config.recipient.avatarUrl || "";
    document.getElementById("cfg-recipient-date").value = config.recipient.eventDate ? config.recipient.eventDate.substring(0, 16) : "";

    // Live sync Avatar Hub
    this.updateLiveAvatarPreview(config.recipient.avatarUrl);
    const liveName = document.getElementById("admin-recipient-live-name");
    if (liveName) liveName.textContent = config.recipient.name || "Nguyễn Ngọc Ánh";

    // Tab 2: Letter
    document.getElementById("cfg-letter-title").value = config.letter.title || "";
    document.getElementById("cfg-letter-sender").value = config.letter.sender || "";
    document.getElementById("cfg-letter-content").value = config.letter.content || "";
    this.updateLiveLetterPreview();

    // Tab 3: Music & Theme
    document.getElementById("cfg-music-url").value = config.music.url || "";
    document.getElementById("cfg-music-title").value = config.music.title || "";
    document.getElementById("cfg-theme-style").value = config.theme.current || "royal-gold";
    document.getElementById("cfg-particle-mode").value = config.theme.particleType || "golden-dust";

    // Tab 4: Security
    document.getElementById("cfg-admin-pin").value = config.security.pin || "2010";
    if (document.getElementById("cfg-entry-passcode")) {
      document.getElementById("cfg-entry-passcode").value = config.security.entryPasscode || "06072010";
    }
    if (document.getElementById("cfg-entry-hint")) {
      document.getElementById("cfg-entry-hint").value = config.security.entryHint || "Ngày kỷ niệm đặc biệt (Ví dụ: 06072010)";
    }

    // Dynamic Lists
    this.renderWishesManager(config.wishes);
    this.renderTreeLettersManager(config.treeLetters || []);
    this.renderMemoriesManager(config.memories);

    // Reset edit modes
    this.cancelEditTreeLetter();
    this.cancelEditWish();
    this.cancelEditMemory();
  }

  // --- CẬP NHẬT LIVE AVATAR TRONG ADMIN VÀ TRÊN WEBSITE ---
  updateLiveAvatarPreview(url) {
    const previewImg = document.getElementById("admin-avatar-live-preview");
    if (previewImg && url) {
      previewImg.src = url;
    }
    const heroAvatar = document.getElementById("hero-avatar");
    if (heroAvatar && url) {
      heroAvatar.src = url;
    }
  }

  // --- CẬP NHẬT LIVE PREVIEW BỨC THƯ TRONG ADMIN ---
  updateLiveLetterPreview() {
    const titleVal = document.getElementById("cfg-letter-title")?.value;
    const contentVal = document.getElementById("cfg-letter-content")?.value;
    const senderVal = document.getElementById("cfg-letter-sender")?.value;

    const previewTitle = document.getElementById("admin-preview-letter-title");
    const previewContent = document.getElementById("admin-preview-letter-content");
    const previewSender = document.getElementById("admin-preview-letter-sender");

    if (previewTitle) previewTitle.textContent = titleVal || "Gửi Đến Em";
    if (previewContent) previewContent.textContent = contentVal || "Nội dung bức tâm thư...";
    if (previewSender) previewSender.textContent = senderVal ? `— ${senderVal}` : "— Người luôn thương em";
  }

  // =========================================================================
  // 1. QUẢN LÝ THƯ TREO TRÊN CÂY ANH ĐÀO 3D (THÊM / SỬA / XÓA)
  // =========================================================================
  renderTreeLettersManager(letters = []) {
    const container = document.getElementById("admin-tree-letters-list");
    if (!container) return;
    container.innerHTML = "";

    letters.forEach((l, index) => {
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.style.borderLeftColor = l.color || "#ff69b4";
      card.innerHTML = `
        <div class="admin-item-header">
          <div class="admin-item-title-group">
            <span class="admin-item-icon">${l.icon || "🌸"}</span>
            <strong>${this.escapeHtml(l.title)}</strong>
            <span class="badge" style="background:${l.color || '#ff69b4'}; color:#fff;">${this.escapeHtml(l.shortTag || "Yêu")}</span>
            ${l.isSpecial ? '<span class="badge badge-gold">Đặc Biệt Cấp 3</span>' : ''}
          </div>
          <div class="admin-item-actions" style="display: flex; gap: 6px;">
            <button type="button" class="btn-icon text-warning" data-tree-edit="${index}" title="Chỉnh sửa tấm thư này">✏️ Sửa</button>
            <button type="button" class="btn-icon text-danger" data-tree-del="${index}" title="Gỡ tấm thư khỏi cây">🗑️ Xóa</button>
          </div>
        </div>
        <p class="admin-item-preview">${this.escapeHtml(l.content)}</p>
        <small class="text-muted">Người gửi: ${this.escapeHtml(l.sender || "Người thương")} | ${this.escapeHtml(l.date || "20/10 Rực Rỡ")}</small>
      `;
      container.appendChild(card);
    });

    // Delegate Edit
    container.querySelectorAll("[data-tree-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-tree-edit"), 10);
        this.startEditTreeLetter(idx);
      });
    });

    // Delegate Delete
    container.querySelectorAll("[data-tree-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-tree-del"), 10);
        const l = window.appStore.get().treeLetters[idx];
        if (confirm(`Bạn có chắc chắn muốn gỡ tấm thư "${l?.title || ''}" khỏi cây anh đào không?`)) {
          window.appStore.update((data) => {
            data.treeLetters.splice(idx, 1);
          });
          this.renderTreeLettersManager(window.appStore.get().treeLetters);
          if (window.sakuraTreeInstance) {
            window.sakuraTreeInstance.refreshHangingLetters();
          }
          this.showToast("Đã gỡ tấm thư khỏi cây anh đào!", "info");
        }
      });
    });
  }

  startEditTreeLetter(idx) {
    const letters = window.appStore.get().treeLetters || [];
    const item = letters[idx];
    if (!item) return;

    this.editingTreeLetterIdx = idx;

    // Điền dữ liệu vào form
    document.getElementById("new-tl-title").value = item.title || "";
    document.getElementById("new-tl-tag").value = item.shortTag || "";
    document.getElementById("new-tl-icon").value = item.icon || "🌸";
    document.getElementById("new-tl-color").value = item.color || "#ff69b4";
    document.getElementById("new-tl-sender").value = item.sender || "";
    document.getElementById("new-tl-content").value = item.content || "";

    // Đổi giao diện form sang Chế độ Chỉnh Sửa
    const titleHeader = document.getElementById("tree-letter-form-title");
    const editBadge = document.getElementById("tree-letter-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-tree-letter-edit");
    const submitBtn = document.getElementById("btn-add-tree-letter-submit");
    const formBox = document.getElementById("admin-tree-letter-form-box");

    if (titleHeader) titleHeader.textContent = `✏️ Chỉnh Sửa Tấm Thư: ${item.title}`;
    if (editBadge) editBadge.style.display = "inline-block";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (submitBtn) {
      submitBtn.innerHTML = "💾 Cập Nhật Bức Thư";
      submitBtn.style.background = "linear-gradient(135deg, #ffd700 0%, #ff85a2 100%)";
    }
    if (formBox) {
      formBox.classList.add("admin-form-editing");
      formBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    this.showToast(`Đang chỉnh sửa: "${item.title}"`, "info");
    window.audioManager.playSfx("pop");
  }

  cancelEditTreeLetter() {
    this.editingTreeLetterIdx = null;

    document.getElementById("new-tl-title").value = "";
    document.getElementById("new-tl-tag").value = "";
    document.getElementById("new-tl-icon").value = "";
    document.getElementById("new-tl-color").value = "#ff69b4";
    document.getElementById("new-tl-sender").value = "";
    document.getElementById("new-tl-content").value = "";

    const titleHeader = document.getElementById("tree-letter-form-title");
    const editBadge = document.getElementById("tree-letter-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-tree-letter-edit");
    const submitBtn = document.getElementById("btn-add-tree-letter-submit");
    const formBox = document.getElementById("admin-tree-letter-form-box");

    if (titleHeader) titleHeader.textContent = "➕ Treo Thư Mới Lên Cây Anh Đào 3D";
    if (editBadge) editBadge.style.display = "none";
    if (cancelBtn) cancelBtn.style.display = "none";
    if (submitBtn) {
      submitBtn.innerHTML = "🌸 Treo Lên Cây Anh Đào Ngay";
      submitBtn.style.background = "linear-gradient(135deg, #ff69b4 0%, #ffd700 100%)";
    }
    if (formBox) {
      formBox.classList.remove("admin-form-editing");
    }
  }

  handleAddNewTreeLetter() {
    const titleInput = document.getElementById("new-tl-title");
    const tagInput = document.getElementById("new-tl-tag");
    const iconInput = document.getElementById("new-tl-icon");
    const colorInput = document.getElementById("new-tl-color");
    const senderInput = document.getElementById("new-tl-sender");
    const contentInput = document.getElementById("new-tl-content");

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
      this.showToast("Vui lòng nhập tiêu đề và nội dung tấm thư!", "warning");
      return;
    }

    if (this.editingTreeLetterIdx !== null) {
      // Đang ở chế độ SỬA bức thư có sẵn
      window.appStore.update((data) => {
        if (!data.treeLetters) data.treeLetters = [];
        const target = data.treeLetters[this.editingTreeLetterIdx];
        if (target) {
          target.title = titleInput.value.trim();
          target.shortTag = tagInput.value.trim() || target.shortTag || "Yêu Thương";
          target.icon = iconInput.value.trim() || target.icon || "🌸";
          target.color = colorInput.value || target.color || "#ff69b4";
          target.sender = senderInput.value.trim() || target.sender || "Người luôn thương em";
          target.content = contentInput.value.trim();
        }
      });

      this.cancelEditTreeLetter();
      this.renderTreeLettersManager(window.appStore.get().treeLetters);
      if (window.sakuraTreeInstance) {
        window.sakuraTreeInstance.refreshHangingLetters();
      }
      this.showToast("Đã cập nhật tấm thư thành công! Cây 3D đã đồng bộ tức thì.", "success");
      window.audioManager.playSfx("fanfare");
    } else {
      // Đang ở chế độ THÊM MỚI tấm thư
      const newLetter = {
        id: "tl_" + Date.now(),
        title: titleInput.value.trim(),
        shortTag: tagInput.value.trim() || "Yêu Thương",
        icon: iconInput.value.trim() || "🌸",
        color: colorInput.value || "#ff69b4",
        sender: senderInput.value.trim() || "Người luôn thương em",
        date: "Khoảnh khắc đặc biệt",
        content: contentInput.value.trim(),
        isSpecial: false,
      };

      window.appStore.update((data) => {
        if (!data.treeLetters) data.treeLetters = [];
        data.treeLetters.push(newLetter);
      });

      this.cancelEditTreeLetter();
      this.renderTreeLettersManager(window.appStore.get().treeLetters);
      if (window.sakuraTreeInstance) {
        window.sakuraTreeInstance.refreshHangingLetters();
      }
      this.showToast("Đã treo tấm thư mới lên cây anh đào 3D!", "success");
      window.audioManager.playSfx("fanfare");
    }
  }

  // =========================================================================
  // 2. QUẢN LÝ LỜI CHÚC (THÊM / SỬA / XÓA)
  // =========================================================================
  renderWishesManager(wishes = []) {
    const container = document.getElementById("admin-wishes-list");
    if (!container) return;
    container.innerHTML = "";

    wishes.forEach((w, index) => {
      const card = document.createElement("div");
      card.className = "admin-item-card";
      card.innerHTML = `
        <div class="admin-item-header">
          <div class="admin-item-title-group">
            <span class="admin-item-icon">${w.icon || "✨"}</span>
            <strong>${this.escapeHtml(w.title)}</strong>
            <span class="badge badge-sm">${this.escapeHtml(w.tag || "VIP")}</span>
            ${w.isHighlight ? '<span class="badge badge-gold">Nổi bật</span>' : ''}
          </div>
          <div class="admin-item-actions" style="display: flex; gap: 6px;">
            <button type="button" class="btn-icon text-warning" data-wish-edit="${index}" title="Chỉnh sửa lời chúc này">✏️ Sửa</button>
            <button type="button" class="btn-icon text-danger" data-wish-del="${index}" title="Xóa lời chúc">🗑️ Xóa</button>
          </div>
        </div>
        <p class="admin-item-preview">${this.escapeHtml(w.content)}</p>
        <small class="text-muted">Người gửi: ${this.escapeHtml(w.author || "Admin")}</small>
      `;
      container.appendChild(card);
    });

    // Delegate Edit
    container.querySelectorAll("[data-wish-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-wish-edit"), 10);
        this.startEditWish(idx);
      });
    });

    // Delegate delete
    container.querySelectorAll("[data-wish-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-wish-del"), 10);
        const w = window.appStore.get().wishes[idx];
        if (confirm(`Bạn có chắc chắn muốn xóa lời chúc "${w?.title || ''}" không?`)) {
          window.appStore.update((data) => {
            data.wishes.splice(idx, 1);
          });
          this.renderWishesManager(window.appStore.get().wishes);
          this.showToast("Đã xóa lời chúc!", "info");
        }
      });
    });
  }

  startEditWish(idx) {
    const wishes = window.appStore.get().wishes || [];
    const item = wishes[idx];
    if (!item) return;

    this.editingWishIdx = idx;

    document.getElementById("new-wish-title").value = item.title || "";
    document.getElementById("new-wish-tag").value = item.tag || "";
    document.getElementById("new-wish-icon").value = item.icon || "✨";
    document.getElementById("new-wish-content").value = item.content || "";
    document.getElementById("new-wish-author").value = item.author || "";
    document.getElementById("new-wish-highlight").checked = !!item.isHighlight;

    const titleHeader = document.getElementById("wish-form-title");
    const editBadge = document.getElementById("wish-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-wish-edit");
    const submitBtn = document.getElementById("btn-add-wish-submit");
    const formBox = document.getElementById("admin-wish-form-box");

    if (titleHeader) titleHeader.textContent = `✏️ Chỉnh Sửa Lời Chúc: ${item.title}`;
    if (editBadge) editBadge.style.display = "inline-block";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (submitBtn) submitBtn.innerHTML = "💾 Cập Nhật Lời Chúc";
    if (formBox) {
      formBox.classList.add("admin-form-editing");
      formBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    this.showToast(`Đang chỉnh sửa lời chúc: "${item.title}"`, "info");
    window.audioManager.playSfx("pop");
  }

  cancelEditWish() {
    this.editingWishIdx = null;

    document.getElementById("new-wish-title").value = "";
    document.getElementById("new-wish-tag").value = "";
    document.getElementById("new-wish-icon").value = "";
    document.getElementById("new-wish-content").value = "";
    document.getElementById("new-wish-author").value = "";
    document.getElementById("new-wish-highlight").checked = true;

    const titleHeader = document.getElementById("wish-form-title");
    const editBadge = document.getElementById("wish-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-wish-edit");
    const submitBtn = document.getElementById("btn-add-wish-submit");
    const formBox = document.getElementById("admin-wish-form-box");

    if (titleHeader) titleHeader.textContent = "➕ Thêm Lời Chúc Mới";
    if (editBadge) editBadge.style.display = "none";
    if (cancelBtn) cancelBtn.style.display = "none";
    if (submitBtn) submitBtn.innerHTML = "Thêm Ngay";
    if (formBox) formBox.classList.remove("admin-form-editing");
  }

  handleAddNewWish() {
    const titleInput = document.getElementById("new-wish-title");
    const contentInput = document.getElementById("new-wish-content");
    const iconInput = document.getElementById("new-wish-icon");
    const tagInput = document.getElementById("new-wish-tag");
    const authorInput = document.getElementById("new-wish-author");
    const highlightInput = document.getElementById("new-wish-highlight");

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
      this.showToast("Vui lòng nhập đầy đủ tiêu đề và nội dung lời chúc!", "warning");
      return;
    }

    if (this.editingWishIdx !== null) {
      window.appStore.update((data) => {
        const target = data.wishes[this.editingWishIdx];
        if (target) {
          target.title = titleInput.value.trim();
          target.content = contentInput.value.trim();
          target.icon = iconInput.value || target.icon || "✨";
          target.tag = tagInput.value.trim() || target.tag || "VIP";
          target.author = authorInput.value.trim() || target.author || "Admin";
          target.isHighlight = highlightInput.checked;
        }
      });

      this.cancelEditWish();
      this.renderWishesManager(window.appStore.get().wishes);
      this.showToast("Đã cập nhật lời chúc thành công!", "success");
      window.audioManager.playSfx("sparkle");
    } else {
      const newWish = {
        id: "w_" + Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        icon: iconInput.value || "✨",
        tag: tagInput.value.trim() || "VIP",
        author: authorInput.value.trim() || "Admin Yêu Thương",
        isHighlight: highlightInput.checked,
      };

      window.appStore.update((data) => {
        data.wishes.unshift(newWish);
      });

      this.cancelEditWish();
      this.renderWishesManager(window.appStore.get().wishes);
      this.showToast("Đã thêm lời chúc mới thành công!", "success");
      window.audioManager.playSfx("sparkle");
    }
  }

  // =========================================================================
  // 3. QUẢN LÝ ALBUM KỶ NIỆM (THÊM / SỬA / XÓA)
  // =========================================================================
  renderMemoriesManager(memories = []) {
    const container = document.getElementById("admin-memories-list");
    if (!container) return;
    container.innerHTML = "";

    memories.forEach((m, index) => {
      const item = document.createElement("div");
      item.className = "admin-item-card memory-admin-card";
      item.innerHTML = `
        <img src="${m.url}" alt="${this.escapeHtml(m.title)}" class="admin-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'" />
        <div class="memory-admin-body">
          <strong>${this.escapeHtml(m.title)}</strong>
          <p class="text-muted small">${this.escapeHtml(m.desc || "")}</p>
          <span class="badge badge-sm">${this.escapeHtml(m.date || "Kỷ niệm")}</span>
        </div>
        <div class="admin-item-actions" style="display: flex; gap: 6px;">
          <button type="button" class="btn-icon text-warning" data-mem-edit="${index}" title="Sửa ảnh này">✏️ Sửa</button>
          <button type="button" class="btn-icon text-danger" data-mem-del="${index}" title="Xóa ảnh này">🗑️ Xóa</button>
        </div>
      `;
      container.appendChild(item);
    });

    // Delegate Edit
    container.querySelectorAll("[data-mem-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-mem-edit"), 10);
        this.startEditMemory(idx);
      });
    });

    // Delegate delete
    container.querySelectorAll("[data-mem-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-mem-del"), 10);
        const m = window.appStore.get().memories[idx];
        if (confirm(`Bạn có chắc muốn xóa ảnh "${m?.title || ''}" khỏi album?`)) {
          window.appStore.update((data) => {
            data.memories.splice(idx, 1);
          });
          this.renderMemoriesManager(window.appStore.get().memories);
          this.showToast("Đã xóa ảnh kỷ niệm!", "info");
        }
      });
    });
  }

  startEditMemory(idx) {
    const memories = window.appStore.get().memories || [];
    const item = memories[idx];
    if (!item) return;

    this.editingMemIdx = idx;

    document.getElementById("new-mem-title").value = item.title || "";
    document.getElementById("new-mem-date").value = item.date || "";
    document.getElementById("new-mem-url").value = item.url || "";
    document.getElementById("new-mem-desc").value = item.desc || "";

    const previewWrap = document.getElementById("new-mem-preview-wrap");
    const previewImg = document.getElementById("new-mem-preview-img");
    if (previewWrap && previewImg && item.url) {
      previewImg.src = item.url;
      previewWrap.style.display = "flex";
    }

    const titleHeader = document.getElementById("mem-form-title");
    const editBadge = document.getElementById("mem-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-mem-edit");
    const submitBtn = document.getElementById("btn-add-mem-submit");
    const formBox = document.getElementById("admin-mem-form-box");

    if (titleHeader) titleHeader.textContent = `✏️ Chỉnh Sửa Ảnh: ${item.title}`;
    if (editBadge) editBadge.style.display = "inline-block";
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    if (submitBtn) submitBtn.innerHTML = "💾 Cập Nhật Ảnh";
    if (formBox) {
      formBox.classList.add("admin-form-editing");
      formBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    this.showToast(`Đang chỉnh sửa ảnh: "${item.title}"`, "info");
    window.audioManager.playSfx("pop");
  }

  cancelEditMemory() {
    this.editingMemIdx = null;

    document.getElementById("new-mem-title").value = "";
    document.getElementById("new-mem-date").value = "";
    document.getElementById("new-mem-url").value = "";
    document.getElementById("new-mem-desc").value = "";

    const previewWrap = document.getElementById("new-mem-preview-wrap");
    if (previewWrap) previewWrap.style.display = "none";

    const titleHeader = document.getElementById("mem-form-title");
    const editBadge = document.getElementById("mem-edit-badge");
    const cancelBtn = document.getElementById("btn-cancel-mem-edit");
    const submitBtn = document.getElementById("btn-add-mem-submit");
    const formBox = document.getElementById("admin-mem-form-box");

    if (titleHeader) titleHeader.textContent = "➕ Thêm Ảnh Kỷ Niệm Mới";
    if (editBadge) editBadge.style.display = "none";
    if (cancelBtn) cancelBtn.style.display = "none";
    if (submitBtn) submitBtn.innerHTML = "Thêm Vào Album";
    if (formBox) formBox.classList.remove("admin-form-editing");
  }

  handleAddNewMemory() {
    const titleInput = document.getElementById("new-mem-title");
    const descInput = document.getElementById("new-mem-desc");
    const urlInput = document.getElementById("new-mem-url");
    const dateInput = document.getElementById("new-mem-date");

    if (!urlInput.value.trim()) {
      this.showToast("Vui lòng nhập link ảnh hoặc chọn file ảnh từ máy!", "warning");
      return;
    }

    if (this.editingMemIdx !== null) {
      window.appStore.update((data) => {
        const target = data.memories[this.editingMemIdx];
        if (target) {
          target.title = titleInput.value.trim() || target.title;
          target.desc = descInput.value.trim();
          target.url = urlInput.value.trim();
          target.date = dateInput.value.trim() || target.date;
        }
      });

      this.cancelEditMemory();
      this.renderMemoriesManager(window.appStore.get().memories);
      this.showToast("Đã cập nhật ảnh kỷ niệm thành công!", "success");
      window.audioManager.playSfx("sparkle");
    } else {
      const newMem = {
        id: "m_" + Date.now(),
        title: titleInput.value.trim() || "Khoảnh Khắc Đẹp",
        desc: descInput.value.trim() || "",
        url: urlInput.value.trim(),
        date: dateInput.value.trim() || "Kỷ niệm đáng nhớ",
      };

      window.appStore.update((data) => {
        data.memories.push(newMem);
      });

      this.cancelEditMemory();
      this.renderMemoriesManager(window.appStore.get().memories);
      this.showToast("Đã thêm ảnh kỷ niệm mới thành công!", "success");
      window.audioManager.playSfx("sparkle");
    }
  }

  // =========================================================================
  // 4. BIND TOÀN BỘ SỰ KIỆN TƯƠNG TÁC ADMIN
  // =========================================================================
  bindEvents() {
    // Submit PIN form
    const pinForm = document.getElementById("admin-pin-form");
    if (pinForm) {
      pinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pinInput = document.getElementById("admin-pin-input");
        if (pinInput) {
          this.verifyPin(pinInput.value);
        }
      });
    }

    // PIN quick buttons (bàn phím số ảo)
    document.querySelectorAll(".pin-key-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const val = e.currentTarget.getAttribute("data-key");
        const pinInput = document.getElementById("admin-pin-input");
        if (!pinInput) return;
        window.audioManager.playSfx("pop");

        if (val === "clear") {
          pinInput.value = "";
        } else if (val === "back") {
          pinInput.value = pinInput.value.slice(0, -1);
        } else if (val === "submit") {
          this.verifyPin(pinInput.value);
        } else {
          if (pinInput.value.length < 8) {
            pinInput.value += val;
          }
        }
      });
    });

    // Đóng modals
    document.getElementById("btn-close-pin-modal")?.addEventListener("click", () => this.closePinModal());
    document.getElementById("btn-close-admin-dash")?.addEventListener("click", () => this.closeDashboard());

    // Switch admin tabs
    document.querySelectorAll(".admin-tab-btn").forEach((tabBtn) => {
      tabBtn.addEventListener("click", (e) => {
        const targetTab = e.currentTarget.getAttribute("data-tab");
        window.audioManager.playSfx("pop");

        document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".admin-tab-content").forEach((c) => c.classList.remove("active"));

        e.currentTarget.classList.add("active");
        const content = document.getElementById(`admin-tab-${targetTab}`);
        if (content) content.classList.add("active");

        if (targetTab === "share") {
          this.loadSharePagesList();
        }
      });
    });

    // --- AVATAR INTERACTION (LIVE PREVIEW, FILE NÉN CANVAS, PRESETS, CLEAR) ---
    const avatarInput = document.getElementById("cfg-recipient-avatar");
    if (avatarInput) {
      avatarInput.addEventListener("input", (e) => {
        this.updateLiveAvatarPreview(e.target.value.trim());
      });
      avatarInput.addEventListener("change", (e) => {
        this.updateLiveAvatarPreview(e.target.value.trim());
      });
    }

    const recipientNameInput = document.getElementById("cfg-recipient-name");
    if (recipientNameInput) {
      recipientNameInput.addEventListener("input", (e) => {
        const liveName = document.getElementById("admin-recipient-live-name");
        if (liveName) liveName.textContent = e.target.value.trim() || "Nguyễn Ngọc Ánh";
      });
    }

    const avatarFileInput = document.getElementById("cfg-recipient-avatar-file");
    if (avatarFileInput) {
      avatarFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            this.showToast("Đang nén ảnh thông minh...", "info");
            const compressed = await this.compressImageFile(file, 800, 800, 0.82);
            document.getElementById("cfg-recipient-avatar").value = compressed;
            this.updateLiveAvatarPreview(compressed);
            this.showToast("Đã nạp và tối ưu ảnh đại diện thành công!", "success");
            window.audioManager.playSfx("sparkle");
          } catch (err) {
            console.error("Lỗi nén ảnh avatar:", err);
            this.showToast("Không thể tải ảnh: " + err.message, "error");
          }
        }
      });
    }

    document.getElementById("btn-admin-avatar-preset")?.addEventListener("click", () => {
      this.presetAvatarIndex = (this.presetAvatarIndex + 1) % this.avatarPresets.length;
      const presetUrl = this.avatarPresets[this.presetAvatarIndex];
      document.getElementById("cfg-recipient-avatar").value = presetUrl;
      this.updateLiveAvatarPreview(presetUrl);
      this.showToast("Đã đổi sang ảnh đại diện mẫu xinh xắn!", "info");
      window.audioManager.playSfx("pop");
    });

    document.getElementById("btn-admin-avatar-clear")?.addEventListener("click", () => {
      const defaultAvatar = "images/avatar.png";
      document.getElementById("cfg-recipient-avatar").value = defaultAvatar;
      this.updateLiveAvatarPreview(defaultAvatar);
      this.showToast("Đã đặt lại ảnh đại diện mặc định!", "info");
      window.audioManager.playSfx("pop");
    });

    // --- LIVE LETTER PREVIEW & DEDICATED LETTER SAVE BUTTON ---
    ["cfg-letter-title", "cfg-letter-sender", "cfg-letter-content"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        this.updateLiveLetterPreview();
      });
    });

    document.getElementById("btn-save-letter-only")?.addEventListener("click", () => {
      const title = document.getElementById("cfg-letter-title").value.trim();
      const sender = document.getElementById("cfg-letter-sender").value.trim();
      const content = document.getElementById("cfg-letter-content").value.trim();

      window.appStore.update((data) => {
        data.letter.title = title;
        data.letter.sender = sender;
        data.letter.content = content;
      });

      this.showToast("Đã lưu bức tâm thư hoàng gia!", "success");
      window.audioManager.playSfx("fanfare");
    });

    // --- TREE LETTER BUTTONS ---
    document.getElementById("btn-add-tree-letter-submit")?.addEventListener("click", () => {
      this.handleAddNewTreeLetter();
    });

    document.getElementById("btn-cancel-tree-letter-edit")?.addEventListener("click", () => {
      this.cancelEditTreeLetter();
    });

    // --- WISHES BUTTONS ---
    document.getElementById("btn-add-wish-submit")?.addEventListener("click", () => {
      this.handleAddNewWish();
    });

    document.getElementById("btn-cancel-wish-edit")?.addEventListener("click", () => {
      this.cancelEditWish();
    });

    // --- MEMORIES BUTTONS & FILE NÉN ---
    document.getElementById("btn-add-mem-submit")?.addEventListener("click", () => {
      this.handleAddNewMemory();
    });

    document.getElementById("btn-cancel-mem-edit")?.addEventListener("click", () => {
      this.cancelEditMemory();
    });

    const memFileInput = document.getElementById("new-mem-file");
    if (memFileInput) {
      memFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            this.showToast("Đang nén ảnh kỷ niệm...", "info");
            const compressed = await this.compressImageFile(file, 900, 900, 0.82);
            document.getElementById("new-mem-url").value = compressed;
            const previewWrap = document.getElementById("new-mem-preview-wrap");
            const previewImg = document.getElementById("new-mem-preview-img");
            if (previewWrap && previewImg) {
              previewImg.src = compressed;
              previewWrap.style.display = "flex";
            }
            this.showToast("Đã nạp và tối ưu ảnh kỷ niệm!", "success");
            window.audioManager.playSfx("sparkle");
          } catch (err) {
            console.error("Lỗi nén ảnh kỷ niệm:", err);
            this.showToast("Không thể tải ảnh: " + err.message, "error");
          }
        }
      });
    }

    // URL Memory change preview
    document.getElementById("new-mem-url")?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      const previewWrap = document.getElementById("new-mem-preview-wrap");
      const previewImg = document.getElementById("new-mem-preview-img");
      if (url && previewWrap && previewImg) {
        previewImg.src = url;
        previewWrap.style.display = "flex";
      }
    });

    // --- SAVE ALL CHANGES ---
    document.getElementById("btn-save-admin-settings")?.addEventListener("click", () => {
      this.saveAll();
    });

    // Export JSON
    document.getElementById("btn-export-config")?.addEventListener("click", () => {
      const json = window.appStore.exportJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VIP-Website-Backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast("Đã xuất file cấu hình JSON thành công!", "success");
    });

    // Import JSON
    document.getElementById("btn-import-config-trigger")?.addEventListener("click", () => {
      document.getElementById("file-import-config")?.click();
    });

    document.getElementById("file-import-config")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const ok = window.appStore.importJSON(evt.target.result);
          if (ok) {
            this.populateFormFields();
            this.showToast("Nhập dữ liệu thành công! Trang đã cập nhật.", "success");
            window.audioManager.playSfx("fanfare");
          } else {
            this.showToast("File JSON không hợp lệ!", "error");
          }
        };
        reader.readAsText(file);
      }
    });

    // Reset default
    document.getElementById("btn-reset-default")?.addEventListener("click", () => {
      if (confirm("CẢNH BÁO: Bạn có muốn khôi phục toàn bộ nội dung về mặc định ban đầu không?")) {
        window.appStore.resetToDefault();
        this.populateFormFields();
        this.showToast("Đã khôi phục cài đặt mặc định!", "info");
        window.audioManager.playSfx("fanfare");
      }
    });

    // Quản lý lộ trình hành trình VIP
    document.getElementById("btn-admin-unlock-all-journey")?.addEventListener("click", () => {
      if (window.journeyManagerInstance) {
        window.journeyManagerInstance.unlockAll();
      }
    });

    document.getElementById("btn-admin-reset-journey")?.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn đặt lại lộ trình về Chương 1 và khóa các chương sau không?")) {
        if (window.journeyManagerInstance) {
          window.journeyManagerInstance.resetProgress();
        }
      }
    });

    // Nhạc mẫu preset buttons
    document.querySelectorAll("[data-preset-music]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const url = e.currentTarget.getAttribute("data-preset-music");
        const title = e.currentTarget.getAttribute("data-preset-title");
        document.getElementById("cfg-music-url").value = url;
        document.getElementById("cfg-music-title").value = title;
        this.showToast(`Đã chọn bài hát: ${title}`, "info");
      });
    });

    // Tải file MP3 trực tiếp từ máy tính / điện thoại
    const musicFileInput = document.getElementById("cfg-music-file-input");
    const triggerMusicBtn = document.getElementById("btn-trigger-music-file");
    const musicUploadStatus = document.getElementById("music-file-upload-status");

    triggerMusicBtn?.addEventListener("click", () => {
      musicFileInput?.click();
    });

    musicFileInput?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (musicUploadStatus) musicUploadStatus.textContent = "⏳ Đang tải file lên...";
      this.showToast("⏳ Đang tải bài hát lên server...", "info");

      try {
        const response = await fetch("/api/upload-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: file
        });
        const result = await response.json();
        if (result.success) {
          const songName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          const formattedTitle = songName.toLowerCase().includes("nang tho") || songName.toLowerCase().includes("nàng thơ") 
            ? "Nàng Thơ - Hoàng Dũng" 
            : songName;
          
          document.getElementById("cfg-music-url").value = result.url;
          document.getElementById("cfg-music-title").value = formattedTitle;
          if (musicUploadStatus) musicUploadStatus.textContent = `✅ Đã nhận: ${file.name}`;
          this.showToast("🎵 Đã nạp bài hát vào dự án thành công!", "success");
          window.audioManager.playSfx("sparkle");
        } else {
          throw new Error(result.error || "Không thể lưu file");
        }
      } catch (err) {
        console.error("Lỗi upload nhạc:", err);
        if (musicUploadStatus) musicUploadStatus.textContent = "❌ Lỗi: " + err.message;
        this.showToast("Lỗi tải nhạc: " + err.message, "warning");
      }
    });

    // --- TAB TẠO TRANG RIÊNG & QR CODE ---
    document.getElementById("btn-create-share-page")?.addEventListener("click", () => {
      this.createSharePage();
    });

    document.getElementById("btn-copy-share-url")?.addEventListener("click", () => {
      const urlInput = document.getElementById("share-result-url");
      if (urlInput && urlInput.value) {
        navigator.clipboard.writeText(urlInput.value).then(() => {
          this.showToast("📋 Đã sao chép liên kết trang riêng!", "success");
          window.audioManager.playSfx("sparkle");
        }).catch(() => {
          urlInput.select();
          document.execCommand("copy");
          this.showToast("📋 Đã sao chép liên kết!", "success");
        });
      }
    });

    document.getElementById("btn-download-qr")?.addEventListener("click", async () => {
      const qrImg = document.getElementById("share-qr-image");
      if (qrImg && qrImg.src) {
        try {
          this.showToast("💾 Đang chuẩn bị tải mã QR...", "info");
          const res = await fetch(qrImg.src);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `QR-VIP-Dedication-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          this.showToast("✅ Đã tải mã QR về máy thành công!", "success");
          window.audioManager.playSfx("fanfare");
        } catch (err) {
          window.open(qrImg.src, "_blank");
          this.showToast("Đã mở ảnh QR ở tab mới, bạn có thể lưu ảnh!", "info");
        }
      }
    });

    document.getElementById("btn-share-new")?.addEventListener("click", () => {
      const panel = document.getElementById("share-result-panel");
      if (panel) panel.style.display = "none";
      const labelInput = document.getElementById("share-page-label");
      if (labelInput) {
        labelInput.value = "";
        labelInput.focus();
      }
    });
  }

  // =========================================================================
  // 5. LƯU TẤT CẢ THAY ĐỔI VÀO STORE
  // =========================================================================
  saveAll() {
    const recipientName = document.getElementById("cfg-recipient-name").value.trim();
    const recipientNickname = document.getElementById("cfg-recipient-nickname").value.trim();
    const recipientOccasion = document.getElementById("cfg-recipient-occasion").value.trim();
    const recipientBadge = document.getElementById("cfg-recipient-badge").value.trim();
    const recipientSubgreeting = document.getElementById("cfg-recipient-subgreeting").value.trim();
    const recipientAvatar = document.getElementById("cfg-recipient-avatar").value.trim();
    const recipientDate = document.getElementById("cfg-recipient-date").value;

    const letterTitle = document.getElementById("cfg-letter-title").value.trim();
    const letterSender = document.getElementById("cfg-letter-sender").value.trim();
    const letterContent = document.getElementById("cfg-letter-content").value.trim();

    const musicUrl = document.getElementById("cfg-music-url").value.trim();
    const musicTitle = document.getElementById("cfg-music-title").value.trim();
    const themeStyle = document.getElementById("cfg-theme-style").value;
    const particleMode = document.getElementById("cfg-particle-mode").value;

    const adminPin = document.getElementById("cfg-admin-pin")?.value.trim() || "2010";
    const entryPasscode = document.getElementById("cfg-entry-passcode")?.value.trim() || "06072010";
    const entryHint = document.getElementById("cfg-entry-hint")?.value.trim() || "Ngày kỷ niệm đặc biệt (Ví dụ: 06072010)";

    const audienceMode = document.getElementById("cfg-audience-mode")?.value || "crush";

    window.appStore.update((data) => {
      data.audienceMode = audienceMode;
      data.recipient.name = recipientName;
      data.recipient.nickname = recipientNickname;
      data.recipient.occasion = recipientOccasion;
      data.recipient.headerBadge = recipientBadge;
      data.recipient.subGreeting = recipientSubgreeting;
      data.recipient.avatarUrl = recipientAvatar;
      data.recipient.eventDate = recipientDate;

      data.letter.title = letterTitle;
      data.letter.sender = letterSender;
      data.letter.content = letterContent;

      data.music.url = musicUrl;
      data.music.title = musicTitle;

      data.theme.current = themeStyle;
      data.theme.particleType = particleMode;

      data.security.pin = adminPin;
      data.security.entryPasscode = entryPasscode;
      data.security.entryHint = entryHint;
    });

    // Đồng bộ tức thì cây 3D nếu đang hiển thị
    if (window.sakuraTreeInstance) {
      window.sakuraTreeInstance.refreshHangingLetters();
    }

    this.showToast("✦ Đã lưu toàn bộ thay đổi vào Database SQLite thành công! Mọi thiết bị truy cập đều thấy ngay lập tức. ✦", "success");
    window.audioManager.playSfx("fanfare");
    this.closeDashboard();
  }

  // =========================================================================
  // 6. TẠO TRANG RIÊNG BIỆT & CHIA SẺ QR CODE
  // =========================================================================

  async createSharePage() {
    const label = document.getElementById("share-page-label")?.value.trim() || "Trang Chia Sẻ VIP";
    
    // Lưu tất cả settings hiện tại trước khi snapshot
    this.saveAll_silent();

    const config = JSON.parse(JSON.stringify(window.appStore.get()));

    try {
      this.showToast("⏳ Đang tạo trang chia sẻ riêng biệt...", "info");

      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ label, config })
      });

      const json = await res.json();
      if (json.success) {
        const shareUrl = `${window.location.origin}/?s=${json.shareId}`;
        
        // Hiện panel kết quả
        const panel = document.getElementById("share-result-panel");
        const urlInput = document.getElementById("share-result-url");
        const labelEl = document.getElementById("share-result-label");
        const qrImg = document.getElementById("share-qr-image");

        if (panel) panel.style.display = "block";
        if (urlInput) urlInput.value = shareUrl;
        if (labelEl) labelEl.textContent = `📌 ${label}`;

        // Tạo QR Code qua API công khai
        if (qrImg) {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=000000&margin=10`;
          qrImg.src = qrApiUrl;
        }

        // Reload danh sách
        this.loadSharePagesList();
        
        this.showToast(json.message || "✦ Đã tạo trang chia sẻ thành công!", "success");
        window.audioManager.playSfx("fanfare");
      } else {
        this.showToast("Lỗi: " + (json.error || "Không thể tạo trang"), "error");
      }
    } catch (err) {
      console.error("Error creating share page:", err);
      this.showToast("Lỗi kết nối server: " + err.message, "error");
    }
  }

  async loadSharePagesList() {
    const container = document.getElementById("share-pages-list");
    if (!container) return;

    try {
      const res = await fetch("/api/share/list");
      const json = await res.json();

      if (json.success && Array.isArray(json.pages)) {
        if (json.pages.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
              <div style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5;">📭</div>
              <p style="font-size: 0.92rem;">Chưa có trang chia sẻ nào được tạo.</p>
              <p style="font-size: 0.82rem; opacity: 0.7;">Hãy cấu hình nội dung ở các tab khác, rồi quay lại đây bấm "Tạo Trang Riêng" nhé!</p>
            </div>
          `;
          return;
        }

        container.innerHTML = "";
        json.pages.forEach(page => {
          const shareUrl = `${window.location.origin}/?s=${page.id}`;
          const createdDate = new Date(page.created_at).toLocaleString("vi-VN");
          const card = document.createElement("div");
          card.className = "admin-item-card";
          card.style.borderLeft = "3px solid #9333ea";
          card.innerHTML = `
            <div class="admin-item-header" style="flex-wrap: wrap; gap: 8px;">
              <div class="admin-item-title-group" style="flex: 1; min-width: 200px;">
                <span class="admin-item-icon">🔗</span>
                <strong>${this.escapeHtml(page.label)}</strong>
                <span class="badge badge-sm" style="background: rgba(147, 51, 234, 0.3); color: #c084fc;">${page.id}</span>
                <span class="badge badge-sm" style="background: rgba(34, 211, 238, 0.2); color: #22d3ee;">👁 ${page.views || 0} lượt xem</span>
              </div>
              <div class="admin-item-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn-icon" style="color: #22d3ee;" data-share-copy="${shareUrl}" title="Sao chép link">📋 Copy Link</button>
                <button type="button" class="btn-icon" style="color: #a78bfa;" data-share-qr="${shareUrl}" title="Xem QR Code">📱 QR</button>
                <button type="button" class="btn-icon text-danger" data-share-del="${page.id}" title="Xóa trang này">🗑️ Xóa</button>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px;">
              <input type="text" value="${this.escapeHtml(shareUrl)}" readonly class="form-input" style="flex: 1; font-size: 0.8rem; padding: 6px 10px; color: #67e8f9; background: rgba(0,0,0,0.25); border: 1px solid rgba(34,211,238,0.2); cursor: pointer;" onclick="this.select()">
            </div>
            <small class="text-muted" style="display:block; margin-top: 6px;">📅 Tạo lúc: ${createdDate}</small>
          `;
          container.appendChild(card);
        });

        // Delegate events
        container.querySelectorAll("[data-share-copy]").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const url = e.currentTarget.getAttribute("data-share-copy");
            navigator.clipboard.writeText(url).then(() => {
              this.showToast("📋 Đã sao chép link chia sẻ!", "success");
              window.audioManager.playSfx("sparkle");
            }).catch(() => {
              // Fallback
              const tmpInput = document.createElement("input");
              tmpInput.value = url;
              document.body.appendChild(tmpInput);
              tmpInput.select();
              document.execCommand("copy");
              document.body.removeChild(tmpInput);
              this.showToast("📋 Đã sao chép link!", "success");
            });
          });
        });

        container.querySelectorAll("[data-share-qr]").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const url = e.currentTarget.getAttribute("data-share-qr");
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=10`;
            
            // Hiện QR trên panel kết quả
            const panel = document.getElementById("share-result-panel");
            const urlInput = document.getElementById("share-result-url");
            const qrImg = document.getElementById("share-qr-image");
            if (panel) panel.style.display = "block";
            if (urlInput) urlInput.value = url;
            if (qrImg) qrImg.src = qrApiUrl;
            
            panel?.scrollIntoView({ behavior: "smooth", block: "center" });
            this.showToast("📱 Đã hiển thị mã QR!", "info");
          });
        });

        container.querySelectorAll("[data-share-del]").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const shareId = e.currentTarget.getAttribute("data-share-del");
            if (!confirm(`Bạn có chắc chắn muốn xóa trang chia sẻ "${shareId}" không?`)) return;
            
            try {
              const res = await fetch(`/api/share/${shareId}`, { method: "DELETE" });
              const json = await res.json();
              if (json.success) {
                this.loadSharePagesList();
                this.showToast("🗑️ Đã xóa trang chia sẻ!", "info");
                window.audioManager.playSfx("pop");
              }
            } catch (err) {
              this.showToast("Lỗi xóa: " + err.message, "error");
            }
          });
        });
      }
    } catch (err) {
      container.innerHTML = `<p style="color: #ff6b81; text-align: center; padding: 16px;">⚠️ Không thể tải danh sách: ${err.message}</p>`;
    }
  }

  // Lưu tất cả settings mà KHÔNG đóng dashboard (silent save)
  saveAll_silent() {
    const recipientName = document.getElementById("cfg-recipient-name")?.value.trim();
    const recipientNickname = document.getElementById("cfg-recipient-nickname")?.value.trim();
    const recipientOccasion = document.getElementById("cfg-recipient-occasion")?.value.trim();
    const recipientBadge = document.getElementById("cfg-recipient-badge")?.value.trim();
    const recipientSubgreeting = document.getElementById("cfg-recipient-subgreeting")?.value.trim();
    const recipientAvatar = document.getElementById("cfg-recipient-avatar")?.value.trim();
    const recipientDate = document.getElementById("cfg-recipient-date")?.value;

    const letterTitle = document.getElementById("cfg-letter-title")?.value.trim();
    const letterSender = document.getElementById("cfg-letter-sender")?.value.trim();
    const letterContent = document.getElementById("cfg-letter-content")?.value.trim();

    const musicUrl = document.getElementById("cfg-music-url")?.value.trim();
    const musicTitle = document.getElementById("cfg-music-title")?.value.trim();
    const themeStyle = document.getElementById("cfg-theme-style")?.value;
    const particleMode = document.getElementById("cfg-particle-mode")?.value;

    const adminPin = document.getElementById("cfg-admin-pin")?.value.trim() || "2010";
    const entryPasscode = document.getElementById("cfg-entry-passcode")?.value.trim() || "06072010";
    const entryHint = document.getElementById("cfg-entry-hint")?.value.trim() || "Ngày kỷ niệm đặc biệt (Ví dụ: 06072010)";

    const audienceMode = document.getElementById("cfg-audience-mode")?.value || "crush";

    window.appStore.update((data) => {
      data.audienceMode = audienceMode;
      if (recipientName !== undefined) data.recipient.name = recipientName;
      if (recipientNickname !== undefined) data.recipient.nickname = recipientNickname;
      if (recipientOccasion !== undefined) data.recipient.occasion = recipientOccasion;
      if (recipientBadge !== undefined) data.recipient.headerBadge = recipientBadge;
      if (recipientSubgreeting !== undefined) data.recipient.subGreeting = recipientSubgreeting;
      if (recipientAvatar !== undefined) data.recipient.avatarUrl = recipientAvatar;
      if (recipientDate !== undefined) data.recipient.eventDate = recipientDate;

      if (letterTitle !== undefined) data.letter.title = letterTitle;
      if (letterSender !== undefined) data.letter.sender = letterSender;
      if (letterContent !== undefined) data.letter.content = letterContent;

      if (musicUrl !== undefined) data.music.url = musicUrl;
      if (musicTitle !== undefined) data.music.title = musicTitle;
      if (themeStyle !== undefined) data.theme.current = themeStyle;
      if (particleMode !== undefined) data.theme.particleType = particleMode;

      data.security.pin = adminPin;
      data.security.entryPasscode = entryPasscode;
      data.security.entryHint = entryHint;
    });
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    // Giới hạn tối đa 2 thông báo cùng lúc để không chiếm diện tích màn hình điện thoại
    while (container.children.length >= 2) {
      container.removeChild(container.firstChild);
    }

    const toast = document.createElement("div");
    toast.className = `vip-toast toast-${type}`;
    const icon = type === "success" ? "✨" : type === "error" ? "⚠️" : "💎";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${this.escapeHtml(message)}</span>`;
    
    // Chạm vào thông báo để đóng ngay lập tức
    toast.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.adminManager = new AdminManager();
