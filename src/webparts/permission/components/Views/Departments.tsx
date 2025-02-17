import React from 'react';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import TableRender from './TableRender';
import UsersRight from './UsersRight';
import Popup from '../../../../Components/Popup';
import Select from 'react-select';
import styles from './Departments.module.scss';
import { ISiteUserInfo } from '@pnp/sp/site-users';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';


interface IDepartmentsProps {
    context: WebPartContext;
}

export interface RowData {
    'Mã phòng ban': string;
    'Tên phòng ban': string;
    'Thành viên': string;
    'Quản lý': string;
    'Trưởng nhóm': string;
    [key: string]: string | undefined;
}


interface IDepartmentsState {
    departmentData: RowData[];
    isUsersRightVisible: boolean;
    selectedRows: RowData[];
    isPopupVisible: boolean;
    popupContent: string;
    saveButtonText: string;
    popupAction: (() => void) | undefined;
    DepartmentId: string;
    DepartmentName: string;
    Manager: { value: string; label: string }[];
    Leader: { value: string; label: string }[];
    Member: { value: string; label: string }[];

    users: { id: number; title: string }[];

    typePermission: { label: string; value: string }[];
}

interface DepartmentItem {
    Title: string;
    NameDepartment: string;
    MemberOfDepartment?: { Id: number; Title: string }[];
    ManagerOfDepartment?: { Id: number; Title: string }[];
    LeaderOfDepartment?: { Id: number; Title: string }[];
}

export default class Departments extends React.Component<IDepartmentsProps, IDepartmentsState> {
    constructor(props: IDepartmentsProps) {
        super(props);
        this.state = {
            departmentData: [],
            isUsersRightVisible: false,
            selectedRows: [],
            isPopupVisible: false,
            popupContent: '',
            saveButtonText: '',
            popupAction: undefined,
            DepartmentId: '',
            DepartmentName: '',
            Manager: [],
            Leader: [],
            Member: [],
            users: [],
            typePermission: [],
        };
    }

    public async componentDidMount(): Promise<void> {
        await this.getUsers();
        await this.getDepartmentData();
        await this.getTypePermission();
    }

    private async getDepartmentData(): Promise<void> {
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

            const departmentData = this.mapDepartmentData(items);

            this.setState({ departmentData });
        } catch (error) {
            console.error('Error fetching Departments data:', error);
        }
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
            console.error('Lấy dữ liệu Type Permission lỗi:', error);
        }
    }

    private mapDepartmentData(items: DepartmentItem[]): RowData[] {
        return items.map(item => ({
            'Mã phòng ban': item.Title,
            'Tên phòng ban': item.NameDepartment,
            'Thành viên': item.MemberOfDepartment
                ? item.MemberOfDepartment.map(member => member.Title).join(', ') : '',
            'Quản lý': item.ManagerOfDepartment
                ? item.ManagerOfDepartment.map(manager => manager.Title).join(', ') : '',
            'Trưởng nhóm': item.LeaderOfDepartment
                ? item.LeaderOfDepartment.map(leader => leader.Title).join(', ') : '',
        }));
    }

    public getUsers = async (): Promise<void> => {
        const sp = spfi().using(SPFx(this.props.context));
        try {
            const groupUsers: ISiteUserInfo[] = await sp.web.siteUsers.filter("IsSiteAdmin eq false")();
            const userList = groupUsers.map((user: ISiteUserInfo) => ({
                id: user.Id,
                title: user.Title,
            }));
            this.setState({ users: userList });
        } catch (error) {
            console.error('Error fetching users from site:', error);
        }
    };

    private toggleUsersRight = (): void => {
        this.setState(prevState => ({
            isUsersRightVisible: !prevState.isUsersRightVisible,
        }));
    };

    private clickAddNew = (): void => {
        this.setState({
            isPopupVisible: true,
            popupContent: 'Thêm mới phòng ban', // Nội dung tiêu đề popup
            popupAction: this.addDepartment,   // Hàm thực hiện khi nhấn nút Lưu
            saveButtonText: "Lưu",             // Text hiển thị trên nút
            DepartmentId: '',                  // Reset dữ liệu khi thêm mới
            DepartmentName: '',
            Manager: [],
            Leader: [],
            Member: [],
        });
    };


    private clickEdit = (): void => {
        const { selectedRows } = this.state;

        if (selectedRows.length !== 1) {
            alert("Vui lòng chọn một dòng để chỉnh sửa!");
            return;
        }

        const row = selectedRows[0];

        // Kiểm tra và ánh xạ dữ liệu từ selectedRows
        const mapToSelectFormat = (names: string | undefined): { value: string; label: string }[] =>
            names
                ? names.split(', ').map(name => ({ value: name.trim(), label: name.trim() }))
                : []; // Nếu không có giá trị, trả về mảng rỗng

        this.setState(
            {
                isPopupVisible: true,
                popupContent: 'Chỉnh sửa phòng ban',
                popupAction: this.editDepartment,
                saveButtonText: "Cập nhật",
                DepartmentId: row['Mã phòng ban'] || '',
                DepartmentName: row['Tên phòng ban'] || '',
                Manager: mapToSelectFormat(row['Quản lý']),
                Leader: mapToSelectFormat(row['Trưởng nhóm']),
                Member: mapToSelectFormat(row['Thành viên']),
            },
            () => {
                // Kiểm tra state sau khi cập nhật
                console.log("📌 State sau khi chọn dòng:");
                console.log("➡ DepartmentId:", this.state.DepartmentId);
                console.log("➡ DepartmentName:", this.state.DepartmentName);
                console.log("➡ Manager:", this.state.Manager);
                console.log("➡ Leader:", this.state.Leader);
                console.log("➡ Member:", this.state.Member);
            }
        );
    };


    //Hàm reset trạng thái select
    private handleRowSelectionChange = (selectedRows: RowData[]): void => {
        this.setState({
            selectedRows,
            DepartmentId: '',
            DepartmentName: '',
            Manager: [],
            Leader: [],
            Member: [],
        });
    };


    private editDepartment = async (): Promise<void> => {
        const { DepartmentId, DepartmentName, Manager, Leader, Member, selectedRows, users } = this.state;
        const listTitle = "Departments";
        const sp = spfi().using(SPFx(this.props.context));

        try {
            if (selectedRows.length !== 1) {
                alert("Vui lòng chọn một dòng để chỉnh sửa!");
                return;
            }

            const selectedRow = selectedRows[0];
            const departmentId = selectedRow['Mã phòng ban'];

            if (!departmentId) {
                alert("Không tìm thấy Mã phòng ban trong dòng được chọn!");
                return;
            }

            // Truy vấn item cần sửa để lấy ID
            const items = await sp.web.lists.getByTitle(listTitle).items
                .select('Id')
                .filter(`Title eq '${departmentId}'`)
                .top(1)();

            if (items.length === 0) {
                alert("Không tìm thấy phòng ban để chỉnh sửa!");
                return;
            }

            const itemId = items[0].Id;

            // **Lấy ID của user từ danh sách users**
            const getUserId = (name: string): number | null => {
                const foundUser = users.find((u) => u.title === name);
                return foundUser ? foundUser.id : null; // Nếu không tìm thấy, trả về null
            };

            const managerId = Manager.map((m) => getUserId(m.label)).filter((id) => id !== null);
            const leaderId = Leader.map((l) => getUserId(l.label)).filter((id) => id !== null);
            const memberIds = Member.map((m) => getUserId(m.label)).filter((id) => id !== null);

            // **Gửi dữ liệu cập nhật lên SharePoint**
            console.log("🔹 Dữ liệu cập nhật:", {
                Title: DepartmentId,
                NameDepartment: DepartmentName,
                ManagerOfDepartmentId: managerId,
                LeaderOfDepartmentId: leaderId,
                MemberOfDepartmentId: memberIds,
            });

            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
                Title: DepartmentId,
                NameDepartment: DepartmentName,
                ManagerOfDepartmentId: managerId,
                LeaderOfDepartmentId: leaderId,
                MemberOfDepartmentId: memberIds,
            });

            console.log("✅ Cập nhật phòng ban thành công!");

            // **Làm mới danh sách phòng ban**
            await this.getDepartmentData();

            // **Đóng popup**
            this.closePopup();

            // **Gọi hàm phân quyền**
            await this.addPermissionFromDepartment([...Manager, ...Leader, ...Member]);
        } catch (error) {
            console.error("❌ Lỗi khi chỉnh sửa phòng ban:", error);
        }
    };


    private addDepartment = async (): Promise<void> => {
        const { DepartmentId, DepartmentName, Manager, Leader, Member } = this.state;
        const listTitle = "Departments";
        const sp = spfi().using(SPFx(this.props.context));

        try {
            if (!DepartmentId) {
                alert("Tên phòng ban không được để trống!");
                return;
            }

            // Chuẩn bị dữ liệu
            const managerId = Manager.map(manager => parseInt(manager.value));
            const leaderId = Leader.map(leader => parseInt(leader.value));
            const memberIds = Member.map(member => parseInt(member.value));

            await sp.web.lists.getByTitle(listTitle).items.add({
                Title: DepartmentId,
                NameDepartment: DepartmentName,
                ManagerOfDepartmentId: managerId,
                LeaderOfDepartmentId: leaderId,
                MemberOfDepartmentId: memberIds,
            });

            console.log("Thêm phòng ban thành công!");

            // Làm mới danh sách phòng ban
            await this.getDepartmentData();

            // Đóng popup
            this.closePopup();

            // Gọi hàm addPermissionFromDepartment và truyền dữ liệu người dùng
            await this.addPermissionFromDepartment([...Manager, ...Leader, ...Member]);
        } catch (error) {
            console.error("Lỗi khi thêm phòng ban:", error);
        }
    };


    private deleteDepartments = async (): Promise<void> => {
        const { selectedRows } = this.state;
        const listTitle = "Departments";
        const sp = spfi().using(SPFx(this.props.context));

        try {
            if (!selectedRows || selectedRows.length === 0) {
                alert("Vui lòng chọn ít nhất một dòng để xóa!");
                return;
            }

            // Lấy danh sách Title (Mã phòng ban) từ các dòng đã chọn
            const selectedTitles = selectedRows.map(row => row['Mã phòng ban']);
            console.log("Danh sách mã phòng ban được chọn:", selectedTitles);

            if (selectedTitles.length === 0) {
                alert("Không có mã phòng ban hợp lệ để xóa!");
                return;
            }

            // Lấy danh sách toàn bộ items từ danh sách SharePoint
            const allItems = await sp.web.lists.getByTitle(listTitle).items();

            // Ánh xạ Title sang ID dựa trên các mã phòng ban đã chọn
            const validIds = allItems
                .filter(item => selectedTitles.includes(item.Title)) // So sánh Title
                .map(item => item.ID); // Lấy ID tương ứng

            if (validIds.length === 0) {
                alert("Không tìm thấy ID hợp lệ để xóa!");
                return;
            }

            // Xác nhận trước khi xóa
            const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa các phòng ban đã chọn?");
            if (!confirmDelete) return;

            // Xóa từng dòng dựa trên ID
            for (const id of validIds) {
                try {
                    console.log(`Đang xóa phòng ban với ID: ${id}`);
                    await sp.web.lists.getByTitle(listTitle).items.getById(id).delete();
                } catch (error) {
                    console.error(`Lỗi khi xóa phòng ban với ID ${id}:`, error);
                }
            }

            console.log("Xóa phòng ban thành công!");

            // Làm mới danh sách phòng ban
            await this.getDepartmentData();

            // Xóa chọn
            this.setState({ selectedRows: [] });
        } catch (error) {
            console.error("Lỗi khi xóa phòng ban:", error);
            alert("Đã xảy ra lỗi trong quá trình xóa phòng ban. Vui lòng kiểm tra lại!");
        }
    };

    private closePopup = (): void => {
        this.setState({
            isPopupVisible: false,
            popupContent: '',
            popupAction: undefined,
            DepartmentId: '',
            DepartmentName: '',
            Manager: [],
            Leader: [],
            Member: [],
        });
    };


    private async addPermissionFromDepartment(users: { value: string; label: string }[]): Promise<void> {
        const listTitle = "Permission";
        const sp = spfi().using(SPFx(this.props.context));

        try {
            console.log("🔹 Hàm addPermissionFromDepartment được gọi!");
            console.log("📌 Users cần thêm:", users);

            if (users.length === 0) {
                console.warn("⚠️ Không có user nào để thêm vào Permission.");
                return;
            }

            // **Xóa user trùng lặp trước khi thêm mới**
            await this.DeleteUsersExist(users);

            // Lấy dữ liệu từ danh sách TypePermission
            const typePermissionItems = await sp.web.lists.getByTitle("TypePermission").items
                .select('Title', 'NameModule')();

            console.log("📌 TypePermission Items:", typePermissionItems);

            if (typePermissionItems.length === 0) {
                console.error("⚠️ Không tìm thấy dữ liệu trong TypePermission");
                return;
            }

            // Thêm từng user vào Permission
            for (const user of users) {
                for (const typePermission of typePermissionItems) {
                    const dataToAdd = {
                        Title: user.value,
                        UserNameId: [parseInt(user.value)],
                        TitleTypePermission: typePermission.Title,
                        Module: typePermission.NameModule,
                        Run: true,
                        Add: true,
                        Modify: true,
                        Delete: true,
                        ApproveSuggestion: true,
                    };

                    console.log("📌 Đang thêm dữ liệu vào Permission:", dataToAdd);

                    // Thêm dữ liệu vào danh sách SharePoint
                    await sp.web.lists.getByTitle(listTitle).items.add(dataToAdd)
                        .then(() => {
                            console.log(`✅ Thêm thành công user: ${user.label}, TypePermission: ${typePermission.Title}`);
                        })
                        .catch((error) => {
                            console.error(`❌ Lỗi khi thêm user: ${user.label}, TypePermission: ${typePermission.Title}`, error);
                        });
                }
            }
            console.log("🚀 Hoàn thành thêm dữ liệu vào Permission!");
        } catch (error) {
            console.error("❌ Lỗi khi thực thi addPermissionFromDepartment:", error);
        }
    }

    private async DeleteUsersExist(users: { value: string; label: string }[]): Promise<void> {
        const listTitle = "Permission"; 
        const sp = spfi().using(SPFx(this.props.context)); 
    
        try {
            console.log("🔹 Kiểm tra và xóa user trùng lặp trong Permission.");
            
            if (users.length === 0) {
                console.warn("⚠️ Không có user nào cần kiểm tra.");
                return;
            }
    
            // Lấy danh sách các user hiện có trong Permission
            const existingItems = await sp.web.lists.getByTitle(listTitle).items
                .select('Id', 'UserName/Id', 'UserName/Title')
                .expand('UserName')();
    
            console.log("📌 Dữ liệu hiện có trong Permission:", existingItems);
    
            // Chuyển danh sách user cần xóa thành dạng mảng ID chuỗi
            const userIdsToDelete = users.map(user => String(user.value));
            console.log("📌 ID Users cần xóa:", userIdsToDelete);
    
            // Lọc ra các user cần xóa khỏi danh sách Permission
            const usersToDelete = existingItems.filter(item => {
                if (!item.UserName) return false;
            
                // Khai báo userIds bằng const thay vì let (sửa lỗi ESLint)
                const userIds: string[] = Array.isArray(item.UserName) 
                    ? item.UserName.map((u: { Id: number }) => String(u.Id)) 
                    : [String((item.UserName as { Id: number }).Id)];
            
                return userIds.some((id: string) => userIdsToDelete.includes(id));
            });

            console.log('Uses cần xóa:', usersToDelete)
            
    
            // Kiểm tra nếu không có user nào cần xóa
            if (usersToDelete.length === 0) {
                console.log("✅ Không có user nào cần xóa.");
                return;
            }
    
            // Xóa từng user nếu có trong danh sách
            for (const item of usersToDelete) {
                await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).delete();
                console.log(`🗑️ Đã xóa user ID ${item.UserName.Id} khỏi Permission.`);
            }
    
        } catch (error) {
            console.error("❌ Lỗi khi kiểm tra và xóa user trùng lặp:", error);
        }
    }
    


    public render(): React.ReactElement {
        const { departmentData, isUsersRightVisible, isPopupVisible, DepartmentId, DepartmentName, Manager, Leader, Member, users } = this.state;

        const userOptions = users.map((user) => ({
            value: user.id.toString(),
            label: user.title,
        }));

        const headers: (keyof RowData)[] = [
            'Mã phòng ban',
            'Tên phòng ban',
            'Quản lý',
            'Thành viên',
            'Trưởng nhóm',
        ];

        return (
            <div style={{ position: 'relative', padding: '20px' }}>
                {!isUsersRightVisible && (
                    <div>
                        <div>
                            <div className={styles.actionButtons}>
                                <button onClick={this.clickAddNew} className={`${styles.btn} ${styles.btnAdd}`} >
                                    <FaPlus color="green" /> Thêm
                                </button>
                                <button onClick={this.clickEdit} className={`${styles.btn} ${styles.btnEdit}`}>
                                    <FaEdit color="orange" /> Sửa
                                </button>
                                <button onClick={this.deleteDepartments} className={`${styles.btn} ${styles.btnDelete}`}>
                                    <FaTrash color="red" /> Xóa
                                </button>

                                <button onClick={this.toggleUsersRight} className={`${styles.btn} ${styles.btnOpenUsersRight}`}>Mở phân quyền</button>
                            </div>
                        </div>
                        <TableRender
                            headers={headers}
                            data={departmentData}
                            showSelectColumn={true}
                            onRowSelectionChange={this.handleRowSelectionChange}
                        />
                    </div>
                )}
                {isUsersRightVisible && (
                    <div>
                        <UsersRight context={this.props.context} />
                        <button onClick={this.toggleUsersRight} className={styles.btnCloseUsersRight}>Quay lại</button>
                    </div>
                )}
                {isPopupVisible && (
                    <Popup
                        show={isPopupVisible}
                        onClose={this.closePopup}
                        onSave={this.state.popupAction} // Sử dụng popupAction từ state
                        saveButtonText={this.state.saveButtonText} // Sử dụng saveButtonText từ state
                    >
                        <div className={styles.popupContent}>
                            <label>
                                Mã phòng ban:
                                <input
                                    type="text"
                                    value={DepartmentId}
                                    onChange={(e) =>
                                        this.setState({ DepartmentId: e.target.value })
                                    }
                                    disabled={this.state.saveButtonText === "Cập nhật"} // Vô hiệu hóa nếu đang sửa
                                />
                            </label>

                            <label>
                                Tên phòng ban:
                                <input
                                    type="text"
                                    value={DepartmentName}
                                    onChange={(e) =>
                                        this.setState({ DepartmentName: e.target.value })
                                    }
                                />
                            </label>
                            <label>
                                Quản lý:
                                <Select
                                    options={userOptions}
                                    value={Manager}
                                    onChange={(option) =>
                                        this.setState({ Manager: option ? [option] : [] })
                                    }
                                />
                            </label>
                            <label>
                                Thành viên:
                                <Select
                                    options={userOptions}
                                    isMulti
                                    value={Member}
                                    onChange={(options) =>
                                        this.setState({ Member: options ? [...options] : [] })
                                    }
                                />
                            </label>
                            <label>
                                Trưởng nhóm:
                                <Select
                                    options={userOptions}
                                    isMulti
                                    value={Leader}
                                    onChange={(options) =>
                                        this.setState({ Leader: options ? [...options] : [] })
                                    }
                                />
                            </label>
                        </div>
                    </Popup>

                )}
            </div>
        );
    }
}
