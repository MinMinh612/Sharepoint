import React from 'react';
import Modal from 'react-modal';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import TableRender from '../../../../Components/TableRender';
import Select from 'react-select';
import { BiRefresh } from 'react-icons/bi';
import styles from './UsersRight.module.scss';
import PermissionDetail from './PermissionDetail'

interface IUsersRightProps {
    context: WebPartContext;
}

export interface Permission {
    id: string;
    'Người dùng': string;
    'Chức năng': string;
    'Xem': JSX.Element;
    'Thêm': JSX.Element;
    'Sửa': JSX.Element;
    'Xóa': JSX.Element;
    'Duyệt đề xuất': JSX.Element;
    [key: string]: string | JSX.Element | undefined;
}


interface IUsersRightState {
    permissionData: Permission[];
    typePermission: { label: string; value: string }[];
    selectedModule: string | undefined;
    isModalOpen: boolean;
    showPermissionDetail: boolean;

    permission: { 
        ID: number;
        Title: string; 
        UserName: { Id: number; Title: string } | undefined;
        TitleTypePermission: string; 
        Module: string; 
        Run: boolean; 
        Add: boolean; 
        Modify: boolean; 
        Delete: boolean; 
        ApproveSuggestion: boolean; 
    }[];
}

export default class UsersRight extends React.Component<IUsersRightProps, IUsersRightState> {
    constructor(props: IUsersRightProps) {
        super(props);
        this.state = {
            permissionData: [],
            typePermission: [],
            selectedModule: undefined,
            isModalOpen: false,
            showPermissionDetail: false,
            permission: [],
        };
    }

    public async componentDidMount(): Promise<void> {
        await this.getTypePermission();
        await this.getPermission();
    }

    private async getTypePermission(): Promise<void> {
        const listTitle = 'TypePermission';
        const sp = spfi().using(SPFx(this.props.context));

        try {
            const items = await sp.web.lists.getByTitle(listTitle).items
                .select('Title', 'NameModule')();

            const typePermission = items.map(item => ({
                label: item.NameModule,
                value: item.Title,
            }));

            this.setState({ typePermission });
            console.log('typePermission', typePermission)
        } catch (error) {
            console.error('Error fetching TypePermission data:', error);
        }
    }

    private async getPermission(): Promise<void> {
        const listTitle = 'Permission';
        const sp = spfi().using(SPFx(this.props.context));
    
        try {
            const items = await sp.web.lists.getByTitle(listTitle).items
                .select(
                    'ID', 'Title', 'UserName/Id', 'UserName/Title', 'TitleTypePermission', 'Module', 'Run', 'Add', 'Modify',
                    'Delete', 'ApproveSuggestion'
                )
                .expand('UserName')();
    
            console.log("Raw Permission Data:", items);
    
            const permission = items.map(item => ({
                ID: item.ID,
                Title: String(item.Title),
                UserName: Array.isArray(item.UserName)  
                    ? item.UserName.map((user: { Id: number; Title: string }) => ({
                        Id: Number(user.Id),
                        Title: String(user.Title)
                    }))
                    : item.UserName ? { Id: Number(item.UserName.Id), Title: String(item.UserName.Title) } : undefined,
                TitleTypePermission: String(item.TitleTypePermission),
                Module: String(item.Module),
                Run: Boolean(item.Run),
                Add: Boolean(item.Add),
                Modify: Boolean(item.Modify),
                Delete: Boolean(item.Delete),
                ApproveSuggestion: Boolean(item.ApproveSuggestion),
            }));
    
            console.log("Processed Permission Data:", permission);
    
            this.setState({ 
                permission,
                permissionData: this.mapPermissionData(permission) // Cập nhật bảng với dữ liệu đã map
            });
    
        } catch (error) {
            console.error('Error fetching Permission data:', error);
            alert('Failed to fetch Permission data: ' + error.message);
        }
    }
    

    private async updatePermission(itemId: number, fieldName: string, value: boolean): Promise<void> {
        const listTitle = 'Permission';
        const sp = spfi().using(SPFx(this.props.context));
    
        try {
            console.log(`Updating item ID ${itemId}, field ${fieldName} to ${value}`);
    
            // Cập nhật trực tiếp bằng ID thực tế của item
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
                [fieldName]: value
            });
    
            console.log(`✅ Updated item ID ${itemId}, field ${fieldName} to ${value}`);
    
            // Cập nhật lại dữ liệu
            await this.getPermission();
        } catch (error) {
            console.error(`❌ Error updating item ID ${itemId}, field ${fieldName}:`, error.message);
        }
    }
    
    private mapPermissionData(items: IUsersRightState["permission"]): Permission[] {
        return items.map(item => ({
            id: item.ID.toString(),
            'Người dùng': item.UserName
                ? Array.isArray(item.UserName)
                    ? item.UserName.map(user => user.Title).join(', ')
                    : item.UserName.Title
                : 'Không xác định',
            'Chức năng': item.Module || 'Không xác định',
            'Xem': <input type="checkbox" checked={item.Run} onChange={(e) => this.updatePermission(Number(item.ID), 'Run', e.target.checked)} />,
            'Thêm': <input type="checkbox" checked={item.Add} onChange={(e) => this.updatePermission(Number(item.ID), 'Add', e.target.checked)} />,
            'Sửa': <input type="checkbox" checked={item.Modify} onChange={(e) => this.updatePermission(Number(item.ID), 'Modify', e.target.checked)} />,
            'Xóa': <input type="checkbox" checked={item.Delete} onChange={(e) => this.updatePermission(Number(item.ID), 'Delete', e.target.checked)} />,
            'Duyệt đề xuất': <input type="checkbox" checked={item.ApproveSuggestion} onChange={(e) => this.updatePermission(Number(item.ID), 'ApproveSuggestion', e.target.checked)} />,
        }));
    }
    
    private filterPermissionData(): Permission[] {
        const { permissionData, selectedModule } = this.state;

        if (!selectedModule) {
            console.log('No module selected, returning all data.');
            return permissionData; // Trả về tất cả dữ liệu nếu không có module được chọn
        }

        console.log('Selected Module (Value):', selectedModule);
        console.log('Permission Data:', permissionData);

        const filteredData = permissionData.filter(row => {
            // Kiểm tra kỹ trường TitleTypePermission
            const titleTypePermission = row.TitleTypePermission
                ? row.TitleTypePermission.toString().trim().toLowerCase()
                : '';

            // So sánh với selectedModule
            const isMatch = titleTypePermission === selectedModule.trim().toLowerCase();
            console.log(`Comparing: "${titleTypePermission}" with "${selectedModule.trim().toLowerCase()}" => ${isMatch}`);
            return isMatch;
        });

        console.log('Filtered Data:', filteredData);
        return filteredData;
    }

    private handleSelectChange = (selectedOption: { label: string; value: string } | null): void => {
        this.setState(
            { selectedModule: selectedOption?.value || undefined, isModalOpen: false }, // Đóng modal sau khi chọn
            () => {
                console.log('Selected Module (Value):', this.state.selectedModule);
            }
        );
    };

    // Hàm xử lý hiển thị PermissionDetail
    private togglePermissionDetail = (): void => {
        this.setState((prevState) => ({
            showPermissionDetail: !prevState.showPermissionDetail,
        }));
    };

    private openModal = (): void => {
        this.setState({ isModalOpen: true });
    };

    private closeModal = (): void => {
        this.setState({ isModalOpen: false });
    };

    private clearFilter(): void {
        this.setState({ selectedModule: undefined }, () => {
            console.log('Filter cleared. Displaying all data.');
        });
    }


    public render(): React.ReactElement {
        const { typePermission, isModalOpen, showPermissionDetail } = this.state;

        const headers: (keyof Permission)[] = [
            'Người dùng',
            'Chức năng',
            'Xem',
            'Thêm',
            'Sửa',
            'Xóa',
            'Duyệt đề xuất',
        ];

        return (
            <div>
                <div style={{ marginBottom: '20px', width: '300px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flexGrow: 1 }} onClick={this.openModal}>
                        <Select
                            id="moduleSelect"
                            options={typePermission}
                            value={typePermission.find(option => option.value === this.state.selectedModule) || null}
                            onChange={this.handleSelectChange}
                            placeholder="Nhấn để chọn chức năng..."
                        />
                    </div>
                    <button
                        onClick={async () => {
                            await this.componentDidMount();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        title="Làm mới dữ liệu"
                    >
                        <BiRefresh size={24} />
                    </button>
                    <button
                        onClick={this.togglePermissionDetail}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        title="Làm mới dữ liệu"
                    >
                        Kiểm tra quyền chi tiết
                    </button>
                </div>
                {/* Hiển thị PermissionDetail khi nút được nhấn */}
                {showPermissionDetail && (
                    <PermissionDetail
                        show={showPermissionDetail}
                        context={this.props.context}
                    />
                )}

                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={this.closeModal}
                    contentLabel="Chọn chức năng"
                    ariaHideApp={false}
                    className={styles.modalContent}
                    overlayClassName={styles.modalOverlay}
                >
                    <ul className={styles.modalList}>
                        {typePermission.map((option, index) => (
                            <li
                                key={index}
                                className={`${styles.modalListItem} ${index < typePermission.length - 1 ? styles.modalListItemBorder : ''
                                    }`}
                                onClick={() => this.handleSelectChange(option)}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                    <button className={styles.modalCloseButton} onClick={this.closeModal}>
                        Đóng
                    </button>
                    <button
                        onClick={() => {
                            this.clearFilter();
                            this.closeModal();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'red',
                        }}
                        title="Bỏ lọc"
                    >
                        Bỏ lọc
                    </button>
                </Modal>

                <TableRender
                    headers={headers}
                    data={this.filterPermissionData()}
                    showSelectColumn={false}
                    onRowSelectionChange={(selectedRows) =>
                        console.log('Selected rows:', selectedRows)
                    }
                />
            </div>
        );
    }
}
