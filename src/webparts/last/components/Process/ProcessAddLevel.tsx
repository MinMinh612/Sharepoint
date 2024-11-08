import React from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import styles from './ProcessAddLevel.module.scss';
import { spfi, SPFx } from '@pnp/sp';
// import { WebPartContext } from '@microsoft/sp-webpart-base';
import ProcessDetail from './ProcessDetail';
import {IProcessAddLevelProps, IProcessItem} from './IProcessData'

interface IProcessAddLevelState {
  Title: string; 
  ProcessName: string; 
  ProcessType: string;
  NumberApporver: string;
  itemId?: number;
  successMessage: boolean;
  Approver: string;
  processDetails: { title: string; numberOfApproval: string; approver: string }[];
  processTypes: { value: string, label: string }[];
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
      processTypes: [],
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

    try {
        // Kiểm tra xem Title đã tồn tại trong danh sách hay chưa
        const existingItems = await sp.web.lists.getByTitle(listTitle).items
            .filter(`Title eq '${Title}'`)()
            .catch(error => {
                console.error("Error checking for existing items:", error);
                return [];
            });

        if (existingItems.length > 0) {
            // Nếu Title đã tồn tại, chỉ cập nhật mục đó
            const existingItemId = existingItems[0].Id;
            await sp.web.lists.getByTitle(listTitle).items.getById(existingItemId).update(fieldsToUpdate);
            this.setState({ itemId: existingItemId });
            // console.log(`Updated existing item with Title: ${Title}`);
        } else if (itemId) {
            // Nếu có itemId, cập nhật mục hiện có (dựa trên itemId)
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update(fieldsToUpdate);
            console.log(`Updated existing item with ID: ${itemId}`);
        } else {
            // Nếu không có itemId và Title chưa tồn tại, tạo mới mục
            const addItemResult = await sp.web.lists.getByTitle(listTitle).items.add(fieldsToUpdate);
            const newItemId = addItemResult?.data?.ID || addItemResult?.data?.Id;

            if (newItemId) {
                this.setState({ itemId: newItemId });
                console.log(`Added new item with Title: ${Title}`);
            }
        }

        // Cập nhật trạng thái để hiển thị thông báo thành công
        this.setState({ successMessage: true });

        // Gọi hàm addProcessDetail từ ProcessDetail sau khi addProcess hoàn thành
        if (this.processDetailRef.current) {
            await this.processDetailRef.current.addProcessDetail();  // Gọi hàm addProcessDetail
        }

        // Tự động ẩn thông báo sau 2 giây
        setTimeout(() => {
            this.setState({ successMessage: false });
        }, 2000);

    } catch (error) {
        console.error("Error in addProcess:", error);
    }
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

      // Bạn có thể setState hoặc xử lý dữ liệu tại đây
      this.setState({ processDetails });

    } catch (error) {
      console.error('Error fetching process details:', error);
    }
  };

  public getProcessTypes = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));

    try {
        const items = await sp.web.lists.getByTitle("ProcessType").items
            .select("Title", "ProcessTypeName")();

        // Lưu vào state
        this.setState({
            processTypes: items.map(item => ({
                value: item.Title,
                label: item.ProcessTypeName
            }))
        });

    } catch (error) {
        console.error('Error fetching ProcessType:', error);
    }
  };


  // Xử lý sự kiện khi người dùng thay đổi giá trị input
  private handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = event.target;
  
    // Remove diacritics and spaces for "Title" field
    const removeDiacriticsAndSpaces = (str: string): string => {
      return str
        .normalize("NFD") // Convert to Unicode Normalization Form
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/\s+/g, ""); // Remove spaces
    };
  
    // Clean the value if the field is "Title"
    const cleanValue = name === "Title" ? removeDiacriticsAndSpaces(value) : value;
  
    // Cập nhật giá trị state với thuộc tính tương ứng
    this.setState((prevState) => ({
      ...prevState,
      [name]: cleanValue
    }), this.updateProcessDetail); // Gọi updateProcessDetail sau khi cập nhật state
  };
  
  // Phương thức này sẽ được gọi khi dữ liệu của ProcessAddLevel thay đổi
  public updateProcessDetail = (): void => {
    if (this.processDetailRef.current) {
      const { Title, ProcessName, NumberApporver, Approver } = this.state;
      this.processDetailRef.current.updateDetails({
        Title,
        ProcessName,
        NumberApporver,
        Approver,
      });
    }
  }


  public async componentDidMount(): Promise<void> {
    await this.getProcessDetail();
    await this.getProcessTypes();
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
                <option value="">-- Chọn loại qui trình --</option>
                {this.state.processTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
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
        
        {/* Hiển thị ProcessDetail nếu NumberApporver không phải là 0 hoặc rỗng */}
        {NumberApporver && parseInt(NumberApporver, 10) > 0 && (
          <ProcessDetail
            ref={this.processDetailRef} // Truyền ref vào component
            formData={{
              ProcessLevelNumber: this.state.NumberApporver,
              ProcessName: this.state.ProcessName,
              Title: this.state.Title,
              Approver: this.state.Approver,
            }} // Truyền NumberApporver và ProcessName
            editable={true} // Cho phép chỉnh sửa
            context={this.props.context}
          />
        )}
      </div>
    );
  }
}

