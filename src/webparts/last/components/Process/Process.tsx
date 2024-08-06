import * as React from 'react';
import type { IFormDataProcess } from '../IFormData';
import { FaEye, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ProcessAddLevel from './ProcessAddLevel';
import styles from './Process.module.scss';

interface IProcessProps {
  formDataList: IFormDataProcess[];
  setFormDataList: React.Dispatch<React.SetStateAction<IFormDataProcess[]>>;
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleApproveAction: (index: number, isApproved: boolean) => void;
  handleDeleteRow: (index: number) => void;
  editable: boolean;
  addRow: () => void;
  editRow: (index: number) => void;
  onCancel: () => void;
}

const Process: React.FC<IProcessProps> = ({
  formDataList,
  setFormDataList,
  handleInputChange,
  handleFileChange,
  handleApproveAction,
  handleDeleteRow,
  editable,
  addRow,
  editRow,
  onCancel
}) => {  
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [newFormData, setNewFormData] = React.useState<IFormDataProcess>({
    ProcessId: '',
    ProcessName: '',
    ProcessNote: '',
    ProcessLevelNumber: '',
    ProcessLevel: '',
    ProcessType: '',
    Approver: []
  });

  if (!Array.isArray(formDataList)) {
    console.error('formDataList is not an array', formDataList);
    return null; // Hoặc xử lý lỗi khác
  }

  const showDetail = (index: number): void => {
    setNewFormData(formDataList[index]); // Set the form data to be edited
    setIsAdding(true); // Show ProcessAddLevel
  };

  const hideDetail = (): void => {
    setIsAdding(false);
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

  const handleCheckboxChange = (index: number): void => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      return newSelectedRows;
    });
  };

  const handleDeleteSelected = (): void => {
    selectedRows.forEach(index => handleDeleteRow(index));
    setSelectedRows(new Set());
    setSelectAll(false);
  };

  const handleAddRow = (): void => {
    setNewFormData({
      ProcessId: '',
      ProcessName: '',
      ProcessNote: '',
      ProcessLevelNumber: '',
      ProcessLevel: '',
      ProcessType: '',
      Approver: []
    });
    setIsAdding(true);
  };

  const handleSaveNewProcess = (data: IFormDataProcess): void => {
    setFormDataList(prevList => [...prevList, data]);
    window.alert('Dữ liệu đã được thêm thành công!');
    setIsAdding(false);
  };

  const handleEdit = (index: number): void => {
    setNewFormData(formDataList[index]); // Set the form data to be edited
    setIsAdding(true); // Show ProcessAddLevel for editing
  };

  return (
    <div className={styles.formContainer}>
      {isAdding ? (
        <ProcessAddLevel
          formData={newFormData}
          onSave={handleSaveNewProcess}
          editable={editable}
          onCancel={hideDetail}
        />
      ) : (
        <div className={styles.tableContainer}>
          <>
            <div className={styles.actionButtons}>
              <button onClick={handleAddRow} disabled={!editable} className={`${styles.btn} ${styles.btnAdd}`}>
                <FaPlus color="green" /> Thêm
              </button>
              <button
                onClick={() => selectedRows.size === 1 && handleEdit(Array.from(selectedRows)[0])}
                disabled={!editable || selectedRows.size !== 1}
                className={`${styles.btn} ${styles.btnEdit}`}
              >
                <FaEdit color="orange" /> Sửa
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedRows.size === 0 || !editable}
                className={`${styles.btn} ${styles.btnDelete}`}
              >
                <FaTrash color="red" /> Xóa
              </button>
            </div>
            <form className={styles.tableContainer}>
              <table className="table">
                <thead className="thead">
                  <tr className="th">
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                      />
                    </th>
                    <th style={{ width: '150px' }}>Mã qui trình</th>
                    <th style={{ width: '150px' }}>Tên qui trình</th>
                    <th style={{ width: '150px' }}>Số cấp duyệt</th>
                    <th style={{ width: '150px' }}>Loại qui trình</th>
                    <th style={{ width: '100px' }}>Chi tiết</th>
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
                          disabled={!editable}
                        />
                      </td>
                      <td><input type="text" name="ProcessName" value={formData.ProcessName} readOnly /></td>
                      <td><input type="text" name="ProcessNote" value={formData.ProcessNote} readOnly /></td>
                      <td><input type="text" name="ProcessLevelNumber" value={formData.ProcessLevelNumber} readOnly /></td>
                      <td>
                        <select
                          name="ProcessType"
                          value={formData.ProcessType}
                          onChange={handleInputChange(index)}
                          disabled 
                        >
                          <option value="Nội bộ">Nội bộ</option>
                          <option value="Khu vực">Khu vực</option>
                          <option value="Tập đoàn">Tập đoàn</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => showDetail(index)}
                        >
                          <FaEye color="blue" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </form>
          </>
        </div>
      )}
    </div>
  );
};

export default Process;
