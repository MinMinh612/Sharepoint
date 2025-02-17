import { IFormData } from '../../suggest/components/ISuggestProps';
import { WebPartContext } from '@microsoft/sp-webpart-base';


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
  context: WebPartContext;
}

export interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

export interface ICommentForApprove {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
  isApprove: string;
  CommentApprover: string;
}


export interface DataSuggest {
  Status: string;
  Plan: string;
  DateTime: string;
  Emergency: string;
  Note: string;
  Id: number;
  Title: string;
  ProcessName: string;
  Attachments: { FileName: string; Url: string }[];
}


export interface IComment {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string; avatarUrl?: string }[];
  isApprove: string;
  CommentApprover: string;
}



