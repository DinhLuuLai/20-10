// tree3d.js - Hệ thống Cây Anh Đào 3D Huyền Ảo + Bé Gấu Trúc Ôm Trái Tim + Vầng Trăng Phát Sáng
// Nâng cấp đồ họa đỉnh cao với Three.js WebGL: Mặt trăng khổng lồ, tán hoa anh đào phát sáng hình trái tim,
// đảo bay bồng bềnh, lồng đèn lung linh và bé gấu trúc dễ thương ngồi ôm trái tim đập nhịp nhàng dưới gốc cây.

class SakuraTree3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.treeGroup = null;
    this.petalsMesh = null;
    this.hangingTags = [];
    this.floatingBalloons = [];
    this.lanterns = [];
    this.fireflies = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredInteractive = null;

    // Bé gấu trúc & trái tim
    this.pandaGroup = null;
    this.pandaHeart = null;
    this.pandaPaws = [];

    // Camera control states
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.spherical = { radius: 30, theta: 0.15, phi: 1.25 };
    this.targetLookAt = new THREE.Vector3(0, 6.8, 0);
    this.autoRotate = true;
    this.autoRotateSpeed = 0.0025;

    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight * 0.88);

    // 1. Scene & Romantic Night Mist Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x120824, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.updateCameraPosition();

    // 3. Renderer with ACES ToneMapping & Soft Shadows (Transparent background for fixed moon backdrop)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. Main World Tree Group
    this.treeGroup = new THREE.Group();
    this.scene.add(this.treeGroup);

    // 6. Build All Magical Elements
    this.buildLuminousMoon();         // Vầng trăng tròn phát sáng sau tán cây
    this.buildFloatingIsland();        // Đảo bay bồng bềnh
    this.buildSakuraTree();            // Cây anh đào cổ thụ tán hoa rực rỡ (mặc định)
    this.loadCustomModelTree("models/tree.glb"); // Nạp mô hình 3D thực tế từ Sketchfab
    this.buildCutePanda();             // Bé gấu trúc ngồi ôm trái tim nhịp đập
    this.buildHangingLanterns();       // Lồng đèn phát sáng ấm áp
    this.buildFairyLights();           // Đom đóm & bụi sao lấp lánh
    this.buildSwirlingPetals();        // Cánh hoa bay 3D trong gió

    // 7. Load & Hang Letters from Store
    this.refreshHangingLetters();

    // 8. Event Listeners
    this.bindControls();

    // 9. Start Render Loop
    this.animate();

    window.addEventListener("resize", () => this.onResize());
  }

  // --- 1. HỆ THỐNG ÁNH SÁNG HUYỀN ẢO ---
  setupLighting() {
    // Ánh sáng môi trường dịu nhẹ màu hoa anh đào
    const ambientLight = new THREE.AmbientLight(0xffd5ec, 1.4);
    this.scene.add(ambientLight);

    // Ánh trăng từ trên cao phía sau chiếu qua tán cây (Moonlight)
    const moonDirLight = new THREE.DirectionalLight(0xfff6e5, 2.8);
    moonDirLight.position.set(0, 22, -18);
    moonDirLight.castShadow = true;
    moonDirLight.shadow.mapSize.width = 2048;
    moonDirLight.shadow.mapSize.height = 2048;
    this.scene.add(moonDirLight);

    // Ánh sáng hồng ngọc làm nổi bật tán hoa đào (Blossom Spotlight)
    const pinkSpot = new THREE.PointLight(0xff2d87, 3.5, 40);
    pinkSpot.position.set(0, 14, 4);
    this.scene.add(pinkSpot);

    // Ánh sáng ấm vàng chiếu rọi bé gấu trúc dưới gốc cây
    const pandaLight = new THREE.PointLight(0xffd700, 2.2, 16);
    pandaLight.position.set(0, 3.5, 4.5);
    this.scene.add(pandaLight);

    // Ánh sáng tím huyền ảo dưới chân đảo
    const purpleUnder = new THREE.PointLight(0x7b2cbf, 2.0, 30);
    purpleUnder.position.set(0, -6, 0);
    this.scene.add(purpleUnder);
  }

  // --- 2. VẦNG TRĂNG CỐ ĐỊNH PHÍA SAU (ĐÃ CHUYỂN THÀNH ẢNH NỀN CỐ ĐỊNH THEO YÊU CẦU) ---
  buildLuminousMoon() {
    // Vầng trăng hiện tại là ảnh nền cố định (Fixed Background Backdrop) đặt phía sau canvas 3D
    // Giữ cho vầng trăng luôn lộng lẫy, nguy nga và cố định ở hậu cảnh khi người dùng tự do xoay cây 3D!
  }

  // --- 3. ĐẢO BAY BỒNG BỀNH / ĐỒI ĐẤT THẦN TIÊN ---
  buildFloatingIsland() {
    const islandGroup = new THREE.Group();

    // Khối đồi đất hình vòm tròn tự nhiên như trong ảnh tham khảo
    const moundGeo = new THREE.SphereGeometry(10.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const moundMat = new THREE.MeshStandardMaterial({
      color: 0x22132e,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.rotation.x = Math.PI;
    mound.position.y = 0.5;
    mound.receiveShadow = true;
    islandGroup.add(mound);

    // Lớp mặt cỏ rêu phủ cánh hoa đào rơi rực rỡ
    const grassTopGeo = new THREE.CircleGeometry(9.8, 36);
    const grassTopMat = new THREE.MeshStandardMaterial({
      color: 0x3d1742,
      roughness: 0.7,
      metalness: 0.2,
    });
    const grassTop = new THREE.Mesh(grassTopGeo, grassTopMat);
    grassTop.rotation.x = -Math.PI / 2;
    grassTop.position.y = 0.52;
    grassTop.receiveShadow = true;
    islandGroup.add(grassTop);

    // Vành đai pha lê vàng viền quanh đảo
    const rimGeo = new THREE.TorusGeometry(10.2, 0.18, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xffd700,
      emissiveIntensity: 0.2,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.52;
    islandGroup.add(rim);

    // Những viên đá phát sáng & cánh hoa phủ dưới đất
    for (let i = 0; i < 35; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.25);
      const isGlowing = Math.random() > 0.6;
      const rockMat = new THREE.MeshStandardMaterial({
        color: isGlowing ? 0xff69b4 : 0x5a2d68,
        emissive: isGlowing ? 0xff1493 : 0x000000,
        emissiveIntensity: isGlowing ? 0.4 : 0,
        roughness: 0.5,
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rad = 2.5 + Math.random() * 6.5;
      const ang = Math.random() * Math.PI * 2;
      rock.position.set(Math.cos(ang) * rad, 0.65, Math.sin(ang) * rad);
      rock.scale.set(1 + Math.random() * 0.5, 0.6, 1 + Math.random() * 0.5);
      islandGroup.add(rock);
    }

    this.treeGroup.add(islandGroup);
  }

  // --- 4. CÂY ANH ĐÀO CỔ THỤ VỚI TÁN HOA RỰC RỠ TRÁI TIM ---
  buildSakuraTree() {
    this.proceduralTreeGroup = new THREE.Group();
    this.treeGroup.add(this.proceduralTreeGroup);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3e1828, // Vỏ cây anh đào nâu tím cổ kính
      roughness: 0.8,
      metalness: 0.1,
    });

    // Rễ cây bám sâu vào mặt đất
    const rootAngles = [0.2, 1.8, 3.4, 4.8];
    rootAngles.forEach((ang) => {
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(ang) * 0.6, 1.5, Math.sin(ang) * 0.6),
        new THREE.Vector3(Math.cos(ang) * 1.8, 0.8, Math.sin(ang) * 1.8),
        new THREE.Vector3(Math.cos(ang) * 3.2, 0.4, Math.sin(ang) * 3.2),
      ]);
      const rootGeo = new THREE.TubeGeometry(rootCurve, 12, 0.45, 8, false);
      const rootMesh = new THREE.Mesh(rootGeo, woodMat);
      rootMesh.castShadow = true;
      this.proceduralTreeGroup.add(rootMesh);
    });

    // Thân cây chính uốn lượn mềm mại
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0.5, 3.2, 0.2),
      new THREE.Vector3(-0.4, 6.0, -0.3),
      new THREE.Vector3(0.3, 8.8, 0.3),
      new THREE.Vector3(0, 11.2, 0),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 28, 1.35, 12, false);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.proceduralTreeGroup.add(trunk);

    // Các nhánh cành chính xòe rộng thành hình trái tim/vương miện
    const mainBranches = [
      { start: new THREE.Vector3(-0.2, 7.2, 0.1), dir: new THREE.Vector3(-6.2, 3.2, 3.8), rad: 0.75 },
      { start: new THREE.Vector3(0.3, 7.6, 0.2), dir: new THREE.Vector3(6.5, 3.5, 3.2), rad: 0.75 },
      { start: new THREE.Vector3(-0.3, 8.5, -0.2), dir: new THREE.Vector3(-5.2, 4.0, -5.2), rad: 0.7 },
      { start: new THREE.Vector3(0.2, 8.8, -0.1), dir: new THREE.Vector3(5.5, 4.2, -4.8), rad: 0.7 },
      { start: new THREE.Vector3(0, 10.5, 0.2), dir: new THREE.Vector3(-2.8, 5.2, 4.5), rad: 0.65 },
      { start: new THREE.Vector3(0, 10.8, -0.2), dir: new THREE.Vector3(3.0, 5.0, -4.2), rad: 0.65 },
      { start: new THREE.Vector3(-0.1, 11.0, 0), dir: new THREE.Vector3(-4.5, 4.5, 0), rad: 0.6 },
      { start: new THREE.Vector3(0.1, 11.0, 0), dir: new THREE.Vector3(4.5, 4.5, 0), rad: 0.6 },
    ];

    mainBranches.forEach((b) => {
      this.generateBranch(b.start, b.dir, b.rad, 3, woodMat);
    });

    // Tạo hàng ngàn đóa hoa anh đào phát sáng lộng lẫy
    this.buildLushBlossomCanopy();
  }

  generateBranch(origin, direction, radius, depth, material) {
    const endPoint = origin.clone().add(direction);
    const midPoint = origin.clone().lerp(endPoint, 0.5).add(new THREE.Vector3(
      (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.2) * 0.7,
      (Math.random() - 0.5) * 1.0
    ));

    const curve = new THREE.CatmullRomCurve3([origin, midPoint, endPoint]);
    const geo = new THREE.TubeGeometry(curve, 10, radius, 8, false);
    const branchMesh = new THREE.Mesh(geo, material);
    branchMesh.castShadow = true;
    this.proceduralTreeGroup.add(branchMesh);

    if (depth > 1) {
      const subBranches = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < subBranches; i++) {
        const spreadAngle = (i / subBranches) * Math.PI * 1.5 - 0.75;
        const subDir = direction.clone()
          .multiplyScalar(0.68)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle + (Math.random() - 0.5) * 0.4)
          .add(new THREE.Vector3(0, Math.random() * 0.8, 0));

        this.generateBranch(endPoint, subDir, radius * 0.65, depth - 1, material);
      }
    }
  }

  // Tán hoa anh đào bồng bềnh phủ rộng phát sáng (Heart-shaped Glowing Canopy)
  buildLushBlossomCanopy() {
    const clusterCenters = [
      // Nhánh bên trái
      new THREE.Vector3(-6.2, 11.2, 3.5),
      new THREE.Vector3(-5.0, 13.0, 2.0),
      new THREE.Vector3(-7.2, 12.0, 0.0),
      new THREE.Vector3(-5.5, 13.5, -3.5),
      new THREE.Vector3(-3.5, 14.8, 2.8),
      // Nhánh bên phải
      new THREE.Vector3(6.5, 11.5, 3.2),
      new THREE.Vector3(5.2, 13.2, 1.8),
      new THREE.Vector3(7.4, 12.2, 0.0),
      new THREE.Vector3(5.8, 13.8, -3.2),
      new THREE.Vector3(3.8, 15.0, 2.5),
      // Đỉnh vòm và tâm giữa
      new THREE.Vector3(0, 15.8, 0.5),
      new THREE.Vector3(-1.8, 16.2, 1.2),
      new THREE.Vector3(1.8, 16.2, 1.2),
      new THREE.Vector3(0, 14.5, -2.8),
      new THREE.Vector3(0, 13.0, 2.5),
    ];

    const blossomColors = [
      0xff2a85, // Hồng magenta rực rỡ
      0xff69b4, // Hồng cánh sen ngọt ngào
      0xff85a2, // Hồng đào phớt dịu
      0xffd1dc, // Hồng phấn nhạt
      0xffffff, // Trắng tuyết thanh khiết
      0xff1493, // Hồng đậm kiêu sa
    ];

    const petalGeo = new THREE.DodecahedronGeometry(0.32, 1);

    clusterCenters.forEach((center) => {
      const countInCluster = 75;
      for (let i = 0; i < countInCluster; i++) {
        const color = blossomColors[Math.floor(Math.random() * blossomColors.length)];
        const isEmissive = Math.random() > 0.35;

        const petalMat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: isEmissive ? color : 0x000000,
          emissiveIntensity: isEmissive ? 0.35 : 0,
          roughness: 0.5,
          metalness: 0.1,
        });

        const blossom = new THREE.Mesh(petalGeo, petalMat);
        const rad = 3.2 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        blossom.position.set(
          center.x + rad * Math.sin(phi) * Math.cos(theta),
          center.y + (rad * Math.sin(phi) * Math.sin(theta)) * 0.75,
          center.z + rad * Math.cos(phi)
        );
        blossom.scale.set(
          1.2 + Math.random() * 0.9,
          0.8 + Math.random() * 0.5,
          1.2 + Math.random() * 0.9
        );
        blossom.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.proceduralTreeGroup.add(blossom);
      }
    });
  }

  // --- NẠP MÔ HÌNH 3D SKETCHFAB THỰC TẾ (GLTF / GLB MODEL LOADER) ---
  loadCustomModelTree(modelPath = "models/tree.glb") {
    if (!window.THREE || !window.THREE.GLTFLoader) {
      console.warn("GLTFLoader not available, keeping procedural tree");
      return;
    }

    const loader = new THREE.GLTFLoader();

    loader.load(
      modelPath,
      (gltf) => {
        console.log("🌸 Loaded Sketchfab 3D Sakura Tree Model successfully!", gltf);
        const model = gltf.scene;

        // Tinh chỉnh chất liệu và bóng đổ cho từng chi tiết
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              child.material.transparent = true;
              child.material.alphaTest = 0.25;
              child.material.roughness = 0.65;
              child.material.metalness = 0.05;
              const matName = (child.material.name || "").toLowerCase();
              if (matName.includes("blossom") || matName.includes("leaf") || matName.includes("flower") || matName.includes("sakura")) {
                child.material.emissive = new THREE.Color(0xff69b4);
                child.material.emissiveIntensity = 0.18;
              }
            }
          }
        });

        // Tính toán kích thước hộp bao quanh (Bounding Box)
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        // Chiều cao chuẩn đạt ~14.5 đơn vị hài hòa với mặt trăng và đảo bay
        const targetHeight = 14.5;
        const scale = targetHeight / (size.y || 1);
        model.scale.set(scale, scale, scale);

        // Căn tâm cây đặt ngay trên thảm cỏ đảo bay (y = 0.52)
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        model.position.x = -scaledCenter.x;
        model.position.y = 0.52 - scaledBox.min.y;
        model.position.z = -scaledCenter.z;

        // Xóa cây thủ công nếu có để nhường chỗ cho cây Sketchfab
        if (this.proceduralTreeGroup) {
          this.treeGroup.remove(this.proceduralTreeGroup);
        }

        if (this.customTreeGroup) {
          this.treeGroup.remove(this.customTreeGroup);
        }

        this.customTreeGroup = new THREE.Group();
        this.customTreeGroup.add(model);
        this.treeGroup.add(this.customTreeGroup);

        // Treo lại các thẻ thư đung đưa theo cành cây mới
        this.refreshHangingLetters();

        if (window.adminManager && typeof window.adminManager.showToast === "function") {
          window.adminManager.showToast("🌸 Đã tải thành công Cây Anh Đào 3D từ Sketchfab!", "success");
        }
      },
      undefined,
      (error) => {
        console.warn("Could not load custom tree model, keeping procedural tree:", error);
      }
    );
  }

  // --- 5. BÉ GẤU TRÚC 3D NGỒI DƯỚI GỐC CÂY ÔM TRÁI TIM ---
  buildCutePanda() {
    const panda = new THREE.Group();
    // Đặt bé gấu trúc ngồi trang trọng, dễ thương ngay phía trước thảm cỏ đảo bay
    panda.position.set(0, 0.58, 3.8);
    panda.rotation.y = 0;

    // Materials
    const whiteFurMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.05,
    });
    const blackFurMat = new THREE.MeshStandardMaterial({
      color: 0x1a1622,
      roughness: 0.7,
      metalness: 0.1,
    });
    const pinkSkinMat = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.4,
    });

    // 1. Thân tròn mũm mĩm (Chubby Body)
    const bodyGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const body = new THREE.Mesh(bodyGeo, whiteFurMat);
    body.position.set(0, 1.25, 0);
    body.scale.set(1.1, 1.05, 1.0);
    panda.add(body);

    // Mảng lông đen trên ngực/lưng
    const backVestGeo = new THREE.SphereGeometry(1.22, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const backVest = new THREE.Mesh(backVestGeo, blackFurMat);
    backVest.position.copy(body.position);
    backVest.scale.set(1.1, 1.05, 1.0);
    panda.add(backVest);

    // 2. Đầu gấu trúc tròn trịa dễ thương (Cute Head)
    const headGeo = new THREE.SphereGeometry(1.05, 24, 24);
    const head = new THREE.Mesh(headGeo, whiteFurMat);
    head.position.set(0, 2.7, 0.15);
    head.scale.set(1.12, 1.0, 1.05);
    panda.add(head);

    // Đôi tai đen tròn vểnh lên (Cute Ears)
    const earGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const earL = new THREE.Mesh(earGeo, blackFurMat);
    earL.position.set(-0.85, 3.55, 0);
    earL.scale.set(1, 1.1, 0.7);
    panda.add(earL);

    const earR = new THREE.Mesh(earGeo, blackFurMat);
    earR.position.set(0.85, 3.55, 0);
    earR.scale.set(1, 1.1, 0.7);
    panda.add(earR);

    // Lòng tai hồng phớt
    const innerEarGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const innerL = new THREE.Mesh(innerEarGeo, pinkSkinMat);
    innerL.position.set(-0.85, 3.55, 0.18);
    panda.add(innerL);
    const innerR = new THREE.Mesh(innerEarGeo, pinkSkinMat);
    innerR.position.set(0.85, 3.55, 0.18);
    panda.add(innerR);

    // Mảng mắt đen xếch đặc trưng gấu trúc (Eye Patches)
    const eyePatchGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const eyePatchL = new THREE.Mesh(eyePatchGeo, blackFurMat);
    eyePatchL.position.set(-0.42, 2.75, 1.0);
    eyePatchL.rotation.z = 0.25;
    eyePatchL.scale.set(0.8, 1.15, 0.35);
    panda.add(eyePatchL);

    const eyePatchR = new THREE.Mesh(eyePatchGeo, blackFurMat);
    eyePatchR.position.set(0.42, 2.75, 1.0);
    eyePatchR.rotation.z = -0.25;
    eyePatchR.scale.set(0.8, 1.15, 0.35);
    panda.add(eyePatchR);

    // Mắt to tròn long lanh có ánh sáng (Sparkling Eyes)
    const eyePupilGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const eyeL = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeL.position.set(-0.42, 2.75, 1.12);
    panda.add(eyeL);
    const eyeR = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    eyeR.position.set(0.42, 2.75, 1.12);
    panda.add(eyeR);

    // Đốm sáng long lanh trong mắt
    const eyeSparkleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeSparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sparkleL = new THREE.Mesh(eyeSparkleGeo, eyeSparkleMat);
    sparkleL.position.set(-0.39, 2.8, 1.22);
    panda.add(sparkleL);
    const sparkleR = new THREE.Mesh(eyeSparkleGeo, eyeSparkleMat);
    sparkleR.position.set(0.45, 2.8, 1.22);
    panda.add(sparkleR);

    // Mũi đen nhỏ hình tam giác bo tròn (Cute Nose)
    const noseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const nose = new THREE.Mesh(noseGeo, blackFurMat);
    nose.position.set(0, 2.45, 1.2);
    nose.scale.set(1.3, 0.8, 0.8);
    panda.add(nose);

    // Má hồng ửng ngượng ngùng (Blush Cheeks)
    const blushGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const blushL = new THREE.Mesh(blushGeo, pinkSkinMat);
    blushL.position.set(-0.7, 2.4, 0.95);
    blushL.scale.set(1, 0.6, 0.2);
    panda.add(blushL);
    const blushR = new THREE.Mesh(blushGeo, pinkSkinMat);
    blushR.position.set(0.7, 2.4, 0.95);
    blushR.scale.set(1, 0.6, 0.2);
    panda.add(blushR);

    // 3. Chân sau mập mạp ngồi bệt (Cute Sitting Legs)
    const footGeo = new THREE.SphereGeometry(0.55, 16, 16);
    const footL = new THREE.Mesh(footGeo, blackFurMat);
    footL.position.set(-0.95, 0.45, 0.65);
    footL.scale.set(0.9, 0.75, 1.25);
    panda.add(footL);

    const footR = new THREE.Mesh(footGeo, blackFurMat);
    footR.position.set(0.95, 0.45, 0.65);
    footR.scale.set(0.9, 0.75, 1.25);
    panda.add(footR);

    // Đệm chân hồng (Paw Pads)
    const padGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const padL = new THREE.Mesh(padGeo, pinkSkinMat);
    padL.position.set(-0.95, 0.48, 1.25);
    padL.scale.set(1, 1, 0.2);
    panda.add(padL);
    const padR = new THREE.Mesh(padGeo, pinkSkinMat);
    padR.position.set(0.95, 0.48, 1.25);
    padR.scale.set(1, 1, 0.2);
    panda.add(padR);

    // 4. TRÁI TIM ĐỎ HỒNG PHÁT SÁNG BÉ ÔM TRƯỚC NGỰC (Glowing 3D Heart)
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.25, y + 0.25);
    heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    heartShape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    heartShape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 1.0);
    heartShape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    heartShape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

    const extrudeSettings = { depth: 0.35, bevelEnabled: true, bevelSegments: 6, steps: 2, bevelSize: 0.15, bevelThickness: 0.15 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff0055,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.3,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0, 1.45, 1.05);
    heartMesh.scale.set(1.4, 1.4, 1.4);
    heartMesh.rotation.z = Math.PI; // Xoay đúng chiều trái tim
    panda.add(heartMesh);
    this.pandaHeart = heartMesh;

    // 5. Tay đen ôm chặt lấy trái tim (Arms Hugging Heart)
    const armGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.1, 16);
    const armL = new THREE.Mesh(armGeo, blackFurMat);
    armL.position.set(-0.75, 1.45, 0.7);
    armL.rotation.set(0.6, 0.4, -0.7);
    panda.add(armL);

    const armR = new THREE.Mesh(armGeo, blackFurMat);
    armR.position.set(0.75, 1.45, 0.7);
    armR.rotation.set(0.6, -0.4, 0.7);
    panda.add(armR);

    // Gắn metadata để click tương tác với bé gấu trúc!
    body.userData = { isPanda: true };
    head.userData = { isPanda: true };
    heartMesh.userData = { isPanda: true, isHeart: true };

    this.treeGroup.add(panda);
    this.pandaGroup = panda;
  }

  // --- 6. LỒNG ĐÈN ĐỎ CAM PHÁT SÁNG TINH TẾ TREO TRÊN CÀNH CÂY ---
  buildHangingLanterns() {
    const lanternPositions = [
      new THREE.Vector3(-5.5, 10.4, 2.8),
      new THREE.Vector3(5.5, 10.6, 2.5),
      new THREE.Vector3(-4.8, 10.8, -3.2),
      new THREE.Vector3(5.2, 11.0, -2.8),
      new THREE.Vector3(0.0, 11.5, -4.5),
    ];

    lanternPositions.forEach((pos, idx) => {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.copy(pos);

      // Sợi dây treo vàng kim thanh mảnh
      const wireGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.y = -0.45;
      lanternGroup.add(wire);

      // Thân lồng đèn đỏ cam ấm áp thon gọn
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.62, 12);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xeb3b5a,
        emissive: 0xff4500,
        emissiveIntensity: 0.8,
        roughness: 0.35,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = -0.9 - 0.31;
      lanternGroup.add(body);

      // Đỉnh & đáy mạ vàng viền mỏng
      const capGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 });
      const topCap = new THREE.Mesh(capGeo, capMat);
      topCap.position.y = body.position.y + 0.33;
      lanternGroup.add(topCap);
      const btmCap = new THREE.Mesh(capGeo, capMat);
      btmCap.position.y = body.position.y - 0.33;
      lanternGroup.add(btmCap);

      // Tua rua đỏ thanh mảnh bên dưới
      const tasselGeo = new THREE.ConeGeometry(0.06, 0.36, 8);
      const tasselMat = new THREE.MeshBasicMaterial({ color: 0xd90429 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.rotation.x = Math.PI;
      tassel.position.y = btmCap.position.y - 0.2;
      lanternGroup.add(tassel);

      // Ánh sáng điểm tỏa ra dịu dàng
      const light = new THREE.PointLight(0xff6b35, 1.2, 9);
      light.position.copy(body.position);
      lanternGroup.add(light);

      this.lanterns.push({
        group: lanternGroup,
        phase: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 0.5,
      });

      this.treeGroup.add(lanternGroup);
    });
  }

  // --- 7. ĐOM ĐÓM & BỤI SAO LẤP LÁNH QUANH CÂY (FAIRY LIGHTS) ---
  buildFairyLights() {
    const fireflyCount = 90;
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff275 });

    for (let i = 0; i < fireflyCount; i++) {
      const fly = new THREE.Mesh(geo, mat);
      const rad = 2 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      const y = 2 + Math.random() * 15;

      fly.position.set(Math.cos(angle) * rad, y, Math.sin(angle) * rad);
      this.fireflies.push({
        mesh: fly,
        angle: angle,
        radius: rad,
        baseY: y,
        speed: 0.006 + Math.random() * 0.012,
        bobSpeed: 1 + Math.random() * 2,
        bobPhase: Math.random() * Math.PI * 2,
      });
      this.treeGroup.add(fly);
    }
  }

  // --- 8. CÁNH HOA ANH ĐÀO XOÁY LƯỢN 3D TRONG GIÓ ---
  buildSwirlingPetals() {
    const petalCount = 450;
    const geo = new THREE.PlaneGeometry(0.24, 0.32);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.3,
    });

    const instancedMesh = new THREE.InstancedMesh(geo, mat, petalCount);
    this.petalsData = [];

    const dummy = new THREE.Object3D();
    for (let i = 0; i < petalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 12;
      const y = Math.random() * 20;

      this.petalsData.push({
        angle: angle,
        radius: radius,
        y: y,
        speedAngle: 0.006 + Math.random() * 0.01,
        speedY: 0.025 + Math.random() * 0.035,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        vRotX: (Math.random() - 0.5) * 0.05,
        vRotY: (Math.random() - 0.5) * 0.05,
      });

      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.petalsMesh = instancedMesh;
    this.treeGroup.add(instancedMesh);
  }

  // --- 9. HỆ THỐNG THẺ NGUYỆN ƯỚC TREO CÀNH CÂY (JAPANESE TANZAKU WISH TAGS) ---
  refreshHangingLetters() {
    this.hangingTags.forEach((item) => {
      this.treeGroup.remove(item.meshGroup);
    });
    this.hangingTags = [];

    const store = window.appStore ? window.appStore.get() : null;
    const letters = (store && store.treeLetters) ? store.treeLetters : [];

    if (letters.length === 0) return;

    // Các vị trí treo tự nhiên dưới vòm cành hoa anh đào (phân bố hài hòa, không chắn gấu trúc)
    const branchSlots = [
      { x: -4.2, y: 10.6, z: 2.8 },   // Nhánh trước bên trái
      { x: 4.2,  y: 10.8, z: 2.6 },   // Nhánh trước bên phải
      { x: -5.6, y: 11.2, z: -0.6 },  // Nhánh sườn trái
      { x: 5.6,  y: 11.4, z: -0.4 },  // Nhánh sườn phải
      { x: -3.4, y: 11.6, z: -3.6 },  // Nhánh sau bên trái
      { x: 3.4,  y: 11.5, z: -3.4 },  // Nhánh sau bên phải
      { x: -2.3, y: 12.0, z: 2.2 },   // Tầng giữa bên trái
      { x: 2.3,  y: 11.9, z: 2.0 },   // Tầng giữa bên phải
      { x: 0.0,  y: 12.2, z: -3.8 },  // Nhánh sau chính giữa
    ];

    const count = letters.length;
    for (let i = 0; i < count; i++) {
      const letter = letters[i];
      const slot = branchSlots[i % branchSlots.length];
      const cycle = Math.floor(i / branchSlots.length);

      const branchX = slot.x + (cycle > 0 ? (slot.x > 0 ? 0.35 : -0.35) * cycle : 0);
      const branchY = slot.y + cycle * 0.25;
      const branchZ = slot.z + (cycle > 0 ? 0.3 * cycle : 0);

      const tagObj = this.createHangingTagMesh(letter, new THREE.Vector3(branchX, branchY, branchZ), i);
      this.hangingTags.push(tagObj);
      this.treeGroup.add(tagObj.meshGroup);
    }

    this.updateHUDLetterCount(letters.length);

    // Đồng thời phóng hệ thống bóng bay mang theo các bức thư bay lên bầu trời
    this.buildFloatingLetterBalloons();
  }

  createHangingTagMesh(letter, branchPoint, index) {
    const group = new THREE.Group();
    group.position.copy(branchPoint);

    // Xoay nhẹ theo góc cành cây tỏa ra ngoài để trông tự nhiên
    group.rotation.y = Math.atan2(branchPoint.x, branchPoint.z) + (Math.random() - 0.5) * 0.35;

    // 1. Sợi chỉ tơ đỏ may mắn treo từ cành cây
    const ropeLength = 0.8 + (index % 3) * 0.22;
    const ropeGeo = new THREE.CylinderGeometry(0.008, 0.008, ropeLength, 6);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.45 });
    const ropeMesh = new THREE.Mesh(ropeGeo, ropeMat);
    ropeMesh.position.y = -ropeLength / 2;
    group.add(ropeMesh);

    // 2. Vòng khuyên vàng đính đầu thẻ thư
    const ringGeo = new THREE.TorusGeometry(0.035, 0.008, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -ropeLength;
    group.add(ringMesh);

    // 3. Thẻ giấy Tanzaku thon thả thanh lịch (Tỉ lệ chuẩn 1:2.55)
    const cardWidth = 0.58;
    const cardHeight = 1.48;
    const cardDepth = 0.02;
    const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);

    const frontTexture = this.generateLetterTexture(letter);
    const backTexture = this.generateBackTexture(letter);

    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 });
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.4,
      metalness: 0.1,
      emissive: new THREE.Color(letter.color || "#ff69b4"),
      emissiveIntensity: 0.12,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.4,
      metalness: 0.1,
    });

    // Box multi-materials: [right, left, top, bottom, front, back]
    const cardMaterials = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
    const cardMesh = new THREE.Mesh(cardGeo, cardMaterials);
    cardMesh.position.y = -ropeLength - cardHeight / 2;
    cardMesh.castShadow = true;
    group.add(cardMesh);

    // 4. Viền vàng kim tinh xảo ôm nhẹ mép thẻ
    const frameGeo = new THREE.BoxGeometry(cardWidth + 0.025, cardHeight + 0.025, cardDepth * 0.7);
    const frameMesh = new THREE.Mesh(frameGeo, edgeMat);
    frameMesh.position.copy(cardMesh.position);
    group.add(frameMesh);

    // 5. Chuỗi ngọc & tua rua lụa đỏ trang nhã ở đáy thẻ
    const beadGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const beadMesh = new THREE.Mesh(beadGeo, ringMat);
    beadMesh.position.y = cardMesh.position.y - cardHeight / 2 - 0.035;
    group.add(beadMesh);

    const tasselGeo = new THREE.ConeGeometry(0.045, 0.32, 8);
    const tasselMat = new THREE.MeshBasicMaterial({ color: 0xd90429 });
    const tassel = new THREE.Mesh(tasselGeo, tasselMat);
    tassel.rotation.x = Math.PI;
    tassel.position.y = beadMesh.position.y - 0.18;
    group.add(tassel);

    cardMesh.userData = {
      isLetterTag: true,
      letterData: letter,
      parentGroup: group,
      index: index,
    };

    return {
      meshGroup: group,
      cardMesh: cardMesh,
      letterData: letter,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 1.1 + Math.random() * 0.5,
    };
  }

  generateLetterTexture(letter) {
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 920;
    const ctx = canvas.getContext("2d");

    // Nền giấy Washi vân lụa hoa anh đào cao cấp
    const bgGrad = ctx.createLinearGradient(0, 0, 360, 920);
    bgGrad.addColorStop(0, "#fffefb");
    bgGrad.addColorStop(0.5, "#fff1f7");
    bgGrad.addColorStop(1, "#ffe8f2");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 360, 920);

    // Họa tiết cánh hoa đào mờ góc trên và dưới
    ctx.fillStyle = "rgba(255, 182, 193, 0.35)";
    ctx.beginPath();
    ctx.arc(320, 40, 60, 0, Math.PI * 2);
    ctx.arc(40, 880, 70, 0, Math.PI * 2);
    ctx.fill();

    // Khung viền mạ vàng kép hoàng gia
    ctx.strokeStyle = "#cba135";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, 332, 892);

    ctx.strokeStyle = "rgba(203, 161, 53, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, 316, 876);

    // Điểm nhấn kim cương 4 góc
    const corners = [[14, 14], [346, 14], [14, 906], [346, 906]];
    ctx.fillStyle = "#cba135";
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Lỗ xỏ dây đầu thẻ
    ctx.beginPath();
    ctx.arc(180, 48, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#2d132c";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffd700";
    ctx.stroke();

    // Nhãn ruy-băng phân loại (Tag)
    ctx.fillStyle = "rgba(255, 105, 180, 0.16)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, 85, 260, 38, 19);
    } else {
      ctx.rect(50, 85, 260, 38);
    }
    ctx.fill();

    ctx.fillStyle = letter.color || "#d81b60";
    ctx.font = "bold 20px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`✦ ${letter.shortTag || "YÊU THƯƠNG"} ✦`, 180, 111);

    // Biểu tượng cảm xúc lớn
    ctx.font = "54px serif";
    ctx.fillText(letter.icon || "🌸", 180, 195);

    // Đường gạch chỉ hoa văn vàng
    ctx.strokeStyle = "rgba(203, 161, 53, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 235);
    ctx.lineTo(280, 235);
    ctx.stroke();

    // Tiêu đề bức thư (Tự động xuống dòng nếu dài)
    ctx.fillStyle = "#2d132c";
    ctx.font = "bold 28px 'Playfair Display', serif";
    const words = (letter.title || "Tấm Lòng").split(" ");
    if (words.length <= 3) {
      ctx.fillText(letter.title, 180, 305);
    } else {
      const mid = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, mid).join(" "), 180, 290);
      ctx.fillText(words.slice(mid).join(" "), 180, 328);
    }

    // Lời nhắn mời gọi nhẹ nhàng
    ctx.fillStyle = "#880e4f";
    ctx.font = "24px 'Dancing Script', cursive";
    ctx.fillText("Chạm vào để mở thư...", 180, 420);

    // Họa tiết hoa anh đào ở giữa
    ctx.font = "22px serif";
    ctx.fillStyle = "#ff69b4";
    ctx.fillText("🌸  ✦  🌸", 180, 480);

    // Tên người gửi
    ctx.fillStyle = "#555555";
    ctx.font = "italic 20px 'Montserrat', sans-serif";
    ctx.fillText(`— ${letter.sender || "Người thương"} —`, 180, 700);

    // Con dấu hoàng gia đỏ (Japanese Hanko Stamp)
    ctx.beginPath();
    ctx.arc(180, 785, 34, 0, Math.PI * 2);
    ctx.fillStyle = "#d90429";
    ctx.fill();
    ctx.strokeStyle = "#ffccd5";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Playfair Display', serif";
    ctx.fillText("20/10", 180, 783);
    ctx.font = "bold 13px 'Montserrat', sans-serif";
    ctx.fillText("VIP", 180, 802);

    return new THREE.CanvasTexture(canvas);
  }

  generateBackTexture(letter) {
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 920;
    const ctx = canvas.getContext("2d");

    // Nền giấy hoa anh đào
    const bgGrad = ctx.createLinearGradient(0, 0, 360, 920);
    bgGrad.addColorStop(0, "#fffefb");
    bgGrad.addColorStop(0.5, "#fff0f6");
    bgGrad.addColorStop(1, "#ffe4ec");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 360, 920);

    // Khung viền vàng
    ctx.strokeStyle = "#cba135";
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, 332, 892);

    ctx.strokeStyle = "rgba(203, 161, 53, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, 316, 876);

    // Họa tiết mặt sau
    ctx.fillStyle = "#cba135";
    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Montserrat', sans-serif";
    ctx.fillText("✦ NGUYỄN NGỌC ÁNH ✦", 180, 160);

    ctx.font = "60px serif";
    ctx.fillText("🌸", 180, 320);

    ctx.font = "italic 24px 'Playfair Display', serif";
    ctx.fillStyle = "#880e4f";
    ctx.fillText("Nguyện ước yêu thương", 180, 430);

    ctx.font = "bold 32px 'Montserrat', sans-serif";
    ctx.fillStyle = "#d90429";
    ctx.fillText("20 / 10", 180, 520);

    // Con dấu son đỏ
    ctx.beginPath();
    ctx.arc(180, 785, 34, 0, Math.PI * 2);
    ctx.fillStyle = "#d90429";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px serif";
    ctx.fillText("ÁNH", 180, 792);

    return new THREE.CanvasTexture(canvas);
  }

  // --- 9.5. HỆ THỐNG BÓNG BAY LÃNG MẠN BAY LÊN MANG THEO CÁC BỨC THƯ ---
  buildFloatingLetterBalloons() {
    if (this.floatingBalloons) {
      this.floatingBalloons.forEach((b) => {
        this.scene.remove(b.group);
      });
    }
    this.floatingBalloons = [];

    const store = window.appStore ? window.appStore.get() : null;
    const letters = (store && store.treeLetters && store.treeLetters.length > 0)
      ? store.treeLetters
      : [];

    if (letters.length === 0) return;

    // Bảng màu bóng bay pastel ngọt ngào, lãng mạn
    const balloonColors = [
      0xff4d6d, // Hồng ruby
      0xff758f, // Hồng đào
      0xffb3c1, // Hồng phấn
      0xffb703, // Vàng ấm
      0xfb8500, // Cam hoàng hôn
      0x06d6a0, // Xanh ngọc may mắn
      0x48cae4, // Xanh da trời
      0x9d4edd, // Tím mộng mơ
      0xc77dff, // Tím oải hương
      0xffd166, // Vàng ánh kim
      0xff5c8a, // Hồng cánh sen
      0xffbe0b, // Vàng rực rỡ
    ];

    const balloonCount = Math.max(14, letters.length);

    for (let i = 0; i < balloonCount; i++) {
      const letter = letters[i % letters.length];
      const color = letter.isSpecial ? 0xe63946 : balloonColors[i % balloonColors.length];

      const balloonGroup = new THREE.Group();

      // 1. Quả bóng bay 3D hình giọt nước tròn căng mọng
      const balloonGeo = new THREE.SphereGeometry(0.5, 20, 20);
      balloonGeo.scale(1.0, 1.28, 0.95);

      const balloonMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.25,
        metalness: 0.15,
        emissive: color,
        emissiveIntensity: letter.isSpecial ? 0.4 : 0.22,
      });

      const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
      balloonMesh.castShadow = true;
      balloonGroup.add(balloonMesh);

      // Điểm thắt nút dưới đáy quả bóng
      const knotGeo = new THREE.ConeGeometry(0.09, 0.12, 8);
      const knotMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3 });
      const knotMesh = new THREE.Mesh(knotGeo, knotMat);
      knotMesh.position.y = -0.64;
      balloonGroup.add(knotMesh);

      // Nếu là thiệp đặc biệt, thêm vòng hào quang vàng nhỏ quanh bóng bay
      if (letter.isSpecial) {
        const specialHaloGeo = new THREE.TorusGeometry(0.68, 0.02, 8, 24);
        const specialHaloMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const specialHalo = new THREE.Mesh(specialHaloGeo, specialHaloMat);
        specialHalo.rotation.x = Math.PI / 2.3;
        balloonGroup.add(specialHalo);
      }

      // 2. Sợi dây mảnh nối bóng bay với bức thư
      const stringLength = 1.25;
      const stringGeo = new THREE.CylinderGeometry(0.005, 0.005, stringLength, 6);
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.position.y = -0.64 - stringLength / 2;
      balloonGroup.add(stringMesh);

      // 3. Thẻ thư mini gắn dưới dây bóng bay
      const tagWidth = 0.44;
      const tagHeight = 0.95;
      const tagDepth = 0.015;
      const tagGeo = new THREE.BoxGeometry(tagWidth, tagHeight, tagDepth);

      const tagTexture = this.generateBalloonTagTexture(letter);
      const tagMat = new THREE.MeshStandardMaterial({
        map: tagTexture,
        roughness: 0.38,
        metalness: 0.1,
        emissive: new THREE.Color(letter.color || "#ff69b4"),
        emissiveIntensity: 0.15,
      });

      const tagMesh = new THREE.Mesh(tagGeo, tagMat);
      tagMesh.position.y = -0.64 - stringLength - tagHeight / 2;
      balloonGroup.add(tagMesh);

      // Viền vàng kim tinh tế cho thẻ thư bay
      const frameGeo = new THREE.BoxGeometry(tagWidth + 0.02, tagHeight + 0.02, tagDepth * 0.8);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.copy(tagMesh.position);
      balloonGroup.add(frameMesh);

      // Tua rua đỏ nhỏ xíu đung đưa dưới thẻ thư
      const tasselGeo = new THREE.ConeGeometry(0.035, 0.22, 6);
      const tasselMat = new THREE.MeshBasicMaterial({ color: 0xd90429 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.rotation.x = Math.PI;
      tassel.position.y = tagMesh.position.y - tagHeight / 2 - 0.12;
      balloonGroup.add(tassel);

      // Gán metadata tương tác
      const clickData = {
        isBalloonLetter: true,
        letterData: letter,
        parentGroup: balloonGroup,
        balloonIndex: i,
      };
      balloonMesh.userData = clickData;
      tagMesh.userData = clickData;

      // Phân bổ bóng bay xung quanh cây và ở các độ cao khác nhau từ thấp lên cao
      const angle = (i / balloonCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const radius = 6.2 + Math.random() * 6.5; // Bay bên ngoài tán cây
      const startY = -2.0 + (i / balloonCount) * 26.0; // Rải đều từ dưới lên trời

      balloonGroup.position.set(Math.cos(angle) * radius, startY, Math.sin(angle) * radius);

      this.scene.add(balloonGroup);

      this.floatingBalloons.push({
        group: balloonGroup,
        balloonMesh: balloonMesh,
        tagMesh: tagMesh,
        letterData: letter,
        angle: angle,
        radius: radius,
        y: startY,
        speedY: 0.016 + Math.random() * 0.022, // Tốc độ bay lên từ tốn, thơ mộng
        swaySpeed: 1.0 + Math.random() * 0.8,
        swayAmp: 0.28 + Math.random() * 0.2,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  generateBalloonTagTexture(letter) {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 520;
    const ctx = canvas.getContext("2d");

    // Nền giấy lụa hoa anh đào
    const bgGrad = ctx.createLinearGradient(0, 0, 240, 520);
    bgGrad.addColorStop(0, "#fffefb");
    bgGrad.addColorStop(0.5, "#fff0f6");
    bgGrad.addColorStop(1, "#ffe8f2");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 240, 520);

    // Khung viền mạ vàng
    ctx.strokeStyle = "#cba135";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 220, 500);

    ctx.strokeStyle = "rgba(203, 161, 53, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(16, 16, 208, 488);

    // Lỗ xỏ dây trên đầu
    ctx.beginPath();
    ctx.arc(120, 32, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#2d132c";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nhãn tag
    ctx.fillStyle = letter.isSpecial ? "rgba(230, 57, 70, 0.2)" : "rgba(255, 105, 180, 0.16)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(25, 52, 190, 26, 13);
    else ctx.rect(25, 52, 190, 26);
    ctx.fill();

    ctx.fillStyle = letter.isSpecial ? "#e63946" : (letter.color || "#d81b60");
    ctx.font = "bold 13px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(letter.isSpecial ? "✦ BẢO TRỌNG ✦" : `✦ ${letter.shortTag || "ƯỚC NGUYỆN"} ✦`, 120, 70);

    // Biểu tượng cảm xúc
    ctx.font = "38px serif";
    ctx.fillText(letter.icon || "🎈", 120, 125);

    // Đường gạch chỉ vàng
    ctx.strokeStyle = "rgba(203, 161, 53, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 148);
    ctx.lineTo(200, 148);
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = "#2d132c";
    ctx.font = "bold 17px 'Playfair Display', serif";
    const words = (letter.title || "Tâm Thư").split(" ");
    if (words.length <= 3) {
      ctx.fillText(letter.title, 120, 185);
    } else {
      const mid = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, mid).join(" "), 120, 175);
      ctx.fillText(words.slice(mid).join(" "), 120, 198);
    }

    // Lời mời chạm vào
    ctx.fillStyle = "#880e4f";
    ctx.font = "16px 'Dancing Script', cursive";
    ctx.fillText("Chạm vào để đọc 💌", 120, 260);

    ctx.font = "italic 13px 'Montserrat', sans-serif";
    ctx.fillStyle = "#555";
    ctx.fillText(`— ${letter.sender || "Người thương"} —`, 120, 390);

    // Con dấu đỏ son
    ctx.beginPath();
    ctx.arc(120, 445, 24, 0, Math.PI * 2);
    ctx.fillStyle = "#d90429";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Playfair Display', serif";
    ctx.fillText(letter.isSpecial ? "CẤP 3" : "20/10", 120, 444);
    ctx.font = "bold 9px 'Montserrat', sans-serif";
    ctx.fillText("VIP", 120, 458);

    return new THREE.CanvasTexture(canvas);
  }

  // --- 10. TƯƠNG TÁC CHUỘT & ĐIỀU KHIỂN ---
  bindControls() {
    const el = this.renderer.domElement;

    const onPointerDown = (clientX, clientY) => {
      this.isDragging = true;
      this.prevMousePos = { x: clientX, y: clientY };
    };

    el.addEventListener("mousedown", (e) => onPointerDown(e.clientX, e.clientY));
    el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const onPointerMove = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = clientX - this.prevMousePos.x;
        const deltaY = clientY - this.prevMousePos.y;
        this.prevMousePos = { x: clientX, y: clientY };

        this.spherical.theta -= deltaX * 0.007;
        this.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 + 0.1, this.spherical.phi - deltaY * 0.007));
        this.updateCameraPosition();
      } else {
        this.checkHover();
      }
    };

    window.addEventListener("mousemove", (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    const onPointerUp = () => {
      this.isDragging = false;
    };
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    // Zoom bằng cuộn chuột
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(12, Math.min(42, this.spherical.radius + e.deltaY * 0.03));
      this.updateCameraPosition();
    }, { passive: false });

    // Click tương tác với thẻ thư HOẶC bé gấu trúc!
    el.addEventListener("click", (e) => this.handleClick(e));
    el.addEventListener("touchend", (e) => {
      if (!this.isDragging) this.handleClick(e);
    });
  }

  updateCameraPosition() {
    this.camera.position.x = this.targetLookAt.x + this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
    this.camera.position.y = this.targetLookAt.y + this.spherical.radius * Math.cos(this.spherical.phi);
    this.camera.position.z = this.targetLookAt.z + this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
    this.camera.lookAt(this.targetLookAt);
  }

  checkHover() {
    if (!this.camera) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.hangingTags.map((t) => t.cardMesh);

    // Bổ sung các quả bóng bay và thẻ thư bay vào danh sách tương tác
    if (this.floatingBalloons) {
      this.floatingBalloons.forEach((b) => {
        if (b.balloonMesh) meshes.push(b.balloonMesh);
        if (b.tagMesh) meshes.push(b.tagMesh);
      });
    }

    if (this.pandaGroup) {
      this.pandaGroup.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.isPanda) {
          meshes.push(child);
        }
      });
    }

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      if (this.hoveredInteractive !== hitMesh) {
        if (this.hoveredInteractive && (this.hoveredInteractive.userData.isLetterTag || this.hoveredInteractive.userData.isBalloonLetter) && this.hoveredInteractive.userData.parentGroup) {
          this.hoveredInteractive.userData.parentGroup.scale.set(1, 1, 1);
        }
        this.hoveredInteractive = hitMesh;
        if (hitMesh.userData && (hitMesh.userData.isLetterTag || hitMesh.userData.isBalloonLetter) && hitMesh.userData.parentGroup) {
          hitMesh.userData.parentGroup.scale.set(1.18, 1.18, 1.18);
        }
        this.container.style.cursor = "pointer";
      }
    } else {
      if (this.hoveredInteractive) {
        if (this.hoveredInteractive.userData && (this.hoveredInteractive.userData.isLetterTag || this.hoveredInteractive.userData.isBalloonLetter) && this.hoveredInteractive.userData.parentGroup) {
          this.hoveredInteractive.userData.parentGroup.scale.set(1, 1, 1);
        }
        this.hoveredInteractive = null;
        this.container.style.cursor = "default";
      }
    }
  }

  handleClick(e) {
    if (!this.camera) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.hangingTags.map((t) => t.cardMesh);

    // Bổ sung bóng bay và thẻ thư bay vào danh sách click
    if (this.floatingBalloons) {
      this.floatingBalloons.forEach((b) => {
        if (b.balloonMesh) meshes.push(b.balloonMesh);
        if (b.tagMesh) meshes.push(b.tagMesh);
      });
    }

    if (this.pandaGroup) {
      this.pandaGroup.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.isPanda) {
          meshes.push(child);
        }
      });
    }

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;

      // 1. Click vào Bé Gấu Trúc Ôm Trái Tim!
      if (hitMesh.userData.isPanda) {
        this.interactWithPanda(e);
        return;
      }

      // 2. Click vào Tấm Thẻ Thư Treo Trên Cây HOẶC Bóng Bay Bay Lên!
      if (hitMesh.userData.isLetterTag || hitMesh.userData.isBalloonLetter) {
        const letterData = hitMesh.userData.letterData;
        if (letterData) {
          if (window.audioManager) window.audioManager.playSfx("sparkle");
          if (window.particleEngineInstance) {
            const clientX = e.clientX || window.innerWidth / 2;
            const clientY = e.clientY || window.innerHeight / 2;
            window.particleEngineInstance.burst(clientX, clientY, 45);
          }
          if (hitMesh.userData.isBalloonLetter && window.adminManager) {
            window.adminManager.showToast(`🎈 Bạn đã mở bức thư từ bóng bay: "${letterData.title}"!`, "success");
          }
          this.openLetterModal(letterData);
        }
      }
    }
  }

  // Tương tác siêu dễ thương khi click vào Bé Gấu Trúc
  interactWithPanda(e) {
    if (!this.pandaGroup) return;

    // Âm thanh cưng xỉu
    if (window.audioManager) window.audioManager.playSfx("fanfare");

    // Bé gấu nhảy nhót gật đầu
    const origY = this.pandaGroup.position.y;
    let progress = 0;
    const jumpInterval = setInterval(() => {
      progress += 0.15;
      this.pandaGroup.position.y = origY + Math.sin(progress) * 0.45;
      if (progress >= Math.PI) {
        clearInterval(jumpInterval);
        this.pandaGroup.position.y = origY;
      }
    }, 25);

    // Bắn pháo hoa tim từ vị trí bé gấu trúc
    if (window.particleEngineInstance) {
      const clientX = e.clientX || window.innerWidth / 2;
      const clientY = e.clientY || window.innerHeight / 2;
      window.particleEngineInstance.burst(clientX, clientY, 50);
    }

    // Hiển thị thông điệp dễ thương từ bé gấu trúc
    if (window.adminManager) {
      window.adminManager.showToast("🐼 Bé Gấu Trúc: 'Em mãi là người phụ nữ tuyệt vời và đáng yêu nhất thế gian! ❤️'", "success");
    }

    // Kích hoạt hoàn thành nhiệm vụ mở khóa lộ trình
    if (typeof window.onTreeTaskCompleted === "function") {
      window.onTreeTaskCompleted("panda");
    }
  }

  openLetterModal(letter) {
    const modal = document.getElementById("tree-letter-modal");
    if (!modal) return;

    const config = window.appStore ? window.appStore.get() : {};
    const mode = config.audienceMode || "crush";
    const transform = (t) => (window.transformPronouns ? window.transformPronouns(t, mode) : t);

    document.getElementById("tree-letter-tag").textContent = transform(letter.shortTag || "YÊU THƯƠNG");
    document.getElementById("tree-letter-tag").style.color = letter.color || "#ff69b4";
    document.getElementById("tree-letter-icon").textContent = letter.icon || "🌸";
    document.getElementById("tree-letter-title").textContent = transform(letter.title);
    document.getElementById("tree-letter-body").innerHTML = letter.content ? transform(letter.content).replace(/\n/g, "<br>") : "";
    document.getElementById("tree-letter-sender").textContent = `— ${transform(letter.sender || "Người thương")}`;
    document.getElementById("tree-letter-date").textContent = `✦ ${transform(letter.date || "Kỷ niệm")}`;

    modal.classList.add("active");

    // Kích hoạt hoàn thành nhiệm vụ mở khóa lộ trình khi đọc thư trên cây
    if (typeof window.onTreeTaskCompleted === "function") {
      window.onTreeTaskCompleted("letter");
    }
  }

  focusOnLetter(index) {
    if (this.hangingTags[index]) {
      const tag = this.hangingTags[index];
      const worldPos = new THREE.Vector3();
      tag.cardMesh.getWorldPosition(worldPos);

      this.spherical.theta = Math.atan2(worldPos.x, worldPos.z);
      this.updateCameraPosition();

      tag.cardMesh.scale.set(1.25, 1.25, 1.25);
      setTimeout(() => tag.cardMesh.scale.set(1, 1, 1), 1200);

      this.openLetterModal(tag.letterData);
    }
  }

  updateHUDLetterCount(count) {
    const countEl = document.getElementById("hud-letter-count");
    if (countEl) countEl.textContent = count;
  }

  // --- 11. VÒNG LẶP RENDER & HOẠT ẢNH THỜI GIAN THỰC ---
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Tự động xoay 3D nhẹ nhàng quanh cây
    if (this.autoRotate && !this.isDragging) {
      this.spherical.theta += this.autoRotateSpeed;
      this.updateCameraPosition();
    }

    // 2. Nhịp tim đập bập bùng của trái tim bé gấu trúc đang ôm (Heartbeat Pulse)
    if (this.pandaHeart) {
      const heartPulse = 1.35 + Math.sin(elapsedTime * 4.5) * 0.12 + Math.cos(elapsedTime * 9.0) * 0.05;
      this.pandaHeart.scale.set(heartPulse, heartPulse, heartPulse);
    }

    // Bé gấu trúc thở nhè nhẹ
    if (this.pandaGroup) {
      this.pandaGroup.position.y = 0.58 + Math.sin(elapsedTime * 2.0) * 0.04;
    }

    // 3. Lồng đèn đung đưa theo gió
    for (let i = 0; i < this.lanterns.length; i++) {
      const lant = this.lanterns[i];
      const t = elapsedTime * lant.speed + lant.phase;
      lant.group.rotation.z = Math.sin(t) * 0.15;
      lant.group.rotation.x = Math.cos(t * 0.8) * 0.1;
    }

    // 4. Các tấm thư lắc lư mềm mại
    for (let i = 0; i < this.hangingTags.length; i++) {
      const tag = this.hangingTags[i];
      const t = elapsedTime * tag.swaySpeed + tag.swayOffset;
      tag.meshGroup.rotation.z = Math.sin(t) * 0.12;
      tag.meshGroup.rotation.x = Math.cos(t * 0.85) * 0.08;
    }

    // 4.5. Hoạt ảnh bóng bay từ từ bay lên mang theo các bức thư bay lượn
    if (this.floatingBalloons) {
      for (let i = 0; i < this.floatingBalloons.length; i++) {
        const b = this.floatingBalloons[i];
        b.y += b.speedY;

        const sway = Math.sin(elapsedTime * b.swaySpeed + b.swayPhase) * b.swayAmp;
        const swayRot = Math.cos(elapsedTime * b.swaySpeed + b.swayPhase) * 0.12;

        b.group.position.x = Math.cos(b.angle) * b.radius + sway;
        b.group.position.z = Math.sin(b.angle) * b.radius + Math.cos(elapsedTime * 0.8 + b.swayPhase) * (b.swayAmp * 0.7);
        b.group.position.y = b.y;

        b.group.rotation.z = swayRot;
        b.group.rotation.x = Math.sin(elapsedTime * 0.7 + b.swayPhase) * 0.08;

        // Khi bóng bay lên qua đỉnh trời (y > 27), reset từ từ phía dưới đáy đảo
        if (b.y > 27.5) {
          b.y = -3.5 - Math.random() * 2.5;
          b.angle = Math.random() * Math.PI * 2;
          b.radius = 6.2 + Math.random() * 6.5;
        }
      }
    }

    // 5. Đom đóm bay lượn bập bùng
    for (let i = 0; i < this.fireflies.length; i++) {
      const f = this.fireflies[i];
      f.angle += f.speed;
      f.mesh.position.x = Math.cos(f.angle) * f.radius;
      f.mesh.position.z = Math.sin(f.angle) * f.radius;
      f.mesh.position.y = f.baseY + Math.sin(elapsedTime * f.bobSpeed + f.bobPhase) * 0.6;
    }

    // 6. Cánh hoa anh đào xoáy vòng 3D
    if (this.petalsMesh && this.petalsData) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.petalsData.length; i++) {
        const p = this.petalsData[i];
        p.angle += p.speedAngle;
        p.y -= p.speedY;
        p.rotX += p.vRotX;
        p.rotY += p.vRotY;

        if (p.y < 0.2) {
          p.y = 18 + Math.random() * 4;
        }

        dummy.position.set(Math.cos(p.angle) * p.radius, p.y, Math.sin(p.angle) * p.radius);
        dummy.rotation.set(p.rotX, p.rotY, p.angle);
        dummy.updateMatrix();
        this.petalsMesh.setMatrixAt(i, dummy.matrix);
      }
      this.petalsMesh.instanceMatrix.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.SakuraTree3D = SakuraTree3D;
