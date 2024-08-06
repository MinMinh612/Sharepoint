import { IFormData } from '../../suggest/components/ISuggestProps';


export interface IApproveProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  formDataList: IFormData[];
  handleDeleteRow: (index: number) => void;
  editable: boolean;
  editRow: (index: number) => void;
  handleAddRow: () => void; 

}
