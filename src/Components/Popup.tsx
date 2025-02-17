import React from 'react';
import styles from './Popup.module.scss'; // CSS module cho popup (tuỳ chọn)

interface IPopupProps {
  show: boolean;
  onClose: () => void;
  onSave?: () => void;
  children?: React.ReactNode;
  saveButtonText?: string;
}

const Popup: React.FC<IPopupProps> = ({ show, onClose, onSave, children, saveButtonText = "Lưu" }) => {
  if (!show) return null; // Nếu `show` là false thì không hiển thị popup

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times; {/* Đây là ký tự "X" */}
        </button>
        <div>
          {children} {/* Đây là nội dung của popup */}
        </div>
        <div className={styles.popupFooter}>
          {/* Nút Lưu */}
          {onSave && (
            <button className={styles.saveButton} onClick={onSave}>
              {saveButtonText}
            </button>
          )}
          {/* Nút Đóng */}
          {/* <button className={styles.closeButton} onClick={onClose}>
            Đóng
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default Popup;
