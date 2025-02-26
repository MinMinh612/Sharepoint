import * as React from 'react';
import styles from './SuggestionAdd.module.scss';
import FooterButton from './FooterButton';
import StatusBar from './StatusBar';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import Select from 'react-select'
import { FaFileAlt, FaFileWord, FaFilePdf, FaDownload } from 'react-icons/fa';
import { DataSuggest } from './DemoSuggest'
import Popup from '../../../../Components/Popup'
import { IProcessItem } from '../../../last/components/Process/IProcessData';
import { ISiteUserInfo } from '@pnp/sp/site-users';
import ShowCommentSuggest from '../../../../Components/ShowCommentSuggest';

interface ISuggestionAddProps {
  onClose: () => void;
  context: WebPartContext;
  suggestionToEdit?: DataSuggest;
  commentToEdit?: IComment[];
}


interface ISuggestionAddState {
  activeTab: 'content' | 'related' | 'flow';
  description: string | undefined;
  plan: string | undefined;
  dateTime: string;
  emergency: string | undefined;
  note: string;
  processName: string;
  files: File[];
  plans: { title: string, planName: string, planNote: string }[];
  emergencies: { title: string, EmergencyName: string, EmergencyNote: string }[];
  processes: { ProcessCode: string, ProcessName: string, NumberApporver: string, ProcessType: string }[];
  itemId?: number;
  showModal: boolean,
  selectedProcess: string;
  processDetails: { title: string; numberOfApproval: string; approver: string[] }[];
  approvers: { [key: string]: string[] };
  selectedProcessCode?: string;
  Status: 'Draft' | 'Staff';
  commentProcessDetailTitle: string;
  commentNumberOfApprover: string;
  commentApprover: IApproverComment[];
  itemProcessDetail: [];
  selectedUsers: IUserOption[]; // Test thêm user
  users: { value: number; label: string }[]; //test
  commentData: IComment[];
  commentToEdit?: IComment[];
  showPlanOptions: boolean;
  showEmergencyOptions: boolean;
  commentDataApprove: IComment[];
  permission: {
    Title: string;
    UserName: { Id: number; Title: string } | undefined; // Chỉnh UserName thành object
    TitleTypePermission: string;
    Module: string;
    Run: boolean;
    Add: boolean;
    Modify: boolean;
    Delete: boolean;
    ApproveSuggestion: boolean;
  }[];
  department: {
    Title: string;
    NameDepartment: string;
    MemberOfDepartment: { Id: number; Title: string } | undefined; 
    ManagerOfDepartment: { Id: number; Title: string } | undefined; 
    LeaderOfDepartment: { Id: number; Title: string } | undefined; 
  }[];
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

interface IFieldsToAddComment {
  Title: string;
  SuggestName: string;
  ProcessTitle?: string;  // Dấu hỏi "?" để thể hiện giá trị này có thể undefined
  ProcessNumberOfApprover?: string;
  ProcessApprover?: { results: number[] };
}

interface IUserOption { //test thêm user
  label: string;
  value: number;
}

interface IApproverComment {
  processTitle: string;
  numberOfApproval: string;
  value: string;
  label: string;
  comment?: string;
}

interface IComment {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
  CommentApprover?: string;
  isApprove?: 'Approve' | 'Reject' | undefined;
}

interface IDuplicateInfo {
  userName: string;
  levels: string[];
}

export default class SuggestionAdd extends React.Component<ISuggestionAddProps, ISuggestionAddState> {
  constructor(props: ISuggestionAddProps) {
    super(props);
    this.state = {
      activeTab: 'content',
      description: props.suggestionToEdit?.Title || '',
      plan: props.suggestionToEdit?.Plan || '',
      emergency: props.suggestionToEdit?.Emergency || '',
      dateTime: props.suggestionToEdit?.DateTime || '',
      emergencies: [],
      processes: [],
      note: props.suggestionToEdit?.Note || '',
      processName: '',
      files: [],
      plans: [],
      itemId: props.suggestionToEdit?.Id,
      showModal: false,
      selectedProcess: '',
      processDetails: [],
      approvers: {},
      selectedProcessCode: undefined,
      Status: 'Draft',
      commentProcessDetailTitle: '',
      commentNumberOfApprover: '',
      commentApprover: [],
      itemProcessDetail: [],
      selectedUsers: [], //Test thêm user
      users: [],
      commentData: [],
      commentToEdit: props.commentToEdit || [],
      showPlanOptions: false,
      showEmergencyOptions: false,
      commentDataApprove: [],
      permission: [],
      department: [],
    };
    this.addComment = this.addComment.bind(this);
    this._inputChange = this._inputChange.bind(this);
    this._toggleModal = this._toggleModal.bind(this);
    this.addSuggest = this.addSuggest.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.getComment = this.getComment.bind(this);
  }

  // Lưu phiếu trống trước
  public async componentDidMount(): Promise<void> {
    await this.getPlanData();
    await this.getEmergency();
    await this.getProcess();
    await this.getProcessDetail();
    await this.getUsers();
    await this.getComment();
    await this.getPermission();
    await this.getDepartment();

    console.log('Dữ liệu cũ trước khi setState:', this.props.suggestionToEdit);

    if (this.props.suggestionToEdit) {
      const { Title, Plan, Emergency, DateTime, Note, ProcessName } = this.props.suggestionToEdit;

      this.setState((prevState) => ({
        description: Title || '',
        plan: Plan || '',
        emergency: Emergency || '',
        dateTime: DateTime || '',
        note: Note || '',
        processName: ProcessName || '',
        selectedProcessCode: prevState.processes.find(p => p.ProcessName === ProcessName)?.ProcessCode
      }), async () => {
        // Gọi hàm getProcessDetail sau khi set lại ProcessCode
        if (this.state.selectedProcessCode) {
          await this.getProcessDetail();
        }
      });
    }

    console.log('Dữ liệu cũ:', this.props.suggestionToEdit);

    if (this.state.processDetails.length === 0) {
      this.setState({
        processDetails: [...this.state.processDetails],
      });
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
        .select('Title', 'PlanName', 'PlanNote')();

      const plans = items.map(item => ({
        title: item.Title,
        planName: item.PlanName,
        planNote: item.PlanNote,
      }));

      this.setState(prevState => {
        // Kiểm tra nếu có dữ liệu plan từ `suggestionToEdit`
        const existingPlan = plans.find(p => p.planName === prevState.plan);
        return {
          plans,
          plan: existingPlan ? prevState.plan : '', // Chỉ giữ lại plan nếu nó tồn tại trong danh sách
        };
      });

      console.log("Danh sách plans:", plans);
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
        .select('Title', 'ProcessName', 'NumberApporver', 'ProcessType')
        ();

      const processes = items.map(item => ({
        ProcessCode: item.Title,
        ProcessName: item.ProcessName,
        NumberApporver: item.NumberApporver,
        ProcessType: item.ProcessType,
      }));

      this.setState({ processes });
    } catch (error) {
      console.error('Error fetching Process data:', error);
      alert('Failed to fetch Process data: ' + error.message);
    }
  }

  public getUsers = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const groupUsers: ISiteUserInfo[] = await sp.web.siteUsers.filter("IsSiteAdmin eq false")();
      const userList = groupUsers.map((user: ISiteUserInfo) => ({
        value: user.Id,   // Đổi từ 'id' thành 'value' để phù hợp với yêu cầu của Select
        label: user.Title, // Đổi từ 'title' thành 'label'
      }));

      this.setState({ users: userList });
    } catch (error) {
      console.error('Error fetching users from site:', error);
    }
  };

  private async getPermission(): Promise<void> {
    const listTitle = 'Permission';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select(
          'Title', 'UserName/Id', 'UserName/Title', 'TitleTypePermission', 'Module', 'Run', 'Add', 'Modify',
          'Delete', 'ApproveSuggestion')
        .expand('UserName')();

      const permission = items.map(item => ({
        Title: String(item.Title),
        UserName: Array.isArray(item.UserName)
          ? item.UserName.map((user: { Id: number; Title: string }) => ({
            Id: Number(user.Id),
            Title: String(user.Title)
          }))
          : [],
        TitleTypePermission: String(item.TitleTypePermission),
        Module: String(item.Module),
        Run: Boolean(item.Run),
        Add: Boolean(item.Add),
        Modify: Boolean(item.Modify),
        Delete: Boolean(item.Delete),
        ApproveSuggestion: Boolean(item.ApproveSuggestion),
      }));

      this.setState({ permission });
      console.log('Permission trong add:', permission)
    } catch (error) {
      console.error('Error fetching Permission data:', error);
      alert('Failed to fetch Permission data: ' + error.message);
    }
  }

  private async getDepartment(): Promise<void> {
    const listTitle = 'Departments';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Title', 'NameDepartment',
          'MemberOfDepartment/Id', 'MemberOfDepartment/Title',
          'ManagerOfDepartment/Id', 'ManagerOfDepartment/Title',
          'LeaderOfDepartment/Id', 'LeaderOfDepartment/Title',
        )
        .expand('MemberOfDepartment', 'ManagerOfDepartment', 'LeaderOfDepartment')();

      const department = items.map(item => ({
        Title: String(item.Title),
        NameDepartment: String(item.NameDepartment),
        MemberOfDepartment: Array.isArray(item.MemberOfDepartment)
          ? item.MemberOfDepartment.map((user: { Id: number; Title: string }) => ({
            Id: Number(user.Id),
            Title: String(user.Title)
          }))
          : [],
          ManagerOfDepartment: Array.isArray(item.ManagerOfDepartment)
          ? item.ManagerOfDepartment.map((user: { Id: number; Title: string }) => ({
            Id: Number(user.Id),
            Title: String(user.Title)
          }))
          : [],
          LeaderOfDepartment: Array.isArray(item.LeaderOfDepartment)
          ? item.LeaderOfDepartment.map((user: { Id: number; Title: string }) => ({
            Id: Number(user.Id),
            Title: String(user.Title)
          }))
          : [],
      }));

      this.setState({ department });
      console.log('department:', department)
    } catch (error) {
      console.error('Error fetching Permission data:', error);
      alert('Failed to fetch Permission data: ' + error.message);
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
          fontFamily: 'Times New Roman, serif',
          fontSize: '10px'
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

  // đóng mở popup Process
  _toggleModal = (): void => {
    this.setState((prevState) => ({
      showModal: !prevState.showModal, // Đảo ngược trạng thái hiển thị popup
    }));
  };

  _handleProcessSelect = (selectedOption: { value: string, label: string }): void => {
    const selectedProcess = this.state.processes.find(process => process.ProcessCode === selectedOption.value);
    if (selectedProcess) {
      // Cập nhật state cho processName và selectedProcessCode
      this.setState({
        processName: selectedOption.label,  // Hiển thị ProcessName trong ô input
        selectedProcessCode: selectedOption.value,  // Lưu lại ProcessCode
      }, async () => {
        const { itemId } = this.state;
        if (itemId) {
          const listTitle = 'Suggest';
          const sp = spfi().using(SPFx(this.props.context));
          try {
            // Cập nhật giá trị processName vào SharePoint ngay sau khi chọn quy trình
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
              ProcessName: selectedOption.label
            });

            // Gọi các hàm khác sau khi đã cập nhật ProcessName
            await this.getProcessDetail();

          } catch (error) {
            console.error('Error saving ProcessName:', error);
          }
        } else {
          console.error('Không tìm thấy itemId, không thể cập nhật ProcessName');
        }
      });
    }
  };

  public getProcessDetail = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));

    try {
      if (!this.state.selectedProcessCode || this.state.selectedProcessCode.trim() === '') {
        console.error('Process code is missing or empty');
        return;
      }

      const items = await sp.web.lists.getByTitle("ProcessDetail").items
        .select("Title", "NumberOfApproval", "Approver/Id", "Approver/Title")
        .expand("Approver")();

      // Filter by selectedProcessCode and map the approver IDs to the state
      const filteredItems = items.filter((item: IProcessItem) =>
        item?.Title?.trim().toLowerCase() === this.state.selectedProcessCode?.trim().toLowerCase()
      );

      if (filteredItems.length > 0) {
        const processDetails = filteredItems.map((item: IProcessItem) => ({
          title: item?.Title ?? '',
          numberOfApproval: item?.NumberOfApproval ?? '',
          approver: Array.isArray(item?.Approver)
            ? item.Approver.map((user: ISiteUserInfo) => user?.Id.toString()) // Store approver IDs
            : item?.Approver ? [item.Approver.Id.toString()] : [],
        }));

        const allApprovers = filteredItems.flatMap((item: IProcessItem) =>
          Array.isArray(item?.Approver)
            ? item.Approver.map((user: ISiteUserInfo) => ({
              processTitle: item.Title,
              numberOfApproval: item.NumberOfApproval,
              value: user?.Id.toString(),
              label: user?.Title
            }))
            : item?.Approver ? [{
              processTitle: item.Title,
              numberOfApproval: item.NumberOfApproval,
              value: item.Approver.Id.toString(),
              label: item.Approver.Title
            }] : []
        );

        console.log('Processed approvers:', allApprovers);

        this.setState({
          processDetails: processDetails,
          commentApprover: allApprovers,
        });
      } else {
        console.log("Không tìm thấy dữ liệu khớp với ProcessCode");
        this.setState({ processDetails: [], commentApprover: [] });
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết quy trình:', error);
    }
  };

  // Function to delete all comments related to the itemId and process titles with retry logic
  private async deleteComment(itemId: string): Promise<void> {
    const listTitle = 'Comment';
    const sp = spfi().using(SPFx(this.props.context));
    const { commentData } = this.state;

    const commentsToDelete = commentData.filter(comment => comment.Title === itemId);
    console.log(`Deleting ${commentsToDelete.length} comments with Title: ${itemId}`);

    for (const comment of commentsToDelete) {
      let retries = 3;  // Retry mechanism in case of intermittent failures
      while (retries > 0) {
        try {
          console.log('Attempting to delete comment with ID:', comment.Id);
          await sp.web.lists.getByTitle(listTitle).items.getById(comment.Id).delete();
          console.log('Deleted comment with ID:', comment.Id);
          break;
        } catch (error) {
          console.error(`Error deleting comment with ID ${comment.Id}. Retries left: ${retries - 1}`, error);
          retries--;
          if (retries === 0) {
            console.error('Failed to delete comment after multiple attempts:', comment.Id);
          }
        }
      }
    }

    // Update state to clear out deleted comments locally
    const updatedCommentData = commentData.filter(comment => comment.Title !== itemId);
    this.setState({ commentData: updatedCommentData });
    console.log('Updated commentData after delete:', updatedCommentData);
  }

  // Function to add new comments after clearing out old ones
  private async addComment(): Promise<void> {
    const { itemId, description, selectedProcessCode, processDetails, commentApprover, commentData } = this.state;

    if (!itemId) {
      throw new Error('Item ID is missing');
    }

    if (!selectedProcessCode || selectedProcessCode.trim() === '') {
      throw new Error('Process code is missing or empty');
    }

    const listTitle = 'Comment';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      await this.getComment();

      if (processDetails.length === 0) {
        throw new Error('No process details found');
      }

      // Delete all existing comments for this item before adding new ones
      await this.deleteComment(itemId.toString());
      console.log('Cleared all existing comments for item ID:', itemId);

      for (const detail of processDetails) {
        const { title, numberOfApproval } = detail;

        if (!description || !title || !numberOfApproval) {
          throw new Error("One or more fields are missing or empty.");
        }

        // Filter approvers related to the current process level
        const relatedApprovers = commentApprover.filter(
          approver =>
            approver.processTitle === title &&
            approver.numberOfApproval === numberOfApproval &&
            approver.value
        );

        // Determine if this level is restricted to a single approver
        const isNumericLevel = /^\d+$/.test(numberOfApproval);

        if (isNumericLevel) {
          // For levels 1, 2, 3, etc., ensure exactly one approver
          if (relatedApprovers.length !== 1) {
            alert(`Cấp duyệt ${numberOfApproval} yêu cầu chính xác một người duyệt.`);
            continue;
          }
        } else {
          // For "Tham mưu" levels, show a warning if there are no approvers
          if (relatedApprovers.length === 0) {
            const confirmSave = window.confirm(`Cấp tham mưu ${numberOfApproval} đang rỗng. Bạn có muốn lưu dữ liệu không?`);
            if (!confirmSave) {
              continue; // Skip saving for this level if the user chooses not to save
            }
          }
        }

        if (relatedApprovers.length === 0) {
          // Add main comment when `relatedApprovers` is empty
          const fieldsToAdd: IFieldsToAddComment = {
            Title: itemId.toString(),
            SuggestName: description,
            ProcessTitle: title,
            ProcessNumberOfApprover: numberOfApproval,
          };

          const addItemResult = await sp.web.lists.getByTitle(listTitle).items.add(fieldsToAdd);

          let addedItemId = addItemResult?.data?.ID || addItemResult?.data?.Id || addItemResult?.ID || addItemResult?.Id;
          if (!addedItemId) {
            addedItemId = addItemResult?.data?.id || addItemResult?.data?.odata.id;
          }

          if (!addedItemId) {
            console.error('Failed to retrieve the added item ID from addItemResult:', addItemResult);
            throw new Error('Failed to retrieve the added item ID');
          }

          console.log('Main comment added successfully with ID:', addedItemId);

          commentData.push({
            Id: addedItemId,
            Title: itemId.toString(),
            SuggestName: description,
            ProcessTitle: title,
            ProcessNumberOfApprover: numberOfApproval,
            ProcessApprover: [],
          });
          this.setState({ commentData });
        } else {
          // Add each approver individually if `relatedApprovers` is not empty
          console.log('Adding individual approvers for title:', title, 'and numberOfApproval:', numberOfApproval);

          for (const approver of relatedApprovers) {
            const oneUser = { Id: approver.value };
            console.log('Adding user with ID:', oneUser.Id);

            const fieldsToAddForUser = {
              Title: itemId.toString(),
              SuggestName: description,
              ProcessTitle: title,
              ProcessNumberOfApprover: numberOfApproval,
              ProcessApproverId: [oneUser.Id],
            };

            await sp.web.lists.getByTitle(listTitle).items.add(fieldsToAddForUser);
            console.log('Approver added successfully with new item for user ID:', oneUser.Id);
          }
        }
      }

      this.showSuccessNotification("Thêm thành công!"); // Show success notification
    } catch (error) {
      console.error('Error during addComment execution:', error);
    }
  }

  // Function to show a non-intrusive success notification
  private showSuccessNotification(message: string): void {
    // Display a toast notification or add any UI element for feedback
    const notificationElement = document.createElement("div");
    notificationElement.innerText = message;
    notificationElement.style.position = "fixed";
    notificationElement.style.bottom = "20px";
    notificationElement.style.right = "20px";
    notificationElement.style.backgroundColor = "green";
    notificationElement.style.color = "white";
    notificationElement.style.padding = "10px";
    notificationElement.style.borderRadius = "5px";
    notificationElement.style.zIndex = "1000";
    document.body.appendChild(notificationElement);

    // Remove the notification after 3 seconds
    setTimeout(() => {
      document.body.removeChild(notificationElement);
    }, 3000);
  }

  //Dùng cho hàm addComment đừng xóa
  public async getComment(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const commentItems = await sp.web.lists.getByTitle('Comment').items
        .select('Id', 'Title', 'SuggestName', 'ProcessTitle', 'ProcessNumberOfApprover', 'ProcessApprover/Title')
        .expand('ProcessApprover')();


      if (commentItems.length > 0) {
        const commentData = commentItems.map(item => ({
          Id: item.Id, // Map the Id property
          Title: item.Title,
          SuggestName: item.SuggestName,
          ProcessTitle: item.ProcessTitle,
          ProcessNumberOfApprover: item.ProcessNumberOfApprover,
          ProcessApprover: item.ProcessApprover.map((approver: { Title: string }) => ({ Title: approver.Title })), // Map to array of approver titles
        }));

        // Update the state with the fetched process details
        this.setState({ commentData });
        console.log('Dữ liệu lấy từ Commnet', commentData)
      } else {
        console.log("Không có dữ liệu từ Comment list.");
      }
    } catch (error) {
      console.error("Error details:", error.message);
    }
  }

  // Thêm hàm kiểm tra user trùng lặp giữa các cấp
  private checkDuplicateUserAcrossLevels = (
    selectedOptions: { value: string; label: string }[],
    currentLevel: string,
    currentProcessTitle: string
  ): IDuplicateInfo[] => {
    const { processDetails } = this.state;
    const duplicateUsers: IDuplicateInfo[] = [];

    selectedOptions.forEach(selectedUser => {
      const duplicateLevels: string[] = [];

      processDetails.forEach(detail => {
        // Kiểm tra trong cùng quy trình nhưng khác cấp
        if (detail.title === currentProcessTitle &&
          detail.numberOfApproval !== currentLevel &&
          detail.approver.includes(selectedUser.value)) {
          duplicateLevels.push(detail.numberOfApproval);
        }
      });

      if (duplicateLevels.length > 0) {
        duplicateUsers.push({
          userName: selectedUser.label,
          levels: duplicateLevels
        });
      }
    });

    return duplicateUsers;
  };

  // Đã cập nhật dữ liệu nhưng chưa sửa, xóa được user mới
  _renderProcessDetailsTable = (): JSX.Element => {
    const { users, processDetails, commentToEdit, department } = this.state;


     // Kiểm tra xem user có thuộc bộ phận nào không
    // const currentUserDepartment = department.find(dept =>
    //     Array.isArray(dept.MemberOfDepartment) &&
    //     dept.MemberOfDepartment.some((member: { Id: number }) => member.Id === currentUserId)
    // );

    // Chuẩn bị danh sách tùy chọn người dùng
    const userOptions = users.map((user) => ({
      value: user.value.toString(),
      label: user.label,
    }));

    // Khởi tạo processDetails với approvers
    const processDetailsWithApprovers = processDetails.map((detail) => {
      // Nếu có dữ liệu từ commentToEdit thì cập nhật vào processDetails
      const approversFromComments =
        commentToEdit?.find(
          (comment) =>
            comment.ProcessTitle === detail.title &&
            comment.ProcessNumberOfApprover === detail.numberOfApproval
        )?.ProcessApprover.map((approver) => {
          const matchedUser = userOptions.find(
            (user) => user.label === approver.Title
          );
          return matchedUser?.value || "";
        }) || [];

      return {
        ...detail,
        approver: approversFromComments.length > 0 ? approversFromComments : detail.approver,
      };
    });

    return (
      <form className={styles.tableContainer}>
        <table className="table">
          <thead className="thead">
            <tr>
              <th style={{ width: '200px' }}>Mã quy trình</th>
              <th style={{ width: '100px' }}>Cấp duyệt</th>
              <th style={{ width: 'auto' }}>Người duyệt</th>
            </tr>
          </thead>
          <tbody>
            {processDetailsWithApprovers.map((detail, index) => (
              <tr key={index}>
                <td>{detail.title}</td>
                <td>{detail.numberOfApproval}</td>
                <td>
                  <Select
                    isMulti
                    name={`Approver_${index}`}
                    value={userOptions.filter(option =>
                      (detail.approver || []).includes(option.value)
                    )}
                    options={userOptions}
                    onChange={(selectedOptions) => {
                      const options = selectedOptions || [];

                      // ✅ Kiểm tra nếu là cấp duyệt số và có nhiều hơn 1 người được chọn
                      if (!isNaN(Number(detail.numberOfApproval)) && options.length > 1) {
                        alert(`Cấp duyệt ${detail.numberOfApproval} chỉ được phép chọn 1 người duyệt`);
                        return;
                      }

                      // ✅ Kiểm tra user trùng lặp giữa các cấp duyệt
                      const duplicateUsers = this.checkDuplicateUserAcrossLevels(
                        [...options],
                        detail.numberOfApproval,
                        detail.title
                      );

                      if (duplicateUsers.length > 0) {
                        const duplicateMessages = duplicateUsers.map(duplicate =>
                          `Người dùng "${duplicate.userName}" đã được chọn ở ${duplicate.levels.length > 1 ? 'các' : ''} cấp: ${duplicate.levels.join(', ')}`
                        );
                        alert(`Phát hiện trùng lặp:\n${duplicateMessages.join('\n')}\n\nVui lòng chọn người duyệt khác.`);
                        return;
                      }

                      // ✅ Kiểm tra nếu user được chọn không thuộc cùng bộ phận
                      const selectedUserOutOfDepartment = options.some(userOption => {
                        return !department.some(dept =>
                          Array.isArray(dept.MemberOfDepartment) &&
                          dept.MemberOfDepartment.some((member: { Id: number }) => member.Id.toString() === userOption.value)
                        );
                      });

                      if (selectedUserOutOfDepartment) {
                        alert('⚠ Bạn đang chọn nhân viên ở phòng ban khác!');
                      }

                      // ✅ Cập nhật state với người được chọn
                      this.setState((prevState) => {
                        const updatedProcessDetails = prevState.processDetails.map((item, i) =>
                          i === index ? { ...item, approver: options.map(opt => opt.value) } : item
                        );

                        const updatedCommentApprover = options.map((user) => ({
                          processTitle: detail.title,
                          numberOfApproval: detail.numberOfApproval,
                          value: user.value,
                          label: user.label,
                        }));

                        const filteredCommentApprover = prevState.commentApprover.filter(
                          (item) =>
                            item.processTitle !== detail.title ||
                            item.numberOfApproval !== detail.numberOfApproval
                        );

                        return {
                          ...prevState,
                          processDetails: updatedProcessDetails,
                          commentApprover: [...filteredCommentApprover, ...updatedCommentApprover],
                        };
                      });
                    }}
                    placeholder="Chọn người duyệt"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    );
  };

  public render(): React.ReactElement<ISuggestionAddProps> {
    const processOptions = this.state.processes.map((process) => ({
      value: process.ProcessCode,   // Dùng ProcessCode cho value
      label: process.ProcessName,   // Dùng ProcessName cho nhãn
      title: process.ProcessName,
    }));


    const emergencyOptions = this.state.emergencies.map(emergency => ({
      value: emergency.EmergencyName,
      label: emergency.EmergencyName,
    }));

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
                    <Select
                      options={this.state.plans.map(plan => ({ value: plan.planName, label: plan.planName }))}
                      value={this.state.plan ? { value: this.state.plan, label: this.state.plan } : null} // Nếu giá trị không hợp lệ, Select sẽ reset
                      onChange={(selectedOption) => this.setState({ plan: selectedOption?.value })}
                      placeholder="Chọn kế hoạch"
                    />
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
                    <Select
                      options={emergencyOptions}
                      value={emergencyOptions.find(option => option.value === this.state.emergency)}
                      onChange={(selectedOption) => this.setState({ emergency: selectedOption?.value })}
                      placeholder="Chọn độ ưu tiên"
                    />
                  </label>
                  <label className={styles.label}>
                    Tên quy trình:
                    <input
                      type="text"
                      value={this.state.processName || "Nhấn để chọn quy trình"}  // Hiển thị giá trị processName hoặc giữ placeholder nếu chưa có
                      readOnly
                      onClick={this._toggleModal}
                      style={{ width: 'auto' }}
                    />
                  </label>
                  <Popup
                    show={this.state.showModal}
                    onClose={this._toggleModal}
                  >
                    <h3>Chọn quy trình</h3>
                    <Select
                      options={processOptions}
                      onChange={this._handleProcessSelect}
                      placeholder="Chọn quy trình..."
                      isSearchable
                      value={processOptions.find(option => option.value === this.state.selectedProcessCode)} // Hiển thị giá trị theo ProcessCode đã được chọn trước đó
                    />
                    {this.state.processName && (
                      <div>
                        {this.state.processDetails.length > 0 ? (
                          this._renderProcessDetailsTable()
                        ) : (
                          <p>Không có dữ liệu chi tiết cho quy trình đã chọn.</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={this.addComment}
                      className={styles.saveButton}
                    >
                      Lưu
                    </button>
                  </Popup>
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
                        style={{ width: 'auto' }}
                      />
                      <div className={styles.attachmentContainer}>
                        {this.state.files.slice(0, 5).map((file, fileIndex) => (
                          <div key={fileIndex} className={styles.attachmentItem}>
                            <div className={styles.attachmentIcon}>
                              {this._renderFileIcon(file.name)}
                            </div>
                            <div className={styles.attachmentLink}>
                              <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">
                                {file.name.length > 10 ? `${file.name.slice(0, 20)}...` : file.name}
                              </a>
                              <button
                                type="button"
                                className={styles.removeFileButton}
                                onClick={() => this.removeFile(fileIndex)}
                              >
                                &times;
                              </button>
                            </div>
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
                <div className={styles.commentContainer}>
                  {this.state.Status === 'Staff' && (
                    <ShowCommentSuggest
                      user={{ name: 'User Name', avatarUrl: 'path_to_avatar.png' }}
                      comment="Đây là comment mẫu"
                      isLoading={false} // Bạn có thể thay đổi điều kiện này tùy theo logic
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          {this.state.Status === 'Staff' && (
            <div className={styles.userCommentContainer}>
              {this.state.commentApprover.length > 0 ? (
                this.state.commentApprover.map((approver, index) => (
                  <div key={index} className={styles.userCommentBox}>
                    <div className={styles.userAvatar}>
                      <img
                        src="path_to_avatar_placeholder.png"
                        alt={approver.label}
                        className={styles.avatarImage}
                      />
                    </div>
                    <div className={styles.userDetails}>
                      <strong>{approver.label}</strong> {/* Display approver's name */}
                      <p>
                        {approver.comment ? approver.comment : 'Đang chờ nhận xét'}
                      </p> {/* Display approver's comment or fallback message */}
                    </div>
                  </div>
                ))
              ) : (
                <p>Không có người duyệt hoặc nhận xét nào.</p>
              )}
            </div>
          )}

          {this.state.activeTab === 'related' &&
            <div>
              {this.state.commentDataApprove
                ?.filter((comment: IComment) => comment.Title === this.props.suggestionToEdit?.Id.toString())
                .map((comment: IComment, commentIndex: number) => (
                  <div key={commentIndex}>
                    {comment.ProcessApprover.map((approver: { Title: string }, approverIndex: number) => (
                      <ShowCommentSuggest
                        key={`${commentIndex}-${approverIndex}`}
                        user={{
                          name: `${approver.Title} (Level: ${comment.ProcessNumberOfApprover})`,
                          avatarUrl: 'path_to_default_avatar.png' // Default avatar fallback
                        }}
                        comment={
                          <>
                            {comment.CommentApprover || 'Đang chờ duyệt'}
                            <span>
                              {comment.isApprove === 'Approve' ? ' ✔️' : comment.isApprove === 'Reject' ? ' ❌' : ''}
                            </span>
                          </>
                        }
                        isLoading={false}
                      />
                    ))}
                  </div>
                ))
              }
            </div>
          }

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

