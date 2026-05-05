import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Grid, OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { getSlot3dConfig } from '@/Components/Configurator/slot3dConfig';

const SLOT_TAGS = {
    korpusa: 'CASE',
    'materinskie-platy': 'MB',
    processory: 'CPU',
    'kulery-dlia-processora': 'COOLER',
    'operativnaia-pamiat': 'RAM',
    videokarty: 'GPU',
    'm2-ssd-nakopiteli': 'M.2',
    'sata-ssd-nakopiteli': 'SSD',
    'zestkii-disk': 'HDD',
    'bloki-pitaniia': 'PSU',
};

function makePlusSpriteTexture(bg, fg, sizePx = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, sizePx, sizePx);

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(sizePx / 2, sizePx / 2, sizePx * 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = sizePx * 0.035;
    ctx.stroke();

    ctx.strokeStyle = fg;
    ctx.lineWidth = sizePx * 0.1;
    ctx.lineCap = 'round';

    const cx = sizePx / 2;
    const cy = sizePx / 2;
    const l = sizePx * 0.26;
    ctx.beginPath();
    ctx.moveTo(cx - l / 2, cy);
    ctx.lineTo(cx + l / 2, cy);
    ctx.moveTo(cx, cy - l / 2);
    ctx.lineTo(cx, cy + l / 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
}

function makeTagTexture(text, isSelected) {
    const padX = 24;
    const fontSize = 40;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    const textWidth = Math.ceil(ctx.measureText(text).width);

    const w = textWidth + padX * 2;
    const h = fontSize + 20;

    canvas.width = w;
    canvas.height = h;

    const ctx2 = canvas.getContext('2d');
    ctx2.clearRect(0, 0, w, h);

    const r = h / 2;
    ctx2.fillStyle = isSelected ? 'rgba(22, 163, 74, 0.95)' : 'rgba(15, 23, 42, 0.92)';
    ctx2.beginPath();
    ctx2.moveTo(r, 0);
    ctx2.lineTo(w - r, 0);
    ctx2.quadraticCurveTo(w, 0, w, r);
    ctx2.quadraticCurveTo(w, h, w - r, h);
    ctx2.lineTo(r, h);
    ctx2.quadraticCurveTo(0, h, 0, r);
    ctx2.quadraticCurveTo(0, 0, r, 0);
    ctx2.closePath();
    ctx2.fill();

    ctx2.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx2.lineWidth = 2;
    ctx2.stroke();

    ctx2.fillStyle = '#ffffff';
    ctx2.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx2.textBaseline = 'middle';
    ctx2.textAlign = 'center';
    ctx2.fillText(text, w / 2, h / 2 + 1);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.aspect = w / h;
    return tex;
}

function SlotTagLabel({ text, isSelected }) {
    const { map, aspect } = useMemo(() => {
        const tex = makeTagTexture(text, isSelected);
        return { map: tex, aspect: tex.aspect || 3 };
    }, [text, isSelected]);

    useEffect(() => () => map.dispose(), [map]);

    const height = 0.03;
    const width = height * aspect;

    return (
        <sprite scale={[width, height, 1]} position={[0, 0.055, 0]} renderOrder={2100}>
            <spriteMaterial
                map={map}
                transparent
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
            />
        </sprite>
    );
}

function SlotMiniButton({ slot, isSelected, onPick, showTag = true }) {
    const pointerDown = useRef({ x: 0, y: 0, dragged: false });

    const { map, size } = useMemo(() => {
        const tex = makePlusSpriteTexture(
            isSelected ? '#15803d' : 'rgba(15,23,42,0.85)',
            isSelected ? '#ffffff' : 'rgba(255,255,255,0.95)'
        );
        return {
            map: tex,
            size: 0.055,
        };
    }, [isSelected]);

    useEffect(() => () => map.dispose(), [map]);

    const tagText = SLOT_TAGS[slot.categorySlug] || slot.categorySlug;

    return (
        <Billboard position={[0.02, 0.11, 0.02]}>
            <sprite
                scale={[size, size, size]}
                renderOrder={2000}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    pointerDown.current = {
                        x: e.clientX,
                        y: e.clientY,
                        dragged: false,
                    };
                }}
                onPointerMove={(e) => {
                    if (e.pressure <= 0) return;
                    const dx = e.clientX - pointerDown.current.x;
                    const dy = e.clientY - pointerDown.current.y;
                    if (Math.hypot(dx, dy) > 6) pointerDown.current.dragged = true;
                }}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    if (!pointerDown.current.dragged) onPick(slot);
                }}
            >
                <spriteMaterial
                    map={map}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    toneMapped={false}
                />
            </sprite>
            {showTag && <SlotTagLabel text={tagText} isSelected={isSelected} />}
        </Billboard>
    );
}

function GlbModel({ url, position, rotation, scale }) {
    const { scene } = useGLTF(url);
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
        cloned.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.needsUpdate = true;
            }
        });
    }, [cloned]);

    return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />;
}

function SceneLoadingOverlay() {
    const { active, progress } = useProgress();
    if (!active) return null;

    return (
        <Html center>
            <div className="flex flex-col items-center gap-3 px-5 py-4 rounded-xl bg-black/55 backdrop-blur-sm border border-white/10 shadow-xl">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <div className="text-white text-sm font-bold">
                    Загрузка 3D… {Math.round(progress)}%
                </div>
            </div>
        </Html>
    );
}

function SlotObject({ slot, isSelected, onClick, alwaysVisible = false, showMarker = true }) {
    const cfg = getSlot3dConfig(slot.slotKey || slot.categorySlug);
    const baseColor = isSelected ? '#22c55e' : '#ffffff';
    const edgeColor = isSelected ? '#16a34a' : '#93c5fd';

    const groupRef = useRef(null);
    const isVisible = alwaysVisible || isSelected;
    const [shouldRender, setShouldRender] = useState(isVisible);
    const targetScale = isVisible ? 1 : 0;
    const currentScale = useRef(isVisible ? 1 : 0);

    const normalizedScale = useMemo(
        () => (Array.isArray(cfg.scale) ? cfg.scale : [cfg.scale, cfg.scale, cfg.scale]),
        [cfg.scale]
    );

    useEffect(() => {
        if (isVisible) setShouldRender(true);
        if (!isVisible) {
            const t = setTimeout(() => setShouldRender(false), 220);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [isVisible]);

    useFrame(() => {
        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.16);
        if (groupRef.current) {
            const s = currentScale.current;
            groupRef.current.scale.set(
                normalizedScale[0] * s,
                normalizedScale[1] * s,
                normalizedScale[2] * s
            );
        }
    });

    return (
        <group position={cfg.position} rotation={cfg.rotation}>
            {shouldRender && (
                <group ref={groupRef}>
                    {cfg.modelPath ? (
                        <Suspense fallback={null}>
                            <GlbModel url={cfg.modelPath} position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1} />
                        </Suspense>
                    ) : (
                        <>
                            <mesh castShadow receiveShadow>
                                <boxGeometry args={[0.25, 0.05, 0.15]} />
                                <meshStandardMaterial color={baseColor} roughness={0.6} metalness={0.1} />
                            </mesh>
                            <lineSegments>
                                <edgesGeometry args={[new THREE.BoxGeometry(0.25, 0.05, 0.15)]} />
                                <lineBasicMaterial color={edgeColor} />
                            </lineSegments>
                        </>
                    )}
                </group>
            )}

            {showMarker && (alwaysVisible || isSelected) && (
                <SlotMiniButton slot={slot} isSelected={isSelected} onPick={onClick} />
            )}
        </group>
    );
}

export default function Configurator3DView({ componentSlots, assembly, onSlotClick, isExpanded = false }) {
    const visualSlots = useMemo(
        () =>
            componentSlots.flatMap((slot) => {
                const slotKey = slot.slotKey || slot.categorySlug;
                const selected = !!assembly[slotKey];

                if (slot.categorySlug === 'operativnaia-pamiat' && selected) {
                    return [
                        slot,
                        {
                            ...slot,
                            slotKey: 'operativnaia-pamiat-2',
                            displayName: 'Оперативная память (2)',
                            __isMirrorOnly: true,
                        },
                    ];
                }

                return [slot];
            }),
        [componentSlots, assembly]
    );

    return (
        <div className="w-full bg-[#08004E] rounded-xl overflow-hidden shadow-inner p-3 border border-gray-300">
            <div className={`w-full ${isExpanded ? 'h-[78vh]' : 'h-[380px]'} rounded-lg overflow-hidden bg-[#08004E]`}>
            <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    camera={{ position:[0.7, 0.6, 0.8], fov: 50, near: 0.01, far: 100 }}
                    gl={{ 
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1.3 
                    }}
                >
                    <color attach="background" args={['#05070d']} />

                    <SceneLoadingOverlay />

                    <Environment preset="city" environmentIntensity={1.5} />

                    <ambientLight intensity={2.5} />
                    <hemisphereLight intensity={2.0} color="#ffffff" groundColor="#0f172a" />
                    
                    <directionalLight 
                        position={[10, 15, 10]} 
                        intensity={6.0} 
                        color="#fffbeb"
                        castShadow 
                        shadow-mapSize-width={2048} 
                        shadow-mapSize-height={2048}
                        shadow-bias={-0.0001}
                    />
                    
                    <directionalLight position={[-8, 6, -8]} intensity={3.5} color="#bae6fd" />

                    <pointLight position={[0, 0.6, 0.5]} intensity={5.0} distance={5} decay={1.5} color="#ffffff" />
                    <pointLight position={[0.15, 0.65, 0.2]} intensity={3.5} distance={3} decay={2} color="#f8fafc" />
                    <pointLight position={[-0.1, 0.3, 0.3]} intensity={3.0} distance={3} decay={2} color="#e0e7ff" />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
                        <planeGeometry args={[12, 12]} />
                        <meshStandardMaterial color="#02040a" roughness={1} metalness={0} />
                    </mesh>

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                        <planeGeometry args={[4, 4]} />
                        <meshStandardMaterial color="#06080f" roughness={1} metalness={0} />
                    </mesh>
                    <Grid
                        position={[0, 0.002, 0]}
                        args={[4, 4]}
                        cellSize={0.25}
                        cellThickness={0.5}
                        cellColor="#2a3140"
                        sectionSize={1}
                        sectionThickness={1}
                        sectionColor="#485266"
                        fadeDistance={2}
                        fadeStrength={2}
                        infiniteGrid={false}
                    />

                    {visualSlots.map((slot) => {
                        const slotKey = slot.slotKey || slot.categorySlug;
                        const isMirrorOnly = slot.__isMirrorOnly === true;
                        const isSelected = isMirrorOnly
                            ? !!assembly['operativnaia-pamiat']
                            : !!assembly[slotKey];

                        return (
                            <SlotObject
                                key={slotKey}
                                slot={slot}
                                isSelected={isSelected}
                                onClick={onSlotClick}
                                alwaysVisible={slotKey === 'korpusa'}
                                showMarker={!isMirrorOnly}
                            />
                        );
                    })}

                    <OrbitControls
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.08}
                        minDistance={0.2}
                        maxDistance={1.5}
                        maxPolarAngle={Math.PI / 1}
                        target={[0, 0.5, 0]}
                        />
                </Canvas>
            </div>
        </div>
    );
}
