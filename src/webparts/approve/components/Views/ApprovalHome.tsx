import * as React from 'react';
import type { IFormData } from '../../../suggest/components/ISuggestProps';
import { FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import styles from './Approval.module.scss';

interface IApprovalHomeProps {
  formDataList: IFormData[];
}

const ApprovalHome: React.FC<IApprovalHomeProps> = ({
  formDataList,
}) => {

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

  return (
    <div className={styles.formContainer}>
      <div className={styles.tableContainer}>
        <form>
          <table>
            <thead>
              <tr>
                <th style={{ width: '250px' }}>Nội dung</th>
                <th style={{ width: '400px' }}>Tài liệu</th>
              </tr>
            </thead>
            <tbody>
              {formDataList.map((formData, index) => (
                <tr key={index}>
                  <td>
                    <input type="text" name="description" value={formData.description} readOnly />
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default ApprovalHome;
