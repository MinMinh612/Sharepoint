import * as React from 'react';
import { ISuggestProps } from './ISuggestProps';
import styles from './Views/Suggestion.module.scss';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFileAlt, FaFileWord, FaFilePdf } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import DemoSuggest from './Views/DemoSuggest';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
// import { ISiteUserInfo } from '@pnp/sp/site-users/types';
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
  selectedIndices: number[];
  showMore: boolean;
}
export interface dataSuggest {
  Id: number;
  Title: string;
  ProcessName: string;
  Attachments?: { FileName: string; Url: string }[]; // khai báo thêm Url để link trực tiếp file 
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface IComment {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[]; // Assuming ProcessApprover contains an array of users
}



export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      suggestions: [],
      commentDataToEdit: [],
      showModal: false,
      showSuggestionAdd: false, // Initialize to false
      users: [],
      selectedUser: '',
      selectedSuggestion: undefined,
      selectedIndex: undefined,
      selectedSuggestions: [],
      commentToEdit: [],
      selectedIndices: [],
      showMore: false,
    };
    this.getSuggest = this.getSuggest.bind(this);
    this.getComment = this.getComment.bind(this);
    this.toggleSuggestionAdd = this.toggleSuggestionAdd.bind(this);
  }


  private async getSuggest(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'Plan', 'DateTime', 'Emergency', 'ProcessName', 'Note', 'Status') // Include ProcessName
        .filter("Status eq 'Staff' or Status eq 'Draft'") // Filter condition
        .expand('AttachmentFiles')();

      const suggestions: dataSuggest[] = await Promise.all(items.map(async (item: {
        Id: number;
        Title: string;
        Plan: string;
        DateTime: string;
        Emergency: string;
        Note: string;
        Status: string;
        ProcessName?: string;  // Optional ProcessName
      }) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();

        const attachmentLinks = attachments.length > 0
          ? attachments.map((attachment: IAttachment) => ({
            FileName: attachment.FileName,
            Url: attachment.ServerRelativeUrl
          }))
          : [];

        return {
          Id: item.Id,
          Title: item.Title,
          Plan: item.Plan,
          DateTime: item.DateTime,
          Emergency: item.Emergency,
          Note: item.Note,
          ProcessName: item.ProcessName || '',  // Add ProcessName to result, or use empty string if undefined
          Attachments: attachmentLinks
        };
      }));

      this.setState({ suggestions });
      this.clearSelection();
    } catch (error) {
      alert('Error retrieving data: ' + error.message);
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
        .select(
          'Id',
          'Title',
          'SuggestName',
          'ProcessTitle',
          'ProcessNumberOfApprover',
          'ProcessApprover/Title'
        )
        .expand('ProcessApprover')();

      // Group and consolidate users only for each unique Title and ProcessNumberOfApprover in commentDataToEdit
      const groupedComments: IComment[] = commentItems.reduce((acc: IComment[], item) => {
        // Check if a comment with the same Title and ProcessNumberOfApprover already exists in acc
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

      // Store the grouped comments in the state
      this.setState({ commentDataToEdit: groupedComments });
      console.log('Grouped comment data:', groupedComments);

    } catch (error) {
      console.error("Error fetching comment data:", error.message);
    }
  }


  private EditButtonClick = async (): Promise<void> => {
    const { selectedSuggestions, commentDataToEdit } = this.state;

    if (selectedSuggestions.length !== 1) {
      alert('Vui lòng chọn đúng một mục để sửa.');
      return;
    }

    const selectedSuggestion = selectedSuggestions[0];
    const suggestionId = selectedSuggestion.Id.toString();

    console.log('Selected Suggestion:', selectedSuggestion);
    console.log("Complete Comment Data loaded from state:", commentDataToEdit);

    if (commentDataToEdit.length === 0) {
      console.error("commentDataToEdit is empty. Ensure getComment() has been called and data is loaded.");
      return;
    }

    // Step 1: Filter comments matching the suggestion ID
    const filteredComments = commentDataToEdit.filter(comment => {
      const isMatch = comment.Title === suggestionId;
      console.log(`Comparing Comment Title "${comment.Title}" with Suggestion ID "${suggestionId}":`, isMatch);
      return isMatch;
    });

    // Step 2: Consolidate users for each unique `ProcessNumberOfApprover`
    const consolidatedComments = filteredComments.reduce((acc: IComment[], current) => {
      // Find if there is already an entry for the same `ProcessNumberOfApprover`
      const existingEntry = acc.find(
        item => item.ProcessNumberOfApprover === current.ProcessNumberOfApprover
      );

      if (existingEntry) {
        // If an entry for this approval level exists, merge the users without duplication
        const newUsers = current.ProcessApprover.filter(
          user => !existingEntry.ProcessApprover.some(existingUser => existingUser.Title === user.Title)
        );
        existingEntry.ProcessApprover = [...existingEntry.ProcessApprover, ...newUsers];
      } else {
        // If no entry for this approval level exists, add it as a new entry
        acc.push({ ...current });
      }

      return acc;
    }, []);

    console.table(consolidatedComments);

    if (consolidatedComments.length === 0) {
      console.warn("No comments found for the selected suggestion. Ensure that commentDataToEdit has the correct data.");
    }

    // Step 3: Update the state with filtered and consolidated comments for editing
    this.setState({
      showSuggestionAdd: true,
      selectedSuggestion,
      commentToEdit: consolidatedComments
    }, () => {
      console.log("State updated with consolidated comments for editing:", this.state.commentToEdit);
    });
  };



  private clearSelection = (): void => {
    this.setState({ selectedIndices: [], selectedSuggestions: [] });
  };

  public async componentDidMount(): Promise<void> {
    await this.getComment();
  }


  public render(): React.ReactElement<ISuggestProps> {
    return (
      <section>
        {this.state.showSuggestionAdd ? (
          <SuggestionAdd
            onClose={this.toggleSuggestionAdd} // Close function
            context={this.props.context}
            suggestionToEdit={this.state.selectedSuggestion}
            commentToEdit={this.state.commentToEdit}
          />
        ) : (
          <>
            <div className={styles.actionButtons}>
              <button type="button" onClick={this.toggleSuggestionAdd} className={`${styles.btn} ${styles.btnAdd}`}>
                <FaPlus color="green" /> Thêm
              </button>
              <button type="button" onClick={this.EditButtonClick} className={`${styles.btn} ${styles.btnEdit}`}>
                <FaEdit color="orange" /> Sửa
              </button>
              <button type="button" onClick={this.deleteSuggest} className={`${styles.btn} ${styles.btnDelete}`}>
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
                  selectedSuggestions,
                  selectedIndices: selectedSuggestions.map((suggestion) => this.state.suggestions.indexOf(suggestion))
                });
              }}
            />
          </>
        )}
      </section>
    );
  }
}