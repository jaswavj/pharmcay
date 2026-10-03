import React from 'react';
import { createPortal } from 'react-dom';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const ReportModal: React.FC<Props> = ({ title, onClose, children }) =>
  createPortal(
    <div className="mst-modal" onMouseDown={onClose}>
      <div className="mst-modal-box" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mst-card">
          <div className="mst-card-h">
            <span>{title}</span>
            <button className="mst-icon-btn" type="button" title="Close" onClick={onClose}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="mst-card-b">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );

export default ReportModal;
