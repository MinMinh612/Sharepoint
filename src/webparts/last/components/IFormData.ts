export interface IFormData {
    [key: string]: string | boolean | number | File | undefined | string[];
    description: string;
    Amount: string;
    Price: string;
    Total: number;
    File?: File;
    Status: string;
    Approve: string;
    Counselors: string;
    CounselorNote: string;
    Approver1: string[];
    Approver1Note: string;
    Approver2: string;
    Approver2Note: string;


    descriptionLv1: string;
    AmountLv1: string;
    PriceLv1: string;
    TotalLv1: number;
    FileLv1?: File;
    CounselorsLv1: string;
    CounselorNoteLv1: string;
    Approver1Lv1: string[];
    Approver1NoteLv1: string;

  }
  

  export interface IFormDataProcess {
    [key: string]: string | boolean | number | File | undefined | string[];
    ProcessId: string;
    ProcessName: string;
    ProcessNote: string;
    ProcessLevelNumber: string;
    ProcessLevel: string;
    ProcessType: string;

    Approver:string[];

  }

  export type MergedFormData = IFormData & IFormDataProcess;