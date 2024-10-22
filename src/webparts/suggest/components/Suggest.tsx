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
  showModal: boolean;
  showSuggestionAdd: boolean; // New state for SuggestionAdd view
  users: string[]; 
  selectedUser: string;
  selectedSuggestion?: dataSuggest; 
  selectedIndex: number | undefined;
  selectedSuggestions: dataSuggest[];
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


export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      suggestions: [],
      showModal: false,
      showSuggestionAdd: false, // Initialize to false
      users: [], 
      selectedUser: '',
      selectedSuggestion: undefined,
      selectedIndex: undefined,
      selectedSuggestions: [],
      selectedIndices: [],
      showMore: false,
    };
    this.getSuggest = this.getSuggest.bind(this);
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

    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      for (const suggestion of selectedSuggestions) {
        await sp.web.lists.getByTitle(listTitle).items.getById(suggestion.Id).delete();
      }

      // Cập nhật lại danh sách sau khi xóa
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
      // console.error('Error deleting items:', error);
      // alert('Không thể xóa các mục: ' + error.message);
    }
  }

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
    this.setState({ showSuggestionAdd: !this.state.showSuggestionAdd });
  }

  private EditButtonClick = (): void => {
    const { selectedSuggestions } = this.state;
    
    if (selectedSuggestions.length !== 1) {
      alert('Vui lòng chọn đúng một mục để sửa.');
      return;
    }
  
    console.log('Selected Suggestion:', selectedSuggestions[0]);
  
    // Mở form chỉnh sửa và xóa bỏ các mục đã chọn
    this.setState({ 
      showSuggestionAdd: true, 
      selectedSuggestion: selectedSuggestions[0] 
    }, this.clearSelection); // Sau khi setState hoàn thành, gọi clearSelection để bỏ chọn
  };
  
  private clearSelection = (): void => {
    this.setState({ selectedIndices: [], selectedSuggestions: [] });
  };
  
  public render(): React.ReactElement<ISuggestProps> {
    return (
      <section>
        {this.state.showSuggestionAdd ? (
          <SuggestionAdd
            onClose={this.toggleSuggestionAdd} // Close function
            context={this.props.context}
            suggestionToEdit={this.state.selectedSuggestion} 
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
              <button type="button" onClick={this.getSuggest} className={`${styles.btn} ${styles.btnEdit}`}>
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