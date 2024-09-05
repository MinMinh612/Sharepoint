import React from 'react';
import styles from './Process.module.scss';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ISiteUserInfo  } from '@pnp/sp/site-users'; 


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

interface IProcessData {
  ProcessLevelNumber: string;
  ProcessName: string;
  Approver?: string;
  Title: string;
}

interface IProcessDetailState {
  processLevels: number[];
  users: { id: number; title: string; Email: string; }[];
  approvers: { [level: number]: string };
}

export default class ProcessDetail extends React.Component<IProcessDetailProps, IProcessDetailState> {
  constructor(props: IProcessDetailProps) {
    super(props);
    this.state = {
      processLevels: [],
      users: [],
      approvers: {},
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.updateProcessLevels();
    await this.getUsers();
  }

  public getUsers = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      // Lấy danh sách người dùng từ SharePoint
      const groupUsers: ISiteUserInfo[] = await sp.web.siteUsers.filter("IsSiteAdmin eq false")();
  
      const userList = groupUsers.map((user: ISiteUserInfo) => ({
        id: user.Id,
        title: user.Title,
        Email: user.Email || '',  // Lấy email của người dùng, nếu không có thì để rỗng
      }));
  
      this.setState({ users: userList });
      console.log('Danh sách user:', userList)
    } catch (error) {
      console.error('Error fetching users from site:', error);
    }
  };

  
  public addProcessDetail = async (): Promise<void> => {
    const { formData } = this.props;  // Lấy dữ liệu từ props
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const processLevelNumber = parseInt(formData.ProcessLevelNumber, 10); // Lấy số cấp duyệt
      if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
  
        // Lặp qua từng cấp duyệt để thêm nhiều hàng tương ứng
        for (let level = 1; level <= processLevelNumber; level++) {
          // Lấy người duyệt từ mảng approvers theo cấp duyệt
          const approverId = this.state.approvers[level]; 
  
          console.log(`Approver ID being added for level ${level}:`, approverId);
  
          // Thêm dữ liệu vào danh sách với từng cấp duyệt
          const addItemResult = await sp.web.lists.getByTitle("ProcessDetail").items.add({
            Title: `${formData.Title}`,  // Cột Title
            NumberOfApproval: `${level}`,  // Cột NumberOfApproval
            ApproverId: approverId ? parseInt(approverId, 10) : null  // Cột Approver, sử dụng ID của người duyệt
          });
  
          console.log(`Item for level ${level} added successfully`, addItemResult);
        }
  
      } else {
        console.error('Invalid ProcessLevelNumber');
      }
    } catch (error) {
      console.error('Error adding item to list:', error);
    }
  };
        
  componentDidUpdate(prevProps: IProcessDetailProps): void {
    if (prevProps.formData.ProcessLevelNumber !== this.props.formData.ProcessLevelNumber) {
      this.updateProcessLevels();
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

  // Hàm cập nhật ApproverId vào formData khi người dùng chọn từ dropdown
  _handleApproverChange = async (e: React.ChangeEvent<HTMLSelectElement>, level: number): Promise<void> => {
    const selectedValue = e.target.value;  // Lấy giá trị được chọn
  
    // Kiểm tra nếu giá trị có định dạng email
    if (selectedValue.includes('@')) {
      console.log(`Selected Approver Email for level ${level}:`, selectedValue);
  
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        // Gọi API SharePoint để lấy thông tin người dùng dựa trên email
        const user = await sp.web.siteUsers.getByEmail(selectedValue)();
  
        if (user && user.Id) {
          console.log(`Selected Approver ID for level ${level}:`, user.Id);
          // Lưu ID người dùng vào mảng approvers theo cấp duyệt
          this.setState((prevState) => ({
            approvers: { ...prevState.approvers, [level]: user.Id.toString() }
          }));
        } else {
          console.error('User not found or invalid email');
        }
      } catch (error) {
        console.error('Error fetching user by email:', error);
      }
    } else {
      // Nếu không phải email, xử lý trường hợp chọn ID
      console.log(`Selected Approver ID for level ${level}:`, selectedValue);
  
      // Lưu thẳng ID vào mảng approvers theo cấp duyệt
      this.setState((prevState) => ({
        approvers: { ...prevState.approvers, [level]: selectedValue }
      }));
    }
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
          value={approvers[level] || ''}  // Hiển thị giá trị người duyệt cho cấp duyệt hiện tại
          onChange={(e) => this._handleApproverChange(e, level)}
        >
          <option value="">Chọn người duyệt</option>
          {users.map((user) => (
            <option key={user.id} value={user.Email || user.id.toString()}>
              {user.title} {user.Email ? `(${user.Email})` : '(ID: ' + user.id + ')'}
            </option>
          ))}
        </select>
      ) : (
        <span>{approvers[level]}</span>  // Hiển thị ID người duyệt cho cấp hiện tại
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
