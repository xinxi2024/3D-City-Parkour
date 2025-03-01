// 游戏变量
let scene, camera, renderer, player;
let buildings = [];
let obstacles = [];
let coins = [];
let powerups = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let coinCount = 0;
let playerSpeed = 0.2;
let playerBaseSpeed = 0.2; // 基础速度
let playerBoostSpeed = 0.35; // 加速速度
let speedIncreaseRate = 0.00005; // 速度增加率
let maxPlayerBaseSpeed = 0.4; // 最大基础速度
let maxPlayerBoostSpeed = 0.6; // 最大加速速度
let jumpForce = 0.15;
let gravity = 0.005;
let isJumping = false;
let velocity = 0;
let roadWidth = 10;
let roadLength = 1000;
let buildingColors = [0x4d4dff, 0x4da6ff, 0x4dffff, 0xff4d4d, 0xffff4d];
let moveLeft = false;
let moveRight = false;
let isBoost = false; // 是否加速
let isPaused = false;
let difficulty = 'normal';
let activePowerup = null;
let powerupTimer = 0;
let powerupDuration = 10; // 能量道具持续10秒
let runningAnimation = 0; // 跑步动画计时器
let touchStartX = 0; // 触摸开始X坐标
let touchStartY = 0; // 触摸开始Y坐标

// 初始化游戏
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 天蓝色背景

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);
    camera.lookAt(0, 0, 10);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 添加事件监听器
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // 移动设备触摸控制
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    
    // 重新开始按钮
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // 暂停菜单按钮
    document.getElementById('resumeButton').addEventListener('click', resumeGame);
    document.getElementById('quitButton').addEventListener('click', quitGame);

    // 难度选择按钮
    document.querySelectorAll('.difficultyBtn').forEach(button => {
        button.addEventListener('click', () => {
            difficulty = button.dataset.difficulty;
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('instructions').style.display = 'block';
            document.getElementById('score').style.display = 'block';
            document.getElementById('coinCounter').style.display = 'block';
            
            // 根据难度设置游戏参数
            switch(difficulty) {
                case 'easy':
                    playerSpeed = 0.15;
                    playerBaseSpeed = 0.15;
                    playerBoostSpeed = 0.25;
                    maxPlayerBaseSpeed = 0.3;
                    maxPlayerBoostSpeed = 0.5;
                    speedIncreaseRate = 0.00003;
                    jumpForce = 0.12;
                    break;
                case 'normal':
                    playerSpeed = 0.2;
                    playerBaseSpeed = 0.2;
                    playerBoostSpeed = 0.35;
                    maxPlayerBaseSpeed = 0.4;
                    maxPlayerBoostSpeed = 0.6;
                    speedIncreaseRate = 0.00005;
                    jumpForce = 0.15;
                    break;
                case 'hard':
                    playerSpeed = 0.25;
                    playerBaseSpeed = 0.25;
                    playerBoostSpeed = 0.45;
                    maxPlayerBaseSpeed = 0.5;
                    maxPlayerBoostSpeed = 0.7;
                    speedIncreaseRate = 0.00007;
                    jumpForce = 0.18;
                    break;
            }

            // 创建游戏场景
            createRoad();
            createBuildings();
            createPlayer();
            createObstacles();
            createCoins();
            createPowerups();

            // 开始游戏
            gameStarted = true;
            animate();
        });
    });
}

// 创建金币
function createCoins() {
    for (let i = 0; i < 100; i++) {
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 1,
            roughness: 0.3,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });
        const coin = new THREE.Mesh(geometry, material);
        
        // 随机位置
        const z = 20 + i * (10 + Math.random() * 20);
        const x = (Math.random() - 0.5) * (roadWidth - 2);
        coin.position.set(x, 1, z);
        coin.rotation.x = Math.PI / 2;
        
        scene.add(coin);
        coins.push(coin);
    }
}

// 创建能量道具
function createPowerups() {
    const powerupTypes = ['speed', 'jump', 'invincible'];
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00FF00,
            emissiveIntensity: 0.5
        });
        const powerup = new THREE.Mesh(geometry, material);
        
        // 随机位置和类型
        const z = 50 + i * (50 + Math.random() * 50);
        const x = (Math.random() - 0.5) * (roadWidth - 2);
        powerup.position.set(x, 1, z);
        powerup.userData.type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        scene.add(powerup);
        powerups.push(powerup);
    }
}

// 暂停游戏
function pauseGame() {
    isPaused = true;
    document.getElementById('pauseMenu').style.display = 'block';
}

// 继续游戏
function resumeGame() {
    isPaused = false;
    document.getElementById('pauseMenu').style.display = 'none';
}

// 退出游戏
function quitGame() {
    location.reload();
}

// 创建道路
function createRoad() {
    const roadGeometry = new THREE.BoxGeometry(roadWidth, 0.5, roadLength);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, -0.25, roadLength / 2);
    scene.add(road);

    // 添加路面标记
    const lineGeometry = new THREE.BoxGeometry(0.5, 0.1, roadLength);
    const lineMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, 0, roadLength / 2);
    scene.add(line);
}

// 创建建筑物
function createBuildings() {
    for (let i = 0; i < 50; i++) {
        // 左侧建筑
        createBuilding(-(roadWidth / 2 + 5 + Math.random() * 10), 0, i * 40);
        
        // 右侧建筑
        createBuilding(roadWidth / 2 + 5 + Math.random() * 10, 0, i * 40);
    }
}

// 创建单个建筑物
function createBuilding(x, y, z) {
    const width = 5 + Math.random() * 10;
    const height = 10 + Math.random() * 40;
    const depth = 5 + Math.random() * 10;
    
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)] 
    });
    
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, y + height / 2, z);
    scene.add(building);
    buildings.push(building);
    
    // 添加窗户
    addWindows(building, width, height, depth);
}

// 为建筑物添加窗户
function addWindows(building, width, height, depth) {
    const windowSize = 0.8;
    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
    const windowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    
    const windowSpacing = 2;
    const startX = -width / 2 + windowSize;
    const startY = -height / 2 + windowSize * 2;
    
    // 前面
    for (let y = startY; y < height / 2; y += windowSpacing) {
        for (let x = startX; x < width / 2; x += windowSpacing) {
            if (Math.random() > 0.3) { // 随机生成一些窗户
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(x, y, depth / 2 + 0.1);
                building.add(windowMesh);
            }
        }
    }
    
    // 后面
    for (let y = startY; y < height / 2; y += windowSpacing) {
        for (let x = startX; x < width / 2; x += windowSpacing) {
            if (Math.random() > 0.3) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(x, y, -depth / 2 - 0.1);
                windowMesh.rotation.y = Math.PI;
                building.add(windowMesh);
            }
        }
    }
    
    // 左侧
    for (let y = startY; y < height / 2; y += windowSpacing) {
        for (let z = -depth / 2 + windowSize; z < depth / 2; z += windowSpacing) {
            if (Math.random() > 0.3) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(-width / 2 - 0.1, y, z);
                windowMesh.rotation.y = -Math.PI / 2;
                building.add(windowMesh);
            }
        }
    }
    
    // 右侧
    for (let y = startY; y < height / 2; y += windowSpacing) {
        for (let z = -depth / 2 + windowSize; z < depth / 2; z += windowSpacing) {
            if (Math.random() > 0.3) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(width / 2 + 0.1, y, z);
                windowMesh.rotation.y = Math.PI / 2;
                building.add(windowMesh);
            }
        }
    }
}

// 创建玩家
function createPlayer() {
    // 创建玩家身体
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3366ff,
        shininess: 30,
        specular: 0x111111
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.25, 0);
    
    // 创建玩家头部 - 使用更圆滑的几何体
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffddcc,
        shininess: 50,
        specular: 0x222222
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.9, 0);
    
    // 添加头发
    const hairGeometry = new THREE.BoxGeometry(0.45, 0.2, 0.45);
    const hairMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        shininess: 10
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.3, 0);
    head.add(hair);
    
    // 创建更精细的眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const eyeWhiteGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.15, 0.05, 0.3);
    head.add(leftEyeWhite);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.05, 0.38);
    head.add(leftEye);
    
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.15, 0.05, 0.3);
    head.add(rightEyeWhite);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.05, 0.38);
    head.add(rightEye);
    
    // 创建嘴巴
    const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.15, 0.3);
    head.add(mouth);
    
    // 创建玩家手臂和腿 - 使用圆柱体使其更圆滑
    const limbMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2255dd,
        shininess: 30,
        specular: 0x111111
    });
    
    // 左臂
    const leftArmGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const leftArm = new THREE.Mesh(leftArmGeometry, limbMaterial);
    leftArm.position.set(-0.5, 1.3, 0);
    leftArm.rotation.z = Math.PI / 16;
    
    // 右臂
    const rightArmGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const rightArm = new THREE.Mesh(rightArmGeometry, limbMaterial);
    rightArm.position.set(0.5, 1.3, 0);
    rightArm.rotation.z = -Math.PI / 16;
    
    // 左腿
    const leftLegGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const leftLeg = new THREE.Mesh(leftLegGeometry, limbMaterial);
    leftLeg.position.set(-0.3, 0.4, 0);
    
    // 右腿
    const rightLegGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16);
    const rightLeg = new THREE.Mesh(rightLegGeometry, limbMaterial);
    rightLeg.position.set(0.3, 0.4, 0);
    
    // 创建鞋子
    const shoeGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
    const shoeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    
    const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    leftShoe.position.set(0, -0.4, 0.05);
    leftLeg.add(leftShoe);
    
    const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
    rightShoe.position.set(0, -0.4, 0.05);
    rightLeg.add(rightShoe);
    
    // 组合成玩家模型
    player = new THREE.Group();
    player.add(body);
    player.add(head);
    player.add(leftArm);
    player.add(rightArm);
    player.add(leftLeg);
    player.add(rightLeg);
    
    // 保存四肢引用以便动画
    player.userData.leftArm = leftArm;
    player.userData.rightArm = rightArm;
    player.userData.leftLeg = leftLeg;
    player.userData.rightLeg = rightLeg;
    
    player.position.set(0, 0, 0);
    player.userData.height = 2;
    player.userData.width = 0.8;
    player.userData.depth = 0.5;
    
    scene.add(player);
}

// 创建障碍物
function createObstacles() {
    for (let i = 0; i < 50; i++) {
        // 随机决定障碍物类型和位置
        const z = 20 + i * (20 + Math.random() * 30);
        const x = (Math.random() - 0.5) * (roadWidth - 2);
        
        // 随机选择障碍物类型 (路障、跳跃台、墙壁等)
        const type = Math.floor(Math.random() * 3);
        
        let obstacle;
        
        if (type === 0) {
            // 路障
            const geometry = new THREE.BoxGeometry(2, 1, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
            obstacle = new THREE.Mesh(geometry, material);
            obstacle.userData.type = 'barrier';
            obstacle.userData.width = 2;
            obstacle.userData.height = 1;
            obstacle.userData.depth = 1;
        } else if (type === 1) {
            // 低墙
            const geometry = new THREE.BoxGeometry(3, 2, 0.5);
            const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
            obstacle = new THREE.Mesh(geometry, material);
            obstacle.userData.type = 'wall';
            obstacle.userData.width = 3;
            obstacle.userData.height = 2;
            obstacle.userData.depth = 0.5;
        } else {
            // 高墙
            const geometry = new THREE.BoxGeometry(2, 3, 0.5);
            const material = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
            obstacle = new THREE.Mesh(geometry, material);
            obstacle.userData.type = 'highWall';
            obstacle.userData.width = 2;
            obstacle.userData.height = 3;
            obstacle.userData.depth = 0.5;
        }
        
        obstacle.position.set(x, obstacle.userData.height / 2, z);
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

// 检测碰撞
function checkCollisions() {
    if (gameOver) return;
    
    const playerBox = new THREE.Box3().setFromObject(player);
    
    // 检测与障碍物的碰撞
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        
        if (playerBox.intersectsBox(obstacleBox)) {
            // 如果有无敌能量道具，则不会碰撞
            if (activePowerup === 'invincible') {
                // 移除障碍物
                scene.remove(obstacle);
                obstacles.splice(i, 1);
                i--;
                // 加分
                score += 5;
            } else {
                endGame();
                return;
            }
        }
    }
    
    // 检测与金币的碰撞
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        const coinBox = new THREE.Box3().setFromObject(coin);
        
        if (playerBox.intersectsBox(coinBox)) {
            // 收集金币
            scene.remove(coin);
            coins.splice(i, 1);
            i--;
            
            // 增加金币计数和分数
            coinCount++;
            score += 10;
            document.getElementById('coinCounter').textContent = `金币: ${coinCount}`;
        }
    }
    
    // 检测与能量道具的碰撞
    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        const powerupBox = new THREE.Box3().setFromObject(powerup);
        
        if (playerBox.intersectsBox(powerupBox)) {
            // 获取能量道具
            activePowerup = powerup.userData.type;
            powerupTimer = 0;
            
            // 显示能量道具提示
            const powerupIndicator = document.querySelector('.powerup-indicator');
            const powerupType = document.getElementById('powerupType');
            
            switch(activePowerup) {
                case 'speed':
                    powerupType.textContent = '加速 (10秒)';
                    playerSpeed *= 1.5;
                    playerBaseSpeed *= 1.5;
                    playerBoostSpeed *= 1.5;
                    break;
                case 'jump':
                    powerupType.textContent = '超级跳跃 (10秒)';
                    jumpForce *= 1.5;
                    break;
                case 'invincible':
                    powerupType.textContent = '无敌 (10秒)';
                    // 玩家模型发光效果
                    player.traverse(child => {
                        if (child.isMesh) {
                            child.material.emissive = new THREE.Color(0xffff00);
                            child.material.emissiveIntensity = 0.5;
                        }
                    });
                    break;
            }
            
            powerupIndicator.style.display = 'block';
            
            // 移除能量道具
            scene.remove(powerup);
            powerups.splice(i, 1);
            i--;
        }
    }
    
    // 检查是否掉出道路
    if (Math.abs(player.position.x) > roadWidth / 2) {
        endGame();
        return;
    }
}

// 更新游戏状态
function update() {
    if (!gameStarted || gameOver || isPaused) return;
    
    // 随着时间逐渐增加速度
    if (playerBaseSpeed < maxPlayerBaseSpeed) {
        playerBaseSpeed += speedIncreaseRate;
        playerBoostSpeed = playerBaseSpeed * 1.75; // 保持加速速度为基础速度的1.75倍
    }
    
    // 自动向前移动
    player.position.z += isBoost ? playerBoostSpeed : playerBaseSpeed;
    // 增加得分
    score += isBoost ? playerBoostSpeed : playerBaseSpeed;
    document.getElementById('score').textContent = `分数: ${Math.floor(score)}`;
    
    // 移动玩家 - A和D键功能互换
    if (moveLeft) {
        player.position.x += playerSpeed; // 向右移动
    }
    if (moveRight) {
        player.position.x -= playerSpeed; // 向左移动
    }
    
    // 处理跳跃
    if (isJumping) {
        velocity -= gravity;
        player.position.y += velocity;
        
        // 着陆检测
        if (player.position.y <= 0) {
            player.position.y = 0;
            isJumping = false;
            velocity = 0;
        }
    }
    
    // 处理能量道具计时
    if (activePowerup) {
        powerupTimer += 0.016; // 大约每帧16毫秒
        
        // 更新能量道具剩余时间显示
        const remainingTime = Math.ceil(powerupDuration - powerupTimer);
        document.getElementById('powerupType').textContent = `${getPowerupName(activePowerup)} (${remainingTime}秒)`;
        
        // 能量道具时间结束
        if (powerupTimer >= powerupDuration) {
            // 重置能量道具效果
            switch(activePowerup) {
                case 'speed':
                    playerSpeed /= 1.5;
                    playerBaseSpeed /= 1.5;
                    playerBoostSpeed /= 1.5;
                    break;
                case 'jump':
                    jumpForce /= 1.5;
                    break;
                case 'invincible':
                    // 移除玩家发光效果
                    player.traverse(child => {
                        if (child.isMesh) {
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;
                        }
                    });
                    break;
            }
            
            // 隐藏能量道具提示
            document.querySelector('.powerup-indicator').style.display = 'none';
            activePowerup = null;
            powerupTimer = 0;
        }
    }
    
    // 移动相机跟随玩家
    camera.position.x = player.position.x;
    camera.position.z = player.position.z - 10;
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z + 10);
    
    // 检测碰撞
    checkCollisions();
    
    // 旋转金币效果
    coins.forEach(coin => {
        coin.rotation.z += 0.02;
    });
    
    // 旋转能量道具效果
    powerups.forEach(powerup => {
        powerup.rotation.y += 0.02;
        powerup.position.y = 1 + Math.sin(Date.now() * 0.002) * 0.2; // 上下浮动
    });
    
    // 更新跑步动画
    updateRunningAnimation();
}

// 跑步动画
function updateRunningAnimation() {
    if (!player.userData.leftLeg || !player.userData.rightLeg || 
        !player.userData.leftArm || !player.userData.rightArm) return;
    
    runningAnimation += isBoost ? 0.2 : 0.15;
    
    // 腿部摆动
    player.userData.leftLeg.rotation.x = Math.sin(runningAnimation) * 0.5;
    player.userData.rightLeg.rotation.x = Math.sin(runningAnimation + Math.PI) * 0.5;
    
    // 手臂摆动
    player.userData.leftArm.rotation.x = Math.sin(runningAnimation + Math.PI) * 0.5;
    player.userData.rightArm.rotation.x = Math.sin(runningAnimation) * 0.5;
    
    // 跳跃时固定姿势
    if (isJumping) {
        player.userData.leftLeg.rotation.x = -0.3;
        player.userData.rightLeg.rotation.x = -0.3;
        player.userData.leftArm.rotation.x = -0.5;
        player.userData.rightArm.rotation.x = -0.5;
    }
}

// 获取能量道具名称
function getPowerupName(type) {
    switch(type) {
        case 'speed':
            return '加速';
        case 'jump':
            return '超级跳跃';
        case 'invincible':
            return '无敌';
        default:
            return '未知';
    }
}

// 游戏结束
function endGame() {
    gameOver = true;
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('finalCoins').textContent = coinCount;
    document.getElementById('gameOver').style.display = 'block';
    
    // 如果有激活的能量道具，重置效果
    if (activePowerup) {
        switch(activePowerup) {
            case 'speed':
                playerSpeed /= 1.5;
                playerBaseSpeed /= 1.5;
                playerBoostSpeed /= 1.5;
                break;
            case 'jump':
                jumpForce /= 1.5;
                break;
            case 'invincible':
                // 移除玩家发光效果
                player.traverse(child => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                });
                break;
        }
        
        // 隐藏能量道具提示
        document.querySelector('.powerup-indicator').style.display = 'none';
        activePowerup = null;
        powerupTimer = 0;
    }
}

// 重新开始游戏
function restartGame() {
    // 重置游戏状态
    score = 0;
    coinCount = 0;
    document.getElementById('score').textContent = `分数: ${score}`;
    document.getElementById('coinCounter').textContent = `金币: ${coinCount}`;
    document.getElementById('gameOver').style.display = 'none';
    
    // 重置玩家位置
    player.position.set(0, 0, 0);
    
    // 移除旧的障碍物
    for (let i = 0; i < obstacles.length; i++) {
        scene.remove(obstacles[i]);
    }
    obstacles = [];
    
    // 移除旧的金币
    for (let i = 0; i < coins.length; i++) {
        scene.remove(coins[i]);
    }
    coins = [];
    
    // 移除旧的能量道具
    for (let i = 0; i < powerups.length; i++) {
        scene.remove(powerups[i]);
    }
    powerups = [];
    
    // 创建新的游戏元素
    createObstacles();
    createCoins();
    createPowerups();
    
    // 根据难度重置游戏参数
    switch(difficulty) {
        case 'easy':
            playerSpeed = 0.15;
            playerBaseSpeed = 0.15;
            playerBoostSpeed = 0.25;
            maxPlayerBaseSpeed = 0.3;
            maxPlayerBoostSpeed = 0.5;
            speedIncreaseRate = 0.00003;
            jumpForce = 0.12;
            break;
        case 'normal':
            playerSpeed = 0.2;
            playerBaseSpeed = 0.2;
            playerBoostSpeed = 0.35;
            maxPlayerBaseSpeed = 0.4;
            maxPlayerBoostSpeed = 0.6;
            speedIncreaseRate = 0.00005;
            jumpForce = 0.15;
            break;
        case 'hard':
            playerSpeed = 0.25;
            playerBaseSpeed = 0.25;
            playerBoostSpeed = 0.45;
            maxPlayerBaseSpeed = 0.5;
            maxPlayerBoostSpeed = 0.7;
            speedIncreaseRate = 0.00007;
            jumpForce = 0.18;
            break;
    }
    
    // 重新开始游戏
    gameOver = false;
    gameStarted = true;
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    update();
    renderer.render(scene, camera);
}

// 窗口大小改变事件处理
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 键盘按下事件处理
function onKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            isBoost = true;
            break;
        case 'a':
            moveLeft = true; // A键控制向右
            break;
        case 'd':
            moveRight = true; // D键控制向左
            break;
        case ' ':
            // 跳跃
            if (!isJumping) {
                isJumping = true;
                velocity = jumpForce;
            }
            break;
        case 'p':
            // 暂停/继续游戏
            if (gameStarted && !gameOver) {
                isPaused = !isPaused;
                if (isPaused) {
                    pauseGame();
                } else {
                    resumeGame();
                }
            }
            break;
    }
}

// 键盘抬起事件处理
function onKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            isBoost = false;
            break;
        case 'a':
            moveLeft = false; // A键控制向右
            break;
        case 'd':
            moveRight = false; // D键控制向左
            break;
    }
}

// 触摸开始事件处理
function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    const screenHeight = window.innerHeight;
    
    // 屏幕上半部分控制跳跃
    if (touchStartY < screenHeight / 2) {
        if (!isJumping) {
            isJumping = true;
            velocity = jumpForce;
        }
    } else {
        // 下半部分加速
        isBoost = true;
    }
}

// 触摸移动事件处理
function onTouchMove(event) {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const currentX = touch.clientX;
        const deltaX = currentX - touchStartX;
        
        // 根据滑动方向移动角色
        if (deltaX > 10) { // 向右滑动
            moveLeft = true;  // 向右移动（互换后）
            moveRight = false;
        } else if (deltaX < -10) { // 向左滑动
            moveRight = true; // 向左移动（互换后）
            moveLeft = false;
        }
        
        // 更新触摸位置，使滑动更流畅
        if (Math.abs(deltaX) > 30) {
            touchStartX = currentX;
        }
    }
}

// 触摸结束事件处理
function onTouchEnd(event) {
    moveLeft = false;
    moveRight = false;
    isBoost = false;
}

// 启动游戏
init();