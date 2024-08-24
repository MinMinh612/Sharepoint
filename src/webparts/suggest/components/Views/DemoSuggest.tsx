import * as React from 'react';
import { FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import styles from './Suggestion.module.scss';

export interface IDemoSuggestProps {
  suggestions: DataSuggest[];
  onSelectForEdit: (suggestion: DataSuggest | undefined) => void;
  onSelectionChange: (selectedSuggestions: DataSuggest[]) => void;
}

export interface DataSuggest {
  Title: string;
  Attachments?: { FileName: string; Url: string }[];
}

const DemoSuggest: React.FC<IDemoSuggestProps> = ({ suggestions, onSelectForEdit, onSelectionChange }) => {
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);
  const [showMoreFiles, setShowMoreFiles] = React.useState<boolean>(false);

  const handleCheckboxChange = (index: number, isChecked: boolean): void => {
    let updatedSelectedIndices: number[];
  
    if (isChecked) {
      updatedSelectedIndices = [...selectedIndices, index];
    } else {
      updatedSelectedIndices = selectedIndices.filter(i => i !== index);
    }
  
    console.log('Checkbox Change:', { index, isChecked, updatedSelectedIndices });
    
    setSelectedIndices(updatedSelectedIndices);
    onSelectionChange(updatedSelectedIndices.map(i => suggestions[i]));
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

  return (
    <div className={styles.formContainer}>
      <div className={styles.tableContainer}>
        <h1>Đề xuất</h1>
        <form className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Select</th>
                <th style={{ width: '200px' }}>Nội dung nè 3</th>
                <th style={{ width: '300px' }}>Tài liệu</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr key={index}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIndices.includes(index)}
                      onChange={(e) => handleCheckboxChange(index, e.target.checked)} 
                    />
                  </td>
                  <td>
                    <input type="text" value={suggestion.Title} readOnly />
                  </td>
                  <td>
                    <div className={styles.attachmentContainer}>
                      {suggestion.Attachments?.slice(0, 3).map((file, fileIndex) => (
                        <div key={fileIndex} className={styles.attachmentItem}>
                          <div className={styles.attachmentIcon}>
                            {renderFileIcon(file.FileName)}
                          </div>
                          <div className={styles.attachmentLink}>
                            <a href={file.Url} target="_blank" rel="noopener noreferrer">
                              {file.FileName}
                            </a>
                          </div>
                        </div>
                      ))}
                      {suggestion.Attachments && suggestion.Attachments.length > 3 && (
                        <button className={styles.showMoreButton} onClick={() => setShowMoreFiles(true)}>
                          Hiển thị thêm
                        </button>
                      )}
                      {showMoreFiles && (
                        <div className={styles.additionalFiles}>  
                          {suggestion.Attachments?.slice(3).map((file, fileIndex) => (
                            <div key={fileIndex} className={styles.attachmentItem}>
                              <div className={styles.attachmentIcon}>
                                {renderFileIcon(file.FileName)}
                              </div>
                              <div className={styles.attachmentLink}>
                                <a href={file.Url} target="_blank" rel="noopener noreferrer">
                                  {file.FileName}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
