// --- 1. SETUP & THREE.JS LOGIC ---
const isMobile = window.innerWidth < 768;
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
if(isMobile) { camera.position.set(0, 6, 22); } 
else { camera.position.set(0, 5, 15); }

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
container.appendChild(renderer.domElement);

const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85 
);
bloomPass.threshold = 0;
bloomPass.strength = isMobile ? 1.2 : 1.5;
bloomPass.radius = 0.5;

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}
const particleTexture = createParticleTexture();

const treeGroup = new THREE.Group();
scene.add(treeGroup);
const particleCount = isMobile ? 1500 : 2500;
const geometry = new THREE.BufferGeometry();
const positions = []; const colors = []; const sizes = [];
const colorInside = new THREE.Color('#ff0080'); 
const colorOutside = new THREE.Color('#ffb3e6'); 

for (let i = 0; i < particleCount; i++) {
    const angle = i * 0.15; 
    const radius = 5 * (1 - i / particleCount); 
    const y = (i / particleCount) * 12 - 6; 
    const x = Math.cos(angle) * radius + (Math.random()-0.5)*0.5;
    const z = Math.sin(angle) * radius + (Math.random()-0.5)*0.5;
    positions.push(x, y + (Math.random()-0.5)*0.5, z);
    const mixedColor = colorInside.clone().lerp(colorOutside, Math.random());
    colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    sizes.push(Math.random() * 2);
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

const material = new THREE.PointsMaterial({
    size: 0.2, vertexColors: true, map: particleTexture,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8
});
const tree = new THREE.Points(geometry, material);
treeGroup.add(tree);

const groundGeo = new THREE.BufferGeometry();
const groundPos = [];
const groundCount = isMobile ? 500 : 1000;
for(let i=0; i<groundCount; i++) {
    const r = Math.random() * 15; 
    const theta = Math.random() * Math.PI * 2;
    groundPos.push(r * Math.cos(theta), -6 + (Math.random()-0.5)*0.5, r * Math.sin(theta));
}
groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(groundPos, 3));
const groundMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, map: particleTexture,
    transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
});
scene.add(new THREE.Points(groundGeo, groundMat));

const starGeo = new THREE.SphereGeometry(0.3, 16, 16);
const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
star.position.set(0, 6.2, 0);
treeGroup.add(star);
const starGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({
        map: particleTexture, color: 0xffddff, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    })
);
starGlow.position.set(0, 6.2, 0);
treeGroup.add(starGlow);

const snowCount = isMobile ? 500 : 1000;
const snowGeo = new THREE.BufferGeometry();
const snowPos = [];
for(let i=0; i<snowCount; i++) {
    snowPos.push((Math.random()-0.5)*40, (Math.random()-0.5)*40, (Math.random()-0.5)*40);
}
snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snowPos, 3));
const snowSystem = new THREE.Points(snowGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, map: particleTexture, transparent: true, opacity: 0.6, depthWrite: false
}));
scene.add(snowSystem);

const clock = new THREE.Clock();
let mouseX = 0; let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});
document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    mouseX = (touch.clientX / window.innerWidth) - 0.5;
    mouseY = (touch.clientY / window.innerHeight) - 0.5;
}, { passive: true });

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    treeGroup.rotation.y = elapsedTime * 0.15; 
    const scale = 1 + Math.sin(elapsedTime * 2) * 0.02;
    tree.scale.set(scale, scale, scale);
    starGlow.lookAt(camera.position);

    const snowPositions = snowSystem.geometry.attributes.position.array;
    for(let i = 1; i < snowPositions.length; i+=3) {
        snowPositions[i] -= 0.05; 
        if(snowPositions[i] < -20) snowPositions[i] = 20; 
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;
    
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 2 + (isMobile ? 6 : 5) - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    composer.render();
}

// --- 5. LOGIC KỂ CHUYỆN & TƯƠNG TÁC ---

let storyTimeline; // Biến toàn cục để quản lý timeline

function startStory() {
    // 1. Nếu đang có timeline chạy dở thì hủy nó
    if (storyTimeline) storyTimeline.kill();

    // 2. RESET TRẠNG THÁI
    // Ẩn toàn bộ text
    gsap.set(".text-container", { autoAlpha: 0, scale: 0.9, y: 0, filter: "blur(0px)" });
    
    // Đưa Memory Card về giữa màn hình và ẩn đi
    const card = document.getElementById('memory-card');
    const note = document.getElementById('memory-note');
    card.classList.remove('minimized'); 
    
    gsap.set("#memory-card", {
        autoAlpha: 0, 
        scale: 0.8,
        top: "50%", left: "50%", 
        right: "auto", bottom: "auto", 
        xPercent: -50, yPercent: -50 
    });
    gsap.set("#memory-note", { opacity: 1 }); 

    // 3. TẠO TIMELINE MỚI
    storyTimeline = gsap.timeline();

    // Scene 1
    storyTimeline.to("#scene-1", { autoAlpha: 1, scale: 1, duration: 1.5 })
                 .to("#scene-1", { autoAlpha: 0, scale: 1.1, filter: "blur(10px)", duration: 1.5, delay: 2.5 });

    // Scene 2
    storyTimeline.to("#scene-2", { autoAlpha: 1, scale: 1, duration: 1.5 })
                 .to("#scene-2", { autoAlpha: 0, y: -20, filter: "blur(10px)", duration: 1.5, delay: 2.5 });
    // Scene 2-5
    storyTimeline.to("#scene-2-5", { autoAlpha: 1, scale: 1, duration: 1.5 })
                 .to("#scene-2-5", { autoAlpha: 0, y: -20, filter: "blur(10px)", duration: 1.5, delay: 2.5 });
    // Scene 3
    storyTimeline.to("#scene-3", { autoAlpha: 1, scale: 1, duration: 1.5 })
                 .to("#scene-3", { autoAlpha: 0, duration: 1, delay: 2.5 }) 
    
    // Hiện ảnh ở giữa màn hình
                 .to("#memory-card", { 
                     autoAlpha: 1, 
                     scale: 1, 
                     duration: 1.5, 
                     ease: "power2.out" 
                 })
      
    // Đợi 3s ngắm ảnh rồi thu nhỏ về góc phải
                 .add(() => {
                     gsap.to("#memory-card", {
                         top: "auto",      
                         bottom: "30px",   
                         left: "auto",     
                         right: "20px",    
                         xPercent: 0,      
                         yPercent: 0,      
                         scale: 0.35,      
                         duration: 2,
                         ease: "power2.inOut",
                         onComplete: () => {
                             card.classList.add('minimized');
                             gsap.to(note, { opacity: 0, duration: 0.5 });
                         }
                     });
                 }, "+=3");
}

// --- SỰ KIỆN CLICK ---
const cardElement = document.getElementById('memory-card');

cardElement.addEventListener('click', () => {
    // Nếu card đang ở trạng thái thu nhỏ (đã chạy xong story)
    if (cardElement.classList.contains('minimized')) {
        // CHẠY LẠI CÂU CHUYỆN TỪ ĐẦU
        startStory();
    }
});

// --- KHỞI CHẠY ---
window.onload = () => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.style.display = 'none';
        animate();
        startStory();
    }, 1000);
};

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});