import { WebPartContext } from '@microsoft/sp-webpart-base';


// interface của file Process.tsx
export interface IProcessData {
    Id: number;
    Title: string;
    ProcessName: string;
    NumberApporver: string;
    ProcessType: string;
    Attachments?: { FileName: string; Url: string }[];
    Approver?: string;  // Add Approver field
    ProcessLevelNumber?: string;  // Add ProcessLevelNumber field 
  }
  
export  interface IAttachment {
    FileName: string;
    ServerRelativeUrl: string;
  }
  
export  interface ProcessData {
    Id: number;
    Title: string;
    ProcessName: string;
    NumberApporver: string;
    ProcessType: string;
  }

export interface IProcessItem {
    Title: string;
    NumberOfApproval: string;
    Approver: { Id: string; Title: string } | undefined;
  }
  
  


export  interface IProcessAddLevelProps {
    onCancel: () => void;
    context: WebPartContext; // Truyền context để kết nối với SharePoint
    item?: IProcessData;
  }
  