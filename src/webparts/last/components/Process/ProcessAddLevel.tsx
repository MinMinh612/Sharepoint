import React from 'react';
import type { IFormDataProcess } from '../IFormData';
import { FaPlus, FaTimes  } from 'react-icons/fa';
import ProcessDetail from './ProcessDetail';
import styles from './ProcessAddLevel.module.scss';

interface IProcessAddLevelProps {
  formData: IFormDataProcess;
  editable: boolean;
  onCancel: () => void;
  onSave: (data: IFormDataProcess) => void;
}

const ProcessAddLevel: React.FC<IProcessAddLevelProps> = ({
  formData,
  editable,
  onCancel,
  onSave
}) => {
  const [localFormData, setLocalFormData] = React.useState<IFormDataProcess>(formData);
  const [isisActive, setIsisActive] = React.useState<boolean>(false);

  const updateData = (field: string, value: string): void => {
    setLocalFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;
    updateData(name, value);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setIsisActive(event.target.checked);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSave(localFormData);
  };

  return (
    <div>
        <div className={styles.actionButtonsAdd}>
          <div className="buttons">
            <button
              type="submit"
              disabled={!editable}
              form="process-form"
              className={`${styles.btn} ${styles.btnAdd}`}
            >
              <FaPlus /> Lưu
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={!editable}
              className={`${styles.btn} ${styles.btnCancel}`}
            >
              <FaTimes color="red" /> Hủy
            </button>
          </div>
          <div className={styles.checkbox}>
            <label htmlFor="isActive">Bỏ sử dụng</label>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={isisActive}
              onChange={handleCheckboxChange}
            />
          </div>
        </div>
        <h1>Thêm mới qui trình</h1>
      <div className={styles.formContainerAdd}>
        <form id="process-form" onSubmit={handleFormSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="ProcessName">Mã qui trình</label>
            <input 
              type="text" 
              id="ProcessName" 
              name="ProcessName" 
              value={localFormData.ProcessName || ''} 
              onChange={handleInput} 
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ProcessNote">Tên qui trình</label>
            <input 
              type="text" 
              id="ProcessNote" 
              name="ProcessNote" 
              value={localFormData.ProcessNote || ''} 
              onChange={handleInput} 
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ProcessType">Loại qui trình</label>
            <select
              id="ProcessType"
              name="ProcessType"
              value={localFormData.ProcessType || ''}
              onChange={handleInput}
              disabled={!editable}
            >
              <option value="NoiBo">Nội bộ</option>
              <option value="KhuVuc">Khu vực</option>
              <option value="TapDoan">Tập đoàn</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ProcessLevelNumber">Số cấp duyệt</label>
            <input 
              type="text" 
              id="ProcessLevelNumber" 
              name="ProcessLevelNumber" 
              value={localFormData.ProcessLevelNumber || ''} 
              onChange={handleInput}
            />
          </div>
        </form>
        {localFormData.ProcessLevelNumber && (
          <ProcessDetail
            formDataList={[localFormData]} 
            handleInputChange={(index: number) => handleInput}
            editable={editable}
            formData={localFormData} 
          />
        )}
      </div>
    </div>
  );
};

export default ProcessAddLevel;
