import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({ children, title, close, closeLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={close} onClick={e => {
    if (e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); }
  }}><button className="icon-button modal-close" onClick={close} aria-label={closeLabel}><X /></button><span className="eyebrow">OPEN WORLD AVIATION</span><h2 id="modal-title">{title}</h2>{children}</dialog>;
}
