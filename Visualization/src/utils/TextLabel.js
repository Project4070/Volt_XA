import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Create a billboard text label that always faces the camera
export function createTextLabel(text, options = {}) {
    const {
        fontSize = '12px',
        color = '#e2e8f0',
        backgroundColor = 'rgba(6, 6, 15, 0.7)',
        padding = '4px 8px',
        borderRadius = '4px',
        fontWeight = 'normal',
        maxWidth = 'none',
        className = '',
    } = options;

    const div = document.createElement('div');
    div.textContent = text;
    div.style.fontSize = fontSize;
    div.style.color = color;
    div.style.backgroundColor = backgroundColor;
    div.style.padding = padding;
    div.style.borderRadius = borderRadius;
    div.style.fontWeight = fontWeight;
    div.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
    div.style.pointerEvents = 'none';
    div.style.userSelect = 'none';
    div.style.whiteSpace = 'nowrap';
    if (maxWidth !== 'none') div.style.maxWidth = maxWidth;
    if (className) div.className = className;

    const label = new CSS2DObject(div);
    label.layers.set(0);
    return label;
}

// Create a layer title label (larger, bold)
export function createLayerLabel(text, color = '#e2e8f0') {
    return createTextLabel(text, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: color,
        backgroundColor: 'rgba(6, 6, 15, 0.85)',
        padding: '6px 14px',
        borderRadius: '6px',
    });
}

// Create a small annotation label
export function createAnnotation(text, color = '#94a3b8') {
    return createTextLabel(text, {
        fontSize: '10px',
        color: color,
        backgroundColor: 'rgba(6, 6, 15, 0.5)',
        padding: '2px 6px',
        borderRadius: '3px',
    });
}
