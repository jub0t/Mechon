AppsData = [];
ServerData = [];
AppsColor = [
  "rgb(94, 224, 253)",
  "rgb(162, 104, 247)",
  "rgb(80, 250, 123)",
  "rgb(255, 85, 85)",
];
Query = new URLSearchParams(window.location.search);

try {
  const paths = Query.get("file").split("/");
  paths.forEach((path) => {
    if (path == "" || path == " " || path == null) {
      return;
    }
    loaction = `${Query.get("file").split(path)[0]}/${path}`
      .replace(/\\/g, "/")
      .toString()
      .replace(/\/\//g, "/");
    document.getElementById("bread_crumb").innerHTML += `
    		<li class="flex items-center space-x-2">
          <i class="uil uil-angle-right"></i>
			<a href="file_manager?file=${loaction}" class="flex items-center px-1 capitalize hover:underline">${path}</a>
		</li>`;
  });
} catch {
  if (document.getElementById("bread_crumb")) {
    document.getElementById("bread_crumb").remove();
  }
}

if (
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

if (!localStorage.theme) {
  localStorage.theme = "light";
}

function renderTips() {
  var all = document.getElementsByTagName("*");

  for (var i = 0, max = all.length; i < max; i++) {
    index = all[i];
    if (index.getAttribute("tip")) {
      if (index.getAttribute("tipped")) continue;
      tippy(index, {
        content: index.getAttribute("tip"),
      });
      index.setAttribute("tipped", "true");
    }
  }
}

if (document.getElementById("content")) {
  fetch(`../file_content?path=${Query.get("file")}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      if (myJson.Success == true) {
        Parts = Query.get("file").toString().split("/");
        Extension = Parts[Parts.length - 1].toString().split(".")[1];
        document.getElementById("content").className = `language-${Extension}`;
        const editorElem = document.getElementById("content");
        const flask = new CodeFlask(editorElem, {
          language: Extension,
          lineNumbers: true,
        });
        flask.updateCode(myJson.Data.Content.decodeEntities());
        flask.onUpdate((code) => {
          saveFile(code);
        });
      } else {
        Side_Err(myJson.Message);
      }
    });
}

function update_main() {
  Name = document.getElementById("update_app_entry").value;
  fetch("../update_main", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("manage_apps_select").value,
      new_main: Name,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("update_app_entry").value = null;
      if (data.Success == true) {
        Side_Success(data.Message);
        renderDashboard();
      } else {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function saveFile(code) {
  let Content = code;
  fetch(`../update_file?path=${Query.get("file")}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: decodeURIComponent(Content),
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.Success == false) {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function NumMat(number, digits) {
  num = number.Stats.size;
  var si = [
    {
      value: 1,
      symbol: "Bytes",
    },
    {
      value: 1e3,
      symbol: "KB",
    },
    {
      value: 1e6,
      symbol: "MB",
    },
    {
      value: 1e9,
      symbol: "GB",
    },
    {
      value: 1e12,
      symbol: "TB",
    },
    {
      value: 1e15,
      symbol: "PB",
    },
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  NumberSize = (num / si[i].value).toFixed(digits).replace(rx, "$1");
  if (number.isDirectory) {
    return "";
  } else {
    return `${NumberSize} ${si[i].symbol}`;
  }
}

function create_app() {
  let Name = document.getElementById("create_app_name");
  let Entry = document.getElementById("create_app_entry");
  fetch("../create_app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: Name.value,
      main_entry: Entry.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      Entry.value = null;
      Name.value = null;
      if (data.Success) {
        Success(data.Message);
      } else {
        Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function isFolder(type) {
  if (type == true) {
    return "Folder";
  } else if (type == false) {
    return "File";
  } else {
    return "Unknown";
  }
}
Name = Query.get("file");
if (!Name) {
  Name = "";
}

function delete_file(path) {
  toDelete = [];
  toDelete.push(path);
  fetch("../delete_path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: toDelete,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.Success) {
        Side_Success(data.Message);
        setTimeout(() => {
          renderFileManager();
        }, 200);
      } else {
        Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function TypeToPen(Name, Data) {
  if (Data.isDirectory == true) {
    return "";
  } else {
    return `<button tip="Edit This File" onclick='window.open("../edit?file=${Name}/${Data.Name}")'
                                            class="items-center rounded-md w-10 h-10 bg-gray-50 shadow dark:bg-charade-600 text-blue-500 hover:text-gray-50 dark:hover:bg-blue-500 hover:bg-blue-500">
                                            <i class="uil uil-pen"></i>
                                        </button>`;
  }
}

function getViewsFolder(name, Data) {
  if (Data.isDirectory) {
    return `<button tip="Open This Directory" onclick='window.location.href = "../file_manager?file=${Name}/${Data.Name}"'
                                            class="items-center rounded-md w-10 h-10 bg-gray-50 dark:bg-charade-600 shadow text-yellow-500 hover:text-gray-50 hover:bg-yellow-500">
                                            <i class="uil uil-eye"></i>
                                        </button>`;
  } else {
    return "";
  }
}

function arraySum(a) {
  var total = 0;
  for (var i in a) {
    total += a[i];
  }
  return total;
}

function delete_app() {
  if (document.getElementById("delete_app_box")) {
    Swal.fire({
      icon: "warning",
      title: `Do You Really Want To Delete ${
        document.getElementById("delete_app_box").value
      }?`,
      showConfirmButton: true,
      showCancelButton: true,
      ConfirmButtonText: "Yes",
      CacnelButtonText: "Never Mind",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("../delete_app", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: document.getElementById("delete_app_box").value,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.Success) {
              Success(data.Message);
            } else {
              Err(data.Message);
            }
          })
          .catch((err) => console.log(err));
      }
    });
  } else {
    Side_Err("Could Not Find Application Data.");
  }
}
function NumComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
async function renderDashboard() {
  if (document.getElementById("apps_table")) {
    fetch("./panel_stats")
      .then((response) => {
        return response.json();
      })
      .then((pData) => {
        document.getElementById(
          "panel_path_display"
        ).innerHTML = `${pData.Data.Env.Path}/${pData.Data.Env.SecretPath}`;
        document.getElementById(
          "server_url_display"
        ).innerHTML = `${window.location.href}`;
        document.getElementById(
          "server_url_display"
        ).href = `${window.location.href}`;
        document.getElementById(
          "total_storage_display"
        ).innerHTML = `${NumComma(pData.Data.Env.MaxSSD / 1000)}`;
        document.getElementById("total_ram_display").innerHTML = `${NumComma(
          pData.Data.Env.MaxRam / 1000
        )}`;
        TotalRam = `${NumComma(pData.Data.Env.MaxRam / 1000)}`;
      });
    fetch("../list-apps")
      .then((response) => {
        return response.json();
      })
      .then((Apps) => {
        AppsData = Apps;
        delete_app_box = document.getElementById("delete_app_box");
        manage_apps_select = document.getElementById("manage_apps_select");
        delete_logs_app_box = document.getElementById("delete_logs_app_box");
        document.getElementById("apps_table").innerHTML = null;
        AppsNames = [];
        AppsCPU = [];
        AppsRam = [];
        delete_app_box.innerHTML = null;
        manage_apps_select.innerHTML = null;
        delete_logs_app_box.innerHTML = null;
        if (Apps.length == 0) {
          if (document.getElementById("charts_display")) {
            document.getElementById("charts_display").innerHTML = null;
          }
          return;
        }
        document.getElementById("total_bots_count").innerHTML = Apps.length;
        Apps.forEach((Process) => {
          AppsRam.push(parseInt((Process.Memory / 1000000).toFixed(2)));
          AppsNames.push(Process.App.Name);
          AppsCPU.push(Process.CPU);
          if (delete_app_box) {
            delete_app_box.value = null;
            AppName = `${Process.App.Name || "Unknown"}`;
            manage_apps_select.innerHTML += `<option class="py-3 " value="${AppName}">${AppName}</option>`;
            delete_app_box.innerHTML += `<option value="${AppName}">${AppName}</option>`;
            delete_logs_app_box.innerHTML += `<option value="${AppName}">${AppName}</option>`;
            document.getElementById(
              "apps_table"
            ).innerHTML += `<tr class="rounded-lg">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="ml-4">
                                                <div class=" dark:text-gray-200 text-gray-500">
                                                    ${Process.App.Pid}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class=" dark:text-gray-200 text-gray-900">${
                                          Process.App.Name || "Unknown"
                                        }</div>
                                    </td>
                                    <td class="px-6 py-4 dark:text-gray-200 whitespace-nowrap">
                                        <span
                                            class="px-5 py-1 uppercase inline-flex  leading-5 rounded-full bg-${StatusToColor(
                                              Process.App.Status
                                            )}-500 text-white font-bold">
                                            ${Process.App.Status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="dark:text-gray-200 text-gray-900">${Math.floor(
                                          Process.Memory / 1000000
                                        )}MB</div>
                                    </td>
                                    <td
                                        class="px-6 space-x-3 items-center py-4 whitespace-nowrap text-right  font-medium">
                                        <button ${StatusToFunction({
                                          Status: Process.App.Status,
                                          Name: Process.App.Name,
                                        })}
                                            class="items-center rounded-md dark:bg-charade-600 w-10 h-10 bg-gray-50 shadow text-${StatusToButton(
                                              Process.App.Status
                                            )}-500 hover:text-gray-50 hover:bg-${StatusToButton(
              Process.App.Status
            )}-500">
                                                ${StatusToIcon(
                                                  Process.App.Status
                                                )}
                                        </button>
                                        <button tip="Restart" onclick="restart_app('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-600 w-10 h-10 bg-gray-50 shadow text-blue-500 hover:text-gray-50 hover:bg-blue-500">
                                            <i class="uil uil-history-alt"></i>
                                        </button>
                                        <button tip="Show Logs" onclick="show_log('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-600 w-10 h-10 bg-gray-50 shadow text-amber-500 hover:text-gray-50 hover:bg-amber-500">
                                            <i class="uil uil-file"></i>
                                        </button>
                                        <button tip="Show Error Logs" onclick="show_error_log('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-600 w-10 h-10 bg-gray-50 shadow text-red-500 hover:text-gray-50 hover:bg-red-500">
                                            <i class="uil uil-exclamation-octagon"></i>
                                        </button>
                                        <button tip="File Manager" onclick="file_manager('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-600 w-10 h-10 bg-gray-50 shadow text-purple-500 hover:text-gray-50 hover:bg-purple-500">
                                            <i class="uil uil-folder"></i>
                                        </button>
                                    </td>
                                </tr>`;
          }
        });

        let FreeCpu = 100 - arraySum(AppsCPU);
        let FreeRam = TotalRam - arraySum(AppsRam); // MBs
        AppsColor.push(`rgb(230, 179, 108, 0.95)`);

        AppsNames.push("Free");
        CPUData = [];
        CPUData = AppsCPU;
        CPUData.push(FreeCpu);

        RamData = [];
        RamData = AppsRam;
        RamData.push(FreeRam);

        if (document.getElementById("ram_chart")) {
          try {
            ram_chart.destroy();
          } catch {}
          let ram_ctx = document.getElementById("ram_chart").getContext("2d");
          ram_chart = new Chart(ram_ctx, {
            type: "doughnut",
            data: {
              labels: AppsNames,
              datasets: [
                {
                  data: RamData,
                  backgroundColor: AppsColor,
                },
              ],
            },
          });
        }
        if (document.getElementById("cpu_chart")) {
          try {
            cpu_chart.destroy();
          } catch {}
          let cpu_ctx = document.getElementById("cpu_chart").getContext("2d");
          cpu_chart = new Chart(cpu_ctx, {
            type: "doughnut",
            data: {
              labels: AppsNames,
              datasets: [
                {
                  data: CPUData,
                  backgroundColor: AppsColor,
                },
              ],
            },
          });
        }
      });
  }
}
renderDashboard();

function renderSSDChart() {
  if (document.getElementById("ssd_chart")) {
    fetch("../ssd_chart")
      .then((response) => {
        return response.json();
      })
      .then((Data) => {
        let colors = AppsColor;
        let ssd_ctx = document.getElementById("ssd_chart").getContext("2d");
        ssd_chart = new Chart(ssd_ctx, {
          type: "doughnut",
          data: {
            labels: Data.Data.Names,
            datasets: [
              {
                data: Data.Data.Sizes,
                backgroundColor: colors,
              },
            ],
          },
        });
      });
  }
}
renderSSDChart();

function renderSSDBar() {
  if (document.getElementById("ssd_usage")) {
    fetch("../ssd_usage")
      .then((response) => {
        return response.json();
      })
      .then((Data) => {
        ssd_usage = document.getElementById("ssd_usage");
        ssd_usage.style.width = `${Data.Data.Percent.Used}%`;
        document
          .getElementById("ssd_tippy")
          .setAttribute(
            "tip",
            `[${Math.floor(Data.Data.Used / 10000)}MB] ${
              Data.Data.Percent.Used
            }% of Storage Used`
          );
        renderTips();
      });
  }
}
renderSSDBar();

async function rename_dir(path, name, data) {
  if (Query.get("file")) {
    root = Query.get("file");
  } else {
    root = "";
  }
  const { value: NewName } = await Swal.fire({
    input: "text",
    customClass: {
      popup: "colored-toast",
    },
    background: "#1B1C24",
    confirmButtonText: "Change",
    color: "#fff",
    inputValue: name,
    inputPlaceholder: `Enter New Name For ${name}`,
  });
  if (NewName) {
    fetch("../rename_dir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ToRename: path,
        NewName: `${root}/${NewName}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.Success) {
          Side_Success(data.Message);
          renderFileManager();
        } else {
          Side_Err(data.Message);
        }
      })
      .catch((err) => console.log(err));
  }
}

if (document.getElementById("display_log")) {
  if (Query.get("name")) {
    display_log = document.getElementById("display_log");
    fetch(`../log/${Query.get("name")}`)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        const editorElem = document.getElementById("display_log");
        const flask = new CodeFlask(editorElem, {
          language: `sh`,
          lineNumbers: true,
        });
        flask.updateCode(myJson.Data.decodeEntities());
        flask.onUpdate((code) => {
          saveFile(code);
        });
      });
  }
}

function delete_error_logs() {
  fetch("../delete_error_logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: document.getElementById("delete_logs_app_box").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.Success) {
        Side_Success(data.Message);
      } else {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function select_all_files() {
  const inputs = document.querySelectorAll("input");
  for (let i = 0; i < inputs.length; i++) {
    const element = inputs[i];
    if (element.type == "checkbox") {
      if (document.getElementById("select_all_files").checked) {
        element.checked = document.getElementById("select_all_files").checked;
      } else {
        element.checked = document.getElementById("select_all_files").checked;
      }
    }
  }
}

function delete_logs() {
  fetch("../delete_logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: document.getElementById("delete_logs_app_box").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.Success) {
        Side_Success(data.Message);
      } else {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function download_package() {
  Side_Info(
    `Installing ${document.getElementById("download_package_box").value} For ${
      document.getElementById("manage_apps_select").value
    }`
  );
  fetch("../install_package", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_app: document.getElementById("manage_apps_select").value,
      package_name: document.getElementById("download_package_box").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("download_package_box").value = null;
      if (data.Success) {
        Side_Success(data.Message);
      } else {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

if (document.getElementById("display_error_log")) {
  display_log = document.getElementById("display_error_log");
  fetch(`../error_log/${Query.get("name")}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      const editorElem = document.getElementById("display_error_log");
      const flask = new CodeFlask(editorElem, {
        language: `language-shell`,
        lineNumbers: true,
      });
      flask.updateCode(myJson.Data);
      flask.onUpdate((code) => {
        saveFile(code);
      });
    });
}

function StatusToFunction(data) {
  if (data.Status == "online") {
    return `onclick="stop_app('${data.Name}')"`;
  } else if (data.Status == "stopped") {
    return `onclick="start_app('${data.Name}')"`;
  } else {
    return `onclick="start_app('${data.Name}')"`;
  }
}

function StatusToIcon(status) {
  if (status == "online") {
    return `<i class="uil uil-pause-circle"></i>`;
  } else if (status == ``) {
    return `<i class="font-bold uil uil-play"></i>`;
  } else {
    return `<i class="font-bold uil uil-play"></i>`;
  }
}

function StatusToColor(status) {
  if (status == "online") {
    return "green";
  } else if (status == "stopped") {
    return "red";
  } else {
    return "amber";
  }
}

function StatusToButton(status) {
  if (status == "online") {
    return "red";
  } else if (status == "stopped") {
    return "green";
  } else {
    return "amber";
  }
}

function Err(Message) {
  Swal.fire("Basilisk Says", Message, "error").then((result) => {
    window.location.reload();
  });
}

function Success(Message) {
  if (localStorage.theme == "dark") {
    ModalBackground = "#1B1C24";
    ModalText = "#ffffff";
  } else {
    ModalText = "#3d3d3d";
    ModalBackground = "#ffffff";
  }
  Swal.fire({
    background: ModalBackground,
    color: ModalText,
    text: Message,
    icon: "success",
  }).then((result) => {
    window.location.reload();
  });
}

function start_app(Name) {
  fetch(`../start/${Name}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      renderDashboard();
      if (myJson.Success) {
        Side_Success(myJson.Message);
      } else {
        Side_Err(myJson.Message);
      }
    });
}

function restart_app(Name) {
  fetch(`../restart/${Name}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      if (myJson.Success) {
        Side_Success(myJson.Message);
        renderDashboard();
      } else {
        Side_Err(myJson.Message);
      }
    });
}

async function npm_install() {
  if (document.getElementById("manage_apps_select")) {
    Name = document.getElementById("manage_apps_select").value;
    Side_Info(`Node Modules Are Being Installed For ${Name}`);
    fetch(`../npm_install/${Name}`)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        Message = myJson.Message;
        if (myJson.Success) {
          Side_Success(myJson.Message);
        } else {
          Side_Err(myJson.Message);
        }
      });
  }
}

function sync_apps() {
  fetch(`../reload_apps`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      if (myJson.Success) {
        Success(myJson.Message);
      } else {
        Err(myJson.Message);
      }
    });
}

function stop_app(Name) {
  fetch(`../stop/${Name}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      renderDashboard();
      if (myJson.Success) {
        Side_Success(myJson.Message);
      } else {
        Side_Err(myJson.Message);
      }
    });
}

function show_log(Name) {
  window.open(`../show_log?name=${Name}`);
}

function show_error_log(Name) {
  window.open(`../show_error_log?name=${Name}`);
}

function renderTips() {
  var all = document.getElementsByTagName("*");

  for (var i = 0, max = all.length; i < max; i++) {
    index = all[i];
    if (index.getAttribute("tip")) {
      if (index.getAttribute("tipped")) continue;
      tippy(index, {
        content: index.getAttribute("tip"),
      });
      index.setAttribute("tipped", "true");
    }
  }
}

function delete_selected() {
  toDelete = [];
  Selectors = document.querySelectorAll("input");
  Selectors.forEach((Element) => {
    if (Element.type == "checkbox") {
      if (Element.checked) {
        if (Element.getAttribute("file_path")) {
          toDelete.push(Element.getAttribute("file_path"));
        }
      }
    }
  });
  if (toDelete.length > 0) {
    Swal.fire({
      title: "Are You Sure You Want To Delete The Selected Files?",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: `Never Mind`,
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("../delete_path", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: toDelete,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.Success) {
              Success(data.Message);
            } else {
              Err(data.Message);
            }
          })
          .catch((err) => console.log(err));
      }
    });
  } else {
    Side_Err("You Havn't Selected Any Files To Delete.");
  }
}

function create_folder() {
  if (Query.get("file") == null || Query.get("file") == "null") {
    MainPath = "";
  } else {
    MainPath = Query.get("file");
  }
  Swal.fire({
    title: "Create New Directory",
    input: "text",
    inputPlaceholder: "Enter Folder Name",
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
      fetch("../create_folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: `${MainPath}/${value}`,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.Success) {
            Success(data.Message);
          } else {
            Err(data.Message);
          }
        })
        .catch((err) => console.log(err));
    },
  });
}

function create_file() {
  Swal.fire({
    title: "Create New File",
    input: "text",
    inputPlaceholder: "Enter File Name",
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
      fetch("../create_file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: `${Query.get("file")}/${value}`,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.Success) {
            Success(data.Message);
          } else {
            Err(data.Message);
          }
        })
        .catch((err) => console.log(err));
    },
  });
}

function admin_login() {
  fetch("../login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: document.getElementById("admin_user_box").value,
      password: document.getElementById("admin_pass_box").value,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.Success) {
        Success(data.Message);
      } else {
        Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
}

function Side_Success(message) {
  Toast = Swal.mixin({
    toast: true,
    position: "top-right",
    iconColor: "white",
    customClass: {
      popup: "colored-toast",
    },
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: "success",
    title: message,
  });
}

function Side_Info(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 3000,
    customClass: {
      popup: "colored-toast",
    },
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: "info",
    title: message,
  });
}

function Side_Warn(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: "colored-toast",
    },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: "warning",
    title: message,
  });
}

function Side_Err(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    customClass: {
      popup: "colored-toast",
    },
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: "error",
    title: message,
  });
}

function file_manager(name) {
  if (name) {
    window.open(`../file_manager?file=${name}`);
  } else {
    window.open(`../file_manager`);
  }
}

function randomRGBA(opacity) {
  if (!opacity) {
    opacity = 1;
  }
  let colors = [
    "d93f3f",
    "99d94c",
    "5ad94c",
    "4cd980",
    "4cd9d7",
    "4c8bd9",
    "4c4ed9",
    "894cd9",
    "cb4cd9",
    "d94c80",
  ];
  let randomHex = `#${colors[Math.floor(Math.random() * colors.length)]}`;
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(randomHex);
  if (result) {
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}, ${opacity}`;
  }
  return null;
}

if (window.location.href.toString().includes("edit")) {
  document.onkeydown = function (e) {
    if (e.ctrlKey && e.keyCode == 83) {
      Side_Success("We Have Auto Save Don't Worry 😎");
      return false;
    }
  };
}

const fileTempl = document.getElementById("file-template"),
  imageTempl = document.getElementById("image-template"),
  empty = document.getElementById("empty");
let FILES = [];
// template to the target element
function addFile(target, file) {
  const isImage = file.type.match("image.*"),
    objectURL = URL.createObjectURL(file);

  const clone = isImage
    ? imageTempl.content.cloneNode(true)
    : fileTempl.content.cloneNode(true);

  clone.querySelector("h1").textContent = file.name;
  clone.querySelector("li").id = objectURL;
  clone.querySelector(".delete").dataset.target = objectURL;
  clone.querySelector(".size").textContent =
    file.size > 1024
      ? file.size > 1048576
        ? Math.round(file.size / 1048576) + "mb"
        : Math.round(file.size / 1024) + "kb"
      : file.size + "b";

  isImage &&
    Object.assign(clone.querySelector("img"), {
      src: objectURL,
      alt: file.name,
    });

  empty.classList.add("hidden");
  target.prepend(clone);

  FILES.push(file);
}

const gallery = document.getElementById("gallery"),
  overlay = document.getElementById("overlay");
const hidden = document.getElementById("hidden-input");
if (document.getElementById("button")) {
  document.getElementById("button").onclick = () => hidden.click();
  hidden.onchange = (e) => {
    for (const file of e.target.files) {
      addFile(gallery, file);
    }
  };
}
const hasFiles = ({ dataTransfer: { types = [] } }) =>
  types.indexOf("Files") > -1;
let counter = 0;

function dropHandler(ev) {
  ev.preventDefault();
  for (const file of ev.dataTransfer.files) {
    addFile(gallery, file);
    overlay.classList.remove("draggedover");
    counter = 0;
  }
}

function dragEnterHandler(e) {
  e.preventDefault();
  if (!hasFiles(e)) {
    return;
  }
  ++counter && overlay.classList.add("draggedover");
}

function dragLeaveHandler(e) {
  1 > --counter && overlay.classList.remove("draggedover");
}

function dragOverHandler(e) {
  if (hasFiles(e)) {
    e.preventDefault();
  }
}

if (gallery) {
  gallery.onclick = ({ target }) => {
    if (target.classList.contains("delete")) {
      const ou = target.dataset.target;
      document.getElementById(ou).remove(ou);
      gallery.children.length === 1 && empty.classList.remove("hidden");
      delete FILES[ou];
    }
  };
}

if (document.getElementById("submit")) {
  document.getElementById("submit").onclick = () => {
    for (let f = 0; f < FILES.length; f++) {
      const FILE = FILES[f];
      let FileData = new FormData();
      FileData.append("file", FILES[f]);
      Path = Query.get("file");
      if (Path == null) {
        Path = "";
      }
      fetch(`../upload_file?path=${Path}`, {
        method: "POST",
        body: FileData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.Success) {
            Side_Success(data.Message);
            renderFileManager();
          } else {
            Side_Err(data.Message);
          }
        })
        .catch((err) => console.log(err));
    }
    while (gallery.children.length > 0) {
      gallery.lastChild.remove();
    }
    empty.classList.remove("hidden");
    gallery.append(empty);
    FILES = {};
  };
}

function toggle_theme() {
  if (localStorage.theme == "dark") {
    localStorage.theme = "light";
    document.documentElement.classList.remove("dark");
  } else {
    localStorage.theme = "dark";
    document.documentElement.classList.add("dark");
  }
}

if (document.getElementById("cancel")) {
  document.getElementById("cancel").onclick = () => {
    while (gallery.children.length > 0) {
      gallery.lastChild.remove();
    }
    FILES = {};
    empty.classList.remove("hidden");
    gallery.append(empty);
  };
}

setInterval(() => {
  if (localStorage.theme == "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, 500);
setInterval(() => {
  renderTips();
}, 1000);
setInterval(() => {
  renderSSDChart();
  renderDashboard();
}, 20000);
