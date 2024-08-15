import * as React from 'react';
import { FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import styles from './Suggestion.module.scss';

export interface IDemoSuggestProps {
  suggestions: DataSuggest[];
}

export interface DataSuggest {
  Title: string;
  Attachments?: string[]; 
}

const DemoSuggest: React.FC<IDemoSuggestProps> = ({ suggestions }) => {

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
        <h1>Đề xuất</h1>
        <form className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>
                  <input type="checkbox" />
                </th>
                <th style={{ width: '200px' }}>Nội dung</th>
                <th style={{ width: '150px' }}>Tài liệu</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr key={index}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <input type="text" value={suggestion.Title} readOnly />
                  </td>
                  <td>
                    {suggestion.Attachments?.map((fileName, fileIndex) => (
                      <div key={fileIndex} className={styles.fileItem}>
                        {renderFileIcon(fileName)}
                        <a href="#" target="_blank" rel="noopener noreferrer">
                          {fileName}
                        </a>
                      </div>
                    )) || 'No attachments'}
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

export default DemoSuggest;
