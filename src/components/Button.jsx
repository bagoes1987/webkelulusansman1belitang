import React from 'react';

export default function Button({ children, onClick, type = "button", variant = "primary", className = "", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-${variant} ${className} ${disabled ? 'btn-disabled' : ''}`}
    >
      {children}
    </button>
  );
}
