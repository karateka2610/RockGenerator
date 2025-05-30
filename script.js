let currentShape = 'redonda';
let rockDataForSchem = null; 

const SimplexNoise = (function() { 
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0); const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const F3 = 1.0 / 3.0; const G3 = 1.0 / 6.0;
    const grad3 = new Float32Array([1,1,0, -1,1,0, 1,-1,0, -1,-1,0, 1,0,1, -1,0,1, 1,0,-1, -1,0,-1, 0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1]);
    let p_ = new Uint8Array(256); // Renombrado para evitar conflicto si 'p' se usa globalmente
    for(let i=0; i<256; i++) p_[i] = i;
    for(let i=255; i>0; i--) { let r = Math.floor(Math.random()*(i+1)); let P_ = p_[i]; p_[i] = p_[r]; p_[r] = P_; }
    
    let perm = new Uint8Array(512); 
    let permMod12 = new Uint8Array(512);
    
    function reseed(prngFunc) {
        const prng = typeof prngFunc === 'function' ? prngFunc : Math.random;
        p_ = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p_[i] = i;
        for (let i = 255; i > 0; i--) {
            let R = Math.floor(prng() * (i + 1));
            let P_ = p_[i]; p_[i] = p_[R]; p_[R] = P_;
        }
        for (let i = 0; i < 512; i++) {
            perm[i] = p_[i & 255];
            permMod12[i] = perm[i] % 12;
        }
    }
    reseed(Math.random); // Initialize with Math.random

    return class SimplexNoise {
        constructor(randomOrSeed) { // El seed puede ser una función o un número para reseeding simple
            if (typeof randomOrSeed === 'function') {
                reseed(randomOrSeed);
            } else if (typeof randomOrSeed === 'number') {
                let LCGSeed = randomOrSeed;
                const LCG = () => (LCGSeed = (1103515245 * LCGSeed + 12345) & 0x7fffffff) / 0x7fffffff;
                reseed(LCG);
            }
            // Si no se provee, usa la inicialización por defecto (Math.random)
        }
        noise3D(xin, yin, zin) {
            let n0, n1, n2, n3; 
            let s = (xin + yin + zin) * F3; 
            let i = Math.floor(xin + s); let j = Math.floor(yin + s); let k = Math.floor(zin + s);
            let t = (i + j + k) * G3; 
            let X0 = i - t; let Y0 = j - t; let Z0 = k - t;
            let x0 = xin - X0; let y0 = yin - Y0; let z0 = zin - Z0;
            let i1, j1, k1; let i2, j2, k2;
            if(x0>=y0) { if(y0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } }
            else { if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } }
            let x1 = x0 - i1 + G3; let y1 = y0 - j1 + G3; let z1 = z0 - k1 + G3;
            let x2 = x0 - i2 + 2.0 * G3; let y2 = y0 - j2 + 2.0 * G3; let z2 = z0 - k2 + 2.0 * G3;
            let x3 = x0 - 1.0 + 3.0 * G3; let y3 = y0 - 1.0 + 3.0 * G3; let z3 = z0 - 1.0 + 3.0 * G3;
            let ii = i & 255; let jj = j & 255; let kk = k & 255;
            let gi0 = permMod12[ii+perm[jj+perm[kk]]]; 
            let gi1 = permMod12[ii+i1+perm[jj+j1+perm[kk+k1]]];
            let gi2 = permMod12[ii+i2+perm[jj+j2+perm[kk+k2]]]; 
            let gi3 = permMod12[ii+1+perm[jj+1+perm[kk+1]]];
            let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0; if(t0<0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * (grad3[gi0*3]*x0 + grad3[gi0*3+1]*y0 + grad3[gi0*3+2]*z0); }
            let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1; if(t1<0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * (grad3[gi1*3]*x1 + grad3[gi1*3+1]*y1 + grad3[gi1*3+2]*z1); }
            let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2; if(t2<0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * (grad3[gi2*3]*x2 + grad3[gi2*3+1]*y2 + grad3[gi2*3+2]*z2); }
            let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3; if(t3<0) n3 = 0.0; else { t3 *= t3; n3 = t3 * t3 * (grad3[gi3*3]*x3 + grad3[gi3*3+1]*y3 + grad3[gi3*3+2]*z3); }
            return 32.0 * (n0 + n1 + n2 + n3);
        }
        noise2D(xin, yin) { return this.noise3D(xin, yin, 0.0); }
    };
})();
const simplex = new SimplexNoise(); // Usará Math.random por defecto la primera vez

let scene, camera, renderer, rockMeshGroup, currentMaterial;
const previewContainer = document.getElementById('preview-container');

function initThreeJS() { 
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, previewContainer.clientWidth / previewContainer.clientHeight, 0.1, 2000);
    camera.position.set(50, 40, 50); 
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(previewContainer.clientWidth, previewContainer.clientHeight);
    previewContainer.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(0.8, 1, 0.9).normalize();
    scene.add(directionalLight);
    rockMeshGroup = new THREE.Group();
    scene.add(rockMeshGroup);
    animate();
}

let rotationSpeed = 0.002;
function animate() { 
    requestAnimationFrame(animate);
    rockMeshGroup.rotation.y += rotationSpeed;
    rockMeshGroup.rotation.x += rotationSpeed * 0.1; 
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => { 
    if (camera && renderer) {
        camera.aspect = previewContainer.clientWidth / previewContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(previewContainer.clientWidth, previewContainer.clientHeight);
    }
});

function generateRock() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'block';
    const downloadButton = document.getElementById('downloadSchemButton');
    downloadButton.classList.remove('enabled'); 

    setTimeout(() => { 
        rockDataForSchem = { blocks: [], width: 0, height: 0, length: 0 }; 
        while (rockMeshGroup.children.length > 0) {
            const obj = rockMeshGroup.children[0]; rockMeshGroup.remove(obj); if(obj.geometry) obj.geometry.dispose();
        }
        if (currentMaterial) currentMaterial.dispose();

        const width = parseInt(document.getElementById('sizeX').value);
        const height = parseInt(document.getElementById('sizeY').value);
        const depth = parseInt(document.getElementById('sizeZ').value);
        const rockColor = new THREE.Color(document.getElementById('rockColorPicker').value);
        currentMaterial = new THREE.MeshLambertMaterial({ color: rockColor });
        
        const VOXEL_LIMIT = 150000; 
        if (width * height * depth > VOXEL_LIMIT) {
            alert(`Las dimensiones son demasiado grandes (máx. ${VOXEL_LIMIT} vóxeles). Actual: ${width*height*depth}. Por favor, reduce el tamaño.`);
            loadingDiv.style.display = 'none'; return;
        }

        const surfaceSmoothness = parseFloat(document.getElementById('surfaceSmoothness').value); 

        const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        const visualCenterX = width / 2, visualCenterY = height / 2, visualCenterZ = depth / 2;
        let blocksPlaced = 0;
        
        rockDataForSchem.width = width; rockDataForSchem.height = height; rockDataForSchem.length = depth;

        if (currentShape === 'redonda') {
            let noiseScale = parseFloat(document.getElementById('redondaNoiseScale').value);
            let deformation = parseFloat(document.getElementById('redondaDeformation').value);
            let effectiveDeformation = deformation * (1 - surfaceSmoothness * 0.8); 
            noiseScale = noiseScale + surfaceSmoothness * 0.1; 
            const baseRadius = Math.min(width, height, depth) / 2.2; 
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let z = 0; z < depth; z++) {
                let dx = x - width/2, dy = y - height/2, dz = z - depth/2;
                let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                let noiseVal = simplex.noise3D(x * noiseScale, y * noiseScale, z * noiseScale);
                let deformedRadius = baseRadius + noiseVal * baseRadius * effectiveDeformation;
                if (dist < deformedRadius && Math.random() < 0.85) {
                     rockDataForSchem.blocks.push({x,y,z});
                     const block = new THREE.Mesh(blockGeometry, currentMaterial);
                     block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                     rockMeshGroup.add(block); blocksPlaced++;
                }
            }
        } else if (currentShape === 'puntiaguda') {
            let noiseScale = parseFloat(document.getElementById('puntiagudaNoiseScale').value);
            const peakFactor = parseFloat(document.getElementById('puntiagudaPeakFactor').value);
            const baseWidthFactor = parseFloat(document.getElementById('puntiagudaBaseWidth').value);
            noiseScale = noiseScale + surfaceSmoothness * 0.05; 
            let noiseAmplitudeFactor = 5 * (1 - surfaceSmoothness * 0.7); 
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let z = 0; z < depth; z++) {
                let yNorm = y / (height -1 || 1); 
                let effectiveRadius = (Math.max(width, depth) / 2) * baseWidthFactor * (1 - Math.pow(yNorm, peakFactor));
                let dx = x - width/2; let dz = z - depth/2;
                let horizontalDist = Math.sqrt(dx*dx + dz*dz);
                let noiseVal = simplex.noise3D(x * noiseScale, y * noiseScale * 0.5, z * noiseScale); 
                let threshold = 0.1 + (Math.random() - 0.5) * 0.2 * (1-surfaceSmoothness); 
                if (horizontalDist < effectiveRadius + noiseVal * noiseAmplitudeFactor && noiseVal > threshold - yNorm * 0.3) { 
                     rockDataForSchem.blocks.push({x,y,z});
                     const block = new THREE.Mesh(blockGeometry, currentMaterial);
                     block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                     rockMeshGroup.add(block); blocksPlaced++;
                }
            }
        } else if (currentShape === 'grumosa') { 
            const numAttractors = parseInt(document.getElementById('grumosaNumAttractors').value);
            const spread = parseFloat(document.getElementById('grumosaSpread').value); 
            let grumousRoughness = parseFloat(document.getElementById('grumosaRoughness').value);
            let effectiveGrumousRoughness = grumousRoughness * (1 - surfaceSmoothness);
            const attractors = [];
            for (let i = 0; i < numAttractors; i++) attractors.push({ x: (width/2)+(Math.random()-0.5)*width*spread, y:(height/2)+(Math.random()-0.5)*height*spread, z:(depth/2)+(Math.random()-0.5)*depth*spread });
            const attractorRadiusFactor = Math.max(width, height, depth) / (3.5 + numAttractors * 0.5);
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let z = 0; z < depth; z++) {
                let inAttractorInfluence = false;
                for (const att of attractors) {
                    let dx = x-att.x, dy=y-att.y, dz=z-att.z; let distSq = dx*dx+dy*dy+dz*dz;
                    if (distSq < Math.pow(attractorRadiusFactor + (Math.random()-0.5) * attractorRadiusFactor * effectiveGrumousRoughness, 2)) {
                        inAttractorInfluence = true; break;
                    }
                }
                if (inAttractorInfluence && Math.random() < 0.75) {
                     rockDataForSchem.blocks.push({x,y,z});
                     const block = new THREE.Mesh(blockGeometry, currentMaterial);
                     block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                     rockMeshGroup.add(block); blocksPlaced++;
                }
            }
        } else if (currentShape === 'rectangular') {
            const taper = parseFloat(document.getElementById('rectangularTaper').value);
            let noiseScale = parseFloat(document.getElementById('rectangularNoiseScale').value);
            let noiseStrength = parseFloat(document.getElementById('rectangularNoiseStrength').value) * (1 - surfaceSmoothness);
            const segmentScale = parseFloat(document.getElementById('rectangularSegmentScale').value);
            let segmentStrength = parseFloat(document.getElementById('rectangularSegmentStrength').value) * (1 - surfaceSmoothness);
            noiseScale = noiseScale + surfaceSmoothness * 0.03; 

            for (let y = 0; y < height; y++) {
                let yNorm = (height > 1) ? (y / (height - 1)) : 0;
                let effectiveTaper = taper * (1 - surfaceSmoothness * 0.5);
                let currentWidth = width * (1 - yNorm * effectiveTaper);
                let currentDepth = depth * (1 - yNorm * effectiveTaper);
                let segmentNoiseVal = simplex.noise2D(y * segmentScale, 0.5); 
                let segmentThreshold = (segmentStrength * 0.8) - 0.4; 
                if (segmentStrength > 0.01 && segmentNoiseVal < segmentThreshold) { continue; }
                for (let x = 0; x < width; x++) {
                    for (let z = 0; z < depth; z++) {
                        let isHorizontallyInside = (Math.abs(x - width/2) < currentWidth/2) && (Math.abs(z - depth/2) < currentDepth/2);
                        if (isHorizontallyInside) {
                            let surfaceNoiseVal = simplex.noise3D(x * noiseScale, y * noiseScale * 0.7, z * noiseScale); 
                            if (surfaceNoiseVal > (0.0 - noiseStrength * 0.6) ) { 
                                rockDataForSchem.blocks.push({x,y,z});
                                const block = new THREE.Mesh(blockGeometry, currentMaterial);
                                block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                                rockMeshGroup.add(block); blocksPlaced++;
                            }
                        }
                    }
                }
            }
        } else if (currentShape === 'escalonado') {
            const numTerrazas = parseInt(document.getElementById('escNumTerrazas').value);
            const profundidadTerrazaFactor = parseFloat(document.getElementById('escProfundidadTerraza').value);
            const inclinacionFrente = parseFloat(document.getElementById('escInclinacionFrente').value) * (1 - surfaceSmoothness * 0.5);
            const rugosidadTerrazas = parseFloat(document.getElementById('escRugosidadTerrazas').value) * (1 - surfaceSmoothness);
            const terrazaNoiseScale = 0.08 + surfaceSmoothness * 0.1;
            const alturaTerrazaMedia = height / numTerrazas;
            for (let y = 0; y < height; y++) {
                let terrazaActual = Math.floor(y / alturaTerrazaMedia);
                if (terrazaActual >= numTerrazas) terrazaActual = numTerrazas - 1;
                let yEnTerrazaNorm = (alturaTerrazaMedia > 0) ? ((y % alturaTerrazaMedia) / alturaTerrazaMedia) : 0;
                if (isNaN(yEnTerrazaNorm)) yEnTerrazaNorm = 0;
                let zBaseTerraza = depth * (1 - (terrazaActual + 1 - yEnTerrazaNorm * inclinacionFrente) / numTerrazas);
                zBaseTerraza = Math.max(0, zBaseTerraza * (1 - profundidadTerrazaFactor * (1-yEnTerrazaNorm)));
                for (let x = 0; x < width; x++) {
                    let noiseVal = simplex.noise3D(x * terrazaNoiseScale, y * terrazaNoiseScale * 0.5, zBaseTerraza * terrazaNoiseScale * 0.2);
                    let zConRuido = zBaseTerraza + noiseVal * depth * 0.1 * rugosidadTerrazas;
                    for (let z = 0; z < depth; z++) {
                        if (z < zConRuido) {
                            rockDataForSchem.blocks.push({x,y,z});
                            const block = new THREE.Mesh(blockGeometry, currentMaterial);
                            block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                            rockMeshGroup.add(block); blocksPlaced++;
                        }
                    }
                }
            }
        } else if (currentShape === 'saliente') {
            const alturaInicioVoladizo = parseFloat(document.getElementById('salAlturaInicio').value);
            const extensionVoladizo = parseFloat(document.getElementById('salExtension').value);
            const curvaturaVoladizo = parseFloat(document.getElementById('salCurvatura').value);
            const rugosidadGeneral = parseFloat(document.getElementById('salRugosidadGeneral').value) * (1 - surfaceSmoothness);
            const noiseScale = 0.05 + surfaceSmoothness * 0.05;
            for (let y = 0; y < height; y++) {
                let yNorm = y / (height -1 || 1);
                let maxZ = depth * 0.3; 
                if (yNorm > alturaInicioVoladizo) {
                    let overhangProgress = (yNorm - alturaInicioVoladizo) / (1 - alturaInicioVoladizo || 1);
                    let curveFactor = Math.pow(overhangProgress, 1 + curvaturaVoladizo * 2); 
                    maxZ += depth * extensionVoladizo * curveFactor;
                }
                for (let x = 0; x < width; x++) {
                    let noiseVal = simplex.noise3D(x * noiseScale, y * noiseScale * 0.7, maxZ * noiseScale);
                    let zConRuido = maxZ + noiseVal * depth * 0.15 * rugosidadGeneral;
                    for (let z = 0; z < depth; z++) {
                        if (z < zConRuido) {
                            rockDataForSchem.blocks.push({x,y,z});
                            const block = new THREE.Mesh(blockGeometry, currentMaterial);
                            block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                            rockMeshGroup.add(block); blocksPlaced++;
                        }
                    }
                }
            }
        } else if (currentShape === 'fracturado') {
            const escMayor = parseFloat(document.getElementById('fracEscalaMayor').value);
            const intensMayor = parseFloat(document.getElementById('fracIntensidadMayor').value) * (1-surfaceSmoothness*0.5);
            const escMenor = parseFloat(document.getElementById('fracEscalaMenor').value);
            const angulosidad = parseFloat(document.getElementById('fracAngulosidad').value) * (1-surfaceSmoothness*0.8);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    for (let z = 0; z < depth; z++) {
                        let zNorm = z / (depth-1 || 1); 
                        let baseThreshold = -0.5 + zNorm * 1.2; 
                        let noiseMayor = simplex.noise3D(x * escMayor, y * escMayor, z * escMayor) * intensMayor;
                        let noiseMenor = simplex.noise3D(x * escMenor, y * escMenor, z * escMenor) * angulosidad;
                        let finalNoise = noiseMayor + noiseMenor * 0.5; 
                        if (finalNoise > baseThreshold) {
                            rockDataForSchem.blocks.push({x,y,z});
                            const block = new THREE.Mesh(blockGeometry, currentMaterial);
                            block.position.set(x-visualCenterX+0.5, y-visualCenterY+0.5, z-visualCenterZ+0.5);
                            rockMeshGroup.add(block); blocksPlaced++;
                        }
                    }
                }
            }
        }
        
        if (blocksPlaced === 0 && width*height*depth > 0) { 
            rockDataForSchem.blocks.push({x: Math.floor(width/2), y: Math.floor(height/2), z: Math.floor(depth/2)});
            const block = new THREE.Mesh(blockGeometry, currentMaterial);
            block.position.set(0,0,0); rockMeshGroup.add(block);
            console.warn("No se generaron bloques, se colocó uno central.");
        }
        if (blocksPlaced > 0) { downloadButton.classList.add('enabled'); }
        const maxSize = Math.max(width, height, depth);
        let camDist = Math.max(40, maxSize * 1.8); 
        if (height > maxSize * 0.7) camDist = Math.max(camDist, height * 2.2);
        camera.position.set(camDist * 0.8, camDist * 0.6, camDist);
        camera.lookAt(0,0,0);
        loadingDiv.style.display = 'none';
    }, 10); 
}

const TAG_End = 0, TAG_Byte = 1, TAG_Short = 2, TAG_Int = 3, TAG_Long = 4;
const TAG_Float = 5, TAG_Double = 6, TAG_Byte_Array = 7, TAG_String = 8;
const TAG_List = 9, TAG_Compound = 10, TAG_Int_Array = 11, TAG_Long_Array = 12;

class NBTWriter { 
    constructor() { this.buffer = []; }
    writeByte(value) { this.buffer.push(value & 0xFF); }
    writeShort(value) { this.buffer.push((value >> 8) & 0xFF); this.buffer.push(value & 0xFF); }
    writeInt(value) { this.buffer.push((value >> 24) & 0xFF); this.buffer.push((value >> 16) & 0xFF); this.buffer.push((value >> 8) & 0xFF); this.buffer.push(value & 0xFF); }
    writeString(str) { const utf8 = new TextEncoder().encode(str); this.writeShort(utf8.length); utf8.forEach(b => this.writeByte(b)); }
    writeByteArray(arr) { this.writeInt(arr.length); arr.forEach(b => this.writeByte(b)); }
    writeNamedTagHeader(type, name) { this.writeByte(type); this.writeString(name); }
    getUint8Array() { return new Uint8Array(this.buffer); }
}

function generateSchemFile(dataForSchem) { 
    if (!dataForSchem || dataForSchem.blocks.length === 0) {
        alert("Primero genera una forma para poder descargarla.");
        return null;
    }
    const { width, height, length, blocks } = dataForSchem;
    const nbt = new NBTWriter();
    nbt.writeNamedTagHeader(TAG_Compound, "Schematic"); 
    nbt.writeNamedTagHeader(TAG_Short, "Width"); nbt.writeShort(width);
    nbt.writeNamedTagHeader(TAG_Short, "Height"); nbt.writeShort(height);
    nbt.writeNamedTagHeader(TAG_Short, "Length"); nbt.writeShort(length);
    nbt.writeNamedTagHeader(TAG_Int, "PaletteMax"); nbt.writeInt(2);
    nbt.writeNamedTagHeader(TAG_Compound, "Palette");
        nbt.writeNamedTagHeader(TAG_Int, "minecraft:air"); nbt.writeInt(0);
        nbt.writeNamedTagHeader(TAG_Int, "minecraft:stone"); nbt.writeInt(1); 
    nbt.writeByte(TAG_End); 
    const blockDataArray = new Uint8Array(width * height * length).fill(0); 
    blocks.forEach(block => {
        const index = (block.y * length + block.z) * width + block.x;
        if (index >= 0 && index < blockDataArray.length) {
            blockDataArray[index] = 1; 
        }
    });
    nbt.writeNamedTagHeader(TAG_Byte_Array, "BlockData");
    nbt.writeByteArray(blockDataArray);
    nbt.writeNamedTagHeader(TAG_Int, "MinecraftDataVersion"); nbt.writeInt(3120); 
    nbt.writeNamedTagHeader(TAG_Int, "Version"); nbt.writeInt(2); 
    nbt.writeNamedTagHeader(TAG_Int_Array, "Offset");
    nbt.writeInt(3); nbt.writeInt(0); nbt.writeInt(0); nbt.writeInt(0);
    nbt.writeByte(TAG_End); 
    try {
        const gzippedData = pako.gzip(nbt.getUint8Array());
        return gzippedData;
    } catch (e) {
        console.error("Error Gzipping:", e);
        alert("Error al comprimir el archivo .schem. Revisa la consola.");
        return null;
    }
}

function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function setupControls() {
    const shapeButtonsContainer = document.getElementById('shape-buttons');
    const sizePresetButtonsContainer = document.getElementById('size-preset-buttons');
    const allShapeControlGroups = document.querySelectorAll('#shape-specific-controls .sub-control-group');

    function updateActiveShapeControls() {
        allShapeControlGroups.forEach(group => group.classList.remove('active'));
        const activeGroup = document.getElementById(`controls-${currentShape}`);
        if (activeGroup) activeGroup.classList.add('active');
    }

    shapeButtonsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            currentShape = button.dataset.shape;
            shapeButtonsContainer.querySelector('.selected')?.classList.remove('selected');
            button.classList.add('selected');
            updateActiveShapeControls();
        });
    });
    
    sizePresetButtonsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const sizeName = button.dataset.size;
            let ySizeDefault = 25; 
            if (['puntiaguda', 'rectangular', 'escalonado', 'saliente', 'fracturado'].includes(currentShape)) {
                ySizeDefault = 40; 
            }
            let dims = {x:30, y: ySizeDefault , z:30}; 
            if (sizeName === 'pequena') dims = {x:20, y: Math.round(ySizeDefault * 0.6), z:20};
            else if (sizeName === 'grande') dims = {x:50, y: Math.round(ySizeDefault * 1.5), z:50};
            
            document.getElementById('sizeX').value = dims.x;
            document.getElementById('sizeY').value = dims.y;
            document.getElementById('sizeZ').value = dims.z;
        });
    });
    
    // Asegurar que los contenedores de controles específicos existan antes de intentar llenarlos.
    // Esto es importante porque el HTML no los tiene llenos inicialmente.
    const controlContent = {
        'redonda': `<h4>Ajustes para Roca Redonda</h4> <label for="redondaNoiseScale">Escala Detalle Superficie (0.01-0.5):</label> <input type="range" id="redondaNoiseScale" min="0.01" max="0.5" step="0.005" value="0.1"> <label for="redondaDeformation">Deformación (0-1):</label> <input type="range" id="redondaDeformation" min="0" max="1" step="0.01" value="0.3">`,
        'puntiaguda': `<h4>Ajustes para Roca Puntiaguda</h4> <label for="puntiagudaNoiseScale">Escala Textura (0.01-0.2):</label> <input type="range" id="puntiagudaNoiseScale" min="0.01" max="0.2" step="0.005" value="0.07"> <label for="puntiagudaPeakFactor">Factor de Picos (1-5):</label> <input type="range" id="puntiagudaPeakFactor" min="1" max="5" step="0.1" value="1.5"> <label for="puntiagudaBaseWidth">Anchura Base (0.1-1):</label> <input type="range" id="puntiagudaBaseWidth" min="0.1" max="1" step="0.01" value="0.8">`,
        'grumosa': `<h4>Ajustes para Roca Grumosa</h4> <label for="grumosaNumAttractors">Número de Grumos (2-7):</label> <input type="range" id="grumosaNumAttractors" min="2" max="7" step="1" value="3"> <label for="grumosaSpread">Dispersión Grumos (0.1-0.8):</label> <input type="range" id="grumosaSpread" min="0.1" max="0.8" step="0.01" value="0.5"> <label for="grumosaRoughness">Rugosidad Individual Grumos (0-1):</label> <input type="range" id="grumosaRoughness" min="0" max="1" step="0.01" value="0.4">`,
        'rectangular': `<h4>Ajustes para Forma Rectangular</h4> <label for="rectangularTaper">Conicidad (0-0.95):</label> <input type="range" id="rectangularTaper" min="0" max="0.95" step="0.01" value="0.2"> <label for="rectangularNoiseScale">Escala Ruido Sup. (0.01-0.2):</label> <input type="range" id="rectangularNoiseScale" min="0.01" max="0.2" step="0.005" value="0.08"> <label for="rectangularNoiseStrength">Fuerza Ruido Sup. (0-1):</label> <input type="range" id="rectangularNoiseStrength" min="0" max="1" step="0.01" value="0.3"> <label for="rectangularSegmentScale">Escala Segment. (0.01-0.2):</label> <input type="range" id="rectangularSegmentScale" min="0.01" max="0.2" step="0.005" value="0.05"> <label for="rectangularSegmentStrength">Fuerza Segment. (0-1):</label> <input type="range" id="rectangularSegmentStrength" min="0" max="1" step="0.01" value="0.2">`,
        'escalonado': `<h4>Ajustes para Acantilado Escalonado</h4><label for="escNumTerrazas">Número de Terrazas (2-8):</label><input type="range" id="escNumTerrazas" min="2" max="8" step="1" value="4"><label for="escProfundidadTerraza">Profundidad Terraza (0.1-0.8):</label><input type="range" id="escProfundidadTerraza" min="0.1" max="0.8" step="0.05" value="0.5"><label for="escInclinacionFrente">Inclinación Frentes (0-0.5):</label><input type="range" id="escInclinacionFrente" min="0" max="0.5" step="0.01" value="0.1"><label for="escRugosidadTerrazas">Rugosidad Terrazas (0-1):</label><input type="range" id="escRugosidadTerrazas" min="0" max="1" step="0.05" value="0.3">`,
        'saliente': `<h4>Ajustes para Acantilado Saliente</h4><label for="salAlturaInicio">Altura Inicio Voladizo (Y norm, 0.4-0.9):</label><input type="range" id="salAlturaInicio" min="0.4" max="0.9" step="0.01" value="0.7"><label for="salExtension">Extensión Voladizo (X norm, 0.1-0.6):</label><input type="range" id="salExtension" min="0.1" max="0.6" step="0.01" value="0.3"><label for="salCurvatura">Curvatura Voladizo (0-1):</label><input type="range" id="salCurvatura" min="0" max="1" step="0.05" value="0.5"><label for="salRugosidadGeneral">Rugosidad General (0-1):</label><input type="range" id="salRugosidadGeneral" min="0" max="1" step="0.05" value="0.4">`,
        'fracturado': `<h4>Ajustes para Acantilado Fracturado</h4><label for="fracEscalaMayor">Escala Fracturas Grandes (0.01-0.1):</label><input type="range" id="fracEscalaMayor" min="0.01" max="0.1" step="0.005" value="0.05"><label for="fracIntensidadMayor">Intensidad Fracturas Grandes (0-1):</label><input type="range" id="fracIntensidadMayor" min="0" max="1" step="0.05" value="0.6"><label for="fracEscalaMenor">Escala Fracturas Pequeñas (0.05-0.3):</label><input type="range" id="fracEscalaMenor" min="0.05" max="0.3" step="0.01" value="0.15"><label for="fracAngulosidad">Angulosidad/Jaggedness (0-1):</label><input type="range" id="fracAngulosidad" min="0" max="1" step="0.05" value="0.5">`
    };

    for (const shapeKey in controlContent) {
        const el = document.getElementById(`controls-${shapeKey}`);
        if (el) {
            el.innerHTML = controlContent[shapeKey];
        }
    }
    
    document.getElementById('shape-buttons').children[0].classList.add('selected'); 
    updateActiveShapeControls(); 

    document.getElementById('generateButton').addEventListener('click', generateRock);
    document.getElementById('downloadSchemButton').addEventListener('click', () => {
        const schemFileData = generateSchemFile(rockDataForSchem);
        if (schemFileData) {
            downloadFile(schemFileData, `forma_${currentShape}.schem`, 'application/octet-stream');
        }
    });
}

initThreeJS();
setupControls();
window.addEventListener('load', () => {
     document.getElementById('size-preset-buttons').children[1].click(); 
     document.getElementById('shape-buttons').children[0].click(); 
     generateRock();
});
