import { WebPartContext } from '@microsoft/sp-webpart-base';
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
  NoteSuggest: string;
  StatusSuggestion: string;

  context: WebPartContext;

}

export interface IFormData {
  ProcessName: string;
  description: string;
  Plan: string;
  Date: string;
  Emergency: string;
  File: { name: string; url: string }[];  
  NoteSuggest: string;
  StatusSuggestion: string;
}

export interface Comment {
  id: number;
  displayName: string;
  avatarUrl: string;
  content: string;
}

export interface IComment {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
}

export interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

export interface dataSuggest {
  Id: number;
  Title: string;
  ProcessName: string;
  Attachments?: { FileName: string; Url: string }[];
}



