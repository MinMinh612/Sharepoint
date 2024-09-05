import * as React from 'react';
import { FaPlus, FaTrash , FaPrint, FaTimes } from 'react-icons/fa';
import styles from './SuggestionAdd.module.scss';

interface IFooterButtonProps {
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

const FooterButton: React.FC<IFooterButtonProps> = ({ onClose, onSave, onDelete }) => {
  return (
    <div className={styles.formContainer}>
      <div className={styles.actionButtons}>
        <button className={`${styles.btn} ${styles.btnAdd}`} onClick={onSave}>
          <FaPlus color="green" /> Lưu
        </button>
        <button className={`${styles.btn} ${styles.btnDelete}`} onClick={onDelete}>
          <FaTrash  color="blue" /> xóa
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
