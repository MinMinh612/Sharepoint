import * as React from 'react';
import type { IFormDataProcess } from '../IFormData';
import { useState, useEffect } from 'react';
import styles from './Process.module.scss';
import './ProcessAddLevel.module.scss'

interface IProcessDetailProps {
  formDataList: IFormDataProcess[];
  formData: IFormDataProcess;
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  editable: boolean;
  // onClose: () => void;
}

const ProcessDetail: React.FC<IProcessDetailProps> = ({
  formData,
  handleInputChange,
  editable,
  // onClose
}) => {
  const [processLevels, setProcessLevels] = useState<number[]>([]);

  useEffect(() => {
    const processLevelNumber = parseInt(formData.ProcessLevelNumber, 10);
    if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
      setProcessLevels(Array.from({ length: processLevelNumber }, (_, i) => i + 1));
    } else {
      setProcessLevels([]);
    }
  }, [formData.ProcessLevelNumber]);

  const renderProcessItems = (): JSX.Element[] => {
    return processLevels.map((level, i) => {
      const processName = formData.ProcessName || '';
      const approver = (formData[`Approver${i}`] || '').toString();

      return (
        <tr key={i} className="process-row">
          <td className="process-name">
            {editable ? (
              <input
                type="text"
                name={`ProcessName${i}`}
                value={processName}
                onChange={handleInputChange(i)}
                className="process-input"
              />
            ) : (
              <span className="process-value">{processName}</span>
            )}
          </td>
          <td className="process-level">
            <input
              type="text"
              name={`ProcessLevel${i}`}
              value={level.toString()}
              readOnly
              className="process-input"
            />
          </td>
          <td className="approver">
            <input
              type="text"
              name={`Approver${i}`}
              value={approver}
              onChange={handleInputChange(i)}
              className="process-input"
            />
          </td>
        </tr>
      );
    });
  };

  return (
      <div>
        <h1>Chi tiết cấp duyệt css</h1>
        <div className={styles.tableContainer}>
          <table className="table">
            <thead className="thead">
              <tr>
                <th style={{ width: '150px' }}>Mã qui trình</th>
                <th style={{ width: '150px' }}>Cấp duyệt</th>
                <th style={{ width: '150px' }}>Tên người duyệt</th>
              </tr>
            </thead>
            <tbody>{renderProcessItems()}</tbody>
          </table>
        </div>
      </div>
  );
};
export default ProcessDetail;