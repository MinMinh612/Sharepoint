import * as React from 'react';
import { useState } from 'react';
import type { IFormData } from '../ISuggestProps';
import styles from './SuggestionAdd.module.scss';
import FooterButton from './FooterButton';
import { FaDownload } from 'react-icons/fa';
import { IFormDataProcess } from '../../../last/components/IFormData';

interface ISuggestionAddProps {
  formDataList: IFormData[];
  formDataListProcess: IFormDataProcess[];
  handleDeleteRow: (index: number) => void;
  editable: boolean;
  editRow: (index: number) => void;
  handleAddRow: (newData: IFormData) => void;
  onClose: () => void;
}

const SuggestionAdd: React.FC<ISuggestionAddProps> = ({
  formDataList,
  formDataListProcess,
  handleDeleteRow,
  editable,
  editRow,
  handleAddRow,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'content' | 'related' | 'flow'>('content');
  const [localFormDataList, setLocalFormDataList] = React.useState<IFormData[]>(formDataList);
  const [filePreviews, setFilePreviews] = useState<Map<number, { name: string; url: string }[]>>(new Map());
  const [currentStep, setCurrentStep] = React.useState<'draft' | 'advise' | 'approve' | 'issue'>('draft');




  const getStatusStepClass = (step: 'draft' | 'advise' | 'approve' | 'issue'): string => {
    if (currentStep === step) return `${styles.statusStep} ${styles.inProgress}`;
    return `${styles.statusStep} ${styles.default}`;
  };

  const handleInputChange = (index: number, name: string, value: string | File[]): void => {
    const updatedFormDataList = [...localFormDataList];
    
    if (name === 'File' && Array.isArray(value)) {
      const filesWithUrls = value.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      
      updatedFormDataList[index] = { ...updatedFormDataList[index], [name]: filesWithUrls };
      
      setFilePreviews(prev => {
        const newMap = new Map(prev);
        newMap.set(index, filesWithUrls);
        return newMap;
      });
    } else if (name === 'Date') {
      const date = new Date(value as string);
      updatedFormDataList[index] = { ...updatedFormDataList[index], [name]: date.toISOString().slice(0, 16) };
    } else {
      updatedFormDataList[index] = { ...updatedFormDataList[index], [name]: value as string };
    }
  
    setLocalFormDataList(updatedFormDataList);
  };
          
  const handleSave = (): void => {
    setCurrentStep('advise');
  };

  const handleDownload = (file: { name: string; url: string }): void => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div>
      <div className={styles.header}>
        <div className={getStatusStepClass('draft')}>
          <div className={styles.statusLabel}>Soạn thảo 123</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={getStatusStepClass('advise')}>
          <div className={styles.statusLabel}>Tham mưu</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={getStatusStepClass('approve')}>
          <div className={styles.statusLabel}>Phê duyệt</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={getStatusStepClass('issue')}>
          <div className={styles.statusLabel}>Ban hành</div>
          <div className={styles.statusCircle} />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('content')}
          >
            NỘI DUNG
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'related' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('related')}
          >
            LIÊN QUAN
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'flow' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            LƯU ĐỒ
          </button>
        </div>

        {activeTab === 'content' && (
          <div className={styles.content}>
            {localFormDataList.map((formData, index) => (
              <div key={index} className={styles.formGroup}>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Nội dung:
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Kế hoạch:
                    <select
                      name="Plan"
                      value={formData.Plan}
                      onChange={(e) => handleInputChange(index, 'Plan', e.target.value)}
                      className={styles.select}
                    >
                      <option value="BMI">BMI</option>
                      <option value="E-Office">E-Office</option>
                      <option value="Wallet">Wallet</option>
                      <option value="addNewPlan">Thêm kế hoạch mới</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    Ngày:
                    <input
                      type="datetime-local"
                      name="Date"
                      value={formData.Date}
                      onChange={(e) => handleInputChange(index, 'Date', e.target.value)}
                      className={styles.date}
                    />
                  </label>
                </div>
                <div className={styles.row}>
                <label className={styles.label}>
                    Tên quy trình:
                    <select
                      name="ProcessName"
                      value={formData.ProcessName || ''}
                      onChange={(e) => handleInputChange(index, 'ProcessName', e.target.value)}
                      className={styles.select}
                    >
                      <option value=""> </option>
                      {formDataListProcess.map((option, idx) => (
                        <option key={idx} value={option.ProcessName}>
                          {option.ProcessName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label}>
                    File:
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          handleInputChange(index, 'File', files);
                        }
                      }}
                    />
                    {filePreviews.get(index)?.map((preview, previewIndex) => (
                      <button
                        key={previewIndex}
                        className={styles.downloadButton}
                        onClick={() => handleDownload(localFormDataList[index].File[previewIndex])}
                      >
                        <FaDownload /> Download
                      </button>
                    ))}
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Trích yếu:
                    <textarea
                      name="NoteSuggest"
                      value={formData.NoteSuggest}
                      className={styles.textArea}
                      onChange={(e) => handleInputChange(index, 'NoteSuggest', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && (
          <div>
            <h3>Tab Liên quan</h3>
          </div>
        )}

        {activeTab === 'flow' && (
          <div>
            <h3>Tab Lưu đồ</h3>
          </div>
        )}
      </div>
      {/* <div>
        <SuggestionAddViewApprove comments={dataComments} />
      </div> */}
      <div className={styles.footer}>
        <FooterButton onClose={onClose} onSave={handleSave} />
      </div>
    </div>
  );
};

export default SuggestionAdd;
