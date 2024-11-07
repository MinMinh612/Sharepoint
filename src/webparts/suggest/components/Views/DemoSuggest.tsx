import * as React from 'react';
// import { FaFilePdf, FaFileWord, FaFileAlt, FaPaperclip  } from 'react-icons/fa';
import { FaPaperclip  } from 'react-icons/fa';
import styles from './Suggestion.module.scss';

export interface IDemoSuggestProps {
  suggestions: DataSuggest[];
  onSelectForEdit: (suggestion: DataSuggest | undefined) => void;
  onSelectionChange: (selectedSuggestions: DataSuggest[]) => void;
  clearSelection?: () => void;
}

export interface DataSuggest {
  Id: number;
  Title: string;
  Attachments?: { FileName: string; Url: string }[];
  Plan?: string; 
  DateTime?: string; 
  Emergency?: string; 
  Note?: string;
  ProcessName: string;
}

const DemoSuggest: React.FC<IDemoSuggestProps> = ({ suggestions, onSelectForEdit, onSelectionChange }) => {
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);
  // const [showMoreFiles, setShowMoreFiles] = React.useState<boolean>(false);

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


  // const renderFileIcon = (fileName: string): JSX.Element => {
  //   const extension = fileName.split('.').pop()?.toLowerCase();
  //   switch (extension) {
  //     case 'pdf':
  //       return <FaFilePdf color="red" />;
  //     case 'doc':
  //     case 'docx':
  //       return <FaFileWord color="blue" />;
  //     default:
  //       return <FaFileAlt />;
  //   }
  // };

  return (
    <div className={styles.formContainer}>
      <div className={styles.tableContainer}>
        <form className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Select</th>
                <th style={{ width: '300px', textAlign: 'left' }}>Nội dung</th>
                <th style={{ width: '200px' }}>Ngày</th>
                {/* <th style={{ width: '150px' }}>Kế hoạch</th> 
                <th style={{ width: '150px' }}>Khẩn cấp</th> 
                <th style={{ width: '300px' }}>Ghi chú</th>  */}
                <th style={{ width: '100px' }}>Tài liệu</th>
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
                      className={styles.circularCheckbox}
                    />
                  </td>
                  <td>
                    <input type="text" value={suggestion.Title} readOnly style={{ textAlign: 'left' }}/>
                  </td>
                  <td>
                    <input type="text" value={suggestion.DateTime} readOnly /> 
                  </td>
                  {/* <td>
                    <input type="text" value={suggestion.Plan} readOnly /> 
                  </td>
                  <td>
                    <input type="text" value={suggestion.Emergency} readOnly /> 
                  </td>
                  <td>
                    <textarea value={suggestion.Note} readOnly /> 
                  </td> */}
                  <td>
                    <div className={styles.attachmentContainer}>
                      {suggestion.Attachments?.slice(0, 1).map((file, fileIndex) => (
                        <div key={fileIndex} className={styles.attachmentItem}>
                            <div>
                              <FaPaperclip />
                            </div>
                        </div>
                      ))}
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
