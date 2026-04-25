import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeForceGraph from 'three-forcegraph';
import type { GraphData } from '../../../graph';
import type { DebugGraphConfig } from './DebugGraphView';
import { convertGraphData } from './DebugGraphUtils';

interface DebugGraphThreeProps {
  data: GraphData | null;
  config: DebugGraphConfig;
  onNodeClick?: (node: any) => void;
  onNodeHover?: (node: any | null) => void;
  onEdgeClick?: (edge: any) => void;
  onEdgeHover?: (edge: any | null) => void;
}

export const DebugGraphThree: React.FC<DebugGraphThreeProps> = ({
  data,
  config,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  onEdgeHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const forceGraphRef = useRef<ThreeForceGraph | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Initialize scene, camera, renderer, force graph once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(200, 100, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-1, -0.5, -1);
    scene.add(backLight);

    // Force graph – do NOT call graphData() here; layout will be initialised
    // when real data arrives in the data‑update effect.
    const forceGraph = new ThreeForceGraph()
      .nodeColor((node: any) => node.color || config.nodeColor || '#4a90e2')
      .nodeVal((node: any) => node.val || 1)
      .nodeOpacity(0.8)
      .linkColor((link: any) => link.color || config.edgeColor || '#999')
      .linkOpacity(0.3)
      .linkWidth((link: any) => link.width || 0.5)
      .linkDirectionalArrowLength(6)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleSpeed(0.005)
      .cooldownTime(Infinity)   // keep simulation running forever
      .warmupTicks(0);          // no warmup ticks needed

    // Event callbacks
    if (typeof forceGraph.onNodeClick === 'function') {
      forceGraph.onNodeClick((node: any) => {
        onNodeClick?.({ id: node.id, ...node });
      });
    }
    if (typeof forceGraph.onNodeHover === 'function') {
      forceGraph.onNodeHover((node: any | null) => {
        onNodeHover?.(node ? { id: node.id, ...node } : null);
      });
    }
    if (typeof forceGraph.onLinkClick === 'function') {
      forceGraph.onLinkClick((link: any) => {
        onEdgeClick?.({ id: `${link.source.id}->${link.target.id}`, ...link });
      });
    }
    if (typeof forceGraph.onLinkHover === 'function') {
      forceGraph.onLinkHover((link: any | null) => {
        onEdgeHover?.(link ? { id: `${link.source.id}->${link.target.id}`, ...link } : null);
      });
    }

    scene.add(forceGraph);
    forceGraphRef.current = forceGraph;

    // Start the render loop immediately (no tickFrame calls – the library
    // advances the simulation internally when graphData() is called later)
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (container && rendererRef.current && cameraRef.current) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        rendererRef.current.setSize(w, h);
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      if (forceGraphRef.current) {
        scene.remove(forceGraphRef.current);
        forceGraphRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []); // empty deps – run once

  // Update graph data when data prop changes
  useEffect(() => {
    const fg = forceGraphRef.current;
    if (!fg) return;

    const converted = convertGraphData(data, config);
    fg.graphData(converted);
    // No manual tickFrame call – the library handles the simulation internally
  }, [data, config]);

  // Update styling when config changes (without recreating graph)
  useEffect(() => {
    const fg = forceGraphRef.current;
    if (!fg) return;

    fg.nodeColor((node: any) => node.color || config.nodeColor || '#4a90e2');
    fg.linkColor((link: any) => link.color || config.edgeColor || '#999');
    fg.d3ReheatSimulation();
  }, [config]);

  // Update event handlers when they change (without recreating graph)
  useEffect(() => {
    const fg = forceGraphRef.current;
    if (!fg) return;

    if (typeof fg.onNodeClick === 'function') {
      fg.onNodeClick((node: any) => {
        onNodeClick?.({ id: node.id, ...node });
      });
    }
    if (typeof fg.onNodeHover === 'function') {
      fg.onNodeHover((node: any | null) => {
        onNodeHover?.(node ? { id: node.id, ...node } : null);
      });
    }
    if (typeof fg.onLinkClick === 'function') {
      fg.onLinkClick((link: any) => {
        onEdgeClick?.({ id: `${link.source.id}->${link.target.id}`, ...link });
      });
    }
    if (typeof fg.onLinkHover === 'function') {
      fg.onLinkHover((link: any | null) => {
        onEdgeHover?.(link ? { id: `${link.source.id}->${link.target.id}`, ...link } : null);
      });
    }
  }, [onNodeClick, onNodeHover, onEdgeClick, onEdgeHover]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 2,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#1a1a2e'
      }}
    />
  );
};
