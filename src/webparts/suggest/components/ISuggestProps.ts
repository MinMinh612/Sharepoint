export interface ISuggestProps {
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

  Plan: string;
  Date: string;
  Emergency: string;
  File?: File;
  NoteSuggest: string

}

export interface IFormData {
  description: string;
  Plan: string;
  Date: string;
  Emergency: string;
  File: File | undefined;
  NoteSuggest: string;
}