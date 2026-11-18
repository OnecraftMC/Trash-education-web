        import * as THREE from "three";
        import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
        import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

        const container = document.getElementById("laptop-canvas");
        if (container) {
            const renderer = new THREE.WebGLRenderer({
                antialias: window.innerWidth >= 768,
                alpha: true,
                powerPreference: "high-performance",
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5));
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

            const camera = new THREE.PerspectiveCamera(
                35,
                container.clientWidth / Math.max(container.clientHeight, 1),
                0.1,
                100
            );

            // Kalkulasi jarak kamera responsif agar 3D MacBook & tumpukan e-waste tampil utuh di mobile & desktop
            function getResponsiveCameraMetrics() {
                const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
                const portraitScale = aspect < 1.05 ? Math.min(2.05, 1.08 / Math.max(aspect, 0.45)) : 1.0;
                return {
                    overviewX: aspect < 0.85 ? 0.14 : 0.35,
                    overviewY: 1.55 + (portraitScale - 1) * 0.42,
                    overviewZ: 5.4 * portraitScale,
                    diveEndZ: aspect < 0.85 ? 2.15 : 1.65
                };
            }

            let camMetrics = getResponsiveCameraMetrics();
            camera.position.set(camMetrics.overviewX, camMetrics.overviewY, camMetrics.overviewZ);

            // Pencahayaan studio agar seluruh detail sampah elektronik terlihat cerah & tajam
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
            keyLight.position.set(3, 6, 4);
            scene.add(keyLight);

            const fillLight = new THREE.HemisphereLight(0xffffff, 0xe6e2d8, 0.72);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0x7a1616, 0.75);
            rimLight.position.set(-4, 3, -3);
            scene.add(rimLight);

            // Tekstur layar 3D selaras dengan tampilan awal Section 4 (#krisis-hero)
            function createScreenPreviewTexture() {
                const canvas = document.createElement("canvas");
                canvas.width = 1920;
                canvas.height = 1200;
                const ctx = canvas.getContext("2d");

                ctx.fillStyle = '#05264f';
                ctx.fillRect(0, 0, 1920, 1200);
                const tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 8;
                return tex;
            }

            const screenTexture = createScreenPreviewTexture();

            // Membangun Model 3D MacBook Prosedural
            const macbookRoot = new THREE.Group();
            scene.add(macbookRoot);

            const aluminumMat = new THREE.MeshStandardMaterial({
                color: 0xc9cdd2,
                metalness: 0.86,
                roughness: 0.24,
            });

            const darkKeyMat = new THREE.MeshStandardMaterial({
                color: 0x141518,
                metalness: 0.15,
                roughness: 0.55,
            });

            const screenMaterial = new THREE.MeshStandardMaterial({
                map: screenTexture,
                emissiveMap: screenTexture,
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 0.0,
                roughness: 0.12,
                metalness: 0.05,
            });

            // Layar MacBook menampilkan tampilan awal peta (diambil dari iframe peta)
            let mapTexture;
            window.__showLaptopDesktop = function () {
                screenMaterial.map = screenTexture;
                screenMaterial.emissiveMap = screenTexture;
                screenMaterial.userData.full = false;
                screenMaterial.needsUpdate = true;
            };
            window.__showLaptopMap = function () {
                if (!mapTexture) return;
                screenMaterial.map = mapTexture;
                screenMaterial.emissiveMap = mapTexture;
                screenMaterial.color.set(0x000000);
                screenMaterial.userData.full = true;
                screenMaterial.needsUpdate = true;
            };
            window.__setLaptopScreen = function (cnv) {
                if (mapTexture) mapTexture.dispose();
                mapTexture = new THREE.CanvasTexture(cnv);
                mapTexture.colorSpace = THREE.SRGBColorSpace;
                mapTexture.anisotropy = 8;
                if (window.macbookScrollState?.selected) window.__showLaptopMap();
            };

            const baseW = 3.12;
            const baseH = 0.075;
            const baseD = 2.18;

            const baseMesh = new THREE.Mesh(
                new RoundedBoxGeometry(baseW, baseH, baseD, 4, 0.025),
                aluminumMat
            );
            baseMesh.position.y = baseH / 2;
            macbookRoot.add(baseMesh);

            const kbWell = new THREE.Mesh(
                new RoundedBoxGeometry(2.74, 0.008, 1.04, 2, 0.004),
                new THREE.MeshStandardMaterial({ color: 0x1d1f24, metalness: 0.4, roughness: 0.5 })
            );
            kbWell.position.set(0, baseH + 0.001, -0.26);
            macbookRoot.add(kbWell);

            const rows = 6;
            const cols = 14;
            const keyGeo = new RoundedBoxGeometry(0.165, 0.014, 0.145, 2, 0.004);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (r === rows - 1 && c >= 4 && c <= 9) {
                        if (c === 4) {
                            const spaceGeo = new RoundedBoxGeometry(0.165 * 6 + 0.02 * 5, 0.014, 0.145, 2, 0.004);
                            const spaceKey = new THREE.Mesh(spaceGeo, darkKeyMat);
                            spaceKey.position.set(0, baseH + 0.006, -0.71 + r * 0.168);
                            macbookRoot.add(spaceKey);
                        }
                        continue;
                    }
                    const key = new THREE.Mesh(keyGeo, darkKeyMat);
                    key.position.set(-1.21 + c * 0.186, baseH + 0.006, -0.71 + r * 0.168);
                    macbookRoot.add(key);
                }
            }

            const trackpad = new THREE.Mesh(
                new RoundedBoxGeometry(1.06, 0.004, 0.66, 2, 0.002),
                new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 0.72, roughness: 0.28 })
            );
            trackpad.position.set(0, baseH + 0.002, 0.65);
            macbookRoot.add(trackpad);

            // Layar tebal & engsel dinaikkan di atas keycaps agar tidak menembus bodi saat tertutup
            const lidH = 2.14;
            const lidThick = 0.068;
            const hingeY = baseH + lidThick + 0.018;

            const lidPivot = new THREE.Group();
            lidPivot.position.set(0, hingeY, -baseD / 2);
            macbookRoot.add(lidPivot);

            const lidBack = new THREE.Mesh(
                new RoundedBoxGeometry(baseW, lidH, lidThick, 4, 0.024),
                aluminumMat
            );
            lidBack.position.set(0, lidH / 2, lidThick / 2);
            lidPivot.add(lidBack);

            const bezel = new THREE.Mesh(
                new THREE.PlaneGeometry(baseW - 0.05, lidH - 0.05),
                new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.18, metalness: 0.1 })
            );
            bezel.position.set(0, lidH / 2, lidThick + 0.001);
            lidPivot.add(bezel);

            const dispW = baseW - 0.14;
            const dispH = lidH - 0.15;
            const display = new THREE.Mesh(new THREE.PlaneGeometry(dispW, dispH), screenMaterial);
            display.position.set(0, lidH / 2 + 0.015, lidThick + 0.003);
            lidPivot.add(display);

            // =================================================================
            // TUMPUKAN SAMPAH ELEKTRONIK (E-WASTE) DETAIL DI BAWAH LAPTOP
            // =================================================================
            const ewastePileGroup = new THREE.Group();

            // Tekstur Prosedural Canvas agar setiap perangkat e-waste terlihat nyata & jelas
            function createBatteryTexture(topColor, bodyColor, codeText) {
                const c = document.createElement("canvas");
                c.width = 256;
                c.height = 256;
                const ctx = c.getContext("2d");

                ctx.fillStyle = bodyColor;
                ctx.fillRect(0, 0, 256, 256);

                ctx.fillStyle = topColor;
                ctx.fillRect(0, 0, 256, 86);

                ctx.fillStyle = "#e2e8f0";
                ctx.fillRect(0, 86, 256, 10);
                ctx.fillRect(0, 232, 256, 24);

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 34px sans-serif";
                ctx.fillText("+", 24, 56);
                ctx.font = "bold 22px monospace";
                ctx.fillText(codeText, 24, 145);
                ctx.font = "600 16px sans-serif";
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.fillText("1.5V ALKALINE • E-WASTE", 24, 182);

                const tex = new THREE.CanvasTexture(c);
                tex.colorSpace = THREE.SRGBColorSpace;
                return tex;
            }

            function createPhoneScreenTexture(accentHex) {
                const c = document.createElement("canvas");
                c.width = 256;
                c.height = 512;
                const ctx = c.getContext("2d");

                ctx.fillStyle = "#0b0f17";
                ctx.fillRect(0, 0, 256, 512);

                // Efek layar glitch & ikon baterai habis merah
                ctx.fillStyle = accentHex;
                ctx.globalAlpha = 0.25;
                ctx.fillRect(18, 80, 220, 14);
                ctx.fillRect(42, 340, 180, 22);
                ctx.globalAlpha = 1;

                // Ikon baterai lemah di tengah layar retak
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 6;
                ctx.strokeRect(88, 210, 80, 42);
                ctx.fillStyle = "#ef4444";
                ctx.fillRect(168, 222, 8, 18);
                ctx.fillRect(96, 218, 18, 26);

                // Garis retakan kaca (spiderweb cracks)
                ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
                ctx.lineWidth = 2.2;
                const impactX = 165;
                const impactY = 175;
                const rays = [
                    [20, 30], [245, 45], [250, 260], [210, 490],
                    [65, 480], [12, 310], [15, 140], [130, 15]
                ];
                rays.forEach(([rx, ry]) => {
                    ctx.beginPath();
                    ctx.moveTo(impactX, impactY);
                    ctx.lineTo((impactX + rx) * 0.5 + 8, (impactY + ry) * 0.5 - 6);
                    ctx.lineTo(rx, ry);
                    ctx.stroke();
                });

                const tex = new THREE.CanvasTexture(c);
                tex.colorSpace = THREE.SRGBColorSpace;
                return tex;
            }

            function createMicrowaveFrontTexture() {
                const c = document.createElement("canvas");
                c.width = 512;
                c.height = 320;
                const ctx = c.getContext("2d");

                // Bodi depan putih/krem microwave
                ctx.fillStyle = "#ece9e1";
                ctx.fillRect(0, 0, 512, 320);

                // Bingkai pintu & kaca jendela gelap
                ctx.fillStyle = "#1f242d";
                ctx.fillRect(22, 24, 326, 272);
                ctx.fillStyle = "#11161f";
                ctx.fillRect(38, 40, 294, 240);

                // Kisi-kisi jendela microwave & retakan kaca
                ctx.strokeStyle = "rgba(255,255,255,0.12)";
                ctx.lineWidth = 1;
                for (let x = 44; x < 328; x += 12) {
                    ctx.beginPath();
                    ctx.moveTo(x, 42);
                    ctx.lineTo(x, 278);
                    ctx.stroke();
                }
                ctx.strokeStyle = "rgba(255,255,255,0.7)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(85, 65);
                ctx.lineTo(175, 155);
                ctx.lineTo(255, 125);
                ctx.moveTo(175, 155);
                ctx.lineTo(135, 250);
                ctx.stroke();

                // Panel kontrol kanan + layar digital LED "ERR:04"
                ctx.fillStyle = "#272b33";
                ctx.fillRect(364, 24, 126, 272);

                ctx.fillStyle = "#062c1e";
                ctx.fillRect(378, 38, 98, 42);
                ctx.fillStyle = "#10b981";
                ctx.font = "bold 24px monospace";
                ctx.fillText("ERR:04", 386, 66);

                // Tombol keypad angka
                ctx.fillStyle = "#cbd5e1";
                for (let r = 0; r < 4; r++) {
                    for (let col = 0; col < 3; col++) {
                        ctx.fillRect(380 + col * 33, 96 + r * 30, 26, 22);
                    }
                }
                // Tombol buka pintu besar di bawah
                ctx.fillStyle = "#dc2626";
                ctx.fillRect(380, 232, 94, 46);

                const tex = new THREE.CanvasTexture(c);
                tex.colorSpace = THREE.SRGBColorSpace;
                return tex;
            }

            function createPCBTexture(isBlue) {
                const c = document.createElement("canvas");
                c.width = 256;
                c.height = 256;
                const ctx = c.getContext("2d");

                ctx.fillStyle = isBlue ? "#1d4ed8" : "#15803d";
                ctx.fillRect(0, 0, 256, 256);

                // Jalur sirkuit tembaga/emas yang kontras
                ctx.strokeStyle = isBlue ? "#93c5fd" : "#86efac";
                ctx.lineWidth = 3;
                for (let i = 16; i < 240; i += 22) {
                    ctx.beginPath();
                    ctx.moveTo(12, i);
                    ctx.lineTo(110, i);
                    ctx.lineTo(145, i + 18);
                    ctx.lineTo(244, i + 18);
                    ctx.stroke();
                }

                // Titik solder emas
                ctx.fillStyle = "#fbbf24";
                for (let y = 24; y < 240; y += 36) {
                    for (let x = 24; x < 240; x += 42) {
                        ctx.beginPath();
                        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                const tex = new THREE.CanvasTexture(c);
                tex.colorSpace = THREE.SRGBColorSpace;
                return tex;
            }

            const ewMats = {
                applianceWhite: new THREE.MeshStandardMaterial({ color: 0xf1efe9, metalness: 0.15, roughness: 0.45 }),
                applianceSilver: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.78, roughness: 0.28 }),
                ironBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.15, roughness: 0.38 }),
                ironSoleplate: new THREE.MeshStandardMaterial({ color: 0xd8dee6, metalness: 0.92, roughness: 0.2 }),
                chargerWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.08, roughness: 0.35 }),
                darkPlastic: new THREE.MeshStandardMaterial({ color: 0x1e2229, metalness: 0.2, roughness: 0.52 }),
                beigeRetro: new THREE.MeshStandardMaterial({ color: 0xd6d1c4, metalness: 0.08, roughness: 0.62 }),
                goldMetal: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.88, roughness: 0.24 }),
                copperMetal: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.28 }),
                cableWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.05, roughness: 0.65 }),
                cableBlack: new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.05, roughness: 0.72 }),
                cableRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.05, roughness: 0.68 }),
                cableYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.05, roughness: 0.68 }),
                microwaveFront: new THREE.MeshStandardMaterial({ map: createMicrowaveFrontTexture(), roughness: 0.35 }),
                pcbGreen: new THREE.MeshStandardMaterial({ map: createPCBTexture(false), roughness: 0.4, metalness: 0.25 }),
                pcbBlue: new THREE.MeshStandardMaterial({ map: createPCBTexture(true), roughness: 0.4, metalness: 0.25 }),
                battCopper: new THREE.MeshStandardMaterial({ map: createBatteryTexture("#d97706", "#18181b", "AA+"), roughness: 0.35, metalness: 0.3 }),
                battGreen: new THREE.MeshStandardMaterial({ map: createBatteryTexture("#059669", "#e2e8f0", "NiMH"), roughness: 0.35, metalness: 0.3 }),
                phoneScreenA: new THREE.MeshStandardMaterial({ map: createPhoneScreenTexture("#38bdf8"), emissive: new THREE.Color(0x0ea5e9), emissiveIntensity: 0.25, roughness: 0.18 }),
                phoneScreenB: new THREE.MeshStandardMaterial({ map: createPhoneScreenTexture("#f43f5e"), emissive: new THREE.Color(0xe11d48), emissiveIntensity: 0.22, roughness: 0.18 })
            };

            // Bayangan kontak lembut di lantai studio
            const shadowCanvas = document.createElement("canvas");
            shadowCanvas.width = 256;
            shadowCanvas.height = 256;
            const sCtx = shadowCanvas.getContext("2d");
            const sGrad = sCtx.createRadialGradient(128, 128, 24, 128, 128, 122);
            sGrad.addColorStop(0, "rgba(16, 17, 19, 0.26)");
            sGrad.addColorStop(0.6, "rgba(16, 17, 19, 0.11)");
            sGrad.addColorStop(1, "rgba(16, 17, 19, 0)");
            sCtx.fillStyle = sGrad;
            sCtx.fillRect(0, 0, 256, 256);
            const contactShadow = new THREE.Mesh(
                new THREE.PlaneGeometry(5.8, 4.4),
                new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
            );
            contactShadow.rotation.x = -Math.PI / 2;
            contactShadow.position.set(0, -0.66, 0.2);
            ewastePileGroup.add(contactShadow);

            // 1. MICROWAVE RUSAK (Sisi kiri-belakang, panel kontrol & kaca retak menghadap kamera)
            function createBrokenMicrowave() {
                const mw = new THREE.Group();
                const cabinet = new THREE.Mesh(
                    new RoundedBoxGeometry(1.18, 0.68, 0.78, 3, 0.03),
                    ewMats.applianceWhite
                );
                mw.add(cabinet);

                const frontFace = new THREE.Mesh(
                    new THREE.PlaneGeometry(1.12, 0.62),
                    ewMats.microwaveFront
                );
                frontFace.position.z = 0.392;
                mw.add(frontFace);

                const vent = new THREE.Mesh(
                    new THREE.BoxGeometry(0.02, 0.36, 0.44),
                    ewMats.darkPlastic
                );
                vent.position.set(-0.59, 0.02, 0);
                mw.add(vent);

                return mw;
            }
            const microwave = createBrokenMicrowave();
            microwave.position.set(-1.64, -0.36, 0.28);
            microwave.rotation.set(-0.14, 0.56, 0.12);
            ewastePileGroup.add(microwave);

            // 2. SETRIKA LISTRIK BEKAS (Sisi kiri-depan, tapak logam segitiga & tangki air biru-putih)
            function createElectricIron() {
                const iron = new THREE.Group();

                const soleShape = new THREE.Shape();
                soleShape.moveTo(0, 0.34);
                soleShape.quadraticCurveTo(0.19, 0.06, 0.17, -0.28);
                soleShape.lineTo(-0.17, -0.28);
                soleShape.quadraticCurveTo(-0.19, 0.06, 0, 0.34);

                const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
                    depth: 0.026,
                    bevelEnabled: true,
                    bevelThickness: 0.005,
                    bevelSize: 0.005,
                    bevelSegments: 2
                });
                const soleplate = new THREE.Mesh(soleGeo, ewMats.ironSoleplate);
                soleplate.rotation.x = -Math.PI / 2;
                iron.add(soleplate);

                const tank = new THREE.Mesh(
                    new RoundedBoxGeometry(0.26, 0.12, 0.44, 3, 0.04),
                    ewMats.ironBlue
                );
                tank.position.set(0, 0.08, -0.02);
                iron.add(tank);

                const handleTop = new THREE.Mesh(
                    new RoundedBoxGeometry(0.11, 0.065, 0.46, 3, 0.025),
                    ewMats.applianceWhite
                );
                handleTop.position.set(0, 0.23, -0.05);
                handleTop.rotation.x = 0.18;
                iron.add(handleTop);

                const handleFront = new THREE.Mesh(
                    new RoundedBoxGeometry(0.1, 0.14, 0.1, 2, 0.02),
                    ewMats.applianceWhite
                );
                handleFront.position.set(0, 0.16, 0.12);
                handleFront.rotation.x = -0.35;
                iron.add(handleFront);

                const dial = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.045, 0.045, 0.03, 18),
                    ewMats.darkPlastic
                );
                dial.position.set(0, 0.145, -0.02);
                iron.add(dial);

                const cordBoot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.022, 0.034, 0.12, 12),
                    ewMats.darkPlastic
                );
                cordBoot.rotation.x = Math.PI / 2.4;
                cordBoot.position.set(0, 0.18, -0.31);
                iron.add(cordBoot);

                return iron;
            }
            const clothesIron = createElectricIron();
            clothesIron.position.set(-1.12, -0.34, 1.24);
            clothesIron.rotation.set(0.32, 0.72, -0.48);
            ewastePileGroup.add(clothesIron);

            // 3. PEMANGGANG ROTI (TOASTER) STAINLESS RUSAK (Sisi kanan-belakang)
            function createBrokenToaster() {
                const toaster = new THREE.Group();
                const body = new THREE.Mesh(
                    new RoundedBoxGeometry(0.76, 0.46, 0.48, 4, 0.05),
                    ewMats.applianceSilver
                );
                toaster.add(body);

                const slot1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.065), ewMats.darkPlastic);
                slot1.position.set(0, 0.231, -0.08);
                const slot2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.065), ewMats.darkPlastic);
                slot2.position.set(0, 0.231, 0.08);
                toaster.add(slot1, slot2);

                const lever = new THREE.Mesh(
                    new RoundedBoxGeometry(0.06, 0.04, 0.12, 2, 0.01),
                    ewMats.darkPlastic
                );
                lever.position.set(0.4, 0.06, 0);
                toaster.add(lever);

                return toaster;
            }
            const toaster = createBrokenToaster();
            toaster.position.set(1.62, -0.36, 0.12);
            toaster.rotation.set(0.16, -0.58, -0.18);
            ewastePileGroup.add(toaster);

            // 4. HANDPHONE & TABLET RUSAK LAYAR RETAK (Area depan-tengah & kanan)
            function createBrokenSmartphone(w, d, bodyMat, screenMat) {
                const phone = new THREE.Group();
                const frame = new THREE.Mesh(
                    new RoundedBoxGeometry(w, 0.026, d, 3, 0.012),
                    bodyMat
                );
                phone.add(frame);

                const glass = new THREE.Mesh(
                    new THREE.PlaneGeometry(w * 0.9, d * 0.93),
                    screenMat
                );
                glass.rotation.x = -Math.PI / 2;
                glass.position.y = 0.014;
                phone.add(glass);

                return phone;
            }

            const phone1 = createBrokenSmartphone(0.28, 0.56, ewMats.darkPlastic, ewMats.phoneScreenA);
            phone1.position.set(0.08, -0.36, 1.38);
            phone1.rotation.set(0.36, -0.22, 0.06);
            ewastePileGroup.add(phone1);

            const phone2 = createBrokenSmartphone(0.26, 0.52, ewMats.copperMetal, ewMats.phoneScreenB);
            phone2.position.set(-0.34, -0.44, 1.48);
            phone2.rotation.set(0.28, 0.45, -0.14);
            ewastePileGroup.add(phone2);

            const brokenTablet = createBrokenSmartphone(0.56, 0.78, ewMats.applianceSilver, ewMats.phoneScreenA);
            brokenTablet.position.set(0.84, -0.32, 1.18);
            brokenTablet.rotation.set(0.34, -0.32, -0.18);
            ewastePileGroup.add(brokenTablet);

            // 5. KEPALA CHARGER ADAPTER PUTIH/HITAM DENGAN COLOKAN LOGAM
            function createWallCharger(isWhite = true) {
                const charger = new THREE.Group();
                const cube = new THREE.Mesh(
                    new RoundedBoxGeometry(0.18, 0.16, 0.21, 3, 0.025),
                    isWhite ? ewMats.chargerWhite : ewMats.darkPlastic
                );
                charger.add(cube);

                const prongGeo = new THREE.BoxGeometry(0.014, 0.032, 0.09);
                const prongL = new THREE.Mesh(prongGeo, ewMats.applianceSilver);
                prongL.position.set(-0.042, 0, 0.14);
                const prongR = new THREE.Mesh(prongGeo, ewMats.applianceSilver);
                prongR.position.set(0.042, 0, 0.14);

                const usbPort = new THREE.Mesh(
                    new THREE.BoxGeometry(0.075, 0.026, 0.01),
                    ewMats.darkPlastic
                );
                usbPort.position.set(0, 0, -0.106);

                charger.add(prongL, prongR, usbPort);
                return charger;
            }

            const chargerConfigs = [
                { pos: [0.46, -0.46, 1.46], rot: [0.22, 0.55, 0.18], white: true },
                { pos: [-0.66, -0.52, 1.52], rot: [0.18, -0.68, -0.2], white: true },
                { pos: [1.34, -0.42, 1.24], rot: [0.25, 0.35, -0.15], white: false }
            ];
            chargerConfigs.forEach((cfg) => {
                const ch = createWallCharger(cfg.white);
                ch.position.set(...cfg.pos);
                ch.rotation.set(...cfg.rot);
                ewastePileGroup.add(ch);
            });

            // 6. BATERAI BEKAS (AA/AAA COPPER & GREEN, BATERAI KOTAK 9V, & BATERAI LI-ION KEMBUNG)
            function createAABattery(isGreen = false) {
                const batt = new THREE.Group();
                const cyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.044, 0.044, 0.22, 18),
                    isGreen ? ewMats.battGreen : ewMats.battCopper
                );
                const nub = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.018, 0.018, 0.022, 14),
                    ewMats.applianceSilver
                );
                nub.position.y = 0.12;
                batt.add(cyl, nub);
                return batt;
            }

            function create9VBattery() {
                const b9 = new THREE.Group();
                const box = new THREE.Mesh(
                    new RoundedBoxGeometry(0.13, 0.22, 0.085, 2, 0.012),
                    ewMats.battCopper
                );
                const term1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.025, 12), ewMats.applianceSilver);
                term1.position.set(-0.032, 0.12, 0);
                const term2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 12), ewMats.applianceSilver);
                term2.position.set(0.032, 0.12, 0);
                b9.add(box, term1, term2);
                return b9;
            }

            const aaPlacements = [
                { pos: [-0.14, -0.56, 1.62], rot: [0.2, 0.4, Math.PI / 2.1], green: false },
                { pos: [0.28, -0.58, 1.66], rot: [-0.15, -0.5, Math.PI / 1.9], green: true },
                { pos: [0.68, -0.54, 1.56], rot: [0.3, 0.8, Math.PI / 2], green: false },
                { pos: [-0.88, -0.55, 1.58], rot: [-0.2, 1.1, Math.PI / 2], green: true },
                { pos: [1.15, -0.54, 1.44], rot: [0.15, -0.3, Math.PI / 2.2], green: false },
                { pos: [-1.42, -0.54, 1.38], rot: [0.25, 0.6, Math.PI / 2], green: true }
            ];
            aaPlacements.forEach((cfg) => {
                const b = createAABattery(cfg.green);
                b.position.set(...cfg.pos);
                b.rotation.set(...cfg.rot);
                ewastePileGroup.add(b);
            });

            const batt9V1 = create9VBattery();
            batt9V1.position.set(0.02, -0.54, 1.68);
            batt9V1.rotation.set(1.25, 0.35, 0.4);
            ewastePileGroup.add(batt9V1);

            const batt9V2 = create9VBattery();
            batt9V2.position.set(-0.48, -0.55, 1.64);
            batt9V2.rotation.set(1.3, -0.45, -0.3);
            ewastePileGroup.add(batt9V2);

            const liIonPouch = new THREE.Mesh(
                new RoundedBoxGeometry(0.24, 0.048, 0.36, 4, 0.02),
                ewMats.applianceSilver
            );
            liIonPouch.position.set(0.92, -0.54, 1.52);
            liIonPouch.rotation.set(0.18, 0.42, -0.1);
            ewastePileGroup.add(liIonPouch);

            // 7. MOTHERBOARD PCB HIJAU/BIRU, KEYBOARD LAWAS & KIPAS PC
            function createDetailedPCB(w, d, isBlue = false) {
                const pcb = new THREE.Group();
                const board = new THREE.Mesh(
                    new THREE.BoxGeometry(w, 0.02, d),
                    isBlue ? ewMats.pcbBlue : ewMats.pcbGreen
                );
                pcb.add(board);

                const goldPins = new THREE.Mesh(
                    new THREE.BoxGeometry(w * 0.74, 0.022, 0.04),
                    ewMats.goldMetal
                );
                goldPins.position.set(0, 0, d / 2 - 0.015);
                pcb.add(goldPins);

                for (let i = 0; i < 4; i++) {
                    const chip = new THREE.Mesh(
                        new THREE.BoxGeometry(0.12, 0.026, 0.12),
                        ewMats.darkPlastic
                    );
                    chip.position.set(-w * 0.25 + i * (w * 0.17), 0.02, (i % 2 === 0 ? -1 : 1) * d * 0.16);
                    pcb.add(chip);

                    const cap = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.026, 0.026, 0.06, 12),
                        ewMats.applianceSilver
                    );
                    cap.position.set(-w * 0.22 + i * (w * 0.16), 0.036, (i % 2 === 0 ? 1 : -1) * d * 0.22);
                    pcb.add(cap);
                }
                return pcb;
            }

            const pcb1 = createDetailedPCB(0.76, 0.54, false);
            pcb1.position.set(-0.68, -0.26, 0.92);
            pcb1.rotation.set(0.28, 0.34, 0.14);
            ewastePileGroup.add(pcb1);

            const pcb2 = createDetailedPCB(0.78, 0.54, true);
            pcb2.position.set(1.22, -0.24, 0.84);
            pcb2.rotation.set(0.26, -0.42, -0.18);
            ewastePileGroup.add(pcb2);

            const pcFan = new THREE.Group();
            const fanFrame = new THREE.Mesh(
                new RoundedBoxGeometry(0.46, 0.12, 0.46, 2, 0.02),
                ewMats.darkPlastic
            );
            const fanRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.18, 0.022, 10, 28),
                ewMats.applianceSilver
            );
            fanRing.rotation.x = Math.PI / 2;
            fanRing.position.y = 0.062;
            pcFan.add(fanFrame, fanRing);
            pcFan.position.set(1.56, -0.44, 0.88);
            pcFan.rotation.set(0.32, -0.35, -0.22);
            ewastePileGroup.add(pcFan);

            const brokenKb = new THREE.Group();
            const kbDeck = new THREE.Mesh(
                new RoundedBoxGeometry(1.15, 0.045, 0.42, 2, 0.012),
                ewMats.beigeRetro
            );
            brokenKb.add(kbDeck);
            const kbKeyGeo = new THREE.BoxGeometry(0.055, 0.022, 0.05);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 13; c++) {
                    if ((r * 5 + c * 3) % 4 === 0) continue;
                    const k = new THREE.Mesh(kbKeyGeo, ewMats.darkPlastic);
                    k.position.set(-0.46 + c * 0.076, 0.03, -0.11 + r * 0.078);
                    brokenKb.add(k);
                }
            }
            brokenKb.position.set(0.25, -0.28, 0.94);
            brokenKb.rotation.set(0.3, -0.18, -0.08);
            ewastePileGroup.add(brokenKb);

            // 8. KABEL-KABEL CHARGER & LISTRIK (PUTIH, MERAH, KUNING, HITAM)
            const cableSpecs = [
                {
                    mat: ewMats.cableWhite,
                    r: 0.016,
                    pts: [
                        [0.46, -0.46, 1.35],
                        [0.34, -0.52, 1.56],
                        [-0.05, -0.58, 1.65],
                        [-0.42, -0.56, 1.54]
                    ]
                },
                {
                    mat: ewMats.cableWhite,
                    r: 0.015,
                    pts: [
                        [-0.66, -0.52, 1.42],
                        [-0.86, -0.56, 1.64],
                        [-1.24, -0.58, 1.62],
                        [-1.56, -0.56, 1.46]
                    ]
                },
                {
                    mat: ewMats.cableBlack,
                    r: 0.022,
                    pts: [
                        [-1.12, -0.32, 1.02],
                        [-1.38, -0.42, 1.28],
                        [-1.68, -0.52, 1.18],
                        [-1.85, -0.58, 0.85]
                    ]
                },
                {
                    mat: ewMats.cableRed,
                    r: 0.014,
                    pts: [
                        [-0.68, -0.24, 0.94],
                        [-0.32, -0.34, 1.22],
                        [0.18, -0.42, 1.28],
                        [0.64, -0.38, 1.15]
                    ]
                },
                {
                    mat: ewMats.cableYellow,
                    r: 0.014,
                    pts: [
                        [1.22, -0.22, 0.86],
                        [1.38, -0.38, 1.16],
                        [1.12, -0.52, 1.48],
                        [0.78, -0.58, 1.62]
                    ]
                },
                {
                    mat: ewMats.cableBlack,
                    r: 0.02,
                    pts: [
                        [1.56, -0.36, 0.34],
                        [1.82, -0.48, 0.68],
                        [1.76, -0.58, 1.12],
                        [1.45, -0.60, 1.42]
                    ]
                }
            ];

            cableSpecs.forEach((cfg) => {
                const curve = new THREE.CatmullRomCurve3(
                    cfg.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
                );
                const tube = new THREE.Mesh(
                    new THREE.TubeGeometry(curve, 36, cfg.r, 8, false),
                    cfg.mat
                );
                ewastePileGroup.add(tube);
            });

            macbookRoot.add(ewastePileGroup);

            const screenCenterY = hingeY + lidH / 2 + 0.015;
            const screenCenterZ = -baseD / 2 + lidThick + 0.003;

            // Jarak kamera akhir yang membuat layar tepat memenuhi seluruh tampilan (tanpa bezel / tepi laptop)
            function exactDiveZ() {
                const asp = container.clientWidth / Math.max(container.clientHeight, 1);
                const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
                const dH = dispH / (2 * t);
                const dW = dispW / (2 * t * asp);
                return screenCenterZ + Math.min(dH, dW) * 0.997;
            }

            let currentProgress = 0;
            let renderActive = false;
            let animationFrameId = 0;
            const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };

            window.addEventListener("pointermove", (e) => {
                pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
                pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
            }, { passive: true });

            window.addEventListener("touchmove", (e) => {
                if (!e.touches || !e.touches[0]) return;
                pointer.x = ((e.touches[0].clientX / window.innerWidth) * 2 - 1) * 0.65;
                pointer.y = (-(e.touches[0].clientY / window.innerHeight) * 2 + 1) * 0.65;
            }, { passive: true });

            window.addEventListener("resize", () => {
                camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
                camera.updateProjectionMatrix();
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.5));
                renderer.setSize(container.clientWidth, container.clientHeight);
                camMetrics = getResponsiveCameraMetrics();
            });

            const smoothstep = (min, max, val) => {
                const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
                return x * x * (3 - 2 * x);
            };

            const desktopEl = document.getElementById('laptop-desktop');
            function positionDesktop() {
                const handheld = window.innerWidth < 768;
                desktopEl.classList.toggle('handheld', handheld);
                const visible = currentProgress > (handheld ? .70 : .45) && !window.macbookScrollState?.selected;
                desktopEl.style.visibility = visible ? 'visible' : 'hidden';
                desktopEl.inert = !visible;
                if (!visible) return;
                if (handheld) { desktopEl.style.transform = 'none'; return; }
                scene.updateMatrixWorld(true);
                camera.updateMatrixWorld(true);
                const points = [[-1,1],[1,1],[1,-1],[-1,-1]].map(([x,y]) => {
                    const v = display.localToWorld(new THREE.Vector3(x * dispW/2,y * dispH/2,.001)).project(camera);
                    return [(v.x+1)*container.clientWidth/2,(1-v.y)*container.clientHeight/2];
                });
                const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = points;
                const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3;
                const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3;
                const den=dx1*dy2-dx2*dy1;
                if(Math.abs(den)<.00001)return;
                const g=(dx3*dy2-dx2*dy3)/den, h=(dx1*dy3-dx3*dy1)/den;
                desktopEl.style.transform=`matrix3d(${(x1-x0+g*x1)/1000},${(y1-y0+g*y1)/1000},0,${g/1000},${(x3-x0+h*x3)/668},${(y3-y0+h*y3)/668},0,${h/668},0,0,1,0,${x0},${y0},0,1)`;
            }

            function animate() {
                animationFrameId = 0;
                if (!renderActive) return;
                animationFrameId = requestAnimationFrame(animate);

                const target = window.macbookScrollState ? window.macbookScrollState.targetProgress : 0;
                currentProgress += (target - currentProgress) * 0.12;
                pointer.smoothX += (pointer.x - pointer.smoothX) * 0.06;
                pointer.smoothY += (pointer.y - pointer.smoothY) * 0.06;

                // Fase 1: Membuka engsel layar MacBook
                const openFactor = smoothstep(0.04, 0.52, currentProgress);
                // Fase 2: Zoom menembus layar ke Section 4 (#krisis-hero)
                const diveFactor = smoothstep(0.52, 0.96, currentProgress);

                const openAngle = THREE.MathUtils.lerp(Math.PI / 2, -0.18, openFactor);
                lidPivot.rotation.x = THREE.MathUtils.lerp(openAngle, 0.0, diveFactor);

                screenMaterial.emissiveIntensity = smoothstep(0.12, 0.45, currentProgress) * (screenMaterial.userData.full ? 1.0 : 0.95);

                const centerAlign = smoothstep(0.0, 0.58, currentProgress);
                const parallaxDamp = 1 - diveFactor;
                macbookRoot.rotation.y =
                    THREE.MathUtils.lerp(-0.42, 0, centerAlign) + pointer.smoothX * 0.08 * parallaxDamp;
                macbookRoot.rotation.x =
                    THREE.MathUtils.lerp(0.14, 0, centerAlign) - pointer.smoothY * 0.05 * parallaxDamp;

                camera.position.x = THREE.MathUtils.lerp(camMetrics.overviewX, 0, centerAlign);
                camera.position.y = THREE.MathUtils.lerp(camMetrics.overviewY, screenCenterY, diveFactor);
                camera.position.z = THREE.MathUtils.lerp(camMetrics.overviewZ, exactDiveZ(), diveFactor);

                const lookY = THREE.MathUtils.lerp(0.34, screenCenterY, smoothstep(0.05, 0.75, currentProgress));
                const lookZ = THREE.MathUtils.lerp(0, screenCenterZ, diveFactor);
                camera.lookAt(0, lookY, lookZ);

                positionDesktop();
                renderer.render(scene, camera);
            }

            const renderObserver = new IntersectionObserver((entries) => {
                renderActive = entries.some((entry) => entry.isIntersecting);
                if (renderActive && !animationFrameId) {
                    animationFrameId = requestAnimationFrame(animate);
                } else if (!renderActive && animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = 0;
                }
            });
            renderObserver.observe(container);
        }
    