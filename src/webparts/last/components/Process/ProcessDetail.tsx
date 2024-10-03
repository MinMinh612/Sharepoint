import React from 'react';
import styles from './Process.module.scss';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ISiteUserInfo } from '@pnp/sp/site-users';
import {IProcessItem, IProcessData } from './IProcessData';

interface IProcessDetailProps {
  formDataList: IProcessData[];
  formData: {
    ProcessLevelNumber: string;
    ProcessName: string;
    Title: string;
    Approver: string;
  };
  editable: boolean;
  context: WebPartContext;
}

interface IProcessDetailState {
  processLevels: number[];
  users: { id: number; title: string }[];
  approvers: { [level: number]: string };
  Title: string;
  ProcessName: string;
  NumberApporver: string;
  Approver: string;
  processDetails: { title: string; numberOfApproval: string; approver: string }[];
}

export default class ProcessDetail extends React.Component<IProcessDetailProps, IProcessDetailState> {
  constructor(props: IProcessDetailProps) {
    super(props);
    this.state = {
      processLevels: [],
      users: [],
      approvers: {},
      Title: '',
      ProcessName: '',
      NumberApporver: '',
      Approver: '',
      processDetails: [],
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.updateProcessLevels();
    await this.getUsers();
    await this.getProcessDetail();
  }

  public updateDetails = (newData: { Title: string, ProcessName: string, NumberApporver: string, Approver: string }): void => {
    this.setState({
      Title: newData.Title,
      ProcessName: newData.ProcessName,
      NumberApporver: newData.NumberApporver,
      Approver: newData.Approver
    });
  };

  public getUsers = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const groupUsers: ISiteUserInfo[] = await sp.web.siteUsers.filter("IsSiteAdmin eq false")();
      const userList = groupUsers.map((user: ISiteUserInfo) => ({
        id: user.Id,
        title: user.Title,
      }));
      this.setState({ users: userList });
    } catch (error) {
      console.error('Error fetching users from site:', error);
    }
  };

  public getProcessDetail = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const items = await sp.web.lists.getByTitle("ProcessDetail").items
        .select("Title", "NumberOfApproval", "Approver/Id", "Approver/Title")
        .expand("Approver")();
  
      const filteredItems = items.filter((item: IProcessItem) => item.Title === this.props.formData.Title);
  
      if (filteredItems.length > 0) {
        const processDetails = filteredItems.map((item: IProcessItem) => ({
          title: item.Title,
          numberOfApproval: item.NumberOfApproval,
          approver: item.Approver ? item.Approver.Id : ""
        }));
  
        const newApprovers = processDetails.reduce((acc: { [key: number]: string }, item) => {
          const level = parseInt(item.numberOfApproval, 10);
          if (!isNaN(level)) {
            acc[level] = item.approver || '';
          }
          return acc;
        }, {});
  
        this.setState({ processDetails, approvers: newApprovers });
      } else {
        // Nếu không có dữ liệu khớp, để ô nhập trống
        this.setState({ processDetails: [], approvers: {} });
      }
    } catch (error) {
      console.error('Error fetching process details:', error);
    }
  };

  public addProcessDetail = async (): Promise<void> => {
    const { formData } = this.props;
    const sp = spfi().using(SPFx(this.props.context));

    try {
        const processLevelNumber = parseInt(formData.ProcessLevelNumber, 10); // Lấy số cấp duyệt
        if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
            
            // Kiểm tra xem có mục nào với Title đã tồn tại không
            const existingItems = await sp.web.lists.getByTitle("ProcessDetail").items
                .filter(`Title eq '${formData.Title}'`)();

            for (let level = 1; level <= processLevelNumber; level++) {
                const approverId = this.state.approvers[level];

                // Kiểm tra xem có mục nào với Title và NumberOfApproval đã tồn tại không
                const existingItemForLevel = existingItems.find(item => 
                    item.Title === formData.Title && 
                    item.NumberOfApproval === `${level}`
                );

                if (existingItemForLevel) {
                    // Nếu đã có mục này, cập nhật người duyệt
                    await sp.web.lists.getByTitle("ProcessDetail").items.getById(existingItemForLevel.Id).update({
                        ApproverId: approverId ? parseInt(approverId, 10) : null
                    });
                    console.log(`Updated item for level ${level}`);
                } else {
                    // Nếu chưa có mục với NumberOfApproval tương ứng, thêm mới
                    await sp.web.lists.getByTitle("ProcessDetail").items.add({
                        Title: `${formData.Title}`,
                        NumberOfApproval: `${level}`,
                        ApproverId: approverId ? parseInt(approverId, 10) : null
                    });
                    console.log(`Added new item for level ${level}`);
                }
            }
        } else {
            console.error('Invalid ProcessLevelNumber');
        }
    } catch (error) {
        console.error('Error adding or updating item:', error);
    }
  };


  async componentDidUpdate(prevProps: IProcessDetailProps): Promise<void> {
    if (prevProps.formData.ProcessLevelNumber !== this.props.formData.ProcessLevelNumber) {
      this.updateProcessLevels();
    }

    if (prevProps.formData.Title !== this.props.formData.Title) {
      await this.getProcessDetail();
    }
  }

  updateProcessLevels = (): void => {
    const processLevelNumber = parseInt(this.props.formData.ProcessLevelNumber, 10);
    if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
      this.setState({
        processLevels: Array.from({ length: processLevelNumber }, (_, i) => i + 1),
      });
    } else {
      this.setState({ processLevels: [] });
    }
  };

  _handleApproverChange = (e: React.ChangeEvent<HTMLSelectElement>, level: number): void => {
    const selectedValue = e.target.value;
    this.setState((prevState) => ({
      approvers: { ...prevState.approvers, [level]: selectedValue }
    }));
  };

  renderProcessItems = (): JSX.Element[] => {
    const { formData, editable } = this.props;
    const { users, approvers } = this.state;
    
    return this.state.processLevels.map((level, i) => (
      <tr key={i}>
        <td>{formData.Title}</td>
        <td>{level}</td>
        <td>
          {editable ? (
            <select 
              name={`Approver${i}`} 
              value={approvers[level] || ''}  
              onChange={(e) => this._handleApproverChange(e, level)}
            >
              <option value="">Chọn người duyệt</option>
              {users.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.title}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {users.find((user) => user.id === parseInt(approvers[level], 10))?.title || 'Không có người duyệt'}
            </span>
          )}
        </td>
      </tr>
    ));
  };

  public render(): React.ReactElement {    
    return (
      <div>
        <h1>Chi tiết cấp duyệt</h1>
        <form className={styles.tableContainer}>
          <table className="table">
            <thead className="thead">
              <tr className="th">
                <th>Mã qui trình</th>
                <th>Cấp duyệt</th>
                <th>Tên người duyệt</th>
              </tr>
            </thead>
            <tbody>{this.renderProcessItems()}</tbody>
          </table>
        </form>
      </div>
    );
  }
}
