import { useEffect, useState } from "react";
import { Zap, Download, Loader2 } from "lucide-react";

import Topbar from "../components/Topbar";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RequireRole from "../components/RequireRole";

import { backupsApi } from "../api/backups";
import { devicesApi } from "../api/devices";


export default function Backups() {

  const [backups, setBackups] = useState([]);
  const [devices, setDevices] = useState([]);

  const [selected, setSelected] = useState([]);

  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const [page, setPage] = useState(1);



  // =========================
  // Load backups and devices
  // =========================

  async function loadData() {

    try {

      const backupsResponse = await backupsApi.list();
      const devicesResponse = await devicesApi.list();


      setBackups(
        backupsResponse.data.results ?? backupsResponse.data
      );


      setDevices(
        devicesResponse.data.results ?? devicesResponse.data
      );


    } catch (error) {

      console.error(
        "Failed loading backup data:",
        error
      );

    }

  }



  useEffect(() => {

    loadData();

  }, []);





  // =========================
  // Start Backup
  // =========================

  async function handleBackupNow() {

    if (selected.length === 0) {
      alert("Select at least one device");
      return;
    }


    setRunning(true);


    try {

      await backupsApi.backupSelected(selected);


      // reload backups after creation
      await loadData();


      setSelected([]);


    } catch(error) {

      console.error(
        "Backup failed:",
        error
      );

      alert(
        "Backup failed. Check backend logs."
      );


    } finally {

      setRunning(false);

    }

  }





  // =========================
  // Download Backup
  // =========================

  async function handleDownload(id) {


    try {

      setDownloading(id);


      const response = await backupsApi.download(id);


      const blob = new Blob(
        [response.data],
        {
          type:"text/plain"
        }
      );


      const url = window.URL.createObjectURL(blob);


      const link = document.createElement("a");

      link.href = url;


      link.download =
        `backup-${id}.txt`;


      document.body.appendChild(link);


      link.click();


      link.remove();


      window.URL.revokeObjectURL(url);



    } catch(error) {


      console.error(
        "Download failed:",
        error
      );


      alert(
        "Unable to download backup file"
      );


    } finally {

      setDownloading(null);

    }

  }





  // =========================
  // Table columns
  // =========================


  const columns = [

    {
      key:"device_name",
      header:"Device",
      render:(backup)=>(

        <span className="font-medium text-brand-600">

          {backup.device_name || backup.device}

        </span>

      )
    },


    {
      key:"ip_address",
      header:"IP Address"
    },


    {
      key:"created_at",
      header:"Backup Time",

      render:(backup)=>

        backup.created_at

        ? new Date(
            backup.created_at
          ).toLocaleString()

        : "—"

    },


    {
      key:"status",
      header:"Status",

      render:(backup)=>(

        <StatusBadge
          status={
            backup.status
          }
        />

      )

    },


    {
      key:"size_kb",
      header:"Size",

      render:(backup)=>

        backup.size_kb

        ? `${Number(
            backup.size_kb
          ).toFixed(2)} KB`

        : "—"

    },


    {
      key:"git_commit_hash",
      header:"Git Commit",

      render:(backup)=>(

        backup.git_commit_hash

        ? (

          <code className="text-xs bg-slate-100 px-2 py-1 rounded">

            {backup.git_commit_hash}

          </code>

        )

        : "—"

      )

    },


    {

      key:"actions",

      header:"Action",


      render:(backup)=>(


        <button

          disabled={
            backup.status !== "SUCCESS" ||
            downloading === backup.id
          }


          onClick={()=>
            handleDownload(
              backup.id
            )
          }


          className="
            p-1.5
            rounded-md
            hover:bg-slate-100
            text-slate-500
            disabled:opacity-40
          "

          title="Download backup"

        >


          {
            downloading === backup.id

            ?

            <Loader2
              size={15}
              className="animate-spin"
            />

            :

            <Download
              size={15}
            />

          }


        </button>


      )

    }


  ];







  return (

    <div className="flex-1 flex flex-col min-w-0">


      <Topbar

        title="Backups"

        subtitle={`${backups.length} backup records`}

      />



      <main className="flex-1 overflow-y-auto p-6 space-y-4">



        <div className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        ">



          <select


            multiple


            className="
              input
              h-32
              w-72
            "


            value={selected}


            onChange={(e)=>


              setSelected(

                Array.from(

                  e.target.selectedOptions,

                  option =>
                    Number(
                      option.value
                    )

                )

              )


            }

          >


            {
              devices.map(device=>(

                <option

                  key={device.id}

                  value={device.id}

                >

                  {device.hostname}

                  {" ("}

                  {device.ip_address}

                  {")"}

                </option>


              ))

            }


          </select>





          <RequireRole roles={["ADMIN","ENGINEER"]}>


            <button


              onClick={
                handleBackupNow
              }


              disabled={
                running ||
                selected.length===0
              }


              className="btn-primary"


            >


              {

                running

                ?

                <Loader2

                  size={16}

                  className="animate-spin"

                />

                :

                <Zap size={16}/>

              }


              Backup Now

              {
                selected.length > 0 &&
                ` (${selected.length})`
              }


            </button>


          </RequireRole>



        </div>





        <DataTable

          columns={columns}

          rows={backups}

          page={page}

          pageCount={
            Math.max(
              1,
              Math.ceil(
                backups.length / 5
              )
            )
          }

          onPageChange={
            setPage
          }

        />



      </main>



    </div>

  );

}