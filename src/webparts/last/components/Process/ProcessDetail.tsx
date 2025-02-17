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
import {IProcessItem } from './IProcessData';

interface IProcessDetailProps {
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
  approvers: { [key: string]: string[] }; // Sử dụng mảng các chuỗi (string[])
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
      // Lấy dữ liệu từ SharePoint list 'ProcessDetail'
      const items = await sp.web.lists.getByTitle("ProcessDetail").items
        .select("Title", "NumberOfApproval", "Approver/Id", "Approver/Title")
        .expand("Approver")();
  
      // Lọc các mục theo tiêu đề phù hợp
      const filteredItems = items.filter((item: IProcessItem) => item.Title === this.props.formData.Title);
  
      if (filteredItems.length > 0) {
        // Tạo dữ liệu từ các mục đã lọc
        const processDetails = filteredItems.map((item: IProcessItem) => ({
          title: item.Title,
          numberOfApproval: item.NumberOfApproval,
          approver: Array.isArray(item.Approver)
            ? item.Approver.map((user: ISiteUserInfo) => user.Id.toString()) // Nếu là mảng người dùng
            : item.Approver ? [item.Approver.Id.toString()] : [] // Nếu chỉ có một đối tượng duy nhất
        }));
  
        // Cập nhật trạng thái approvers với các dữ liệu đã lọc từ SharePoint
        const newApprovers = processDetails.reduce((acc: { [key: string]: string[] }, item) => {
          const isAdvisor = item.numberOfApproval.includes("Tham mưu");
          const level = isAdvisor 
              ? `advisor_${item.numberOfApproval.replace('Tham mưu cấp ', '')}`
              : item.numberOfApproval.replace('Cấp ', '');
  
          acc[level] = item.approver || [];
          return acc;
        }, {});
  
        // Cập nhật trạng thái mới của các chi tiết quy trình và người duyệt
        this.setState({ processDetails, approvers: newApprovers });
      } else {
        // console.log("Không tìm thấy dữ liệu khớp với tiêu đề");
        this.setState({ processDetails: [], approvers: {} });
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết quy trình:', error);
    }
  };
  
  public addProcessDetail = async (): Promise<void> => {
    const { formData } = this.props;
    const sp = spfi().using(SPFx(this.props.context));

    try {
        const processLevelNumber = parseInt(formData.ProcessLevelNumber, 10); // Lấy số cấp duyệt

        if (!isNaN(processLevelNumber) && processLevelNumber > 0) {
            // Kiểm tra xem Title đã tồn tại hay chưa
            const existingItems = await sp.web.lists.getByTitle("ProcessDetail").items
                .filter(`Title eq '${formData.Title}'`)();

            // Xóa các mục dư thừa nếu cấp duyệt thực tế nhỏ hơn cấp duyệt hiện tại
            const maxExistingLevel = existingItems.length;
            if (maxExistingLevel > processLevelNumber) {
                for (let level = processLevelNumber + 1; level <= maxExistingLevel; level++) {
                    const itemToDelete = existingItems.find(item => item.NumberOfApproval === `${level}` || item.NumberOfApproval === `Tham mưu cấp ${level}`);
                    if (itemToDelete) {
                        await sp.web.lists.getByTitle("ProcessDetail").items.getById(itemToDelete.Id).delete();
                    }
                }
            }

            // Xử lý thêm/cập nhật các mục cấp duyệt và tham mưu
            for (let level = 1; level <= processLevelNumber; level++) {
                const approverIds = this.state.approvers[level] || []; // Mảng các user ID
                const advisorIds = this.state.approvers[`advisor_${level}`] || []; // Mảng các user ID cho tham mưu

                // Gửi null nếu không có người duyệt hoặc mảng rỗng nếu có người duyệt
                const approverData = approverIds.length === 0 ? [] : approverIds.map(id => parseInt(id, 10));
                const advisorData = advisorIds.length === 0 ? [] : advisorIds.map(id => parseInt(id, 10));

                // Kiểm tra và cập nhật dòng tham mưu
                const existingAdvisorItem = existingItems.find(item => item.NumberOfApproval === `Tham mưu cấp ${level}`);
                if (existingAdvisorItem) {
                    await sp.web.lists.getByTitle("ProcessDetail").items.getById(existingAdvisorItem.Id).update({
                        ApproverId: advisorData // Mảng người tham mưu
                    });
                } else {
                    // Thêm mới nếu chưa tồn tại dòng tham mưu
                    await sp.web.lists.getByTitle("ProcessDetail").items.add({
                        Title: `${formData.Title}`,
                        NumberOfApproval: `Tham mưu cấp ${level}`,
                        ApproverId: advisorData // Mảng người tham mưu
                    });
                }
                // Kiểm tra và cập nhật dòng cấp duyệt chính
                const existingApproverItem = existingItems.find(item => item.NumberOfApproval === `${level}`);
                if (existingApproverItem) {
                    await sp.web.lists.getByTitle("ProcessDetail").items.getById(existingApproverItem.Id).update({
                        ApproverId: approverData // Mảng người duyệt chính
                    });
                } else {
                    // Thêm mới nếu chưa tồn tại dòng cấp duyệt
                    await sp.web.lists.getByTitle("ProcessDetail").items.add({
                        Title: `${formData.Title}`,
                        NumberOfApproval: `${level}`,
                        ApproverId: approverData // Mảng người duyệt chính
                    });
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

    return this.state.processLevels
        .map((level: number, i: number) => ([
            <tr key={`advisor_${i}`}>
                <td>{formData.Title}</td>
                <td>Tham mưu cấp {level}</td>
                <td>
                    {editable ? (
                        <Select
                            isMulti
                            name={`Advisor_${i}`}
                            value={userOptions.filter(option =>
                                (approvers[`advisor_${level}`] || []).includes(option.value)
                            )} // Lọc ra những user đã chọn cho tham mưu
                            options={userOptions} // Danh sách người dùng
                            onChange={(selectedOptions) => {
                                const selectedIds = selectedOptions.map(option => option.value);
                                this.setState((prevState) => ({
                                    approvers: { ...prevState.approvers, [`advisor_${level}`]: selectedIds }
                                }));
                            }}
                            placeholder="Nhập tên người tham mưu"
                        />
                    ) : (
                        <span>
                            {approvers[`advisor_${level}`] && approvers[`advisor_${level}`].length > 0
                                ? approvers[`advisor_${level}`].map(userId => users.find(user => user.id === parseInt(userId, 10))?.title || 'Không có tham mưu').join(', ')
                                : 'Không có tham mưu'}
                        </span>
                    )}
                </td>
            </tr>,
            <tr key={`approver_${i}`}>
                <td>{formData.Title}</td>
                <td>Cấp {level}</td>
                <td>
                    {editable ? (
                        <Select
                            isMulti
                            name={`Approver_${i}`}
                            value={userOptions.filter(option =>
                                (approvers[level] || []).includes(option.value)
                            )} // Lọc ra những user đã chọn cho cấp duyệt
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
        ]))
        .reduce((acc, val) => acc.concat(val), []); // Thay thế flatMap bằng map rồi reduce
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
