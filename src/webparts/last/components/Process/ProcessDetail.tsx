import React from 'react';
import styles from './Process.module.scss';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 
import Select from 'react-select';
import { MultiValue } from 'react-select';
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
  approvers: { [level: number]: string[] }; // Sử dụng mảng các chuỗi (string[])
  Title: string;
  ProcessName: string;
  NumberApporver: string;
  Approver: string;
  processDetails: { title: string; numberOfApproval: string; approver: string[] }[];
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
                approver: Array.isArray(item.Approver)
                    ? item.Approver.map((user: ISiteUserInfo) => user.Id.toString()) // Nếu là mảng, duyệt qua để lấy ID
                    : item.Approver ? [item.Approver.Id.toString()] : [] // Nếu là đối tượng đơn, lấy ID của đối tượng đó
            }));

            console.log("Process details kết nối:", processDetails); // Kiểm tra dữ liệu sau khi map

            const newApprovers = processDetails.reduce((acc: { [key: number]: string[] }, item) => {
                const level = parseInt(item.numberOfApproval, 10);
                if (!isNaN(level)) {
                    acc[level] = item.approver || [];
                }
                return acc;
            }, {});

            console.log("Người duyệt mới:", newApprovers); // Kiểm tra dữ liệu mới của approvers

            this.setState({ processDetails, approvers: newApprovers });
        } else {
            console.log("No matching data found");
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
        console.log("Process Level Number:", processLevelNumber);

        if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
            const existingItems = await sp.web.lists.getByTitle("ProcessDetail").items
                .filter(`Title eq '${formData.Title}'`)();

            console.log("Existing items for Title:", formData.Title, existingItems);

            // Xóa các mục dư thừa nếu cấp duyệt thực tế nhỏ hơn cấp duyệt hiện tại
            const maxExistingLevel = existingItems.length;
            if (maxExistingLevel > processLevelNumber) {
                console.log(`Deleting levels greater than ${processLevelNumber}`);
                for (let level = processLevelNumber + 1; level <= maxExistingLevel; level++) {
                    const itemToDelete = existingItems.find(item => item.NumberOfApproval === `${level}`);
                    if (itemToDelete) {
                        console.log(`Deleting item for level ${level}, item ID: ${itemToDelete.Id}`);
                        await sp.web.lists.getByTitle("ProcessDetail").items.getById(itemToDelete.Id).delete();
                    }
                }
            }

            // Xử lý thêm/cập nhật các mục cấp duyệt
            for (let level = 1; level <= processLevelNumber; level++) {
                const approverIds = this.state.approvers[level] || []; // Mảng các user ID
                console.log(`Level ${level} approvers:`, approverIds);

                // Gửi null nếu không có người duyệt hoặc mảng rỗng nếu có người duyệt
                const approverData = approverIds.length === 0 ? [] : approverIds.map(id => parseInt(id, 10));
                console.log(`Approver data to send:`, approverData);

                const existingItemForLevel = existingItems.find(item =>
                    item.Title === formData.Title && 
                    item.NumberOfApproval === `${level}`
                );

                if (existingItemForLevel) {
                    console.log(`Updating existing item for level ${level}, item ID: ${existingItemForLevel.Id}`);
                    await sp.web.lists.getByTitle("ProcessDetail").items.getById(existingItemForLevel.Id).update({
                        ApproverId: approverData // Gửi null hoặc mảng các ID
                    });
                    console.log(`Updated item for level ${level}`);
                } else {
                    console.log(`Adding new item for level ${level}`);
                    await sp.web.lists.getByTitle("ProcessDetail").items.add({
                        Title: `${formData.Title}`,
                        NumberOfApproval: `${level}`,
                        ApproverId: approverData // Gửi null hoặc mảng các ID
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

  _handleApproverChange = (selectedOptions: MultiValue<{ value: string; label: string }>, level: number): void => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    this.setState((prevState) => ({
      approvers: { ...prevState.approvers, [level]: selectedIds }
    }));
  };


  renderProcessItems = (): JSX.Element[] => {
    const { formData, editable } = this.props;
    const { users, approvers } = this.state;

    const userOptions = users.map((user) => ({
        value: user.id.toString(),
        label: user.title,
    }));

    return this.state.processLevels.map((level, i) => (
        <tr key={i}>
            <td>{formData.Title}</td>
            <td>{level}</td>
            <td>
                {editable ? (
                    <Select
                        isMulti
                        name={`Approver${i}`}
                        value={userOptions.filter(option =>
                            (approvers[level] || []).includes(option.value)
                        )} // Lọc ra những user đã chọn
                        options={userOptions} // Danh sách người dùng
                        onChange={(selectedOptions) => {
                            const selectedIds = selectedOptions.map(option => option.value);
                            this.setState((prevState) => ({
                                approvers: { ...prevState.approvers, [level]: selectedIds }
                            }));
                        }}
                        placeholder="Nhập tên người duyệt"
                    />
                ) : (
                    <span>
                        {approvers[level] && approvers[level].length > 0
                            ? approvers[level].map(userId => users.find(user => user.id === parseInt(userId, 10))?.title || 'Không có người duyệt').join(', ')
                            : 'Không có người duyệt'}
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
                <th style={{ width: '200px' }}>Mã qui trình</th>
                <th style={{ width: '100px' }}>Cấp duyệt</th>
                <th style={{ width: 'auto' }}>Tên người duyệt</th>
              </tr>
            </thead>
            <tbody>{this.renderProcessItems()}</tbody>
          </table>
        </form>
      </div>
    );
  }
}
