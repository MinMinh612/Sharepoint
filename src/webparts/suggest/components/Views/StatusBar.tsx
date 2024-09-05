import * as React from 'react';
import styles from './StatusBar.module.scss';
import { spfi, SPFx } from '@pnp/sp'; // Ensure you have pnp/sp installed
import { WebPartContext } from '@microsoft/sp-webpart-base'; 
// import { FaDownload, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';

interface IStatusBarProps {
//   onClose: () => void;
  context: WebPartContext;
  itemId: number;
}

interface IStatusBarState {
  activeTab: 'content' | 'related' | 'flow';
  currentStep: 'draft' | 'advise' | 'approve' | 'issue';
  itemId: number;
}


export default class StatusBar extends React.Component<IStatusBarProps, IStatusBarState> {
  constructor(props: IStatusBarProps) {
    super(props);
    this.state = {
      currentStep: 'draft',
      activeTab: 'content', 
      itemId: props.itemId,
    };
  }

  // Method to fetch Suggest data and update currentStep based on Status
  private async getDataSuggest(): Promise<void> {
    const { itemId } = this.state; // Assuming you have itemId in state
    if (!itemId) {
      console.error('No itemId available');
      return;
    }
  
    const listTitle = 'Suggest'; // The name of your SharePoint list
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      // Fetch the item by ID
      const item = await sp.web.lists.getByTitle(listTitle).items.getById(itemId).select('Status')();
  
      if (item) {
        const status = item.Status;
        console.log('Status:', status);
  
        // Update currentStep based on Status
        let currentStep: IStatusBarState['currentStep'] = 'draft';
        if (status === 'Staff') {
          currentStep = 'advise';
        } else if (status === 'Approve') {
          currentStep = 'approve';
        } else if (status === 'Issue') {
          currentStep = 'issue';
        }
  
        this.setState({ currentStep });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + error.message);
    }
  }
  
  public async componentDidMount(): Promise<void> {
    try {
      await this.getDataSuggest();
    } catch (error) {
      console.error('Error in componentDidMount:', error);
    }
  }

  getStatusStepClass = (step: 'draft' | 'advise' | 'approve' | 'issue'): string => {
    return this.state.currentStep === step ? `${styles.statusStep} ${styles.inProgress}` : `${styles.statusStep} ${styles.default}`;
  };

  public render(): React.ReactElement<IStatusBarProps> {
    return (
      <div className={styles.header}>
        <div className={this.getStatusStepClass('draft')}>
          <div className={styles.statusLabel}>Soạn thảo</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={this.getStatusStepClass('advise')}>
          <div className={styles.statusLabel}>Tham mưu</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={this.getStatusStepClass('approve')}>
          <div className={styles.statusLabel}>Phê duyệt</div>
          <div className={styles.statusCircle} />
        </div>
        <div className={styles.connector} />
        <div className={this.getStatusStepClass('issue')}>
          <div className={styles.statusLabel}>Ban hành</div>
          <div className={styles.statusCircle} />
        </div>
      </div>
    );
  }
}