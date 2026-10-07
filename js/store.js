// store.js - Quản lý dữ liệu tập trung với LocalStorage & reactive updates

// Hàm chuyển đổi đại từ xưng hô theo chế độ đối tượng nhận:
// mode = "crush" (Người yêu: Anh - Em)
// mode = "friend" (Bạn bè: Tớ - Cậu)
window.transformPronouns = function(text, mode = "crush") {
  if (!text || typeof text !== "string") return text;
  if (mode !== "friend") return text;

  let res = text;

  // 1. Cụm từ thành ngữ & danh xưng đặc thù tình cảm -> tình bạn
  res = res.replace(/Công Chúa Của Anh/g, "Người Bạn Tuyệt Vời Của Tớ");
  res = res.replace(/công chúa của anh/g, "cô bạn của tớ");
  res = res.replace(/Công chúa của anh/g, "Cô bạn của tớ");
  res = res.replace(/Công Chúa/g, "Bạn Thân");
  res = res.replace(/công chúa/g, "cô bạn");
  res = res.replace(/Tình yêu duy nhất/g, "Tình bạn diệu kỳ");
  res = res.replace(/Người luôn thương em/g, "Người bạn luôn quý mến cậu");
  res = res.replace(/người luôn thương em/g, "người bạn luôn quý mến cậu");
  res = res.replace(/Người từng đồng hành cùng em/g, "Người từng đồng hành cùng cậu");
  res = res.replace(/Người luôn ngắm nhìn em/g, "Người bạn luôn dõi theo cậu");
  res = res.replace(/Người yêu dấu/g, "Bạn tri kỷ");
  res = res.replace(/người yêu dấu/g, "bạn tri kỷ");
  res = res.replace(/Người thương/g, "Bạn thân");
  res = res.replace(/người thương/g, "bạn thân");
  res = res.replace(/Yêu và luôn bên cạnh em/g, "Luôn trân trọng và đồng hành cùng cậu");
  res = res.replace(/yêu và luôn bên cạnh em/g, "luôn trân trọng và đồng hành cùng cậu");
  res = res.replace(/Yêu thương/g, "Quý mến");
  res = res.replace(/yêu thương/g, "quý mến");
  res = res.replace(/Đặc Quyền Dành Riêng Cho Em/g, "Đặc Quyền Dành Riêng Cho Cậu");
  res = res.replace(/Đặc Quyền Công Chúa Suốt Đời/g, "Đặc Quyền Bạn Thân Suốt Đời");
  res = res.replace(/Đặc quyền công chúa suốt đời/g, "Đặc quyền bạn thân suốt đời");
  res = res.replace(/HÔM NAY LÀ NGÀY CỦA EM/g, "HÔM NAY LÀ NGÀY CỦA CẬU");
  res = res.replace(/Cánh Cửa Yêu Thương/g, "Cánh Cửa Tri Kỷ");
  res = res.replace(/cánh cửa yêu thương/g, "cánh cửa tri kỷ");
  res = res.replace(/Cánh Cửa Trái Tim/g, "Cánh Cửa Tình Bạn & Tri Kỷ");

  // 2. Cụm từ quan hệ kèm giới từ
  res = res.replace(/của anh/g, "của tớ");
  res = res.replace(/Của anh/g, "Của tớ");
  res = res.replace(/Của Anh/g, "Của Tớ");
  res = res.replace(/của em/g, "của cậu");
  res = res.replace(/Của em/g, "Của cậu");
  res = res.replace(/Của Em/g, "Của Cậu");

  res = res.replace(/cho anh/g, "cho tớ");
  res = res.replace(/Cho anh/g, "Cho tớ");
  res = res.replace(/cho em/g, "cho cậu");
  res = res.replace(/Cho em/g, "Cho cậu");

  res = res.replace(/với anh/g, "với tớ");
  res = res.replace(/Với anh/g, "Với tớ");
  res = res.replace(/với em/g, "với cậu");
  res = res.replace(/Với em/g, "Với cậu");

  res = res.replace(/cùng anh/g, "cùng tớ");
  res = res.replace(/Cùng anh/g, "Cùng tớ");
  res = res.replace(/cùng em/g, "cùng cậu");
  res = res.replace(/Cùng em/g, "Cùng cậu");

  res = res.replace(/bên anh/g, "bên tớ");
  res = res.replace(/Bên anh/g, "Bên tớ");
  res = res.replace(/bên em/g, "bên cậu");
  res = res.replace(/Bên em/g, "Bên cậu");

  res = res.replace(/tới em/g, "tới cậu");
  res = res.replace(/Tới em/g, "Tới cậu");
  res = res.replace(/đến em/g, "đến cậu");
  res = res.replace(/Đến em/g, "Đến cậu");
  res = res.replace(/Đến Em/g, "Đến Cậu");

  res = res.replace(/vì anh/g, "vì tớ");
  res = res.replace(/Vì anh/g, "Vì tớ");
  res = res.replace(/vì em/g, "vì cậu");
  res = res.replace(/Vì em/g, "Vì cậu");

  // 3. Đại từ xưng hô độc lập (Tránh thay thế sai các từ chứa 'anh'/'em' như: xem, kèm, rèm, thanh, chanh, bánh...)
  const VN_CHARS = "a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ";
  const lb = `(?<![${VN_CHARS}])`;
  const rb = `(?![${VN_CHARS}])`;

  // Anh -> Tớ
  res = res.replace(new RegExp(`${lb}Anh${rb}`, "g"), "Tớ");
  res = res.replace(new RegExp(`${lb}anh${rb}`, "g"), "tớ");
  res = res.replace(new RegExp(`${lb}ANH${rb}`, "g"), "TỚ");

  // Em -> Cậu
  res = res.replace(new RegExp(`${lb}Em${rb}`, "g"), "Cậu");
  res = res.replace(new RegExp(`${lb}em${rb}`, "g"), "cậu");
  res = res.replace(new RegExp(`${lb}EM${rb}`, "g"), "CẬU");

  return res;
};

const DEFAULT_CONFIG = {
  version: "2.0",
  audienceMode: "crush", // "crush" (Người yêu: Anh - Em) hoặc "friend" (Bạn bè: Tớ - Cậu)
  security: {
    pin: "2010", // Mã PIN truy cập admin mặc định
    entryPasscode: "06072010", // Mật khẩu trang đầu mở khóa hành trình
    entryHint: "Ngày kỷ niệm đặc biệt (Ví dụ: 06072010)", // Gợi ý mật khẩu
  },
  theme: {
    current: "royal-gold", // 'royal-gold', 'rose-romance', 'cyber-luxe', 'emerald-prestige'
    particleType: "golden-dust", // 'golden-dust', 'rose-petals', 'glowing-hearts', 'fireworks'
    bgGlowColor: "rgba(255, 215, 0, 0.15)",
  },
  recipient: {
    name: "Nguyễn Ngọc Ánh",
    nickname: "Công Chúa Của Anh",
    occasion: "20/10 - Ngày Phụ Nữ Việt Nam",
    headerBadge: "✦ VIP SPECIAL DEDICATION ✦",
    subGreeting: "Chúc em một ngày tràn ngập nụ cười, hạnh phúc và vạn điều như ý!",
    avatarUrl: "images/avatar.png",
    eventDate: "2026-10-20T00:00:00",
    relationshipStatus: "Tình yêu duy nhất",
  },
  music: {
    title: "Nàng Thơ (Lofi Ver.) - Hoàng Dũng x Freak D",
    artist: "Hoàng Dũng x Freak D",
    url: "audio/nang-tho.mp3",
    autoPlayPrompt: true,
  },
  letter: {
    title: "Gửi Đến Em - Người Phụ Nữ Tuyệt Vời Nhất",
    sender: "Người luôn thương em",
    content: `Thế giới này có hơn 8 tỷ người, nhưng với anh, nụ cười của em là điều rạng rỡ và dịu dàng nhất.
    
Nhân ngày 20/10 thật đặc biệt này, anh muốn gửi trọn những tình cảm chân thành và ngọt ngào nhất tới em. Cảm ơn em vì đã xuất hiện, thắp sáng cuộc sống của anh bằng sự ân cần, thông minh và đáng yêu không ai sánh bằng.

Chúc công chúa của anh luôn tự tin tỏa sáng như những vì sao lấp lánh, mỗi ngày trôi qua đều là một ngày hạnh phúc, bình yên và tràn ngập những điều bất ngờ tuyệt diệu nhất.

Yêu và luôn bên cạnh em! ❤️`,
  },
  wishes: [
    {
      id: "w1",
      tag: "Vẻ Đẹp",
      icon: "✨",
      title: "Mãi Mãi Xinh Đẹp & Rạng Rỡ",
      content: "Chúc em luôn giữ mãi nụ cười tỏa nắng, nét trẻ trung và khí chất kiêu kỳ quyến rũ khiến ai cũng phải ngưỡng mộ.",
      author: "Vũ Trụ Gửi Tặng",
      isHighlight: true,
    },
    {
      id: "w2",
      tag: "Thành Công",
      icon: "💎",
      title: "Vạn Sự Như Ý & Tỏa Sáng",
      content: "Mọi dự định, ước mơ và công việc của em đều thuận buồm xuôi gió. Thành công rực rỡ và luôn là niềm tự hào lớn nhất.",
      author: "Admin Cưng Chiều",
      isHighlight: true,
    },
    {
      id: "w3",
      tag: "Hạnh Phúc",
      icon: "💖",
      title: "Bình Yên & Được Yêu Thương",
      content: "Mong em luôn được bao bọc trong sự yêu thương vô điều kiện, không muộn phiền, chỉ có tiếng cười và an yên.",
      author: "Người Yêu Dấu",
      isHighlight: true,
    },
    {
      id: "w4",
      tag: "May Mắn",
      icon: "🍀",
      title: "Tài Lộc & Vận May Đầy Tay",
      content: "Chúc ví luôn đầy tiền, lòng luôn thanh thản, gặp dữ hóa lành và luôn có quý nhân đồng hành trên mọi nẻo đường.",
      author: "Vận Mệnh An Bài",
      isHighlight: false,
    },
    {
      id: "w5",
      tag: "Sức Khỏe",
      icon: "🌸",
      title: "Dẻo Dai & Tinh Thần Lạc Quan",
      content: "Luôn khỏe mạnh, ngủ ngon mỗi đêm và thức dậy với nguồn năng lượng tích cực tràn ngập cho ngày mới ngập tràn niềm vui.",
      author: "Thiên Sứ Hộ Mệnh",
      isHighlight: false,
    },
    {
      id: "w6",
      tag: "Đặc Quyền",
      icon: "👑",
      title: "Đặc Quyền Công Chúa Suốt Đời",
      content: "Hôm nay và mãi mãi về sau, mọi yêu cầu và mong muốn của em đều là mệnh lệnh tối cao được ưu tiên số 1!",
      author: "VIP Server",
      isHighlight: true,
    }
  ],
  treeLetters: [
    {
      id: "tl_special_c3",
      title: "Khoảng Trời Riêng & Lời Chúc Cấp 3",
      shortTag: "BẢO TRỌNG",
      content: "Cảm ơn em vì khoảng thời gian vừa qua đã cho anh những kỷ niệm thật đẹp. Chúc em bước vào cấp 3 sẽ có một môi trường mới thật rực rỡ, học tập tốt, luôn vui vẻ và tìm thấy niềm hạnh phúc trọn vẹn với những lựa chọn của riêng mình. Đoạn đường này anh xin phép dừng lại ở đây để cả hai đều có khoảng trời riêng; giữ gìn sức khỏe và luôn bình an nhé, bảo trọng.",
      sender: "Người từng đồng hành cùng em",
      date: "Bước ngoặt Cấp 3 ✦ Bình an",
      color: "#e63946",
      icon: "🕊️",
      isSpecial: true
    },
    {
      id: "tl1",
      title: "Gửi Nụ Cười Em",
      shortTag: "Ánh Nắng",
      content: "Mỗi khi em cười, cả thế giới xung quanh dường như bừng sáng. Mong nụ cười ấy mãi vẹn nguyên trên môi em qua mọi năm tháng.",
      sender: "Người luôn ngắm nhìn em",
      date: "Khoảnh khắc đầu tiên",
      color: "#ff69b4",
      icon: "🌸"
    },
    {
      id: "tl2",
      title: "Điều Ước Bình Yên",
      shortTag: "An Yên",
      content: "Nếu có một điều ước cho em, anh ước em luôn được sống trong sự dịu dàng của cuộc đời, không bão giông, chỉ có an lành và tình yêu.",
      sender: "Gió mùa thu",
      date: "Ước nguyện vĩnh cửu",
      color: "#ffd700",
      icon: "✨"
    },
    {
      id: "tl3",
      title: "Đóa Hoa Đẹp Nhất",
      shortTag: "Xinh Đẹp",
      content: "Trăm ngàn bông hoa anh đào nở rộ ngoài kia cũng không thể sánh bằng nét duyên dáng, thuần khiết và kiêu kỳ của em.",
      sender: "Trái tim chân thành",
      date: "20/10 Rực Rỡ",
      color: "#ff1493",
      icon: "🌹"
    },
    {
      id: "tl4",
      title: "Hành Trình Cấp 3 Rực Rỡ",
      shortTag: "Tương Lai",
      content: "Ngôi trường mới sẽ mở ra những chân trời mới, những người bạn tốt và bao ước mơ đẹp. Hãy luôn tự tin, kiên cường và tỏa sáng rạng ngời nhé!",
      sender: "Gửi từ phương xa",
      date: "Khởi đầu mới tràn đầy hy vọng",
      color: "#ff758f",
      icon: "🎒"
    },
    {
      id: "tl5",
      title: "Năng Lượng Diệu Kỳ",
      shortTag: "Tỏa Sáng",
      content: "Em mang trong mình một nguồn năng lượng ấm áp tuyệt vời. Hãy luôn tự tin sải bước và chinh phục mọi giấc mơ lớn của mình nhé!",
      sender: "Người hâm mộ số 1",
      date: "Ngày mới ngập tràn niềm vui",
      color: "#00f0ff",
      icon: "💎"
    },
    {
      id: "tl6",
      title: "May Mắn & Thuận Buồm",
      shortTag: "Thịnh Vượng",
      content: "Chúc em học tập thật tốt, thi cử suôn sẻ, gặp được những thầy cô tận tâm và mọi điều may mắn nhất sẽ luôn mỉm cười với em.",
      sender: "Vũ trụ ban phước",
      date: "Tương lai rực rỡ",
      color: "#2ed573",
      icon: "🍀"
    },
    {
      id: "tl7",
      title: "Tự Do & Tìm Hạnh Phúc",
      shortTag: "Hạnh Phúc",
      content: "Hạnh phúc đích thực là khi được là chính mình và bước đi trên con đường mình chọn. Chúc em luôn tìm thấy niềm an yên và hân hoan trọn vẹn.",
      sender: "Lời nhắn chân thành",
      date: "Bình yên mỗi ngày",
      color: "#9d4edd",
      icon: "🎈"
    },
    {
      id: "tl8",
      title: "Giữ Gìn Sức Khỏe Nhé",
      shortTag: "Bảo Trọng",
      content: "Dù bài vở hay cuộc sống có bận rộn đến đâu, em nhớ luôn ăn uống đủ chất, ngủ thật ngon và giữ gìn sức khỏe thật tốt nhé.",
      sender: "Người luôn cầu mong em bình an",
      date: "Chăm sóc bản thân",
      color: "#f77f00",
      icon: "🍵"
    },
    {
      id: "tl9",
      title: "Món Quà Của Kỷ Niệm",
      shortTag: "Kỷ Niệm",
      content: "Có những đoạn đường dù ngắn hay dài, những điều tốt đẹp đã từng trao nhau sẽ luôn là một phần ký ức trân quý không bao giờ phai nhạt.",
      sender: "Gửi vào mây trời",
      date: "Trân trọng từng khoảnh khắc",
      color: "#4cc9f0",
      icon: "💌"
    },
    {
      id: "tl10",
      title: "Đặc Quyền Của Nàng 20/10",
      shortTag: "Công Chúa",
      content: "Hôm nay là ngày 20/10 của em - hãy nhận lấy tất cả những điều ngọt ngào nhất, rạng rỡ nhất và xinh đẹp nhất thế gian này nhé!",
      sender: "VIP Palace",
      date: "20/10 Đặc Biệt",
      color: "#ffd700",
      icon: "👑"
    }
  ],
  memories: [
    {
      id: "m1",
      title: "Khoảnh Khắc Tỏa Sáng",
      desc: "Nụ cười làm tan chảy trái tim ngay từ cái nhìn đầu tiên.",
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      date: "Kỷ niệm khó phai"
    },
    {
      id: "m2",
      title: "Nàng Thơ Dịu Dàng",
      desc: "Vẻ đẹp thuần khiết và thanh lịch như đóa hồng sớm mai.",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      date: "Ngọt ngào từng phút giây"
    },
    {
      id: "m3",
      title: "Năng Lượng Rạng Ngời",
      desc: "Ở bên em, ngày u ám nhất cũng hóa rực rỡ nắng vàng.",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      date: "Mãi bên nhau"
    },
    {
      id: "m4",
      title: "Khí Chất Sang Trọng",
      desc: "Vẻ đẹp kiêu sa, quyến rũ và đầy tự tin của người phụ nữ hiện đại.",
      url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
      date: "Tỏa sáng vô tận"
    }
  ],
  surpriseGifts: [
    {
      title: "Voucher Đi Du Lịch & Mua Sắm Thả Ga 🛍️",
      content: "Được tài trợ 100% không giới hạn hạn mức bởi người tặng!",
      code: "VIP-PASS-2010"
    },
    {
      title: "Bó Hoa Hồng Mạ Vàng 24K Bất Tử 🌹",
      content: "Biểu tượng cho tình yêu vĩnh cửu và sự tôn vinh tuyệt đối.",
      code: "GOLDEN-ROSE-LUX"
    },
    {
      title: "100 Lần Đặc Quyền 'Anh Luôn Luôn Sai' 👑",
      content: "Mỗi khi giận dỗi, chỉ cần đưa voucher này ra là lập tức được dỗ dành và nhận quà!",
      code: "QUEEN-PRIVILEGE"
    }
  ]
};

const STORAGE_KEY = "VIP_PORTAL_CONFIG_V1";

class Store {
  constructor() {
    this.data = this.load();
    this.listeners = [];
    this.dbConnected = false;
    this.dbStatus = null;
    this.isSharedPage = false;
    this.shareId = null;
    this.sharedLabel = null;

    // Hỗ trợ tham số URL: ?s=xxx (Trang chia sẻ riêng) hoặc ?mode=friend / ?mode=crush
    try {
      if (typeof window !== "undefined" && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const shareParam = urlParams.get("s") || urlParams.get("share");
        if (shareParam) {
          this.isSharedPage = true;
          this.shareId = shareParam.trim();
        }
        const urlMode = urlParams.get("mode");
        if (urlMode === "friend" || urlMode === "crush") {
          this.data.audienceMode = urlMode;
        }
      }
    } catch (e) {}

    // Tự động kết nối và đồng bộ dữ liệu thời gian thực từ SQLite Database
    if (typeof window !== "undefined" && typeof fetch === "function") {
      this.initSyncWithDb();
    }
  }

  // Đồng bộ cấu hình từ Cơ sở dữ liệu SQLite Server (hỗ trợ cả trang riêng và trang chính)
  async initSyncWithDb() {
    // 1. TRƯỜNG HỢP TRANG CHIA SẺ RIÊNG BIỆT (?s=id)
    if (this.isSharedPage && this.shareId) {
      try {
        console.log(`🔗 [Share Page] Đang tải cấu hình trang chia sẻ ID: ${this.shareId}`);
        const res = await fetch(`/api/share/${encodeURIComponent(this.shareId)}`, {
          headers: { "Accept": "application/json" }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.config && typeof json.config === "object") {
            const cfg = json.config;
            this.data = {
              ...DEFAULT_CONFIG,
              ...cfg,
              security: { ...DEFAULT_CONFIG.security, ...(cfg.security || {}) },
              theme: { ...DEFAULT_CONFIG.theme, ...(cfg.theme || {}) },
              recipient: { ...DEFAULT_CONFIG.recipient, ...(cfg.recipient || {}) },
              music: { ...DEFAULT_CONFIG.music, ...(cfg.music || {}) },
              letter: { ...DEFAULT_CONFIG.letter, ...(cfg.letter || {}) },
              wishes: (Array.isArray(cfg.wishes) && cfg.wishes.length > 0) ? cfg.wishes : DEFAULT_CONFIG.wishes,
              treeLetters: (Array.isArray(cfg.treeLetters) && cfg.treeLetters.length > 0) ? cfg.treeLetters : DEFAULT_CONFIG.treeLetters,
              memories: (Array.isArray(cfg.memories) && cfg.memories.length > 0) ? cfg.memories : DEFAULT_CONFIG.memories,
              surpriseGifts: cfg.surpriseGifts || DEFAULT_CONFIG.surpriseGifts,
              audienceMode: cfg.audienceMode || "crush"
            };
            this.dbConnected = true;
            this.sharedLabel = json.label || "Trang Chia Sẻ VIP";
            console.log(`✨ [Share Page] Đã tải thành công trang riêng: "${this.sharedLabel}"!`, this.data);
            this.notify();
            this.updateDbStatusBadge(true);
            return;
          }
        }
        console.warn(`⚠️ Không tìm thấy trang chia sẻ ID ${this.shareId}, sử dụng trang mặc định`);
      } catch (err) {
        console.error("Lỗi kết nối tải trang chia sẻ:", err);
      }
    }

    // 2. TRƯỜNG HỢP TRANG CHỦ BÌNH THƯỜNG -> ĐỒNG BỘ VỚI /api/config
    try {
      const res = await fetch("/api/config", {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && typeof json.data === "object") {
          this.data = {
            ...DEFAULT_CONFIG,
            ...json.data,
            security: { ...DEFAULT_CONFIG.security, ...(json.data.security || {}) },
            theme: { ...DEFAULT_CONFIG.theme, ...(json.data.theme || {}) },
            recipient: { ...DEFAULT_CONFIG.recipient, ...(json.data.recipient || {}) },
            music: { ...DEFAULT_CONFIG.music, ...(json.data.music || {}) },
            letter: { ...DEFAULT_CONFIG.letter, ...(json.data.letter || {}) },
            wishes: (Array.isArray(json.data.wishes) && json.data.wishes.length > 0) ? json.data.wishes : DEFAULT_CONFIG.wishes,
            treeLetters: (Array.isArray(json.data.treeLetters) && json.data.treeLetters.length > 0) ? json.data.treeLetters : DEFAULT_CONFIG.treeLetters,
            memories: (Array.isArray(json.data.memories) && json.data.memories.length > 0) ? json.data.memories : DEFAULT_CONFIG.memories,
            surpriseGifts: json.data.surpriseGifts || DEFAULT_CONFIG.surpriseGifts,
            audienceMode: json.data.audienceMode || this.data.audienceMode || "crush"
          };
          this.dbConnected = true;
          // Lưu cache cục bộ phòng khi mất mạng
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          } catch (e) {}

          console.log("💽 [SQLite DB] Đã nạp thành công dữ liệu từ Database Server!", json);
          this.notify();
          this.updateDbStatusBadge(true);
        }
      }
    } catch (err) {
      console.warn("⚠️ Không thể kết nối API SQLite, tiếp tục dùng bộ nhớ cục bộ:", err.message);
      this.updateDbStatusBadge(false);
    }
  }

  updateDbStatusBadge(isOnline) {
    const badge = document.getElementById("admin-db-status-badge");
    if (badge) {
      if (this.isSharedPage) {
        badge.innerHTML = `🔗 Trang Riêng: <strong>${this.sharedLabel || 'VIP'}</strong>`;
        badge.style.color = '#c084fc';
      } else if (isOnline) {
        badge.innerHTML = '🟢 Database: <strong>SQLite Online</strong>';
        badge.style.color = '#10b981';
      } else {
        badge.innerHTML = '🟡 Database: <strong>Local Offline</strong>';
        badge.style.color = '#f59e0b';
      }
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          audienceMode: parsed.audienceMode || DEFAULT_CONFIG.audienceMode || "crush",
          security: { ...DEFAULT_CONFIG.security, ...(parsed.security || {}) },
          theme: { ...DEFAULT_CONFIG.theme, ...(parsed.theme || {}) },
          recipient: { ...DEFAULT_CONFIG.recipient, ...(parsed.recipient || {}) },
          music: { ...DEFAULT_CONFIG.music, ...(parsed.music || {}) },
          letter: { ...DEFAULT_CONFIG.letter, ...(parsed.letter || {}) },
          wishes: parsed.wishes && parsed.wishes.length > 0 ? parsed.wishes : DEFAULT_CONFIG.wishes,
          treeLetters: (Array.isArray(parsed.treeLetters) && parsed.treeLetters.length > 0) ? parsed.treeLetters : DEFAULT_CONFIG.treeLetters,
          memories: parsed.memories && parsed.memories.length > 0 ? parsed.memories : DEFAULT_CONFIG.memories,
          surpriseGifts: parsed.surpriseGifts || DEFAULT_CONFIG.surpriseGifts,
        };
      }
    } catch (e) {
      console.warn("Error parsing storage, fallback to defaults", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  setAudienceMode(mode) {
    if (mode !== "crush" && mode !== "friend") return;
    this.update((data) => {
      data.audienceMode = mode;
    });
  }

  async save() {
    // 1. Lưu ngay vào LocalStorage làm fallback cache
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("LocalStorage quota warning:", e);
    }

    // 2. Kích hoạt cập nhật giao diện reactive
    this.notify();

    // 3. Ghi trực tiếp vào Cơ sở dữ liệu SQLite Server (REST API)
    // Chỉ ghi khi KHÔNG PHẢI là trang chia sẻ riêng biệt (để tránh ghi đè cấu hình chính)
    if (!this.isSharedPage && typeof fetch === "function") {
      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          },
          body: JSON.stringify(this.data)
        });
        if (res.ok) {
          const json = await res.json();
          this.dbConnected = true;
          this.updateDbStatusBadge(true);
          console.log("💽 [SQLite DB] Đã lưu thành công vào Cơ sở dữ liệu SQLite:", json);
          return true;
        }
      } catch (err) {
        console.warn("⚠️ Không thể gửi POST lưu vào SQLite DB:", err.message);
        this.updateDbStatusBadge(false);
      }
    }
    return true;
  }

  get() {
    return this.data;
  }

  update(mutator) {
    if (typeof mutator === "function") {
      mutator(this.data);
    } else {
      Object.assign(this.data, mutator);
    }
    this.save();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.data));
  }

  async resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    await this.save();
  }

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === "object") {
        this.data = { ...DEFAULT_CONFIG, ...parsed };
        this.save();
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON import", e);
    }
    return false;
  }
}

window.appStore = new Store();
