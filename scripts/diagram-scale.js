// Use page 3's 13px labels and thin connectors as the shared diagram scale.
(() => {
  const selector = '.physical-card-svg, .image-wrap .connection-svg, .hero-diagram, .diagram-panel .connection-svg';
  const diagrams = [...document.querySelectorAll(selector)];
  const markers = new WeakMap();
  const scaleOf = el => {
    const m = el.getScreenCTM();
    return m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 0;
  };
  function update() {
    for (const svg of diagrams) {
      if (!svg.getBoundingClientRect().width) continue;
      for (const text of svg.querySelectorAll('text')) {
        const scale = scaleOf(text);
        if (scale) text.style.setProperty('font-size', `${Math.min(13 / scale, 22)}px`, 'important');
      }
      // Match P3's 1.25 line height while keeping each label's first line fixed.
      for (const first of svg.querySelectorAll('[data-label-line="0"]')) {
        const fontSize = parseFloat(getComputedStyle(first).fontSize);
        for (const line of svg.querySelectorAll(`[data-label-group="${first.dataset.labelGroup}"]`)) {
          line.setAttribute('y', String(first.y.baseVal[0].value + Number(line.dataset.labelLine) * fontSize * 1.25));
        }
      }
      for (const line of svg.querySelectorAll('line, path[marker-end], path[marker-start]')) {
        if (line.closest('defs')) continue;
        const scale = scaleOf(line);
        if (scale) line.style.setProperty('stroke-width', String(1.8 / scale), 'important');
      }
      for (const marker of svg.querySelectorAll('marker')) {
        if (!markers.has(marker)) markers.set(marker, {
          width: marker.getAttribute('markerWidth'), height: marker.getAttribute('markerHeight')
        });
        const original = markers.get(marker);
        const scale = scaleOf(svg);
        if (!scale) continue;
        marker.setAttribute('viewBox', `0 0 ${original.width} ${original.height}`);
        marker.setAttribute('markerUnits', 'userSpaceOnUse');
        marker.setAttribute('markerWidth', String(8 / scale));
        marker.setAttribute('markerHeight', String(5 / scale));
      }
    }
  }
  // HTML labels use the same spacing as SVG labels, including nested emphasis.
  const labelStyle = document.createElement('style');
  labelStyle.textContent = '.image-wrap .canvas div, .image-wrap .canvas span, .diagram-panel .canvas div, .diagram-panel .canvas span, .hero-boost-badge { line-height: 1.25 !important; }';
  document.head.append(labelStyle);
  const calibrate = update;
  function alignChain() {
    calibrate();
    const arrow = document.querySelector('.chain-contact-arrow');
    const strip = document.querySelector('.physical-chain-strip');
    if (!arrow || !strip || !arrow.getScreenCTM()) return;
    const point = new DOMPoint(arrow.x2.baseVal.value, arrow.y2.baseVal.value).matrixTransform(arrow.getScreenCTM());
    const parent = strip.offsetParent;
    const bounds = parent.getBoundingClientRect();
    // The triangle tip is 0.4 marker units beyond refX; marker scale is 8 / 4.8.
    strip.style.top = `${point.y + 0.4 * (8 / 4.8) - bounds.top - parent.clientTop}px`;
    strip.style.bottom = 'auto';
  }
  let frame;
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(alignChain); };
  const observer = new ResizeObserver(schedule);
  diagrams.forEach(svg => observer.observe(svg));
  window.addEventListener('resize', schedule);
  alignChain();
})();
