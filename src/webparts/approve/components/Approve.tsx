import * as React from 'react';
// import DemoApprove from './Views/DemoApprove';
import { IApproveProps } from './IApproveProps';
import styles from '../../suggest/components/Views/Suggestion.module.scss';
import ApproverView from './Views/AppoverView'

import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import { FaSearch, FaFilePdf, FaFileWord, FaFileAlt, FaEdit } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';




interface IApproveState {
  suggestions: DataSuggest[];
  showPopup: boolean;
  popupReason: string;
  popupAction: 'approve' | 'reject' | undefined;
  currentIndex: number | undefined;
  error: string;
  description: string;
  filterStatus: string;
  commentDataApprove: ICommentForApprove[];
  showApproverView: boolean;
  selectedSuggestion: DataSuggest | undefined; // Use DataSuggest here
}



interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface ICommentForApprove {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
  isApprove: string;
  CommentApprover: string;
}

export interface DataSuggest {
  Status: string;
  Plan: string;
  DateTime: string;
  Emergency: string;
  Note: string;
  Id: number;
  Title: string;
  ProcessName: string;
  Attachments: { FileName: string; Url: string }[]; 
}

export default class Approve extends React.Component<IApproveProps, IApproveState> {
  constructor(props: IApproveProps) {
    super(props);
    this.state = {
      suggestions: [],
      showPopup: false,
      popupReason: '',
      popupAction: undefined,
      currentIndex: undefined,
      error: '',
      description: '',
      filterStatus: 'Staff',  // Default to "Chờ duyệt"
      commentDataApprove: [],
      showApproverView: false, 
      selectedSuggestion: undefined,
    };
    this.getSuggestForApprove = this.getSuggestForApprove.bind(this);
  }

  handleClose = (): void => {
    this.setState({
      showPopup: false,
      popupReason: '',
      error: '',
    });
  };

  handleApprove = (index: number): void => {
    const selectedSuggestion = this.state.suggestions[index];
    this.setState({
      currentIndex: index,
      popupAction: 'approve',
      showPopup: true,
      description: selectedSuggestion.Title,
    });
  };

  handleReject = (index: number): void => {
    const selectedSuggestion = this.state.suggestions[index];
    this.setState({
      currentIndex: index,
      popupAction: 'reject',
      showPopup: true,
      description: selectedSuggestion.Title,
    });
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

  handlePopupChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setState({ popupReason: event.target.value, error: '' });
  };

  private async getSuggestForApprove(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
    const { filterStatus } = this.state;
  
    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'Plan', 'DateTime', 'Emergency', 'ProcessName', 'Note', 'Status')
        .filter(`Status eq '${filterStatus}'`)
        .expand('AttachmentFiles')();
  
        const suggestions: DataSuggest[] = await Promise.all(items.map(async (item) => {
          const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
          const attachmentLinks = attachments.map((attachment: IAttachment) => ({
            FileName: attachment.FileName,
            Url: attachment.ServerRelativeUrl
          }));
        
          return {
            Id: item.Id,
            Title: item.Title,
            Plan: item.Plan,
            DateTime: item.DateTime,
            Emergency: item.Emergency,
            Note: item.Note,
            ProcessName: item.ProcessName || '',
            Attachments: attachmentLinks || [], // Ensure it's always an array
            Status: item.Status as 'Draft' | 'Staff',
          };
        }));
        
        
      // Set the suggestions and apply user-specific filtering
      this.setState({ suggestions }, async () => {
        await this.filterSuggestByComment();  // Apply user-specific filtering after fetching data
      });
    } catch (error) {
      alert('Error retrieving data: ' + error.message);
    }
  }

  public async getCommentForApprove(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const commentItems = await sp.web.lists.getByTitle('Comment').items
        .select(
          'Id',
          'Title',
          'SuggestName',
          'ProcessTitle',
          'ProcessNumberOfApprover',
          'ProcessApprover/Title',
          'isApprove',
          'CommentApprover'
        )
        .expand('ProcessApprover')();

      if (commentItems.length > 0) {
        const commentDataApprove = commentItems.map(item => ({
          Id: item.Id,
          Title: item.Title,
          SuggestName: item.SuggestName,
          ProcessTitle: item.ProcessTitle,
          ProcessNumberOfApprover: item.ProcessNumberOfApprover,
          ProcessApprover: item.ProcessApprover.map((approver: { Title: string }) => ({ Title: approver.Title })), // Map to array of approver titles
          isApprove: item.isApprove,
          CommentApprover: item.CommentApprover
        }));

        // Update the state with the fetched process details
        this.setState({ commentDataApprove });
      } else {
        console.log("No comments found in the Comment list.");
      }
    } catch (error) {
      console.error("Error details:", error.message);
    }
  }

  private async filterSuggestByComment(): Promise<void> { 
    const { suggestions, commentDataApprove } = this.state;
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      // Get the current user information
      const currentUser = await sp.web.currentUser();
  
      // Filter suggestions based on matching Id and current user in ProcessApprover
      const filteredSuggestions = suggestions.filter(suggestion => {
        const matchingComment = commentDataApprove.find(comment => comment.Title === suggestion.Id.toString());
  
        // Check if there's a matching comment and if current user is in ProcessApprover
        if (matchingComment) {
          return matchingComment.ProcessApprover.some((approver: { Title: string }) => approver.Title === currentUser.Title);
        }
  
        return false;
      });
  
      // Update the state with filtered suggestions
      this.setState({ suggestions: filteredSuggestions });
      console.log("Filtered suggestions:", filteredSuggestions);
    } catch (error) {
      console.error("Error during filtering suggestions:", error.message);
    }
  }

  public async componentDidMount(): Promise<void> {
    await this.getSuggestForApprove();
    await this.getCommentForApprove();
    await this.filterSuggestByComment();
  }

  private openApproverView(suggestion: DataSuggest): void {
    this.setState({ selectedSuggestion: suggestion, showApproverView: true });
  }
  

  public render(): React.ReactElement<IApproveProps> {
    const searchStatus = Array.from(new Set(this.state.suggestions.map(s => s.Status)));
  
    return (
      <div className={styles.formContainer}>
        {!this.state.showApproverView && ( // Hiển thị form tra cứu và table khi showApproverView là false
          <form className={styles.tableContainer}>
            <div className={styles.actionButtons}>
              <select
                onChange={(e) => this.setState({ filterStatus: e.target.value })}
              >
                {searchStatus.map((status, index) => (
                  <option key={index} value={status}>
                    {status === 'Staff' ? 'Chờ duyệt' : status === 'Approve' ? 'Đã duyệt' : status === 'Deny' ? 'Trả lại' : status}
                  </option>
                ))}
              </select>
              <button type="button" onClick={this.getSuggestForApprove.bind(this)} className={`${styles.btn} ${styles.btnEdit}`}>
                <FaSearch color="blue" /> Tra cứu
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>Nội dung</th>
                  <th style={{ width: '200px' }}>Dự án</th>
                  <th style={{ width: '200px' }}>Ngày</th>
                  <th style={{ width: '200px' }}>Độ ưu tiên</th>
                  <th style={{ width: '150px' }}>Xem duyệt</th>
                </tr>
              </thead>
              <tbody>
                {this.state.suggestions.map((suggestion: DataSuggest, index: number) => (
                  <tr key={index}>
                    <td>
                      <input type="text" value={suggestion.Title} readOnly />
                    </td>
                    <td>
                      <input type="text" value={suggestion.Plan} readOnly />
                    </td>
                    <td>
                      <input type="text" value={suggestion.DateTime} readOnly />
                    </td>
                    <td>
                      <input type="text" value={suggestion.Emergency} readOnly />
                    </td>
                    <td>
                      <FaEdit onClick={() => this.openApproverView(suggestion)} style={{ cursor: 'pointer' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
        )}
        {this.state.showApproverView && this.state.selectedSuggestion && (
          <ApproverView
            suggestionToEdit={this.state.selectedSuggestion}  // Correct type
            onClose={() => this.setState({ showApproverView: false })}
            context={this.props.context}
          />
        )}
      </div>
    );
  }
}
