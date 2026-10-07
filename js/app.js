// app.js - Xử lý trải nghiệm tương tác người dùng, hoạt ảnh VIP, hiệu ứng 3D và render động

document.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi tạo Particle Engine
  const particleCanvas = "particle-canvas";
  const particles = new window.ParticleEngine(particleCanvas);
  window.particleEngineInstance = particles;

  // 1.1 Khởi tạo Cây Anh Đào 3D Hoàng Gia (Sakura Tree 3D Engine)
  if (window.THREE && window.SakuraTree3D) {
    const tree = new window.SakuraTree3D("sakura-tree-3d-stage");
    window.sakuraTreeInstance = tree;
    setupTreeHUDControls(tree);
  }

  // 1.2 QUẢN LÝ LỘ TRÌNH TUẦN TỰ & KHÓA TIẾN TRÌNH (VIP JOURNEY ROADMAP CONTROLLER)
  class JourneyManager {
    constructor() {
      this.pages = ["welcome", "tree", "letter", "wishes"];
      this.pageNames = {
        welcome: "Lời Chào",
        tree: "Cây Nguyện Ước 3D",
        letter: "Tâm Thư",
        wishes: "Lời Chúc"
      };
      this.pageIcons = {
        welcome: "👑",
        tree: "🌸",
        letter: "💌",
        wishes: "✨"
      };
      this.storageKey = "vip_journey_progress_v3";
      this.progress = this.loadProgress();
      this.activePage = "welcome";
      this.initUI();
    }

    loadProgress() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.unlocked === "object") {
            return parsed;
          }
        }
      } catch (e) {}
      return {
        unlocked: {
          welcome: true,
          tree: false,
          letter: false,
          wishes: false
        },
        completed: {
          welcome: false,
          tree: false,
          letter: false,
          wishes: false
        }
      };
    }

    saveProgress() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
      } catch (e) {}
    }

    canAccess(pageId) {
      if (window.adminManager && window.adminManager.isAuthenticated) return true;
      return !!this.progress.unlocked[pageId];
    }

    unlock(pageId, notify = true) {
      if (!this.pages.includes(pageId)) return;
      const isNew = !this.progress.unlocked[pageId];
      this.progress.unlocked[pageId] = true;
      this.saveProgress();
      this.updateUI(this.activePage);

      if (isNew && notify) {
        if (window.audioManager) window.audioManager.playSfx("fanfare");
        if (window.particleEngineInstance) {
          window.particleEngineInstance.burst(window.innerWidth / 2, window.innerHeight * 0.35, 75);
        }
        this.showToast(`✨ Chúc mừng! Đã mở khóa ${this.pageIcons[pageId]} ${this.pageNames[pageId]}!`, "success");
      }
    }

    completeWelcomeTask() {
      this.progress.completed.welcome = true;
      this.unlock("tree", true);
    }

    completeTreeTask(source = "letter") {
      const isFirst = !this.progress.completed.tree || !this.progress.unlocked.letter;
      this.progress.completed.tree = true;
      this.unlock("letter", isFirst);
      if (isFirst) {
        this.showToast("🌸 Tuyệt vời! Bạn đã hoàn thành thử thách Cây Nguyện Ước! Bức Tâm Thư Chương 3 đã mở khóa!", "success");
      }
    }

    completeLetterTask() {
      const isFirst = !this.progress.completed.letter || !this.progress.unlocked.wishes;
      this.progress.completed.letter = true;
      this.unlock("wishes", isFirst);
      if (isFirst) {
        this.showToast("💖 Trái tim đã mở! Bạn đã mở khóa Chương cuối: Vạn Điều Tốt Lành! ✨", "success");
      }
    }

    showLockHint(pageId) {
      const hints = {
        tree: "🔒 Hãy trải nghiệm Lời Chào Mở Đầu và nhấn nút 'Khám Phá Cây Nguyện Ước 3D' ở cuối Chương 1 nhé! 🌸",
        letter: "🔒 Nhiệm vụ Chương 2: Chạm vào Bé Gấu Trúc 🐼 hoặc mở 1 Tấm Thư 🌸 trên cây để mở khóa Bức Tâm Thư nhé!",
        wishes: "🔒 Nhiệm vụ Chương 3: Chạm mở Phong Bì Hoàng Gia 👑 ở Chương 3 để giải mã Vạn Lời Chúc VIP nhé! 💌"
      };
      this.showToast(hints[pageId] || "🔒 Bạn cần hoàn thành nhiệm vụ chương trước để mở khóa chương này!", "warning");
    }

    showToast(msg, type = "info") {
      if (window.adminManager && typeof window.adminManager.showToast === "function") {
        window.adminManager.showToast(msg, type);
      }
    }

    unlockAll() {
      this.pages.forEach((p) => {
        this.progress.unlocked[p] = true;
        this.progress.completed[p] = true;
      });
      this.saveProgress();
      this.updateUI(this.activePage);
      this.showToast("🔓 Đã mở khóa toàn bộ tất cả các chương lộ trình!", "success");
    }

    resetProgress() {
      this.progress = {
        unlocked: { welcome: true, tree: false, letter: false, wishes: false },
        completed: { welcome: false, tree: false, letter: false, wishes: false }
      };
      this.saveProgress();
      this.activePage = "welcome";
      switchPage("welcome");
      this.updateUI("welcome");
      this.showToast("🔒 Đã đặt lại lộ trình ban đầu! (Chỉ mở Chương 1)", "info");
    }

    initUI() {
      this.updateUI(this.activePage);
    }

    updateUI(currentPageId = this.activePage) {
      this.activePage = currentPageId;
      const unlockedCount = this.pages.filter((p) => this.progress.unlocked[p]).length;
      const percent = Math.round((unlockedCount / this.pages.length) * 100);

      // 1. Cập nhật thanh Track Fill
      const fillEl = document.getElementById("roadmap-track-fill");
      if (fillEl) fillEl.style.width = `${percent}%`;

      const percentEl = document.getElementById("roadmap-progress-percent");
      if (percentEl) {
        percentEl.textContent = percent === 100 ? "Tiến độ: 100% Hoàn Thành 👑" : `Tiến độ: ${percent}%`;
      }

      // 2. Cập nhật Roadmap Step Nodes
      this.pages.forEach((pageId) => {
        const stepNode = document.getElementById(`step-node-${pageId}`);
        if (stepNode) {
          const isUnlocked = this.progress.unlocked[pageId];
          const isActive = pageId === currentPageId;
          const isCompleted = this.progress.completed[pageId] || (pageId === "welcome" && this.progress.unlocked.tree) || (percent === 100);

          stepNode.classList.toggle("locked", !isUnlocked);
          stepNode.classList.toggle("active", isActive);
          stepNode.classList.toggle("completed", isCompleted);

          const iconEl = stepNode.querySelector(".step-node-icon");
          if (iconEl) {
            iconEl.textContent = isUnlocked ? this.pageIcons[pageId] : "🔒";
          }
        }
      });

      // 3. Cập nhật Navbar buttons
      this.pages.forEach((pageId) => {
        const navBtn = document.getElementById(`nav-btn-${pageId}`) || document.querySelector(`.nav-page-btn[data-page="${pageId}"]`);
        if (navBtn) {
          const isUnlocked = this.progress.unlocked[pageId];
          navBtn.classList.toggle("is-locked", !isUnlocked);
          const iconEl = navBtn.querySelector(".nav-btn-icon");
          if (iconEl) {
            iconEl.textContent = isUnlocked ? this.pageIcons[pageId] : "🔒";
          }
        }
      });

      // 4. Cập nhật Footer Buttons & Mission Banners
      // Chương 2 (tree -> letter)
      const btnTreeNext = document.getElementById("btn-tree-next");
      const treeStatus = document.getElementById("tree-mission-status");
      if (this.progress.unlocked.letter) {
        if (btnTreeNext) {
          btnTreeNext.classList.remove("btn-locked");
          btnTreeNext.classList.add("btn-unlocked-glow");
          btnTreeNext.innerHTML = '<span>✨ Đã Mở Khóa! Mở Bức Tâm Thư</span> <span>💌 ❯</span>';
        }
        if (treeStatus) {
          treeStatus.className = "mission-status-pill completed";
          treeStatus.innerHTML = '<span class="status-icon">✓</span> <span class="status-text">Đã Hoàn Thành!</span>';
        }
      } else {
        if (btnTreeNext) {
          btnTreeNext.classList.add("btn-locked");
          btnTreeNext.classList.remove("btn-unlocked-glow");
          btnTreeNext.innerHTML = '<span class="btn-lock-icon">🔒</span> <span class="btn-label">Chưa Mở Khóa (Hãy mở thư hoặc chạm gấu)</span>';
        }
        if (treeStatus) {
          treeStatus.className = "mission-status-pill";
          treeStatus.innerHTML = '<span class="status-icon">🔒</span> <span class="status-text">Chưa Hoàn Thành</span>';
        }
      }

      // Chương 3 (letter -> wishes)
      const btnLetterNext = document.getElementById("btn-letter-next");
      const letterStatus = document.getElementById("letter-mission-status");
      if (this.progress.unlocked.wishes) {
        if (btnLetterNext) {
          btnLetterNext.classList.remove("btn-locked");
          btnLetterNext.classList.add("btn-unlocked-glow");
          btnLetterNext.innerHTML = '<span>✨ Đã Mở Khóa! Khám Phá Vạn Lời Chúc</span> <span>✨ ❯</span>';
        }
        if (letterStatus) {
          letterStatus.className = "mission-status-pill completed";
          letterStatus.innerHTML = '<span class="status-icon">✓</span> <span class="status-text">Đã Mở Thư! Hoàn Thành</span>';
        }
      } else {
        if (btnLetterNext) {
          btnLetterNext.classList.add("btn-locked");
          btnLetterNext.classList.remove("btn-unlocked-glow");
          btnLetterNext.innerHTML = '<span class="btn-lock-icon">🔒</span> <span class="btn-label">Chưa Mở Khóa (Hãy chạm mở phong bì)</span>';
        }
        if (letterStatus) {
          letterStatus.className = "mission-status-pill";
          letterStatus.innerHTML = '<span class="status-icon">🔒</span> <span class="status-text">Chưa Mở Bức Thư</span>';
        }
      }
    }
  }

  const journeyManager = new JourneyManager();
  window.journeyManagerInstance = journeyManager;

  // Lắng nghe tín hiệu hoàn thành nhiệm vụ từ cây 3D và tâm thư
  window.onTreeTaskCompleted = function(source) {
    journeyManager.completeTreeTask(source);
  };
  window.onLetterTaskCompleted = function() {
    journeyManager.completeLetterTask();
  };

  // 1.3 HỆ THỐNG ĐIỀU HƯỚNG CHUYỂN TRANG PHÉP THUẬT (CINEMATIC MULTI-PAGE SYSTEM)
  let isTransitioning = false;
  function switchPage(pageId) {
    if (!pageId || isTransitioning) return;

    const validPages = ["welcome", "tree", "letter", "wishes"];
    if (!validPages.includes(pageId)) return;

    isTransitioning = true;

    // 1. Kích hoạt Màn Chuyển Cảnh Phép Thuật (Cinematic Light Portal Wipe)
    const curtain = document.getElementById("page-transition-curtain");
    if (curtain) {
      curtain.classList.remove("active-wipe");
      // Force reflow
      void curtain.offsetWidth;
      curtain.classList.add("active-wipe");
      setTimeout(() => {
        curtain.classList.remove("active-wipe");
        isTransitioning = false;
      }, 760);
    } else {
      isTransitioning = false;
    }

    // 2. Âm thanh chuyển cảnh hào nhoáng
    if (window.audioManager) {
      window.audioManager.playSfx("woosh");
      setTimeout(() => window.audioManager.playSfx("sparkle"), 180);
    }

    // 3. Pháo hoa bụi sao vàng & cánh hoa bung nở khắp màn hình
    if (window.particleEngineInstance) {
      window.particleEngineInstance.burst(window.innerWidth / 2, window.innerHeight * 0.4, 75);
    }

    // 4. Đổi trang đồng thời với độ trễ tối ưu cho mắt nhìn mượt mà
    setTimeout(() => {
      // Ẩn tất cả trang và hiện trang được chọn
      const pages = document.querySelectorAll(".page-section");
      pages.forEach((p) => {
        p.classList.remove("active");
      });

      const target = document.getElementById(`page-${pageId}`);
      if (target) {
        target.classList.add("active");
      }

      // Cập nhật nút navbar
      document.querySelectorAll(".nav-page-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-page") === pageId);
      });

      // Cập nhật dots
      document.querySelectorAll(".step-dot").forEach((dot) => {
        dot.classList.toggle("active", dot.getAttribute("data-page") === pageId);
      });

      // Cập nhật UI lộ trình
      journeyManager.updateUI(pageId);

      // Nếu chuyển vào trang cây anh đào, render chuẩn kích thước & hiện gợi ý
      if (pageId === "tree") {
        if (window.sakuraTreeInstance) {
          window.sakuraTreeInstance.onResize();
        }
        const guide = document.getElementById("tree-interactive-guide");
        const quickContainer = document.getElementById("tree-letters-quick-container");
        if (guide && !journeyManager.progress.completed.tree) {
          guide.style.display = "block";
          guide.style.opacity = "1";
          quickContainer?.classList.add("highlight-guide");
        }
      }

      // Cuộn êm ái lên đầu trang
      window.scrollTo({ top: 120, behavior: "smooth" });

      // Cập nhật hash
      window.location.hash = pageId;
    }, 140);
  }
  window.switchPage = switchPage;

  // HÀM ĐIỀU HƯỚNG CÓ KIỂM SOÁT LỘ TRÌNH (FIXED PROGRESSION GUARD)
  function requestPageNavigation(pageId, triggerElement) {
    if (!pageId) return;

    // Nút Bắt đầu hành trình từ Welcome -> Tự động mở khóa Tree và chuyển trang
    if (triggerElement && triggerElement.id === "btn-welcome-next" && pageId === "tree") {
      journeyManager.completeWelcomeTask();
      switchPage("tree");
      return;
    }

    // Kiểm tra trang có được mở khóa chưa
    if (!journeyManager.canAccess(pageId)) {
      if (triggerElement) {
        triggerElement.classList.remove("shake-locked");
        void triggerElement.offsetWidth;
        triggerElement.classList.add("shake-locked");
        setTimeout(() => triggerElement.classList.remove("shake-locked"), 500);
      }
      if (window.audioManager) {
        window.audioManager.playSfx("pop");
      }
      journeyManager.showLockHint(pageId);
      return;
    }

    // Cho phép chuyển trang
    switchPage(pageId);
  }

  // Lắng nghe sự kiện click nút chuyển trang
  document.querySelectorAll("[data-go-page]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pageId = e.currentTarget.getAttribute("data-go-page");
      requestPageNavigation(pageId, e.currentTarget);
    });
  });

  document.querySelectorAll(".nav-page-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const pageId = e.currentTarget.getAttribute("data-page");
      requestPageNavigation(pageId, e.currentTarget);
    });
  });

  document.querySelectorAll(".roadmap-step").forEach((step) => {
    step.addEventListener("click", (e) => {
      const pageId = e.currentTarget.getAttribute("data-step");
      requestPageNavigation(pageId, e.currentTarget);
    });
  });

  document.querySelectorAll(".step-dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      const pageId = e.currentTarget.getAttribute("data-page");
      requestPageNavigation(pageId, e.currentTarget);
    });
  });

  // Hỗ trợ mở trang từ URL hash (e.g. #tree, #letter, #wishes) nếu đã mở khóa
  if (window.location.hash) {
    const hash = window.location.hash.replace("#", "").replace("page-", "");
    if (["welcome", "tree", "letter", "wishes"].includes(hash)) {
      if (journeyManager.canAccess(hash)) {
        switchPage(hash);
      } else {
        switchPage("welcome");
      }
    }
  }

  // 1.4 KHỞI TẠO MÀN HÌNH KHÓA TRANG ĐẦU & GỢI Ý TƯƠNG TÁC CÂY
  setupEntryLockScreen();
  setupTreeInteractiveGuide();

  function setupEntryLockScreen() {
    const lockScreen = document.getElementById("entry-lock-screen");
    const input = document.getElementById("entry-passcode-input");
    const dotsContainer = document.getElementById("entry-passcode-dots");
    const dots = dotsContainer ? dotsContainer.querySelectorAll(".p-dot") : [];
    const btnSubmit = document.getElementById("btn-submit-entry-passcode");
    const btnTogglePwd = document.getElementById("btn-toggle-entry-pwd");
    const btnHint = document.getElementById("btn-entry-hint-toggle");
    const hintBox = document.getElementById("entry-hint-box");
    const hintText = document.getElementById("entry-hint-text");
    const btnModeCrush = document.getElementById("btn-lock-mode-crush");
    const btnModeFriend = document.getElementById("btn-lock-mode-friend");
    const lockTitleText = document.getElementById("lock-title-text");
    const lockDescText = document.getElementById("lock-desc-text");

    if (!lockScreen || !input) return;

    // Cập nhật text gợi ý từ store
    const config = window.appStore.get();
    if (hintText && config.security && config.security.entryHint) {
      hintText.textContent = `Gợi ý: ${config.security.entryHint}`;
    }

    // Cập nhật giao diện Lock Screen theo chế độ xưng hô (Người yêu / Bạn bè)
    function updateLockScreenModeUI(mode) {
      if (btnModeCrush) btnModeCrush.classList.toggle("active", mode === "crush");
      if (btnModeFriend) btnModeFriend.classList.toggle("active", mode === "friend");

      if (mode === "friend") {
        if (lockTitleText) lockTitleText.textContent = "Cánh Cửa Tri Kỷ";
        if (lockDescText) lockDescText.textContent = "Trang web được thiết kế đặc biệt dành riêng cho một người bạn quý mến. Vui lòng nhập mật mã để mở khóa hành trình.";
        if (btnSubmit) btnSubmit.innerHTML = '<span>Mở Cánh Cửa Tri Kỷ</span> <span>✨ ❯</span>';
      } else {
        if (lockTitleText) lockTitleText.textContent = "Cánh Cửa Trái Tim";
        if (lockDescText) lockDescText.textContent = "Trang web được thiết kế đặc biệt dành riêng cho một người. Vui lòng nhập mật mã yêu thương để mở khóa hành trình.";
        if (btnSubmit) btnSubmit.innerHTML = '<span>Mở Cánh Cửa Yêu Thương</span> <span>✨ ❯</span>';
      }
    }

    const currentAudienceMode = (config.audienceMode || "crush");
    updateLockScreenModeUI(currentAudienceMode);

    btnModeCrush?.addEventListener("click", () => {
      window.appStore.setAudienceMode("crush");
      updateLockScreenModeUI("crush");
      window.audioManager.playSfx("pop");
    });

    btnModeFriend?.addEventListener("click", () => {
      window.appStore.setAudienceMode("friend");
      updateLockScreenModeUI("friend");
      window.audioManager.playSfx("sparkle");
    });

    // Toggle Gợi ý
    btnHint?.addEventListener("click", () => {
      if (hintBox) {
        hintBox.style.display = hintBox.style.display === "none" ? "block" : "none";
        window.audioManager.playSfx("pop");
      }
    });

    // Toggle Hiện / Ẩn mật khẩu
    btnTogglePwd?.addEventListener("click", () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btnTogglePwd.textContent = isPwd ? "🙈" : "👁️";
    });

    // Cập nhật trạng thái dots khi gõ
    function updateDots() {
      const len = input.value.length;
      dots.forEach((dot, idx) => {
        dot.classList.toggle("filled", idx < len);
      });
    }

    function checkAutoSubmit() {
      const entered = input.value.trim();
      const cfg = window.appStore.get();
      const targetPass = (cfg.security && cfg.security.entryPasscode) ? cfg.security.entryPasscode.trim() : "2010";

      // 1. Nhập mã đặc biệt chia tay & tri ân "06072010"
      if (entered === "06072010") {
        setTimeout(verifyEntryPasscode, 80);
        return;
      }

      // 2. Nhập mã mở trang chủ ("2010" hoặc mã admin cấu hình)
      if (entered === "2010" || entered === targetPass) {
        setTimeout(verifyEntryPasscode, 80);
        return;
      }

      // 3. Đã gõ chạm mốc 8 ký tự mà không khớp bất kỳ mã nào
      if (entered.length >= 8) {
        setTimeout(verifyEntryPasscode, 150);
        return;
      }
    }

    input.addEventListener("input", () => {
      updateDots();
      checkAutoSubmit();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        verifyEntryPasscode();
      }
    });

    // Bàn phím số nhanh (Numeric Keypad)
    document.querySelectorAll(".keypad-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-key");
        if (key !== null) {
          if (input.value.length < 8) {
            input.value += key;
            window.audioManager.playSfx("pop");
            updateDots();
            checkAutoSubmit();
          }
        }
      });
    });

    document.getElementById("btn-keypad-clear")?.addEventListener("click", () => {
      input.value = "";
      updateDots();
      window.audioManager.playSfx("woosh");
    });

    document.getElementById("btn-keypad-back")?.addEventListener("click", () => {
      input.value = input.value.slice(0, -1);
      updateDots();
      window.audioManager.playSfx("pop");
    });

    btnSubmit?.addEventListener("click", () => {
      verifyEntryPasscode();
    });

    let isRedirecting = false;
    function verifyEntryPasscode() {
      if (isRedirecting) return;
      const cfg = window.appStore.get();
      const targetPass = (cfg.security && cfg.security.entryPasscode) ? cfg.security.entryPasscode.trim() : "2010";
      const entered = input.value.trim();
      const isFriend = (cfg.audienceMode === "friend");

      // TRƯỜNG HỢP 1: MÃ ĐẶC BIỆT "06072010" -> CHUYỂN TỚI TRANG KỶ NIỆM & TRI ÂN (farewell.html)
      if (entered === "06072010") {
        isRedirecting = true;
        if (window.audioManager) {
          window.audioManager.playSfx("fanfare");
        }
        if (window.particleEngineInstance) {
          window.particleEngineInstance.burst(window.innerWidth / 2, window.innerHeight / 2, 90);
        }
        if (window.adminManager) {
          window.adminManager.showToast("🕊️ Đang mở cánh cửa ký ức & tri ân chân thành...", "info");
        }

        // Mở màn cửa và hiệu ứng chuyển trang mượt mà
        lockScreen.classList.add("unlocked");
        document.body.style.transition = "opacity 0.75s ease, filter 0.75s ease";
        document.body.style.opacity = "0";
        document.body.style.filter = "blur(8px)";

        setTimeout(() => {
          window.location.href = "farewell.html";
        }, 750);
        return;
      }

      // TRƯỜNG HỢP 2: MÃ TRANG CHỦ "2010" HOẶC MÃ CẤU HÌNH -> MỞ KHÓA
      if (entered === "2010" || entered === targetPass) {
        // KIỂM TRA: NẾU LÀ TRANG CHIA SẺ RIÊNG BIỆT (URL ?s=id)
        // Toàn bộ tên, xưng hô, ảnh, thư đã được người tạo cấu hình sẵn
        // Người nhận KHÔNG CẦN chọn chế độ hay nhập gì cả -> MỞ KHÓA VÀ VÀO THẲNG!
        if (window.appStore.isSharedPage) {
          unlockAndEnterSite();
          return;
        }

        // NẾU LÀ TRANG CHỦ BÌNH THƯỜNG -> HIỆN BƯỚC 2: NHẬP TÊN & CHỌN DANH PHẬN
        showProfileStep();
        return;
      }

      // SAI MẬT MÃ
      if (window.audioManager) window.audioManager.playSfx("pop");
      const card = lockScreen.querySelector(".lock-screen-card");
      if (card) {
        card.classList.remove("shake-locked");
        void card.offsetWidth;
        card.classList.add("shake-locked");
        setTimeout(() => card.classList.remove("shake-locked"), 500);
      }
      if (window.adminManager) {
        const failMsg = isFriend 
          ? "Mật mã chưa chính xác! Cậu hãy thử lại nhé ✨" 
          : "Mật mã chưa chính xác! Em hãy thử lại nhé ❤️";
        window.adminManager.showToast(failMsg, "warning");
      }
      // Nháy và reset
      setTimeout(() => {
        input.value = "";
        updateDots();
      }, 450);
    }

    // HIỂN THỊ BƯỚC 2: NHẬP HỌ TÊN VÀ CHỌN DANH PHẬN
    function showProfileStep() {
      const stepPasscode = document.getElementById("lock-step-passcode");
      const stepProfile = document.getElementById("lock-step-profile");
      const nameInput = document.getElementById("entry-recipient-fullname");
      const currentCfg = window.appStore.get();

      if (window.audioManager) window.audioManager.playSfx("sparkle");

      if (nameInput) {
        nameInput.value = currentCfg.recipient.name || "Nguyễn Ngọc Ánh";
      }

      updateLockScreenModeUI(currentCfg.audienceMode || "crush");

      if (stepPasscode && stepProfile) {
        stepPasscode.style.opacity = "0";
        stepPasscode.style.transform = "translateY(-10px)";
        stepPasscode.style.transition = "all 0.3s ease";
        setTimeout(() => {
          stepPasscode.style.display = "none";
          stepProfile.style.display = "block";
          stepProfile.style.opacity = "0";
          stepProfile.style.transform = "translateY(10px)";
          stepProfile.style.transition = "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
          void stepProfile.offsetWidth;
          stepProfile.style.opacity = "1";
          stepProfile.style.transform = "translateY(0)";
          if (nameInput) {
            nameInput.focus();
            nameInput.select();
          }
        }, 300);
      }
    }

    // XỬ LÝ KHI BẤM "BƯỚC VÀO HÀNH TRÌNH" SAU KHI NHẬP TÊN
    const btnConfirmProfile = document.getElementById("btn-confirm-entry-profile");
    const recipientNameInput = document.getElementById("entry-recipient-fullname");

    function handleConfirmProfile() {
      const enteredName = recipientNameInput ? recipientNameInput.value.trim() : "";
      if (enteredName) {
        window.appStore.update((data) => {
          data.recipient.name = enteredName;
        });
      }
      unlockAndEnterSite();
    }

    btnConfirmProfile?.addEventListener("click", handleConfirmProfile);
    recipientNameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleConfirmProfile();
      }
    });

    // MỞ KHÓA MÀN HÌNH VÀ VÀO KHÔNG GIAN WEBSITE
    function unlockAndEnterSite() {
      const currentCfg = window.appStore.get();
      const isCurrentFriend = (currentCfg.audienceMode === "friend");

      if (window.audioManager) {
        window.audioManager.playSfx("fanfare");
        if (typeof window.audioManager.playMusic === "function" && currentCfg.music && currentCfg.music.url) {
          window.audioManager.playMusic(currentCfg.music.url);
        } else if (typeof window.audioManager.play === "function") {
          window.audioManager.play();
        }
      }

      if (window.particleEngineInstance) {
        window.particleEngineInstance.burst(window.innerWidth / 2, window.innerHeight / 2, 90);
      }

      // Mở màn cửa
      lockScreen.classList.add("unlocked");
      setTimeout(() => {
        lockScreen.style.display = "none";
      }, 850);

      // Thông báo chào mừng cá nhân hóa thích ứng xưng hô
      if (window.adminManager) {
        const welcomeMsg = isCurrentFriend
          ? `✨ Chào mừng ${currentCfg.recipient.name}! Cánh cửa tình bạn & tri kỷ đã mở ra 🌸`
          : `✨ Chào mừng ${currentCfg.recipient.name}! Cánh cửa trái tim đã mở ra ❤️`;
        window.adminManager.showToast(welcomeMsg, "success");
      }

      // Chuyển vào trang chào mừng
      switchPage("welcome");
    }

    // Tùy biến UI Lock Screen nếu là trang chia sẻ riêng biệt (?s=id)
    if (window.appStore && window.appStore.isSharedPage) {
      const lockBadgeTag = document.getElementById("lock-badge-tag");
      if (lockBadgeTag) {
        lockBadgeTag.textContent = "✦ TRANG KỶ NIỆM DÀNH RIÊNG ✦";
      }
      if (lockTitleText) {
        lockTitleText.textContent = `Dành Riêng Cho ${config.recipient.name || 'Em'}`;
      }
      if (lockDescText) {
        lockDescText.textContent = `Không gian kỷ niệm đặc biệt được chuẩn bị riêng cho ${config.recipient.name || 'bạn'}. Vui lòng nhập mật mã để mở khóa.`;
      }
    }

    // Đăng ký cập nhật reactive từ Store
    window.appStore?.subscribe((updatedCfg) => {
      if (window.appStore.isSharedPage) {
        const lockBadgeTag = document.getElementById("lock-badge-tag");
        if (lockBadgeTag) {
          lockBadgeTag.textContent = `✦ DÀNH TẶNG ${updatedCfg.recipient.name.toUpperCase()} ✦`;
        }
        if (lockTitleText) {
          lockTitleText.textContent = `Dành Riêng Cho ${updatedCfg.recipient.name || 'Em'}`;
        }
        if (lockDescText) {
          lockDescText.textContent = `Không gian kỷ niệm đặc biệt được chuẩn bị riêng cho ${updatedCfg.recipient.name || 'bạn'}. Vui lòng nhập mật mã để mở khóa.`;
        }
        if (hintText && updatedCfg.security && updatedCfg.security.entryHint) {
          hintText.textContent = `Gợi ý: ${updatedCfg.security.entryHint}`;
        }
      }
    });
  }

  function setupTreeInteractiveGuide() {
    const guide = document.getElementById("tree-interactive-guide");
    const dismissBtn = document.getElementById("btn-dismiss-guide");
    const quickContainer = document.getElementById("tree-letters-quick-container");

    if (dismissBtn && guide) {
      dismissBtn.addEventListener("click", () => {
        guide.style.display = "none";
        quickContainer?.classList.remove("highlight-guide");
      });
    }

    // Khi hoàn thành thử thách cây -> ẩn guide
    const originalCompleteTreeTask = journeyManager.completeTreeTask.bind(journeyManager);
    journeyManager.completeTreeTask = function(source) {
      originalCompleteTreeTask(source);
      if (guide) {
        guide.style.opacity = "0";
        setTimeout(() => guide.style.display = "none", 400);
      }
      quickContainer?.classList.remove("highlight-guide");
    };
  }

  // 2. Kết nối Audio Visualizer
  const vizCanvas = document.getElementById("audio-visualizer");
  if (vizCanvas) {
    window.audioManager.setVisualizerCanvas(vizCanvas);
  }

  // 3. Render dữ liệu từ Store
  function renderAll(config) {
    applyTheme(config.theme);
    renderHero(config.recipient);
    renderCountdown(config.recipient.eventDate);
    renderLetter(config.letter, config.recipient);
    renderTreeLettersHUD(config.treeLetters || []);
    renderWishes(config.wishes);
    renderMemories(config.memories || []);
    renderMusicWidget(config.music);

    if (window.sakuraTreeInstance) {
      window.sakuraTreeInstance.refreshHangingLetters();
    }
  }

  function setupTreeHUDControls(tree) {
    const autoRotateBtn = document.getElementById("btn-tree-autorotate");
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener("click", () => {
        tree.autoRotate = !tree.autoRotate;
        autoRotateBtn.classList.toggle("active", tree.autoRotate);
        autoRotateBtn.innerHTML = tree.autoRotate 
          ? '<span>🔄</span> <span>Tự Xoay: BẬT</span>' 
          : '<span>⏸️</span> <span>Tự Xoay: TẮT</span>';
        window.audioManager.playSfx("pop");
      });
    }

    const resetViewBtn = document.getElementById("btn-tree-reset");
    if (resetViewBtn) {
      resetViewBtn.addEventListener("click", () => {
        tree.spherical = { radius: 30, theta: 0.15, phi: 1.25 };
        tree.targetLookAt.set(0, 6.8, 0);
        tree.updateCameraPosition();
        window.audioManager.playSfx("woosh");
      });
    }

    // Đóng modal xem thư
    document.getElementById("btn-close-tree-letter")?.addEventListener("click", () => {
      document.getElementById("tree-letter-modal")?.classList.remove("active");
    });
  }

  function renderTreeLettersHUD(letters = []) {
    const container = document.getElementById("tree-letters-quick-tags");
    if (!container) return;
    container.innerHTML = "";
    const config = window.appStore.get();
    const mode = config.audienceMode || "crush";
    const transform = (t) => (window.transformPronouns ? window.transformPronouns(t, mode) : t);

    letters.forEach((l, idx) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "tree-tag-quick-pill" + (l.isSpecial ? " special-farewell-pill" : "");
      pill.innerHTML = `<span>${l.icon || "🌸"}</span> <span>${escapeHtml(transform(l.title))}</span>`;
      pill.style.borderColor = l.color || "#ff69b4";

      pill.addEventListener("click", () => {
        if (window.sakuraTreeInstance) {
          window.sakuraTreeInstance.focusOnLetter(idx);
          window.audioManager.playSfx("sparkle");
        }
      });

      container.appendChild(pill);
    });
  }

  // 4. Áp dụng Theme giao diện
  function applyTheme(themeConfig) {
    const body = document.body;
    body.classList.remove("theme-royal-gold", "theme-rose-romance", "theme-cyber-luxe", "theme-emerald-prestige");
    body.classList.add(`theme-${themeConfig.current || "royal-gold"}`);

    if (window.particleEngineInstance) {
      window.particleEngineInstance.setMode(themeConfig.particleType || "golden-dust");
    }
  }

  // 5. Render Hero Section
  function renderHero(recipient) {
    const config = window.appStore.get();
    const mode = config.audienceMode || "crush";
    const transform = (t) => (window.transformPronouns ? window.transformPronouns(t, mode) : t);

    document.title = `VIP Dedication ✦ ${recipient.name} - ${recipient.occasion}`;
    
    const badgeEl = document.getElementById("hero-badge");
    if (badgeEl) badgeEl.textContent = transform(recipient.headerBadge || "✦ VIP SPECIAL DEDICATION ✦");

    const nameEl = document.getElementById("hero-name");
    if (nameEl) nameEl.textContent = recipient.name;

    const nicknameEl = document.getElementById("hero-nickname");
    if (nicknameEl) nicknameEl.textContent = `"${transform(recipient.nickname)}"`;

    const occasionEl = document.getElementById("hero-occasion");
    if (occasionEl) occasionEl.textContent = transform(recipient.occasion);

    const subGreetingEl = document.getElementById("hero-subgreeting");
    if (subGreetingEl) subGreetingEl.textContent = transform(recipient.subGreeting);

    const avatarEl = document.getElementById("hero-avatar");
    if (avatarEl && recipient.avatarUrl) {
      avatarEl.src = recipient.avatarUrl;
    }

    // Cập nhật Header mode switcher button
    const headerBtn = document.getElementById("btn-toggle-audience-mode");
    const headerModeIcon = document.getElementById("header-mode-icon");
    const headerModeText = document.getElementById("header-mode-text");
    const headerDedication = document.getElementById("header-dedication-tag");

    if (headerBtn) {
      headerBtn.classList.toggle("mode-friend", mode === "friend");
    }
    if (headerModeIcon) {
      headerModeIcon.textContent = mode === "friend" ? "🌸" : "💖";
    }
    if (headerModeText) {
      headerModeText.textContent = mode === "friend" ? "Bạn Bè (Tớ - Cậu)" : "Người Yêu (Anh - Em)";
    }
    if (headerDedication) {
      headerDedication.textContent = mode === "friend" ? "Đặc Quyền Dành Riêng Cho Cậu" : "Đặc Quyền Dành Riêng Cho Em";
    }
  }

  // 6. Countdown Timer
  let countdownInterval = null;
  function renderCountdown(targetDateStr) {
    if (!targetDateStr) return;
    if (countdownInterval) clearInterval(countdownInterval);

    const targetTime = new Date(targetDateStr).getTime();

    function update() {
      const now = new Date().getTime();
      const diff = targetTime - now;

      const daysEl = document.getElementById("cd-days");
      const hoursEl = document.getElementById("cd-hours");
      const minsEl = document.getElementById("cd-mins");
      const secsEl = document.getElementById("cd-secs");
      const labelEl = document.getElementById("cd-label");

      const config = window.appStore.get();
      const mode = config.audienceMode || "crush";

      if (diff > 0) {
        if (labelEl) labelEl.textContent = "ĐẾM NGƯỢC ĐẾN KHOẢNH KHẮC ĐẶC BIỆT";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
        if (minsEl) minsEl.textContent = String(mins).padStart(2, "0");
        if (secsEl) secsEl.textContent = String(secs).padStart(2, "0");
      } else {
        if (labelEl) {
          labelEl.textContent = mode === "friend"
            ? "✨ HÔM NAY LÀ NGÀY CỦA CẬU - TOÀN CẦU CHÚC MỪNG! ✨"
            : "✨ HÔM NAY LÀ NGÀY CỦA EM - TOÀN CẦU CHÚC MỪNG! ✨";
        }
        const pastDiff = Math.abs(diff);
        const days = Math.floor(pastDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((pastDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((pastDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((pastDiff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
        if (minsEl) minsEl.textContent = String(mins).padStart(2, "0");
        if (secsEl) secsEl.textContent = String(secs).padStart(2, "0");
      }
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  // 7. Render Thư Ngỏ Phong Bì 3D
  function renderLetter(letter, recipient) {
    const config = window.appStore.get();
    const mode = config.audienceMode || "crush";
    const transform = (t) => (window.transformPronouns ? window.transformPronouns(t, mode) : t);

    const titleEl = document.getElementById("letter-view-title");
    if (titleEl) titleEl.textContent = transform(letter.title || `Gửi Đến ${recipient.name}`);

    const contentEl = document.getElementById("letter-view-content");
    if (contentEl) {
      contentEl.innerHTML = letter.content ? transform(letter.content).replace(/\n/g, "<br>") : "";
    }

    const senderEl = document.getElementById("letter-view-sender");
    if (senderEl) senderEl.textContent = letter.sender ? `— ${transform(letter.sender)}` : "";

    const envelopeAddrName = document.getElementById("envelope-addr-name");
    if (envelopeAddrName) envelopeAddrName.textContent = recipient.name || "Nguyễn Ngọc Ánh";
  }

  // 8. Render Lưới Lời Chúc VIP Cards
  let activeFilter = "all";
  function renderWishes(wishes = []) {
    const config = window.appStore.get();
    const mode = config.audienceMode || "crush";
    const transform = (t) => (window.transformPronouns ? window.transformPronouns(t, mode) : t);

    const container = document.getElementById("wishes-grid");
    if (!container) return;
    container.innerHTML = "";

    const filtered = activeFilter === "all" 
      ? wishes 
      : wishes.filter((w) => w.tag && w.tag.toLowerCase().includes(activeFilter.toLowerCase()));

    filtered.forEach((w) => {
      const card = document.createElement("div");
      card.className = `wish-card glass-panel ${w.isHighlight ? "card-highlight" : ""}`;
      card.setAttribute("data-tilt", "true");

      card.innerHTML = `
        <div class="wish-card-glow"></div>
        <div class="wish-card-top">
          <span class="wish-icon-avatar">${w.icon || "✨"}</span>
          <span class="badge ${w.isHighlight ? 'badge-gold' : 'badge-subtle'}">${escapeHtml(transform(w.tag || "VIP"))}</span>
        </div>
        <h3 class="wish-title">${escapeHtml(transform(w.title))}</h3>
        <p class="wish-content">${escapeHtml(transform(w.content))}</p>
        <div class="wish-card-footer">
          <span class="wish-author">Từ: <strong>${escapeHtml(transform(w.author || "Người thương"))}</strong></span>
          <button type="button" class="btn-like-wish" title="Thả tim lời chúc này">
            <span class="heart-icon">❤️</span> <span class="like-count">1</span>
          </button>
        </div>
      `;

      // Nút like
      const likeBtn = card.querySelector(".btn-like-wish");
      const likeCount = card.querySelector(".like-count");
      let count = 1;
      let liked = false;
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        liked = !liked;
        count = liked ? count + 1 : count - 1;
        likeCount.textContent = count;
        likeBtn.classList.toggle("liked", liked);
        window.audioManager.playSfx("pop");

        // Spawn floating hearts
        spawnFloatingHeart(e.clientX, e.clientY);
      });

      // 3D Card Tilt Effect
      setupCardTilt(card);

      container.appendChild(card);
    });

    // Cập nhật bộ lọc tags
    updateFilterButtons(wishes);
  }

  function updateFilterButtons(wishes) {
    const filterContainer = document.getElementById("wishes-tags-filter");
    if (!filterContainer) return;
    filterContainer.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = `filter-tag-btn ${activeFilter === "all" ? "active" : ""}`;
    allBtn.textContent = `Tất cả (${wishes.length})`;
    allBtn.addEventListener("click", () => {
      activeFilter = "all";
      renderWishes(window.appStore.get().wishes);
    });
    filterContainer.appendChild(allBtn);

    const tags = Array.from(new Set(wishes.map((w) => w.tag).filter(Boolean)));
    tags.forEach((tag) => {
      const count = wishes.filter((w) => w.tag === tag).length;
      const tagBtn = document.createElement("button");
      tagBtn.className = `filter-tag-btn ${activeFilter === tag ? "active" : ""}`;
      tagBtn.textContent = `${tag} (${count})`;
      tagBtn.addEventListener("click", () => {
        activeFilter = tag;
        renderWishes(window.appStore.get().wishes);
      });
      filterContainer.appendChild(tagBtn);
    });
  }

  // 9. 3D Tilt Effect on mouse movement
  function setupCardTilt(card) {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  }

  // 10. Render Album Kỷ Niệm
  function renderMemories(memories = []) {
    const galleryContainer = document.getElementById("gallery-grid");
    if (!galleryContainer) return;
    galleryContainer.innerHTML = "";

    memories.forEach((mem, idx) => {
      const item = document.createElement("div");
      item.className = "gallery-card glass-panel";
      item.innerHTML = `
        <div class="gallery-img-wrapper">
          <img src="${mem.url}" alt="${escapeHtml(mem.title)}" loading="lazy" class="gallery-img" />
          <div class="gallery-overlay">
            <span class="gallery-zoom-icon">🔍 Phóng to</span>
          </div>
        </div>
        <div class="gallery-info">
          <h4 class="gallery-title">${escapeHtml(mem.title)}</h4>
          <p class="gallery-desc">${escapeHtml(mem.desc || "")}</p>
          <span class="gallery-date">✦ ${escapeHtml(mem.date || "Kỷ niệm")}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        openLightbox(memories, idx);
      });

      galleryContainer.appendChild(item);
    });
  }

  // Lightbox
  let currentLightboxIdx = 0;
  function openLightbox(memories, idx) {
    currentLightboxIdx = idx;
    const modal = document.getElementById("gallery-lightbox-modal");
    const img = document.getElementById("lightbox-img");
    const title = document.getElementById("lightbox-title");
    const desc = document.getElementById("lightbox-desc");

    if (modal && img) {
      const item = memories[idx];
      img.src = item.url;
      if (title) title.textContent = item.title;
      if (desc) desc.textContent = item.desc || "";
      modal.classList.add("active");
      window.audioManager.playSfx("sparkle");
    }
  }

  document.getElementById("btn-close-lightbox")?.addEventListener("click", () => {
    document.getElementById("gallery-lightbox-modal")?.classList.remove("active");
  });

  document.getElementById("btn-lightbox-prev")?.addEventListener("click", () => {
    const memories = window.appStore.get().memories;
    currentLightboxIdx = (currentLightboxIdx - 1 + memories.length) % memories.length;
    openLightbox(memories, currentLightboxIdx);
  });

  document.getElementById("btn-lightbox-next")?.addEventListener("click", () => {
    const memories = window.appStore.get().memories;
    currentLightboxIdx = (currentLightboxIdx + 1) % memories.length;
    openLightbox(memories, currentLightboxIdx);
  });

  // 11. Render Music Widget info
  function renderMusicWidget(music) {
    const titleEl = document.getElementById("music-current-title");
    if (titleEl) {
      titleEl.textContent = music.title || "VIP Romantic Soundscape";
    }
  }

  // 12. Mystery Gift Box (Hộp Quà Bất Ngờ)
  let isGiftOpened = false;
  let giftIndex = 0;
  function updateGiftBox(gifts = []) {
    // Gift content ready
  }

  const giftBox = document.getElementById("vip-gift-box-3d");
  if (giftBox) {
    giftBox.addEventListener("click", (e) => {
      const gifts = window.appStore.get().surpriseGifts || [];
      const currentGift = gifts[giftIndex % gifts.length];
      giftIndex++;

      giftBox.classList.add("opened");
      window.audioManager.playSfx("fanfare");

      // Fireworks Burst on canvas!
      const rect = giftBox.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      window.particleEngineInstance.burst(cx, cy, 80);
      setTimeout(() => {
        window.particleEngineInstance.burst(cx - 100, cy - 80, 60);
        window.particleEngineInstance.burst(cx + 100, cy - 80, 60);
      }, 250);

      // Show Gift Modal
      const modal = document.getElementById("gift-reward-modal");
      const titleEl = document.getElementById("gift-reward-title");
      const descEl = document.getElementById("gift-reward-desc");
      const codeEl = document.getElementById("gift-reward-code");

      if (modal && currentGift) {
        if (titleEl) titleEl.textContent = currentGift.title;
        if (descEl) descEl.textContent = currentGift.content;
        if (codeEl) codeEl.textContent = currentGift.code;
        setTimeout(() => {
          modal.classList.add("active");
        }, 500);
      }
    });
  }

  document.getElementById("btn-close-gift-modal")?.addEventListener("click", () => {
    document.getElementById("gift-reward-modal")?.classList.remove("active");
    if (giftBox) {
      setTimeout(() => giftBox.classList.remove("opened"), 300);
    }
  });

  // 13. Interactive Sealed Envelope & Cinematic Unfolding Experience
  const envelopeContainer = document.getElementById("envelope-container");
  const sealedCard = document.getElementById("sealed-envelope-card");
  const foldBtn = document.getElementById("btn-fold-letter");
  const blurOverlay = document.getElementById("letter-backdrop-blur");
  let letterOpenTimer1 = null;
  let letterOpenTimer2 = null;

  function openLetterCinematic() {
    if (!envelopeContainer || envelopeContainer.classList.contains("open") || envelopeContainer.classList.contains("animating")) return;

    clearTimeout(letterOpenTimer1);
    clearTimeout(letterOpenTimer2);
    envelopeContainer.classList.add("animating");

    // GIAI ĐOẠN 1 (0ms): Bẻ gãy con dấu sáp và mở nắp phong bì
    window.audioManager.playSfx("woosh");
    envelopeContainer.classList.add("phase-flap-open");

    // Pháo hoa nhẹ tại vị trí con dấu sáp
    if (sealedCard && window.particleEngineInstance) {
      const rect = sealedCard.getBoundingClientRect();
      window.particleEngineInstance.burst(rect.left + rect.width / 2, rect.top + 80, 25);
    }

    // GIAI ĐOẠN 2 (500ms): Thư từ từ trượt và bay bổng ra khỏi phong bì ("thư bay từ từ ra")
    letterOpenTimer1 = setTimeout(() => {
      window.audioManager.playSfx("pop");
      envelopeContainer.classList.add("phase-letter-flying");

      // Bụi vàng phát sáng thăng hoa theo đà bức thư bay lên không trung
      if (sealedCard && window.particleEngineInstance) {
        const rect = sealedCard.getBoundingClientRect();
        window.particleEngineInstance.burst(rect.left + rect.width / 2, rect.top - 50, 45);
      }
    }, 500);

    // GIAI ĐOẠN 3 (2200ms): Sau khi thư đã bay hẳn lên cao bồng bềnh, thư mới từ từ bung nở toàn diện ("r mới mở đi")
    letterOpenTimer2 = setTimeout(() => {
      envelopeContainer.classList.add("open");
      window.audioManager.playSfx("sparkle");
      envelopeContainer.classList.remove("animating");

      // Cuộn êm vào tầm nhìn bức thư
      const letterPaper = document.querySelector(".royal-letter-paper");
      if (letterPaper) {
        letterPaper.scrollTop = 0;
      }

      // Kích hoạt hoàn thành nhiệm vụ mở khóa chương tiếp theo
      if (typeof window.onLetterTaskCompleted === "function") {
        window.onLetterTaskCompleted();
      }
    }, 2200);
  }

  function closeLetterCinematic() {
    if (!envelopeContainer) return;
    clearTimeout(letterOpenTimer1);
    clearTimeout(letterOpenTimer2);

    window.audioManager.playSfx("pop");
    envelopeContainer.classList.remove("open");

    // Thu nhỏ bức thư, từ từ hạ xuống phong bì và đóng nắp lại
    setTimeout(() => {
      envelopeContainer.classList.remove("phase-letter-flying");
      setTimeout(() => {
        envelopeContainer.classList.remove("phase-flap-open");
        envelopeContainer.classList.remove("animating");
      }, 500);
    }, 380);
  }

  if (sealedCard) {
    sealedCard.addEventListener("click", openLetterCinematic);
  }

  if (foldBtn) {
    foldBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLetterCinematic();
    });
  }

  if (blurOverlay) {
    blurOverlay.addEventListener("click", closeLetterCinematic);
  }

  // 14. Vòng Quay May Mắn (Lucky Fortune Wheel)
  const wheelCanvas = document.getElementById("fortune-wheel-canvas");
  if (wheelCanvas) {
    initFortuneWheel(wheelCanvas);
  }

  function initFortuneWheel(canvas) {
    const ctx = canvas.getContext("2d");
    const segments = [
      { text: "Bó Hoa Hồng 🌹", color: "#e63946" },
      { text: "Trà Sữa Cưng Chiều 🧋", color: "#f4a261" },
      { text: "Nắm Tay Dạo Phố 🌟", color: "#2a9d8f" },
      { text: "Massage Thư Giãn 💆‍♀️", color: "#8338ec" },
      { text: "Thẻ Đòi Quà VIP 💳", color: "#e76f51" },
      { text: "1 Điều Ước Bất Kỳ 👑", color: "#ffd700", textColor: "#000" },
      { text: "Chuyến Du Lịch Xa ✈️", color: "#3a86ff" },
      { text: "Ôm Hôn Thật Kêu 💖", color: "#ff006e" },
    ];

    let currentAngle = 0;
    let isSpinning = false;

    function drawWheel() {
      const w = canvas.width;
      const h = canvas.height;
      const radius = w / 2 - 10;
      const arc = (Math.PI * 2) / segments.length;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(currentAngle);

      segments.forEach((seg, i) => {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = seg.color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Stroke gold border
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffd700";
        ctx.stroke();

        // Text
        ctx.save();
        ctx.fillStyle = seg.textColor || "#ffffff";
        ctx.font = "bold 13px 'Montserrat', sans-serif";
        ctx.translate(Math.cos(angle + arc / 2) * (radius * 0.65), Math.sin(angle + arc / 2) * (radius * 0.65));
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText(seg.text, 0, 0);
        ctx.restore();
      });

      // Center gold hub
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd700";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffd700";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#110b1d";
      ctx.fill();

      ctx.restore();
    }

    drawWheel();

    const spinBtn = document.getElementById("btn-spin-wheel");
    if (spinBtn) {
      spinBtn.addEventListener("click", () => {
        if (isSpinning) return;
        isSpinning = true;
        window.audioManager.playSfx("sparkle");

        const extraRotations = 5 + Math.random() * 4;
        const targetSector = Math.floor(Math.random() * segments.length);
        const arc = (Math.PI * 2) / segments.length;
        // Pointer is at the top (3*PI / 2)
        const targetAngle = (Math.PI * 2) * extraRotations + (Math.PI * 1.5 - (targetSector + 0.5) * arc);

        const startAngle = currentAngle;
        const totalDelta = targetAngle - startAngle;
        const duration = 4000;
        const startTime = performance.now();

        function animateSpin(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const easeOut = 1 - Math.pow(1 - progress, 3);
          currentAngle = startAngle + totalDelta * easeOut;
          drawWheel();

          if (progress < 1) {
            requestAnimationFrame(animateSpin);
          } else {
            isSpinning = false;
            window.audioManager.playSfx("fanfare");
            const prize = segments[targetSector];
            const prizeResult = document.getElementById("fortune-wheel-result");
            if (prizeResult) {
              prizeResult.innerHTML = `🎉 Chúc mừng! Bạn quay trúng: <strong>${prize.text}</strong>`;
            }
            const rect = canvas.getBoundingClientRect();
            window.particleEngineInstance.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
          }
        }

        requestAnimationFrame(animateSpin);
      });
    }
  }

  // 15. Gửi lời chúc từ khách (Quick Guest Wish Box)
  const guestWishForm = document.getElementById("guest-wish-form");
  if (guestWishForm) {
    guestWishForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("guest-name");
      const msgInput = document.getElementById("guest-msg");
      const tagSelect = document.getElementById("guest-tag");

      if (!nameInput.value.trim() || !msgInput.value.trim()) {
        if (window.adminManager && typeof window.adminManager.showToast === "function") {
          window.adminManager.showToast("Vui lòng điền tên và lời chúc của bạn nhé!", "warning");
        }
        return;
      }

      const newWish = {
        id: "w_guest_" + Date.now(),
        title: `Lời chúc từ ${nameInput.value.trim()}`,
        content: msgInput.value.trim(),
        tag: tagSelect.value || "Bạn bè",
        icon: "💖",
        author: nameInput.value.trim(),
        isHighlight: false,
      };

      window.appStore.update((data) => {
        data.wishes.unshift(newWish);
      });

      nameInput.value = "";
      msgInput.value = "";
      window.audioManager.playSfx("fanfare");
      window.adminManager.showToast("Cảm ơn bạn! Lời chúc đã được đăng lên bức tường vinh danh ✨", "success");
      
      // Burst confetti
      window.particleEngineInstance.burst(window.innerWidth / 2, window.innerHeight * 0.7, 60);
    });
  }

  // 16. Floating Hearts effect helper
  function spawnFloatingHeart(x, y) {
    const heart = document.createElement("div");
    heart.className = "floating-heart-particle";
    heart.textContent = ["❤️", "💖", "✨", "👑", "🌹"][Math.floor(Math.random() * 5)];
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1500);
  }

  // 17. Music Controls
  document.getElementById("music-toggle-btn")?.addEventListener("click", () => {
    window.audioManager.toggleMusic();
  });

  document.getElementById("btn-accept-music")?.addEventListener("click", () => {
    const config = window.appStore.get();
    window.audioManager.playMusic(config.music.url);
    window.audioManager.hideAudioPrompt();
  });

  document.getElementById("btn-dismiss-music")?.addEventListener("click", () => {
    window.audioManager.hideAudioPrompt();
  });

  // 18. Quick Navigation Buttons (Hỗ trợ tương thích ngược)
  document.getElementById("btn-scroll-tree")?.addEventListener("click", () => {
    switchPage("tree");
  });
  document.getElementById("btn-scroll-letter")?.addEventListener("click", () => {
    switchPage("letter");
  });
  document.getElementById("btn-scroll-wishes")?.addEventListener("click", () => {
    switchPage("wishes");
  });
  document.getElementById("btn-scroll-gift")?.addEventListener("click", () => {
    switchPage("gifts");
  });

  // Pháo hoa chào mừng khi click vào bất kỳ đâu trên hero badge
  document.getElementById("hero-badge")?.addEventListener("click", (e) => {
    window.audioManager.playSfx("sparkle");
    window.particleEngineInstance.burst(e.clientX, e.clientY, 50);
  });

  // Nút chuyển đổi nhanh chế độ xưng hô (Người yêu / Bạn bè) trên Header
  document.getElementById("btn-toggle-audience-mode")?.addEventListener("click", () => {
    const cur = window.appStore.get().audienceMode || "crush";
    const next = cur === "crush" ? "friend" : "crush";
    window.appStore.setAudienceMode(next);
    if (window.audioManager) window.audioManager.playSfx("sparkle");
    if (window.adminManager) {
      const toastText = next === "friend"
        ? "🌸 Đã chuyển sang chế độ Bạn Bè (Xưng hô: Tớ - Cậu)"
        : "💖 Đã chuyển sang chế độ Người Yêu (Xưng hô: Anh - Em)";
      window.adminManager.showToast(toastText, "info");
    }
  });

  // 19. Đăng ký Store reactivity
  window.appStore.subscribe((newConfig) => {
    renderAll(newConfig);
  });

  // Lần render đầu tiên
  renderAll(window.appStore.get());

  // Thử tự động phát nhạc khi click chuột đầu tiên vào trang
  const firstInteract = () => {
    const config = window.appStore.get();
    if (!window.audioManager.isPlaying && config.music.url) {
      window.audioManager.playMusic(config.music.url);
    }
    window.removeEventListener("click", firstInteract);
  };
  window.addEventListener("click", firstInteract, { once: true });
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
