import * as React from 'react';
import type { IFormData } from '../../../suggest/components/ISuggestProps';
import type { IFormDataProcess } from '../../../last/components/IFormData';
import { FaEye, FaCheck, FaTimes, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import styles from './Approval.module.scss';
import SuggestionAddView from '../../../suggest/components/Views/SuggestionAddView';

interface IApprovalProps {
  formDataList: IFormData[];
  formDataListProcess: IFormDataProcess[];
  handleDeleteRow: (index: number) => void;
  editable: boolean;
  editRow: (index: number) => void;
  handleAddRow: (newData: IFormData) => void;
}

const Approval: React.FC<IApprovalProps> = ({
  formDataList,
  formDataListProcess,
  handleDeleteRow,
  editable,
  editRow,
  handleAddRow,
}) => {
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);
  const [isViewing, setIsViewing] = React.useState(false);
  const [viewingIndex, setViewingIndex] = React.useState<number | null>(null);

  const [showPopup, setShowPopup] = React.useState(false);
  const [popupReason, setPopupReason] = React.useState('');
  const [popupAction, setPopupAction] = React.useState<'approve' | 'reject' | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string>('');

  const handleCheckboxChange = (index: number): void => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      return newSelectedRows;
    });
  };

  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedRows(new Set(formDataList.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleClose = (): void => {
    setIsViewing(false);
    setShowPopup(false);
    setPopupReason('');
    setError('');
  };

  const handleView = (index: number): void => {
    setViewingIndex(index);
    setIsViewing(true);
  };

  const handleApprove = (index: number): void => {
    setCurrentIndex(index);
    setPopupAction('approve');
    setShowPopup(true);
  };

  const handleReject = (index: number): void => {
    setCurrentIndex(index);
    setPopupAction('reject');
    setShowPopup(true);
  };

  const handlePopupSubmit = (): void => {
    if (popupReason.trim() === '') {
      setError('Nói gì đó đi bạn, đừng im lặng vậy chứ!!!');
      return;
    }

    if (currentIndex !== null && popupAction) {
      const action = popupAction === 'approve' ? 'Duyệt' : 'Không duyệt';
      console.log(`Lý do ${action}: ${popupReason}`);
      handleClose();
    }
  };

  const handlePopupChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setPopupReason(event.target.value);
    setError('');
  };

  const renderFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf color="red" />;
      case 'doc':
      case 'docx':
        return <FaFileWord color="blue" />;
      default:
        return <FaFileAlt />;
    }
  };

  if (isViewing && viewingIndex !== null) {
    return (
      <SuggestionAddView
        formDataList={[formDataList[viewingIndex]]}
        formDataListProcess={formDataListProcess}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.tableContainer}>
        <form className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                </th>
                <th style={{ width: '300px' }}>Nội dung</th>
                <th style={{ width: '200px' }}>Tài liệu</th>
                <th style={{ width: '100px' }}>Chi tiết</th>
                <th style={{ width: '180px' }}>Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {formDataList.map((formData, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => handleCheckboxChange(index)}
                    />
                  </td>
                  <td><input type="text" name="description" value={formData.description} readOnly /></td>
                  <td>
                    {formData.File.map((file, fileIndex) => (
                      <div key={fileIndex} className={styles.fileItem}>
                        {renderFileIcon(file.name)}
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                      </div>
                    ))}
                  </td>
                  <td>
                    <button type="button" onClick={() => handleView(index)}>
                      <FaEye color="blue" />
                    </button>
                  </td>
                  <td>
                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className={styles.btnApprove}
                        onClick={() => handleApprove(index)}
                      >
                        <FaCheck color="green" /> Duyệt
                      </button>
                      <button
                        type="button"
                        className={styles.btnReject}
                        onClick={() => handleReject(index)}
                      >
                        <FaTimes color="red" /> Không duyệt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      </div>
      {showPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h2>{popupAction === 'approve' ? 'Lý do Duyệt' : 'Lý do Không Duyệt'}</h2>
            <textarea
              value={popupReason}
              onChange={handlePopupChange}
              placeholder="Nhập lý do... "
            />
            {error && <p className={styles.errorText}>{error}</p>}
            <div className={styles.buttonContainer}>
              <button className={`${styles.submitBtn} ${styles.popupButton}`} onClick={handlePopupSubmit}>Xác nhận</button>
              <button className={`${styles.closeBtn} ${styles.popupButton}`} onClick={handleClose}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approval;
