// import * as React from 'react';
// import type { IFormData } from '../ISuggestProps';
// import styles from './SuggestionAdd.module.scss';
// // import FooterButton from './FooterButton';
// import type { IFormDataProcess } from '../../../last/components/IFormData';
// import { FaDownload, FaShare, FaPrint, FaTimes, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
// import SuggestionAddViewApprove from './SuggestionViewApprove'

// interface ISuggestionAddViewProps {
//   formDataList: IFormData[];
//   formDataListProcess: IFormDataProcess[];
//   onClose: () => void;
// }

// const SuggestionAddView: React.FC<ISuggestionAddViewProps> = ({
//   formDataList,
//   formDataListProcess,
//   onClose,
// }) => {
//   const dataComments = [
//     {
//       id: 1,
//       displayName: 'Trưởng nhóm dự án',
//       avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
//       content: 'Ổn áp'
//     },
//     {
//       id: 2,
//       displayName: 'Trưởng phòng',
//       avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
//       content: 'Được phết'
//     }
//   ];

//   const [activeTab, setActiveTab] = React.useState<'content' | 'related' | 'flow'>('content');
//   const [currentStep] = React.useState<'draft' | 'advise' | 'approve' | 'issue'>('draft');

//   const getStatusStepClass = (step: 'draft' | 'advise' | 'approve' | 'issue'): string => {
//     if (currentStep === step) return `${styles.statusStep} ${styles.inProgress}`;
//     return `${styles.statusStep} ${styles.default}`;
//   };

//   const handleDownload = (url: string, fileName: string): void => {
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = fileName;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   };

//   const renderFileIcon = (fileName: string): JSX.Element => {
//     const extension = fileName.split('.').pop()?.toLowerCase();
//     switch (extension) {
//       case 'pdf':
//         return <FaFilePdf color="red" />;
//       case 'doc':
//       case 'docx':
//         return <FaFileWord color="blue" />;
//       default:
//         return <FaFileAlt />;
//     }
//   };

//   const formatDate = (dateString: string): string => {
//     const [day, month, year, time] = dateString.split(/[/\s:]/);
//     return `${year}-${month}-${day}T${time}`;
//   };

//   return (
//     <div>
//       <div className={styles.header}>
//         <div className={getStatusStepClass('draft')}>
//           <div className={styles.statusLabel}>Soạn thảo</div>
//           <div className={styles.statusCircle} />
//         </div>
//         <div className={styles.connector} />
//         <div className={getStatusStepClass('advise')}>
//           <div className={styles.statusLabel}>Tham mưu</div>
//           <div className={styles.statusCircle} />
//         </div>
//         <div className={styles.connector} />
//         <div className={getStatusStepClass('approve')}>
//           <div className={styles.statusLabel}>Phê duyệt</div>
//           <div className={styles.statusCircle} />
//         </div>
//         <div className={styles.connector} />
//         <div className={getStatusStepClass('issue')}>
//           <div className={styles.statusLabel}>Ban hành</div>
//           <div className={styles.statusCircle} />
//         </div>
//       </div>
//       <div className={styles.body}>
//         <div className={styles.tabs}>
//           <button
//             className={`${styles.tab} ${activeTab === 'content' ? styles.activeTab : ''}`}
//             onClick={() => setActiveTab('content')}
//           >
//             NỘI DUNG
//           </button>
//           <button
//             className={`${styles.tab} ${activeTab === 'related' ? styles.activeTab : ''}`}
//             onClick={() => setActiveTab('related')}
//           >
//             LIÊN QUAN
//           </button>
//           <button
//             className={`${styles.tab} ${activeTab === 'flow' ? styles.activeTab : ''}`}
//             onClick={() => setActiveTab('flow')}
//           >
//             LƯU ĐỒ
//           </button>
//         </div>

//         {activeTab === 'content' && (
//           <div className={styles.content}>
//             {formDataList.map((formData, index) => (
//               <div key={index} className={styles.formGroup}>
//                 <div className={styles.row}>
//                   <label className={styles.label}>
//                     Nội dung:
//                     <input 
//                       type="text" 
//                       name="description" 
//                       value={formData.description} 
//                       readOnly 
//                     />
//                   </label>
//                   <label className={styles.label}>
//                     Kế hoạch:
//                     <select 
//                       name="Plan" 
//                       value={formData.Plan} 
//                       className={styles.select}
//                       disabled
//                     >
//                       <option value="BMI">BMI</option>
//                       <option value="E-Office">E-Office</option>
//                       <option value="Wallet">Wallet</option>
//                       <option value="addNewPlan">Thêm kế hoạch mới</option>
//                     </select>
//                   </label>
//                   <label className={styles.label}>
//                   Ngày:
//                   <input type="datetime-local" name="Date" 
//                   value={formatDate(formData.Date)} readOnly className={styles.date}/>
//                 </label>
//                 </div> 
//                 <div className={styles.row}>
//                   <label className={styles.label}>
//                     Tên quy trình:
//                     <select 
//                       name="ProcessName" 
//                       value={formData.ProcessName || ''} 
//                       className={styles.select}
//                       disabled
//                     >
//                       <option value="">Chọn quy trình</option>
//                       {formDataListProcess.map((option, idx) => (
//                         <option key={idx} value={option.ProcessName}>
//                           {option.ProcessName}
//                         </option>
//                       ))}
//                     </select>
//                   </label>
//                   <label className={styles.label}>
//                     File:
//                     <div className={styles.fileContainer}>
//                       {formData.File.map((file, fileIndex) => (
//                         <div key={fileIndex} className={styles.fileItem}>
//                           {renderFileIcon(file.name)}
//                           <a href={file.url} target="_blank" rel="noopener noreferrer">
//                             {file.name}
//                           </a>
//                           <FaDownload
//                             className={styles.downloadButton}
//                             onClick={() => handleDownload(file.url, file.name)}
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   </label>
//                 </div>
//                 <div className={styles.row}>
//                   <label className={styles.label}>
//                     Trích yếu:
//                     <textarea
//                       name="NoteSuggest"
//                       value={formData.NoteSuggest}
//                       className={styles.textArea}
//                       readOnly
//                     />
//                   </label>
//                 </div>
//               </div>
//             ))}
//             <div>
//               <h2>Danh sách đã duyệt</h2>
//               <SuggestionAddViewApprove comments={dataComments} />
//             </div>
//           </div>
        
//         )}
//         {activeTab === 'related' && (
//           <div>
//             <h3>Tab Liên quan</h3>
//           </div>
//         )}

//         {activeTab === 'flow' && (
//           <div>
//             <h3>Tab Lưu đồ</h3>
//           </div>
//         )}
//       </div>
//       <div className={styles.formContainer}>
//         <div className={styles.actionButtons}>
//           <button className={`${styles.btn} ${styles.btnShare}`}>
//             <FaShare color="blue" /> Chia sẻ
//           </button>
//           <button className={`${styles.btn} ${styles.btnPrint}`}>
//             <FaPrint color="blue" /> In
//           </button>
//           <button className={`${styles.btn} ${styles.btnClose}`} onClick={onClose}>
//             <FaTimes color="gray" /> Đóng
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SuggestionAddView;
