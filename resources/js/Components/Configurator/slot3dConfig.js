export const slot3dConfig = {
    // position / rotation / scale — где лежит 3D-модель компонента.
    // markerPosition — где рисуется «+» и подпись (если не задано, совпадает с position).
    // markerBillboardOffset — мелкая подстройка «+» относительно markerPosition (по умолчанию [0.02, 0.11, 0.02]).
    // Ось Y вверх, единицы — метры в сцене (условно).
    'korpusa': { modelPath: '/models/case.glb', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.5 },
    'materinskie-platy': {
        modelPath: '/models/motherboard.glb',
        position: [-0.24, 0.52, -4.225],
        markerPosition: [0.1, 0.6, -0.33],
        rotation: [0, 80.1, 0],
        scale: 0.02,
    },
    'processory': { modelPath: '/models/cpu.glb', position: [0.133, 0.6305, -0.142], markerPosition: [0.07, 0.52, -0.23], rotation: [-1.57, 0, 1.54], scale:[0.022, 0.02, 0.0205] },
    'kulery-dlia-processora': { modelPath: '/models/cooler.glb', position: [-0.038, 0.65, -0.12], markerPosition: [-0.038, 0.6, -0.12], rotation: [3.15, 0, 1.56], scale: 0.04 },
    'operativnaia-pamiat': { modelPath: '/models/ram.glb', position: [0.105, 0.63, -0.044], markerPosition: [0.08, 0.63, 0.02], rotation: [1.57, 0, 1.57], scale: 0.055 },
    'operativnaia-pamiat-2': { modelPath: '/models/ram.glb', position: [0.105, 0.63, -0.01], rotation: [1.57, 0, 1.57], scale: 0.055 },
    'videokarty': { modelPath: '/models/gpu.glb', position: [0.292, 0.389, -0.13], markerPosition: [0.09, 0.3, -0.35], rotation: [1.57, 0.02, -1.57], scale: 0.1 },
    'm2-ssd-nakopiteli': { modelPath: '/models/m2_ssd.glb', position: [0.135, 0.454, -0.23], markerPosition: [0.12, 0.35, -0.15], rotation: [1.575, 0, 1.58], scale: 0.03 },
    // Логичное расположение 2.5" SSD возле фронтальной корзины
    'sata-ssd-nakopiteli': { modelPath: '/models/ssd.glb', position: [0.05, 0.5, 0.2], markerPosition: [0.05, 0.35, 0.2], rotation: [3.16, -4.7, 6.3], scale: 0.02 },
    // HDD ниже SSD, в той же передней зоне корпуса
    'zestkii-disk': { modelPath: '/models/hdd.glb', position: [0.05, 0.6, 0.2], markerPosition: [0.05, 0.55, 0.2], rotation: [6.3, 3.12, 6.3], scale: 0.04 },
    'bloki-pitaniia': { modelPath: '/models/psu.glb', position: [0, 0.13, -0.262], rotation: [6.28, 6.285, 6.29], scale: 1.8 },
};

const DEFAULT_MARKER_BILLBOARD_OFFSET = [0.02, 0.11, 0.02];

export function getSlot3dConfig(categorySlug) {
    const cfg = slot3dConfig[categorySlug] || {
        modelPath: null,
        position: [0, 0.03, 0],
        rotation: [0, 0, 0],
        scale: 0.5,
    };

    return {
        ...cfg,
        markerPosition: cfg.markerPosition ?? cfg.position,
        markerBillboardOffset: cfg.markerBillboardOffset ?? DEFAULT_MARKER_BILLBOARD_OFFSET,
    };
}

