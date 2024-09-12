import * as React from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import styles from './Process.module.scss';
import { spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 
import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProcessAddLevel from './ProcessAddLevel';

interface IProcessData {
  Id: number;
  Title: string;
  ProcessName: string;
  NumberApporver: string;
  ProcessType: string;
  Attachments?: { FileName: string; Url: string }[]; 
}

interface IProcessState {
  processData: IProcessData[];
  selectedProcesses: IProcessData[];
  showAddForm: boolean; // Thêm state để quản lý việc hiển thị ProcessAddLevel
  selectDataProcess: number[];
  selectedItem?: IProcessData;
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface ProcessData {
  Id: number;
  Title: string;
  ProcessName: string;
  NumberApporver: string;
  ProcessType: string;
}

interface IProcessItem {
  Title: string;
  NumberOfApproval: string;
  Approver: { Title: string } | undefined;
}

interface IProcessState {
  processDetails: { title: string; numberOfApproval: string; approver: string }[];
}

export default class Process extends React.Component<{ context: WebPartContext }, IProcessState> {
  constructor(props: { context: WebPartContext }) {
    super(props);
    this.state = {
      processData: [],
      selectedProcesses: [],
      showAddForm: false, 
      selectDataProcess: [],
      selectedItem: undefined, 
      processDetails: [],
    };
  }

  public async componentDidMount(): Promise<void> {
    await this.getProcess();
    await this.getProcessDetail();
  }

  // Hàm getProcess để lấy dữ liệu từ SharePoint
  public getProcess = async (): Promise<void> => {
    const listTitle = 'Process';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const items: ProcessData[] = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'ProcessName', 'NumberApporver', 'ProcessType')
        .expand('AttachmentFiles')();
  
      const processData: IProcessData[] = await Promise.all(items.map(async (item: ProcessData) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
  
        const attachmentLinks = attachments.length > 0
          ? attachments.map((attachment: IAttachment) => ({
            FileName: attachment.FileName,
            Url: attachment.ServerRelativeUrl,
          }))
          : [];
  
        return {
          Id: item.Id,
          Title: item.Title,
          ProcessName: item.ProcessName,
          NumberApporver: item.NumberApporver,
          ProcessType: item.ProcessType,
          Attachments: attachmentLinks,
        };
      }));
  
      this.setState({ processData });
    } catch (error) {
      console.error("Error retrieving data: ", error);
    }
  };

  public getProcessDetail = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      // Gọi API SharePoint để lấy danh sách dữ liệu
      const items = await sp.web.lists.getByTitle("ProcessDetail").items
        .select("Title", "NumberOfApproval", "Approver/Title")
        .expand("Approver")
        ();

      // Xử lý dữ liệu sau khi lấy
      const processDetails = items.map((item: IProcessItem) => ({
        title: item.Title,
        numberOfApproval: item.NumberOfApproval,
        approver: item.Approver ? item.Approver.Title : "No Approver",  // Check if Approver exists
      }));
  
      console.log('Process Details:', processDetails);
  
      // Bạn có thể setState hoặc xử lý dữ liệu tại đây
      this.setState({ processDetails });
  
    } catch (error) {
      console.error('Error fetching process details:', error);
    }
  };
  

  // Hàm để hiển thị ProcessAddLevel khi nhấn vào nút Thêm
  public handleShowAddForm = (): void => {
    this.setState({ showAddForm: true, selectedItem: undefined });
  };
  
  // Hàm để ẩn ProcessAddLevel khi người dùng hủy thêm mới
  public handleCancelAddForm = (): void => {
    this.setState({ showAddForm: false });
  };

  public handleShowEditForm = (item: IProcessData): void => {
    this.setState({ showAddForm: true, selectedItem: item });
  };

  //Chọn từng checkbox
  public handleCheckboxChange = (id: number): void => {
    const { selectDataProcess } = this.state;

    if (selectDataProcess.includes(id)) {
      // Nếu ID đã có trong danh sách chọn, loại bỏ nó
      this.setState({
        selectDataProcess: selectDataProcess.filter((selectedId) => selectedId !== id),
      });
    } else {
      // Nếu ID chưa có, thêm nó vào danh sách chọn
      this.setState({
        selectDataProcess: [...selectDataProcess, id],
      });
    }
  };

  // Hàm xóa các mục đã chọn
  public handleDeleteSelected = async (): Promise<void> => {
    const { selectDataProcess, processData } = this.state;
    const listTitle = 'Process';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      // Xóa từng mục được chọn
      for (const id of selectDataProcess) {
        await sp.web.lists.getByTitle(listTitle).items.getById(id).delete();
      }

      // Cập nhật lại danh sách dữ liệu sau khi xóa
      const updatedProcessData = processData.filter((item) => !selectDataProcess.includes(item.Id));
      this.setState({ processData: updatedProcessData, selectDataProcess: [] });
      alert('Deleted successfully!');
    } catch (error) {
      console.error("Error deleting items: ", error);
      alert('Failed to delete items.');
    }
  };

  //Chọn all checkbox
  public handleSelectAllChange = (): void => {
    const { processData, selectDataProcess } = this.state;
    if (selectDataProcess.length === processData.length) {
      this.setState({ selectDataProcess: [] }); // Bỏ chọn tất cả
    } else {
      const allIds = processData.map((item) => item.Id);
      this.setState({ selectDataProcess: allIds }); // Chọn tất cả
    }
  };
  

  public render(): React.ReactElement {
    const { processData, showAddForm, selectDataProcess, selectedItem } = this.state;

    return (
      <div className={styles.formContainer}>
        {showAddForm ? (
          <ProcessAddLevel 
            onCancel={this.handleCancelAddForm}
            context = {this.props.context}
            item={selectedItem} 
          />
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.btn} ${styles.btnAdd}`}
                onClick={this.handleShowAddForm}
              >
                <FaPlus color="green" /> Thêm
              </button>
              <button 
                className={`${styles.btn} ${styles.btnEdit}`}
                disabled={selectDataProcess.length !== 1}
                onClick={() => {
                  const item = processData.find(item => selectDataProcess.includes(item.Id));
                  if (item) {
                    this.handleShowEditForm(item); // Gọi hàm hiển thị View với dữ liệu để sửa
                  }
                }}              
                >
                <FaEdit color="orange" /> Sửa
              </button>
              <button 
              className={`${styles.btn} ${styles.btnDelete}`}
              onClick={this.handleDeleteSelected} 
              disabled={selectDataProcess.length === 0}
              >
                <FaTrash color="red" /> Xóa
              </button>
              <button className={`${styles.btn} ${styles.btnDelete}`} onClick={this.getProcess}>
                <FaSearch color="red" /> Tra cứu
                
              </button>
            </div>
            <form className={styles.tableContainer}>
              <table className="table">
                <thead className="thead">
                  <tr className="th">
                    <th style={{ width: '50px' }}>
                      <input 
                        type="checkbox" 
                        checked={this.state.selectDataProcess.length === processData.length && processData.length > 0} 
                        onChange={this.handleSelectAllChange}
                        />
                    </th>
                    <th style={{ width: '150px' }}>Mã qui trình</th>
                    <th style={{ width: '200px' }}>Tên qui trình</th>
                    <th style={{ width: '150px' }}>Số cấp duyệt</th>
                    <th style={{ width: '150px' }}>Loại qui trình</th>
                    <th style={{ width: '100px' }}>Chi tiết</th>
                  </tr>
                </thead> 
                <tbody>
                  {processData.length > 0 ? (
                    processData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectDataProcess.includes(item.Id)} 
                             onChange={() => this.handleCheckboxChange(item.Id)} 
                          />
                        </td>
                        <td>{item.Title}</td>
                        <td>{item.ProcessName}</td>
                        <td>{item.NumberApporver}</td>
                        <td>{item.ProcessType}</td>
                        <td>
                          <button type="button">
                            <FaEdit color="blue" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </form>
          </div>
        )}
      </div>
    );
  }
}
