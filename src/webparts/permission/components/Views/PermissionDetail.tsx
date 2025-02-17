import React, { useState, useEffect } from 'react';
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface IPermissionDetailProps {
  show: boolean;
  context: WebPartContext;
}

const PermissionDetail: React.FC<IPermissionDetailProps> = ({ show, context }) => {
  const [permissionData, setPermissionData] = useState<unknown[]>([]);

  const getPermissionData = async (): Promise<void> => {
    const sp = spfi().using(SPFx(context));
    try {
      const data = await sp.web.lists.getByTitle('Permission').items
        .select(
          'Title',
          'UserName/Id',
          'UserName/Title',
          'TitleTypePermission',
          'Module',
          'Run',
          'Add',
          'Modify',
          'Delete',
          'ApproveSuggestion'
        )
        .expand('UserName')();
      setPermissionData(data);
      console.log('Fetched Permission Data:', data);
    } catch (error) {
      console.error('Error fetching Permission data:', error);
    }
  };

  const fetchPermissionData = async (): Promise<void> => {
    try {
      await getPermissionData();
    } catch (error) {
      console.error('Error in fetchPermissionData:', error);
    }
  };

  useEffect(() => {
    if (show) {
      fetchPermissionData()
        .then(() => {
          console.log('Data fetched successfully');
        })
        .catch((error) => {
          console.error('Error in fetchPermissionData:', error);
        });
    }
  }, [show]);
  
  return (
    <div>
      <h3>Permission Data</h3>
      <pre>{JSON.stringify(permissionData, null, 2)}</pre>
    </div>
  );
};

export default PermissionDetail;
