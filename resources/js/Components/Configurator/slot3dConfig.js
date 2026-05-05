export const slot3dConfig = {
    // Координаты условные (заглушки) — под реальные GLB подгоняй position/rotation/scale.
    // Ось Y вверх. Единицы — метры в сцене (условно).
    'korpusa': { modelPath: '/models/case.glb', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.5 },
    'materinskie-platy': { modelPath: '/models/motherboard.glb', position: [-0.24, 0.52, -4.225], rotation: [0, 80.1, 0], scale: 0.02 },
    'processory': { modelPath: '/models/cpu.glb', position: [0.133, 0.6305, -0.142], rotation: [-1.57, 0, 1.54], scale:[0.022, 0.02, 0.0205] },
    'kulery-dlia-processora': { modelPath: '/models/cooler.glb', position: [-0.038, 0.65, -0.12], rotation: [3.15, 0, 1.56], scale: 0.04 },
    'operativnaia-pamiat': { modelPath: '/models/ram.glb', position: [0.105, 0.63, -0.044], rotation: [1.57, 0, 1.57], scale: 0.055 },
    'operativnaia-pamiat-2': { modelPath: '/models/ram.glb', position: [0.105, 0.63, -0.01], rotation: [1.57, 0, 1.57], scale: 0.055 },
    'videokarty': { modelPath: '/models/gpu.glb', position: [0.292, 0.389, -0.13], rotation: [1.57, 0.02, -1.57], scale: 0.1 },
    'm2-ssd-nakopiteli': { modelPath: '/models/m2_ssd.glb', position: [0.135, 0.454, -0.23], rotation: [1.575, 0, 1.58], scale: 0.03 },
    // Логичное расположение 2.5" SSD возле фронтальной корзины
    'sata-ssd-nakopiteli': { modelPath: '/models/ssd.glb', position: [0.05, 0.5, 0.2], rotation: [3.16, -4.7, 6.3], scale: 0.02 },
    // HDD ниже SSD, в той же передней зоне корпуса
    'zestkii-disk': { modelPath: '/models/hdd.glb', position: [0.05, 0.6, 0.2], rotation: [6.3, 3.12, 6.3], scale: 0.04 },
    'bloki-pitaniia': { modelPath: '/models/psu.glb', position: [0, 0.13, -0.262], rotation: [6.28, 6.285, 6.29], scale: 1.8 },
};

export function getSlot3dConfig(categorySlug) {
    return (
        slot3dConfig[categorySlug] || {
            modelPath: null,
            position: [0, 0.03, 0],
            rotation: [0, 0, 0],
            scale: 0.5,
        }
    );
}

