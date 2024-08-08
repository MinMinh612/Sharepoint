import * as React from 'react';
import styles from './Last.module.scss';
import type { ILastProps } from './ILastProps';
import Process from './Process/Process';
import type { MergedFormData } from './IFormData';

interface ILastState {
  formDataList: MergedFormData[];
}

interface ILastPropsExtended extends ILastProps {
  approver1List: string[];
}

export default class Last extends React.Component<ILastPropsExtended, ILastState> {
  constructor(props: ILastPropsExtended) {
    super(props);
    this.state = {
      formDataList: [
        {
          currentUserEmail: '',
          description: '',
          Amount: '',
          Price: '',
          Total: 0,
          Status: '',
          Approve: '',
          Counselors: '',
          CounselorNote: '',
          Approver1: [],
          Approver1Note: '',
          Approver2: '',
          Approver2Note: '',
      
          descriptionLv1: '',
          AmountLv1: '',
          PriceLv1: '',
          TotalLv1: 0,
          CounselorsLv1: '',
          CounselorNoteLv1: '',
          Approver1Lv1: [],
          Approver1NoteLv1: '',
      
          ProcessId: '1',
          ProcessName: 'Qui trình duyệt 2 cấp',
          ProcessNote: 'Duyệt 2 cấp',
          ProcessLevelNumber: '2',
          ProcessLevel: '',
          ProcessType: '',
      
          Approver: ['minh', 'thanh']
        },
        {
          currentUserEmail: '',
          description: '',
          Amount: '',
          Price: '',
          Total: 0,
          Status: '',
          Approve: '',
          Counselors: '',
          CounselorNote: '',
          Approver1: [],
          Approver1Note: '',
          Approver2: '',
          Approver2Note: '',
      
          descriptionLv1: '',
          AmountLv1: '',
          PriceLv1: '',
          TotalLv1: 0,
          CounselorsLv1: '',
          CounselorNoteLv1: '',
          Approver1Lv1: [],
          Approver1NoteLv1: '',
      
          ProcessId: '2',
          ProcessName: 'Qui trình duyệt 3 cấp',
          ProcessNote: 'Duyệt 3 cấp',
          ProcessLevelNumber: '3',
          ProcessLevel: '',
          ProcessType: '',
      
          Approver: ['thanh', 'minh']
        }
      ],
    };
  }
  
  private setFormDataList = (formDataList: MergedFormData[]): void => {
    this.setState({ formDataList });
  };

  private handleInputChange = (index: number): ((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
      const { name, value, type } = event.target;
  
      const formDataList = [...this.state.formDataList];
      if (type === 'checkbox') {
        const checked = (event.target as HTMLInputElement).checked;
        formDataList[index][name] = checked;
      } else {
        formDataList[index][name] = value;
      }
  
      if (name === 'Amount' || name === 'Price') {
        const amount = parseFloat(formDataList[index].Amount) || 0;
        const price = parseFloat(formDataList[index].Price) || 0;
        formDataList[index].Total = amount * price;
      }
  
      this.setState({ formDataList }, () => {
        this.autoAddRow(index);
      });
    };
  };
  
  private addRow = (): void => {
    const formDataList = [...this.state.formDataList];
    formDataList.push({
      currentUserEmail: this.props.userEmail,
      description: '',
      Amount: '',
      Price: '',
      Total: 0,
      Status: '',
      Approve: '',
      Counselors: '',
      CounselorNote: '',
      Approver1: [],
      Approver1Note: '',
      Approver2: '',
      Approver2Note: '',

      descriptionLv1: '',
      AmountLv1: '',
      PriceLv1: '',
      TotalLv1: 0,
      CounselorsLv1: '',
      CounselorNoteLv1: '',
      Approver1Lv1: [],
      Approver1NoteLv1: '',

      ProcessId: '2', 
      ProcessName: 'Tài liệu', 
      ProcessNote: 'Qui trình duyệt tập đoàn', 
      ProcessLevelNumber: '3', 
      ProcessLevel: '',
      ProcessType: 'Tập đoàn',
  
      Approver: ['minh', 'thanh'] 
    });
    this.setState({ formDataList });
  };

  private autoAddRow = (index: number): void => {
    const { formDataList } = this.state;
    const lastIndex = formDataList.length - 1;
    if (index === lastIndex) {
      this.addRow();
    }
  };

  private handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] || undefined;
    const formDataList = [...this.state.formDataList];
    formDataList[index].File = file;
    this.setState({ formDataList });
  };

  private handleApproveAction = (index: number, isApproved: boolean): void => {
    const formDataList = [...this.state.formDataList];
    const { userEmail, approver1List } = this.props;

    if (isApproved && !formDataList[index].Approver1.includes(userEmail) && approver1List.includes(userEmail)) {
      formDataList[index].Approver1.push(userEmail);
    } else {
      formDataList[index].Approver1 = formDataList[index].Approver1.filter(email => email !== userEmail);
    }

    formDataList[index].Approve = isApproved ? 'Approved' : 'Rejected';
    this.setState({ formDataList });
  };

  private handleDeleteRow = (index: number): void => {
    this.setState((prevState) => {
      let formDataList = [...prevState.formDataList];
      if (formDataList.length > 1) {
        formDataList = formDataList.filter((_, i) => i !== index);
      } else {
        formDataList[index] = {
          currentUserEmail: this.props.userEmail,
          description: '',
          Amount: '',
          Price: '',
          Total: 0,
          Status: '',
          Approve: '',
          Counselors: '',
          CounselorNote: '',
          Approver1: [],
          Approver1Note: '',
          Approver2: '',
          Approver2Note: '',
          descriptionLv1: '',
          AmountLv1: '',
          PriceLv1: '',
          TotalLv1: 0,
          CounselorsLv1: '',
          CounselorNoteLv1: '',
          Approver1Lv1: [],
          Approver1NoteLv1: '',

          ProcessId: '1',
          ProcessName: 'Văn bản',
          ProcessNote: 'Qui trình duyệt chi nhánh',
          ProcessLevelNumber: '2',
          ProcessLevel: '',
          ProcessType: 'Nội bộ',

          Approver: ['minh', 'thanh']
        };
      }
      return { formDataList };
    });
  };

  public render(): React.ReactElement<ILastProps> {
    const { hasTeamsContext} = this.props;
    const { formDataList } = this.state;

    return (
      <section className={`${styles.last} ${hasTeamsContext ? styles.teams : ''}`}>
      <Process
        formDataList={formDataList}
        setFormDataList={this.setFormDataList}
        handleInputChange={this.handleInputChange}
        handleFileChange={this.handleFileChange}
        handleApproveAction={this.handleApproveAction}
        handleDeleteRow={this.handleDeleteRow}
        editable={true}
        addRow={this.addRow}
        editRow={function (index: number): void {
          throw new Error('Function not implemented.');
        }}
        onCancel={function (): void {
          throw new Error('Function not implemented.');
        }}
      />
      </section>
    );
  }
}
