import React from 'react';
import styles from './Popup.module.scss'; // CSS module cho popup (tuỳ chọn)

interface IPopupProps {
  show: boolean;
  onClose: () => void;
  onSave?: () => void;
  children?: React.ReactNode;
}

const Popup: React.FC<IPopupProps> = ({ show, onClose, onSave, children }) => {
  if (!show) return null; // Nếu `show` là false thì không hiển thị popup

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        {/* Nút đóng "X" */}
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
              Lưu
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
