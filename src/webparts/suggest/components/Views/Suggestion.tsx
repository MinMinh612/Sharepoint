// import * as React from 'react';
// import type { IFormData } from '../ISuggestProps';
// import { FaEye, FaPlus, FaEdit, FaTrash, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
// import styles from './Suggestion.module.scss';
// import SuggestionAdd from './SuggestionAdd';
// import SuggestionAddView from './SuggestionAddView';
// import type { IFormDataProcess } from '../../../last/components/IFormData';
// // import { dataProcess } from '../../../Data';


// interface ISuggestionProps {
//   formDataList: IFormData[];
//   formDataListProcess: IFormDataProcess[];
//   handleDeleteRow: (index: number) => void;
//   editable: boolean;
//   editRow: (index: number) => void;
//   handleAddRow: (newData: IFormData) => void;
// }

// const Suggestion: React.FC<ISuggestionProps> = ({
//   formDataList,
//   formDataListProcess,
//   handleDeleteRow,
//   editable,
//   editRow,
//   handleAddRow,
// }) => {
//   const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
//   const [selectAll, setSelectAll] = React.useState(false);
//   const [isAdding, setIsAdding] = React.useState(false);
//   const [isViewing, setIsViewing] = React.useState(false);
//   const [viewingIndex, setViewingIndex] = React.useState<number | null>(null);
//   const [isEditing, setIsEditing] = React.useState(false);
//   const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
//   const [newFormData, setNewFormData] = React.useState<IFormData>({
//     ProcessName: '',
//     description: '',
//     Plan: '',
//     Date: '',
//     Emergency: '',
//     File: [],
//     NoteSuggest: '',
//     StatusSuggestion: '',
//   });



//   const handleCheckboxChange = (index: number): void => {
//     setSelectedRows((prevSelectedRows) => {
//       const newSelectedRows = new Set(prevSelectedRows);
//       if (newSelectedRows.has(index)) {
//         newSelectedRows.delete(index);
//       } else {
//         newSelectedRows.add(index);
//       }
//       return newSelectedRows;
//     });
//   };

//   const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
//     const checked = event.target.checked;
//     setSelectAll(checked);
//     if (checked) {
//       setSelectedRows(new Set(formDataList.map((_, index) => index)));
//     } else {
//       setSelectedRows(new Set());
//     }
//   };

//   const handleDeleteSelected = (): void => {
//     selectedRows.forEach((index) => handleDeleteRow(index));
//     setSelectedRows(new Set());
//     setSelectAll(false);
//   };

//   const handleClose = (): void => {
//     setIsAdding(false);
//     setIsViewing(false);
//     setIsEditing(false);
//   };

//   const handleAddNew = (): void => {
//     setNewFormData({
//       ProcessName: '',
//       description: '',
//       Plan: '',
//       Date: '',
//       Emergency: '',
//       File: [],
//       NoteSuggest: '',
//       StatusSuggestion: '',
//     });
//     setIsAdding(true);
//   };

//   const handleView = (index: number): void => {
//     setViewingIndex(index);
//     setIsViewing(true);
//   };

//   const handleEdit = (index: number): void => {
//     setEditingIndex(index);
//     setIsEditing(true);
//   };

//   const handleSaveNewSuggestion = (data: IFormData): void => {
//     handleAddRow(data);
//     setIsAdding(false);
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


//   if (isAdding) {
//     return (
//       <SuggestionAdd
//         formDataList={[newFormData]}
//         formDataListProcess={formDataListProcess}
//         handleDeleteRow={handleDeleteRow}
//         editable={true}
//         editRow={editRow}
//         handleAddRow={handleSaveNewSuggestion}
//         onClose={handleClose}
//       />
//     );
//   }

//   if (isViewing && viewingIndex !== null) {
//     return (
//       <SuggestionAddView
//         formDataList={[formDataList[viewingIndex]]}
//         formDataListProcess={formDataListProcess}
//         onClose={handleClose}
//       />
//     );
//   }

//   if (isEditing && editingIndex !== null) {
//     return (
//       <SuggestionAdd
//         formDataList={[formDataList[editingIndex]]}
//         formDataListProcess={formDataListProcess}
//         handleDeleteRow={handleDeleteRow}
//         editable={false}
//         editRow={editRow}
//         handleAddRow={handleAddRow}
//         onClose={handleClose}
//       />
//     );
//   }

//   return (
//     <div className={styles.formContainer}>
//       <div className={styles.tableContainer}>
//         <div className={styles.actionButtons}>
//           <button
//             onClick={handleAddNew}
//             disabled={!editable}
//             className={`${styles.btn} ${styles.btnAdd}`}
//           >
//             <FaPlus color="green" /> Thêm
//           </button>
//           <button
//             onClick={() => selectedRows.size === 1 && handleEdit(Array.from(selectedRows)[0])}
//             disabled={!editable || selectedRows.size !== 1}
//             className={`${styles.btn} ${styles.btnEdit}`}
//           >
//             <FaEdit color="orange" /> Sửa
//           </button>
//           <button
//             onClick={handleDeleteSelected}
//             disabled={selectedRows.size === 0 || !editable}
//             className={`${styles.btn} ${styles.btnDelete}`}
//           >
//             <FaTrash color="red" /> Xóa
//           </button>
//         </div>
//         <h1>Đề xuất</h1>
//         <form className={styles.tableContainer}>
//           <table>
//             <thead>
//               <tr>
//                 <th>
//                   <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
//                 </th>
//                 <th style={{ width: '200px' }}>Nội dung</th>
//                 <th style={{ width: '150px' }}>Kế hoạch</th>
//                 <th style={{ width: '150px' }}>Ngày</th>
//                 <th style={{ width: '150px' }}>Độ ưu tiên</th>
//                 <th style={{ width: '150px' }}>Tài liệu</th>
//                 <th style={{ width: '100px' }}>Chi tiết</th>
//               </tr>
//             </thead>
//             <tbody>
//               {formDataList.map((formData, index) => (
//                 <tr key={index}>
//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={selectedRows.has(index)}
//                       onChange={() => handleCheckboxChange(index)}
//                     />
//                   </td>
//                   <td><input type="text" name="description" value={formData.description} readOnly /></td>
//                   <td><input type="text" name="Plan" value={formData.Plan} readOnly /></td>
//                   <td><input type="text" name="Date" value={formData.Date} readOnly /></td>
//                   <td><input type="text" name="Emergency" value={formData.Emergency} readOnly /></td>
//                   <td>                    
//                     {formData.File.map((file, fileIndex) => (
//                       <div key={fileIndex} className={styles.fileItem}>
//                         {renderFileIcon(file.name)}
//                         <a href={file.url} target="_blank" rel="noopener noreferrer">
//                           {file.name}
//                         </a>
//                       </div>
//                     ))}
//                   </td>
//                   <td>
//                     <button type="button" onClick={() => handleView(index)}>
//                       <FaEye color="blue" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Suggestion;
