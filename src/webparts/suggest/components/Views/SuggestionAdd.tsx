import * as React from 'react';
import styles from './SuggestionAdd.module.scss';
import FooterButton from './FooterButton';
import StatusBar from './StatusBar';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import { FaFileAlt, FaFileWord, FaFilePdf, FaDownload } from 'react-icons/fa';
import {DataSuggest} from './DemoSuggest'

interface ISuggestionAddProps {
  onClose: () => void;
  context: WebPartContext;
  suggestionToEdit?: DataSuggest;
}


interface ISuggestionAddState {
  activeTab: 'content' | 'related' | 'flow';
  description: string;
  plan: string;
  dateTime: string;
  emergency: string;
  note: string;
  processName: string;
  files: File[];
  plans: { title: string, planName: string, planNote: string }[];
  emergencies: { title: string, EmergencyName: string, EmergencyNote: string }[]; 
  processes: { ProcessCode: string, ProcessName: string, Quantity_Of_Approve: string, ProcessType: string }[]; 
  itemId?: number; 
}

interface FieldsToAdd {
  Title?: string;
  Plan?: string;
  DateTime?: string;
  Emergency?: string;
  Note?: string;
  ProcessName?: string;
  Status: 'Draft' | 'Staff';
}

export default class SuggestionAdd extends React.Component<ISuggestionAddProps, ISuggestionAddState> {
  constructor(props: ISuggestionAddProps) {
    super(props);
    this.state = {
      activeTab: 'content',
      description: props.suggestionToEdit?.Title || '',
      plan:  props.suggestionToEdit?.Plan || '',
      emergency: props.suggestionToEdit?.Emergency || '',
      dateTime: props.suggestionToEdit?.DateTime || '',
      emergencies: [],
      processes: [],
      note: props.suggestionToEdit?.Note || '',
      processName: '',
      files: [],
      plans: [],
      itemId: props.suggestionToEdit?.Id,
    };
  }

  // Lưu phiếu trống trước
  public async componentDidMount(): Promise<void> {
    await this.getPlanData();
    await this.getEmergency();
    await this.getProcess();
  
    if (this.props.suggestionToEdit && this.props.suggestionToEdit.Attachments) {
      const files = this.props.suggestionToEdit.Attachments.map(attachment => {
        return new File([], attachment.FileName);
      });
      this.setState({ files });
    }
  
    if (!this.props.suggestionToEdit) {
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        const fieldsToAdd: FieldsToAdd = {
          Title: '',
          Plan: '',
          DateTime: new Date().toISOString(), // ngày hiện tại
          Emergency: '',
          Note: '',
          ProcessName: '',
          Status: 'Draft', // Set status 'Draft'
        };
  
        if (!fieldsToAdd.DateTime) {
          delete fieldsToAdd.DateTime; // Or set null
        }
  
        const addItemResult = await sp.web.lists.getByTitle(listTitle).items.add(fieldsToAdd);
        const itemId = addItemResult?.data?.ID || addItemResult?.data?.Id || addItemResult?.ID || addItemResult?.Id;
  
        if (!itemId) {
          throw new Error('Item ID not found in the response. Please check the response structure.');
        }
  
        this.setState({ itemId });
  
      } catch (error) {
        console.error('Error adding item:', error);
        alert('Failed to auto-save item: ' + error.message);
      }
    }
  }
  
  // Thêm data vào Suggest list
  private async addSuggest(): Promise<void> {
    const { description, plan, dateTime, emergency, note, processName, files, itemId } = this.state;
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const fieldsToUpdate: FieldsToAdd = {
        Status: 'Staff',  // Update status to 'Staff'
      };
  
      // Dynamically add fields only if they have values
      if (description) fieldsToUpdate.Title = description;
      if (plan) fieldsToUpdate.Plan = plan;
      if (dateTime) fieldsToUpdate.DateTime = new Date(dateTime).toISOString();
      if (emergency) fieldsToUpdate.Emergency = emergency;
      if (note) fieldsToUpdate.Note = note;
      if (processName) fieldsToUpdate.ProcessName = processName;
  
      if (itemId) {
        // Update existing item
        await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update(fieldsToUpdate);
  
        // Upload attachments if there are any
        if (files && files.length > 0) {
          for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, arrayBuffer);
          }
        }
  
        alert('Item updated successfully!');
      } else {
        // Create new item if itemId doesn't exist
        const addItemResult = await sp.web.lists.getByTitle(listTitle).items.add(fieldsToUpdate);
        const newItemId = addItemResult?.data?.ID || addItemResult?.data?.Id;
  
        if (newItemId) {
          this.setState({ itemId: newItemId });
  
          // Upload attachments if there are any
          if (files && files.length > 0) {
            for (const file of files) {
              const arrayBuffer = await file.arrayBuffer();
              await sp.web.lists.getByTitle(listTitle).items.getById(newItemId).attachmentFiles.add(file.name, arrayBuffer);
            }
          }
  
          // alert('Item added and updated successfully!');
        } else {
          // throw new Error('Failed to create a new item.');
        }
      }
  
      // Force update to ensure StatusBar is refreshed
      this.forceUpdate();
  
      // Optionally, you can also close the form or perform other actions after saving
      // this.props.onClose();
  
    } catch (error) {
      // console.error('Error saving item:', error);
      // alert('Failed to save item: ' + error.message);
    }
  }
    
  // getdata Plan từ Plan list
  private async getPlanData(): Promise<void> {
    const listTitle = 'Plan';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Title', 'PlanName', 'PlanNote') // Select required fields
        ();

      const plans = items.map(item => ({
        title: item.Title,
        planName: item.PlanName,
        planNote: item.PlanNote,
      }));

      this.setState({ plans });
    } catch (error) {
      console.error('Error fetching plan data:', error);
      alert('Failed to fetch plan data: ' + error.message);
    }
  }

  //getdata Emergency
  private async getEmergency(): Promise<void> {
    const listTitle = 'Emergency';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Title', 'EmergencyName', 'EmergencyNote') // Chọn các trường cần thiết
        ();
  
      const emergencies = items.map(item => ({
        title: item.Title,
        EmergencyName: item.EmergencyName,
        EmergencyNote: item.EmergencyNote,
      }));
  
      this.setState({ emergencies });
    } catch (error) {
      // console.error('Error fetching Emergency data:', error);
      // alert('Failed to fetch Emergency data: ' + error.message);
    }
  }

    //getdata Process
    private async getProcess(): Promise<void> {
      const listTitle = 'Process';
      const sp = spfi().using(SPFx(this.props.context));
    
      try {
        const items = await sp.web.lists.getByTitle(listTitle).items
          .select('ProcessCode', 'ProcessName', 'Quantity_Of_Approve', 'ProcessType') // Chọn các trường cần thiết
          ();
    
        const processes = items.map(item => ({
          ProcessCode: item.ProcessCode,
          ProcessName: item.ProcessName,
          Quantity_Of_Approve: item.Quantity_Of_Approve,
          ProcessType: item.ProcessType,
        }));
    
        this.setState({ processes });
      } catch (error) {
        // console.error('Error fetching Emergency data:', error);
        // alert('Failed to fetch Emergency data: ' + error.message);
      }
    }
  
  

  // Auto save của các feild (k có file)
  private _inputChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): Promise<void> => {
    const { name, value } = event.target;
    const { itemId } = this.state;

    // Mapping feildName với column sharepoint (Bên trái FeildName bên phải column sharepoint)
    const fieldMapping: { [key: string]: string } = {
        description: 'Title',
        plan: 'Plan',
        dateTime: 'DateTime',
        emergency: 'Emergency',
        note: 'Note',
        processName: 'ProcessName',
    };

    const internalFieldName = fieldMapping[name];

    // Update the local state
    this.setState({
      ...this.state,
      [name]: value
    });

    // If the itemId exists, update the corresponding SharePoint field
    if (itemId && internalFieldName) {
        const listTitle = 'Suggest';
        const sp = spfi().using(SPFx(this.props.context));

        try {
            // Update theo FieldName
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
                [internalFieldName]: value
            });

        } catch (error) {
          //Mở phong ấn cái này là 1 mớ lỗi đó ;))
            // console.error(`Error updating ${name} field:`, error);
            // alert(`Failed to update ${name} field: ` + error.message);
        }
    }
};

  //Tự động tải file lên và view giao diện
  private handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const { itemId } = this.state;
    const files = event.target.files;

    if (files && itemId) {
        const listTitle = 'Suggest';
        const sp = spfi().using(SPFx(this.props.context));
        const uploadedFiles: File[] = []; // Khai báo uploadedFiles

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const arrayBuffer = await file.arrayBuffer();

                // Upload each file as an attachment
                await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, arrayBuffer);
                uploadedFiles.push(file); // Thêm file vào uploadedFiles sau khi upload thành công
            }
            
            // Cập nhật state để render danh sách các file đã upload
            this.setState(prevState => ({
                files: [...prevState.files, ...uploadedFiles]
            }));

            // alert('Files uploaded successfully!');
        } catch (error) {
            // console.error('Error uploading files:', error);
            // alert('Failed to upload files: ' + error.message);
        }
    }
  };

  //Chức năng download file
  private handleDownload = (url: string, fileName: string): void => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  //Render giao diện File
  _renderFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {(() => {
          switch (extension) {
            case 'pdf':
              return <FaFilePdf color="red" />;
            case 'doc':
            case 'docx':
              return <FaFileWord color="blue" />;
            default:
              return <FaFileAlt />;
          }
        })()}
        <span style={{ 
          marginRight: '10px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          fontFamily: 'Times New Roman, serif',  // Thêm font chữ Times New Roman
          fontSize: '10px'  // Thêm kích thước chữ 10px
        }}>
          {fileName.length > 10 ? `${fileName.slice(0, 20)}...` : fileName}
        </span>        
      </div>
    );
  };
  
  //Xóa file
  private removeFile = async (fileIndex: number): Promise<void> => {
    const { itemId } = this.state;
    const fileToRemove = this.state.files[fileIndex];
  
    if (!itemId) {
      alert('Item ID is not set.');
      return;
    }
  
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      // Xóa file khỏi SharePoint
      await sp.web.lists.getByTitle(listTitle)
        .items.getById(itemId)
        .attachmentFiles.getByName(fileToRemove.name)
        .delete();
  
      // Xóa file khỏi giao diện người dùng
      const updatedFiles = [...this.state.files];
      updatedFiles.splice(fileIndex, 1);
      this.setState({ files: updatedFiles });
  
      alert('File removed successfully!');
  
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Failed to remove file: ' + error.message);
    }
  };
  
  // Đưa Form lại ban đầu sau khu xóa
  private resetForm = (): void => {
    this.setState({
      activeTab: 'content',
      description: '',
      plan: '',
      dateTime: '',
      emergency: '',
      note: '',
      processName: '',
      files: [],
      plans: [],
      emergencies: [],
      itemId: undefined,
    });
  }

  private deleteSuggest = async (): Promise<void> => {
    const userConfirmed = window.confirm("Bạn có muốn xóa phiếu này không?");
    
    if (!userConfirmed) {
      return; // Nếu người dùng chọn "Không", không làm gì cả
    }
  
    const { itemId } = this.state;
  
    if (!itemId) {
      alert('No item found to delete.');
      return;
    }
  
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      await sp.web.lists.getByTitle(listTitle).items.getById(itemId).delete();
  
      alert('Item deleted successfully!');
      // Reset form state after deletion
      this.resetForm();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  }

    
  public render(): React.ReactElement<ISuggestionAddProps> {
    return (
      <div>
        {this.state.itemId !== undefined && (
          <StatusBar context={this.props.context} itemId={this.state.itemId} />
        )}

        <div className={styles.body}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'content' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'content' })}
            >
              NỘI DUNG
            </button>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'related' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'related' })}
            >
              LIÊN QUAN
            </button>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'flow' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'flow' })}
            >
              LƯU ĐỒ
            </button>
          </div>

          {this.state.activeTab === 'content' && (
            <div className={styles.content}>
              <div className={styles.formGroup}>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Nội dung:
                    <input
                      type="text"
                      name="description"
                      value={this.state.description}
                      onChange={this._inputChange}
                    />
                  </label>
                  <label className={styles.label}>
                    Kế hoạch:
                    <select
                      name="plan"
                      value={this.state.plan}
                      onChange={this._inputChange}
                      className={styles.select}
                    >
                      <option value="">Chọn kế hoạch</option>
                      {this.state.plans.map((plan, index) => (
                        <option key={index} value={plan.planName}>
                          {plan.planName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label}>
                    Ngày:
                    <input
                      type="datetime-local"
                      name="dateTime"
                      // value={this.state.dateTime}
                      value={this.state.dateTime ? 
                        new Date(new Date(this.state.dateTime).getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 16) : 
                        new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().substring(0, 16)
                      }
                      onChange={this._inputChange}
                      className={styles.date}
                      readOnly
                    />
                  </label>
                </div>
                <div className={styles.row}>
                <label className={styles.label}>
                    Độ ưu tiên:
                    <select
                      name="emergency"
                      value={this.state.emergency}
                      onChange={this._inputChange}
                      className={styles.select}
                      style={{ width: 'auto'}}
                    >
                      <option value="">Chọn độ ưu tiên</option>
                      {this.state.emergencies.map((item, index) => (
                        <option key={index} value={item.EmergencyName}>
                          {item.EmergencyName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.label}>
                    Tên quy trình:
                    <select
                      name="processName"
                      value={this.state.processName}
                      onChange={this._inputChange}
                      className={styles.select}
                      style={{ width: 'auto'}}
                    >
                      <option value="">Chọn tên quy trình</option>
                      {this.state.processes.map((process, index) => (
                        <option key={index} value={process.ProcessName}>
                          {process.ProcessName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.row}>
                <label className={styles.label}>
                    File:
                    <div className={styles.fileContainer}>
                      {this.state.files.length > 0 && (
                        <FaDownload
                          className={styles.downloadButton}
                          onClick={() => this.state.files.forEach(file => this.handleDownload(URL.createObjectURL(file), file.name))}
                        />
                      )}
                      <input
                        type="file"
                        multiple
                        onChange={this.handleFileChange}
                        className={styles.fileInput}
                      />
                      <div className={styles.attachmentContainer}>
                        {this.state.files.slice(0, 4).map((file, fileIndex) => (
                          <div key={fileIndex} className={styles.attachmentItem}>
                            <div className={styles.attachmentIcon}>
                              {this._renderFileIcon(file.name)}
                            </div>
                            <div className={styles.attachmentLink}>
                              <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">
                                {file.name.length > 10 ? `${file.name.slice(0, 20)}...` : file.name}
                              </a>
                            </div>
                            <button
                              type="button"
                              className={styles.removeFileButton}
                              onClick={() => this.removeFile(fileIndex)}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Trích yếu:
                    <textarea
                      name="note"
                      value={this.state.note}
                      onChange={this._inputChange}
                      className={styles.textArea}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {this.state.activeTab === 'related' && <div><h3>Tab Liên quan</h3></div>}

          {this.state.activeTab === 'flow' && <div><h3>Tab Lưu đồ</h3></div>}
        </div>

        <div className={styles.footer}>
          <FooterButton 
            onClose={this.props.onClose} 
            onSave={() => this.addSuggest()} 
            onDelete={() => this.deleteSuggest()}
          />
        </div>
      </div>
    );
  }
}
