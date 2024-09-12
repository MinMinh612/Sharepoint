import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import styles from './ProcessAddLevel.module.scss';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProcessDetail from './ProcessDetail';

interface IProcessAddLevelProps {
  onCancel: () => void;
  context: WebPartContext; // Truyền context để kết nối với SharePoint
  item?: IProcessData;
}

interface IProcessData {
  Id: number;
  Title: string;
  ProcessName: string;
  NumberApporver: string;
  ProcessType: string;
}


interface IProcessAddLevelState {
  Title: string; 
  ProcessName: string; 
  ProcessType: string;
  NumberApporver: string;
  itemId?: number;
  successMessage: boolean;
  Approver: string;
  processDetails: { title: string; numberOfApproval: string; approver: string }[];
}

interface IProcessItem {
  Title: string;
  NumberOfApproval: string;
  Approver: { Title: string } | undefined;
}


export default class ProcessAddLevel extends React.Component<IProcessAddLevelProps, IProcessAddLevelState> {
  processDetailRef: React.RefObject<ProcessDetail>; //Gọi hàm của file ProcessDetail

  constructor(props: IProcessAddLevelProps) {
    super(props);
    this.state = {
      Title: props.item ? props.item.Title : '', 
      ProcessName: props.item ? props.item.ProcessName : '', 
      ProcessType: props.item ? props.item.ProcessType : 'Nội bộ',
      NumberApporver: props.item ? props.item.NumberApporver : '',
      itemId: props.item ? props.item.Id : undefined,
      successMessage: false,
      Approver: '',
      processDetails: [],
    };
    this.processDetailRef = React.createRef();  
  }

  // Hàm thêm mới Process vào danh sách (k có try catch do kiểu j cũng lỗi keke)
  private async addProcess(): Promise<void> {
    const { Title, ProcessName, ProcessType, NumberApporver, itemId } = this.state;
    const listTitle = 'Process'; 
    const sp = spfi().using(SPFx(this.props.context));

    const fieldsToUpdate = {
        Title, // Mã qui trình
        ProcessName, // Tên qui trình
        ProcessType, // Loại qui trình
        NumberApporver // Số cấp duyệt 
    };

    if (itemId) {
        // Nếu có itemId, cập nhật mục hiện có
        await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update(fieldsToUpdate);
    } else {
        // Nếu không có itemId, tạo mới mục
        const addItemResult = await sp.web.lists.getByTitle(listTitle).items.add(fieldsToUpdate);
        
        const newItemId = addItemResult?.data?.ID || addItemResult?.data?.Id;

        if (newItemId) {
            this.setState({ itemId: newItemId });
        }
    }

    // Cập nhật trạng thái để hiển thị thông báo thành công
    this.setState({ successMessage: true });

    // Gọi hàm addProcessDetail từ ProcessDetail sau khi addProcess hoàn thành
    if (this.processDetailRef.current) {
      console.log('Vô hàm')
      await this.processDetailRef.current.addProcessDetail();  // Call the addProcessDetail method
    }

    // Tự động ẩn thông báo sau 2 giây
    setTimeout(() => {
        this.setState({ successMessage: false });
    }, 2000);
}

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

    console.log('Chi tiết Process:', processDetails);

    // Bạn có thể setState hoặc xử lý dữ liệu tại đây
    this.setState({ processDetails });

  } catch (error) {
    console.error('Error fetching process details:', error);
  }
};


  // Xử lý sự kiện khi người dùng thay đổi giá trị input
  private handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = event.target;

    switch (name) {
      case "Title": // Mã qui trình
        this.setState({ Title: value });
        break;
      case "ProcessName": // Tên qui trình
        this.setState({ ProcessName: value });
        break;
      case "ProcessType":
        this.setState({ ProcessType: value });
        break;
      case "NumberApporver":
        this.setState({ NumberApporver: value });
        break;
      default:
        break;
    }

    const removeDiacriticsAndSpaces = (str: string): string => {
      return str
        .normalize("NFD") // Chuyển sang dạng Unicode tổ hợp
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
        .replace(/\s+/g, ""); // Loại bỏ khoảng trắng
    };
  
    const cleanValue = name === "Title" ? removeDiacriticsAndSpaces(value) : value;

    switch (name) {
      case "Title": // Mã qui trình
        this.setState({ Title: cleanValue });
        break;
    }
  };

  public async componentDidMount(): Promise<void> {
    await this.getProcessDetail();
  }


  public render(): React.ReactElement {
    const { Title, ProcessName, ProcessType, NumberApporver } = this.state;

    return (
      <div>
        {this.state.successMessage && (
          <div className={styles.successMessage}>
            Dữ liệu đã lưu thành công!
          </div>
        )}
        <div className={styles.actionButtonsAdd}>
          <div className="buttons">
            <button
              type="button"
              className={`${styles.btn} ${styles.btnAdd}`}
              onClick={() => this.addProcess()} 
            >
              <FaPlus /> Lưu
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnCancel}`}
              onClick={this.props.onCancel}
            >
              <FaTimes color="red" /> Hủy
            </button>
          </div>
        </div>
        <div className={styles.formContainerAdd}>
          <form id="process-form">
            <div className={styles.formGroup}>
              <label htmlFor="Title">Mã qui trình</label>
              <input
                type="text"
                id="Title"
                name="Title" 
                value={Title}
                onChange={this.handleInputChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ProcessName">Tên qui trình</label>
              <input
                type="text"
                id="ProcessName"
                name="ProcessName" // Đặt name là "ProcessName" cho Tên qui trình
                value={ProcessName}
                onChange={this.handleInputChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ProcessType">Loại qui trình</label>
              <select
                id="ProcessType"
                name="ProcessType"
                value={ProcessType}
                onChange={this.handleInputChange}
              >
                <option value="Nội bộ">Nội bộ</option>
                <option value="Khu vực">Khu vực</option>
                <option value="Tập đoàn">Tập đoàn</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="NumberApporver">Số cấp duyệt</label>
              <input
                type="text"
                id="NumberApporver"
                name="NumberApporver"
                value={NumberApporver}
                onChange={this.handleInputChange}
              />
              {parseInt(NumberApporver, 10) > 4 && (
                <div className={styles.warning}>Bạn đang chọn lớn hơn 4 cấp duyệt</div>
              )}
            </div>
          </form>
        </div>
        <ProcessDetail
          ref={this.processDetailRef} // Truyền ref vào component
          formDataList={[]} // Bạn có thể cung cấp dữ liệu nếu có
          formData={{
            ProcessLevelNumber: this.state.NumberApporver,
            ProcessName: this.state.ProcessName,
            Title: this.state.Title,
            Approver: this.state.Approver,
          }} // Truyền NumberApporver và ProcessName
          editable={true} // Cho phép chỉnh sửa
          context = {this.props.context}
        />
      </div>
    );
  }
}

