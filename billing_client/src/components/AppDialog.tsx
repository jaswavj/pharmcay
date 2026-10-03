import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './AppDialog.css';

type DialogRequest = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string | null;
  tone: 'primary' | 'danger';
  resolve: (value: boolean) => void;
};

type AskOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
};

let showDialog: ((request: DialogRequest) => void) | null = null;

export function alertDialog(message: string, title = 'Notice'): Promise<void> {
  return askDialog({ title, message, confirmText: 'OK', tone: 'primary' }).then(() => undefined);
}

export function confirmDialog(message: string, options: AskOptions = {}): Promise<boolean> {
  return askDialog({
    title: options.title || 'Please confirm',
    message,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    tone: options.tone || 'primary',
  });
}

function askDialog(options: {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  tone: 'primary' | 'danger';
}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!showDialog) {
      resolve(window.confirm(options.message));
      return;
    }
    showDialog({
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText ?? null,
      tone: options.tone,
      resolve,
    });
  });
}

export const AppDialog: React.FC = () => {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    showDialog = (next) => setRequest(next);
    return () => {
      showDialog = null;
    };
  }, []);

  useEffect(() => {
    if (!request) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(request.cancelText == null);
      if (event.key === 'Enter') finish(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request]);

  const finish = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  if (!request) return null;

  return createPortal(
    <div className="app-dialog" onMouseDown={() => finish(request.cancelText == null)}>
      <div className={`app-dialog-card ${request.tone}`} onMouseDown={(event) => event.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="app-dialog-icon">
          <i className={`fas ${request.tone === 'danger' ? 'fa-exclamation' : 'fa-info'}`} />
        </div>
        <h3>{request.title}</h3>
        <p>{request.message}</p>
        <div className="app-dialog-actions">
          {request.cancelText != null && (
            <button className="app-dialog-cancel" type="button" onClick={() => finish(false)}>{request.cancelText}</button>
          )}
          <button className="app-dialog-ok" type="button" onClick={() => finish(true)}>{request.confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppDialog;
