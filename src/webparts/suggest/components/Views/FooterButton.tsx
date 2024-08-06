import * as React from 'react';
import { FaPlus, FaShare, FaPrint, FaTimes } from 'react-icons/fa';
import styles from './SuggestionAdd.module.scss';

interface IFooterButtonProps {
  onClose: () => void;
  onSave: () => void;
}

const FooterButton: React.FC<IFooterButtonProps> = ({ onClose, onSave }) => {
  return (
    <div className={styles.formContainer}>
      <div className={styles.actionButtons}>
        <button className={`${styles.btn} ${styles.btnAdd}`} onClick={onSave}>
          <FaPlus color="green" /> Thêm
        </button>
        <button className={`${styles.btn} ${styles.btnShare}`}>
          <FaShare color="blue" /> Chia sẻ
        </button>
        <button className={`${styles.btn} ${styles.btnPrint}`}>
          <FaPrint color="blue" /> In
        </button>
        <button className={`${styles.btn} ${styles.btnClose}`} onClick={onClose}>
          <FaTimes color="gray" /> Đóng
        </button>
      </div>
    </div>
  );
};

export default FooterButton;
