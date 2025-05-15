import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './TextAreaModal.css';

interface TextAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  isTextArea?: boolean;
}

const TextAreaModal: React.FC<TextAreaModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  isTextArea = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="textarea-modal-overlay">
      <div className="textarea-modal" ref={modalRef}>
        <div className="textarea-modal-header">
          <h3 className="textarea-modal-title">{title}</h3>
          <button className="textarea-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="textarea-modal-content">
          {isTextArea ? (
            <textarea
              ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
              className="textarea-modal-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              ref={textareaRef as React.RefObject<HTMLInputElement>}
              type="text"
              className="textarea-modal-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
        
        <div className="textarea-modal-footer">
          <button className="textarea-modal-save" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TextAreaModal;
