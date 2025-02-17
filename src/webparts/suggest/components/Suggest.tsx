import * as React from 'react';
import { ISuggestProps, IComment, IAttachment, dataSuggest } from './ISuggestProps';
import styles from './Views/Suggestion.module.scss';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFileAlt, FaFileWord, FaFilePdf } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import {Permission} from '../../permission/components/Views/UsersRight'
import DemoSuggest from './Views/DemoSuggest';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import SuggestionAdd from './Views/SuggestionAdd';

interface ISuggestState {
  suggestions: dataSuggest[];
  commentDataToEdit: IComment[];
  showModal: boolean;
  showSuggestionAdd: boolean; // New state for SuggestionAdd view
  users: string[];
  selectedUser: string;
  selectedSuggestion?: dataSuggest;
  selectedIndex: number | undefined;
  selectedSuggestions: dataSuggest[];
  commentToEdit?: IComment[];
  commentData?: IComment[];
  selectedIndices: number[];
  showMore: boolean;

  permissionData: Permission[];

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
}

export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      suggestions: [],
      commentDataToEdit: [],
      showModal: false,
      showSuggestionAdd: false,
      users: [],
      selectedUser: '',
      selectedSuggestion: undefined,
      selectedIndex: undefined,
      selectedSuggestions: [],
      commentToEdit: [],
      commentData: [],
      selectedIndices: [],
      showMore: false,

      permissionData: [],

      permission: [],
    };
    this.getSuggest = this.getSuggest.bind(this);
    this.getPermission = this.getPermission.bind(this);
    this.getComment = this.getComment.bind(this);
    this.getPermissionData = this.getPermissionData.bind(this);
    this.toggleSuggestionAdd = this.toggleSuggestionAdd.bind(this);
  }


  private async getSuggest(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'Plan', 'DateTime', 'Emergency', 'ProcessName', 'Note', 'Status')
        .filter("Status eq 'Staff' or Status eq 'Draft'")
        .expand('AttachmentFiles')();
  
      const suggestions: dataSuggest[] = await Promise.all(items.map(async (item) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
  
        const attachmentLinks = attachments.length > 0
          ? attachments.map((attachment: IAttachment) => ({
              FileName: attachment.FileName,
              Url: attachment.ServerRelativeUrl
            }))
          : [];
  
        return {
          Id: item.Id,
          Title: item.Title ?? "",
          ProcessName: item.ProcessName ?? "",
          DateTime: item.DateTime ?? "",
          plan: item.Plan ?? "",
          Attachments: attachmentLinks
        };
      }));
  
      this.setState({ suggestions });
      this.clearSelection();
      await this.getPermission();
    } catch (error) {
      alert('Error retrieving data Suggest: ' + error.message);
    }
  }

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
      } catch (error) {
        console.error('Error fetching Permission data:', error);
        alert('Failed to fetch Permission data: ' + error.message);
      }
  }
  
  private deleteSuggest = async (): Promise<void> => {
    const { selectedSuggestions, suggestions } = this.state;

    if (selectedSuggestions.length === 0) {
      alert('Vui lòng chọn ít nhất một mục để xóa.');
      return;
    }

    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa các mục đã chọn không?');

    if (!confirmDelete) {
      return;
    }

    const listTitleSuggest = 'Suggest';
    const listTitleComment = 'Comment';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      for (const suggestion of selectedSuggestions) {
        const itemId = suggestion.Id;

        // Delete corresponding comments in "Comment" list with Title matching Suggest's itemId
        const commentItems = await sp.web.lists.getByTitle(listTitleComment).items
          .filter(`Title eq '${itemId}'`)() // Fetch comments with matching Title
          .catch(error => {
            console.error("Error fetching comments to delete:", error);
          });

        if (commentItems && commentItems.length > 0) {
          for (const comment of commentItems) {
            await sp.web.lists.getByTitle(listTitleComment).items.getById(comment.Id).delete();
            console.log(`Deleted comment with ID: ${comment.Id}`);
          }
        }

        // Delete the item from the "Suggest" list
        await sp.web.lists.getByTitle(listTitleSuggest).items.getById(itemId).delete();
        console.log(`Deleted suggestion with ID: ${itemId}`);
      }

      // Update the suggestions list in the state after deletion
      const updatedSuggestions = suggestions.filter(
        suggestion => !selectedSuggestions.includes(suggestion)
      );

      this.setState({
        suggestions: updatedSuggestions,
        selectedSuggestions: [],
        selectedIndices: []
      });

      alert('Xóa thành công!');
      this.clearSelection();
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Không thể xóa các mục: ' + error.message);
    }
  };


  _renderFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FaFilePdf color="red" />;
      case 'doc':
      case 'docx':
        return <FaFileWord color="blue" />;
      default:
        return <FaFileAlt />;
    }
  };

  private toggleSuggestionAdd(): void {
    // this.setState({ showSuggestionAdd: !this.state.showSuggestionAdd });
    this.setState({ showSuggestionAdd: !this.state.showSuggestionAdd, selectedSuggestion: undefined });
  }

  public async getComment(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const commentItems = await sp.web.lists.getByTitle('Comment').items
        .select('Id', 'Title', 'SuggestName', 'ProcessTitle', 'ProcessNumberOfApprover', 'ProcessApprover/Title')
        .expand('ProcessApprover')();
  
      if (commentItems.length > 0) {
        const groupedComments = commentItems.reduce((acc: IComment[], item) => {
          const existingComment = acc.find(comment =>
            comment.Title === item.Title &&
            comment.ProcessNumberOfApprover === item.ProcessNumberOfApprover
          );
  
          if (existingComment) {
            // Add the new approver to the existing ProcessApprover array only
            if (item.ProcessApprover && item.ProcessApprover.length > 0) {
              existingComment.ProcessApprover.push({ Title: item.ProcessApprover[0].Title });
            }
          } else {
            // Create a new entry for this comment with its ProcessApprover array
            const newComment: IComment = {
              Id: item.Id,
              Title: item.Title,
              SuggestName: item.SuggestName,
              ProcessTitle: item.ProcessTitle,
              ProcessNumberOfApprover: item.ProcessNumberOfApprover,
              ProcessApprover: item.ProcessApprover && item.ProcessApprover.length > 0
                ? item.ProcessApprover.map((approver: { Title: string }) => ({ Title: approver.Title }))
                : []
            };
            acc.push(newComment);
          }
          return acc;
        }, []);
        this.setState({ commentData: groupedComments }, () => {
          // Log the state after it has been updated
        });
  
      } else {
        console.log("Không có dữ liệu từ Comment list.");
      }
    } catch (error) {
      console.error("Error fetching comment data:", error.message);
    }
  }

  private async getPermissionData(): Promise<void> {
    const listTitle = 'Permission';
    const sp = spfi().using(SPFx(this.props.context));

    try {
        const Data = await sp.web.lists.getByTitle(listTitle).items
            .select('Title', 'UserName/Id', 'UserName/Title', 'TitleTypePermission', 'Module', 'Run', 'Add', 'Modify', 'Delete', 'ApproveSuggestion')
            .expand('UserName')();

        // Gắn trực tiếp giá trị trả về vào state
        this.setState({ permissionData: Data });
        console.log('Data là:', Data);
    } catch (error) {
        console.error('Error fetching Permission data:', error);
    }
}


  private clearSelection = (): void => {
    this.setState({ selectedIndices: [], selectedSuggestions: [] });
  };

  
  private EditButtonClick = async (): Promise<void> => {
    const { selectedSuggestions, commentData } = this.state;
  
    if (selectedSuggestions.length !== 1) {
      alert('Vui lòng chọn đúng một mục để sửa.');
      return;
    }
  
    const selectedSuggestion = selectedSuggestions[0];
  
    // Kiểm tra commentData có phải là undefined không trước khi lọc
    const commentToEdit = (commentData || []).filter(comment => comment.SuggestName === selectedSuggestion.Title);
  
    this.setState(
      {
        showSuggestionAdd: true,
        selectedSuggestion, // Dữ liệu dòng được chọn
        commentToEdit, // Cập nhật commentToEdit vào state
      },
      () => {
        // console.log('State updated with selected suggestion for editing:', this.state.selectedSuggestion);
        // console.log('Updated commentToEdit:', this.state.commentToEdit);
      }
    );
  };
  
  
  public async componentDidMount(): Promise<void> {
    await this.getComment();
    await this.getSuggest();
    await this.getPermission();
  
    // Kiểm tra nếu selectedSuggestion không phải là undefined
    if (this.state.selectedSuggestion) {
      const { selectedSuggestion, commentData } = this.state;
      
      // Đảm bảo rằng selectedSuggestion có giá trị hợp lệ trước khi truy cập Title
      const commentToEdit = (commentData || []).filter(comment => comment.SuggestName === selectedSuggestion.Title);
  
      this.setState({ commentToEdit }, () => {
        console.log('Cập nhật commentToEdit sau khi componentDidMount:', this.state.commentToEdit);
      });
    }
  }
  
  
  

  public render(): React.ReactElement<ISuggestProps> {

  const isAddSuggest = this.state.permission.length > 0 
  ? this.state.permission.some(p => p.Run === false) : true; 

  const isModifySuggest = this.state.permission.length > 0 
  ? this.state.permission.some(p => p.Modify === false) : true;

  const isDeleteSuggest = this.state.permission.length > 0 
  ? this.state.permission.some(p => p.Delete === false) : true;


    return (
      <section>
        {this.state.showSuggestionAdd ? (
          <SuggestionAdd
            onClose={this.toggleSuggestionAdd}
            context={this.props.context}
            suggestionToEdit={this.state.selectedSuggestion}
            commentToEdit={this.state.commentToEdit}
          />
        ) : (
          <>
            <div className={styles.actionButtons}>
              <button 
              type="button" 
              onClick={this.toggleSuggestionAdd} 
              className={`${styles.btn} ${styles.btnAdd}`} 
              disabled={isAddSuggest} 
              >
                <FaPlus color="green" /> Thêm
              </button>
              <button type="button" onClick={this.EditButtonClick} className={`${styles.btn} ${styles.btnEdit}`}
              disabled={isModifySuggest} 
              >
                <FaEdit color="orange" /> Sửa
              </button>
              <button type="button" onClick={this.deleteSuggest} className={`${styles.btn} ${styles.btnDelete}`}
              disabled={isDeleteSuggest} 
              >
                <FaTrash color="red" /> Xóa
              </button>
              <button
                type="button"
                onClick={() => {
                  this.getSuggest()
                    .then(() => this.getComment())
                    .catch(error => console.error("Error loading data:", error));
                }}
                className={`${styles.btn} ${styles.btnEdit}`}
              >
                <FaSearch color="red" /> Tra cứu
              </button>
            </div>

            <DemoSuggest
              suggestions={this.state.suggestions}
              onSelectForEdit={this.EditButtonClick}
              onSelectionChange={(selectedSuggestions) => {
                console.log('Selected Suggestions:', selectedSuggestions);
                this.setState({
                  selectedSuggestions, // Cập nhật dòng được chọn
                  selectedIndices: selectedSuggestions.map((s) =>
                    this.state.suggestions.findIndex((item) => item.Id === s.Id)
                  ),
                });
              }}
            />

          </>
        )}
      </section>
    );
  }
}