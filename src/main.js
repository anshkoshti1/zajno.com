import * as THREE from 'three';
import vertexShader from '../shaders/vertexShader.glsl';
import fragmentShader from '../shaders/fragmentShader.glsl';
import Lenis from 'lenis'
import gsap from 'gsap';

const lenis = new Lenis({
  duration: 3.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)), 
  smoothWheel: true,
  wheelMultiplier: 0.6,
  touchMultiplier: 2,
  lerp: 0.1,
  infinite: false
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (!isMobile) {
  const scene = new THREE.Scene();

  const distance = 100;
  const fov = 2 * Math.atan((window.innerHeight / 2) / distance) * (180 / Math.PI);

  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = distance;

  const canvas = document.getElementById('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const images = document.querySelectorAll('img');
  const planes = [];
  images.forEach(image => {
    const imageBounds = image.getBoundingClientRect();
    const texture = new THREE.TextureLoader().load(image.src);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 }
      }
    });
    const geometry = new THREE.PlaneGeometry(imageBounds.width, imageBounds.height);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(
      imageBounds.left - window.innerWidth / 2 + imageBounds.width / 2,
      -imageBounds.top + window.innerHeight / 2 - imageBounds.height / 2,
      0
    );
    planes.push(plane);
    scene.add(plane);
  });

  function updatePlanes() {
    planes.forEach((plane, index) => {
      const image = images[index];
      const imageBounds = image.getBoundingClientRect();

      plane.geometry.dispose();
      plane.geometry = new THREE.PlaneGeometry(imageBounds.width, imageBounds.height);

      plane.position.set(
        imageBounds.left - window.innerWidth / 2 + imageBounds.width / 2,
        -imageBounds.top + window.innerHeight / 2 - imageBounds.height / 2,
        0
      );
    });
  }

  let mouseMoveTimeout;

  function resetHoverEffects() {
    planes.forEach(plane => {
      gsap.to(plane.material.uniforms.uHover, {
        value: 0,
        duration: 1,
        ease: "power2.out"
      });
    });
  }

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let isHovering = false;

    planes.forEach(plane => {
      const intersects = raycaster.intersectObject(plane);
      if (intersects.length > 0) {
        isHovering = true;
        const intersectionPoint = intersects[0].uv;
        plane.material.uniforms.uMouse.value = intersectionPoint;
        gsap.to(plane.material.uniforms.uHover, {
          value: 1,
          duration: 1,
          ease: "power2.out"
        });
      }
    });

    if (!isHovering) {
      resetHoverEffects();
    }

    clearTimeout(mouseMoveTimeout);

    mouseMoveTimeout = setTimeout(() => {
      resetHoverEffects();
    }, 500); 
  });

  function animate() {
    requestAnimationFrame(animate);
    updatePlanes();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    const newFov = 2 * Math.atan((window.innerHeight / 2) / distance) * (180 / Math.PI);
    camera.fov = newFov;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updatePlanes();
  });
}
