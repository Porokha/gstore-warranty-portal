import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';
import './trade-in-agreement.css';

const SignaturePad = ({ onChange, clearLabel = 'Clear signature' }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const inkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
  }, []);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
  };

  const start = (event) => {
    const canvas = canvasRef.current;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext('2d');
    const { x, y } = point(event);
    context.strokeStyle = '#16203a';
    context.lineWidth = 2.7;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(x, y);
    drawingRef.current = true;
    inkRef.current = true;
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
    setHasInk(true);
  };

  const move = (event) => {
    if (!drawingRef.current) return;
    const { x, y } = point(event);
    const context = canvasRef.current.getContext('2d');
    context.lineTo(x, y);
    context.stroke();
    setHasInk(true);
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (inkRef.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    inkRef.current = false;
    onChange('');
  };

  return (
    <div className="zzv-signature-pad">
      <canvas ref={canvasRef} width="700" height="210" aria-label="Signature area" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} />
      <div className="zzv-signature-pad__footer"><span>{hasInk ? 'Signature' : 'Sign here'}</span><Button size="small" onClick={clear}>{clearLabel}</Button></div>
    </div>
  );
};

export default SignaturePad;
