import client from "./client";


export const backupsApi = {


    // GET all backups
    list: (params = {}) => {

        return client.get(
            "/backups/",
            {
                params
            }
        );

    },



    // Start backup
    backupSelected: (deviceIds) => {

        return client.post(

            "/backups/backup_selected/",

            {
                device_ids: deviceIds
            }

        );

    },



    // Restore backup
    restore: (backupId) => {

        return client.post(

            `/backups/${backupId}/restore/`

        );

    },



    // Compare backups
    compare: (backupIdA, backupIdB) => {

        return client.get(

            "/backups/compare/",

            {
                params:{
                    a: backupIdA,
                    b: backupIdB
                }
            }

        );

    },



    // Download backup file
    download: (backupId) => {

        return client.get(

            `/backups/${backupId}/download/`,

            {
                responseType:"blob"
            }

        );

    }


};