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

function NumComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function arraySum(a) {
  var total = 0;
  for (var i in a) {
    total += a[i];
  }
  return total;
}
Query = new URLSearchParams(window.location.search);
Name = Query.get("file");
if (!Name) {
  Name = "";
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

function renderFileManager() {
  fetch(`../dirs?path=${Name}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      if (myJson.Success) {
        if (document.getElementById("file_manager_table")) {
          document.getElementById("file_manager_table").innerHTML = "";
          myJson.Data.forEach((File) => {
            document.getElementById("file_manager_table").innerHTML += `
                        <tr class="divide dark:text-gray-200 dark:divide-perfume-800 small-text">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class=" dark:text-gray-200 text-gray-900">
                                        <input file_name="${
                                          File.Name
                                        }" file_path="${Name}/${
              File.Name
            }" byte_size="${File.Stats.size}" created_ms="${
              File.Stats.birthtimeMs
            }" type="checkbox"></input>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="ml-4">
                                                <div class=" dark:text-gray-200 text-gray-500">
                                                    ${File.Name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class=" text-gray-900 dark:text-gray-200">${NumMat(
                                          File
                                        )}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class=" text-gray-900 dark:text-gray-200">${isFolder(
                                          File.isDirectory
                                        )}</div>
                                    </td>
                                    <td
                                        class="px-6 space-x-3 items-center py-4 whitespace-nowrap text-right  font-medium">
                                        ${getViewsFolder(Name, File)}
                                        ${TypeToPen(Name, File)}
                                        <button tip="Rename This" onclick="rename_dir('${Name}/${
              File.Name
            }', '${File.Name}', '${File}')"
                                            class="items-center rounded-md w-10 dark:hover:text-gray-300 dark:bg-charade-600 h-10 bg-gray-50 shadow text-perfume-800 dark:text-perfume-800 hover:text-gray-300 dark:hover:bg-perfume-800 hover:bg-perfume-800">
                                            <i class="uil uil-label"></i>
                                        </button>
                                        <button tip="Delete This File" onclick='delete_file("${
                                          Query.get("file") || ""
                                        }/${File.Name}")'
                                            class="items-center rounded-md w-10 dark:bg-charade-600 h-10 bg-gray-50 shadow text-red-500 hover:text-gray-50 hover:bg-red-500">
                                            <i class="uil uil-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>`;
          });
        }
      }
    });
}
renderFileManager();

async function renderDashboard() {
  fetch("./panel_stats")
    .then((response) => {
      return response.json();
    })
    .then((pData) => {
      if (document.getElementById("panel_path_display")) {
        document.getElementById(
          "panel_path_display"
        ).innerHTML = `${pData.Data.Env.Path}/${pData.Data.Env.SecretPath}`;
      }
      if (document.getElementById("server_url_display")) {
        document.getElementById(
          "server_url_display"
        ).innerHTML = `${window.location.href}`;
      }
      if (document.getElementById("server_url_display")) {
        document.getElementById(
          "server_url_display"
        ).href = `${window.location.href}`;
      }
      if (document.getElementById("total_storage_display")) {
        document.getElementById(
          "total_storage_display"
        ).innerHTML = `${NumComma(pData.Data.Env.MaxSSD / 1000)}`;
      }
      if (document.getElementById("total_ram_display")) {
        document.getElementById("total_ram_display").innerHTML = `${NumComma(
          pData.Data.Env.MaxRam / 1000
        )}`;
      }
      TotalRam = `${NumComma(pData.Data.Env.MaxRam / 1000)}`;
    });
  fetch("../list-apps")
    .then((response) => {
      return response.json();
    })
    .then((Apps) => {
      AppsData = Apps;
      if (document.getElementById("apps_table")) {
        document.getElementById("apps_table").innerHTML = null;
      }

      if (document.getElementById("delete_app_box")) {
        delete_app_box = document.getElementById("delete_app_box");
        delete_app_box.innerHTML = null;
      }
      if (document.getElementById("delete_logs_app_box ")) {
        delete_logs_app_box = document.getElementById("delete_logs_app_box");
      }
      if (document.getElementById("manage_apps_select")) {
        manage_apps_select = document.getElementById("manage_apps_select");
        if (document.getElementById("delete_logs_app_box ")) {
          document.getElementById("delete_logs_app_box ").innerHTML = null;
        }
      }
      if (Apps.length == 0) {
        if (document.getElementById("charts_display")) {
          document.getElementById("charts_display").innerHTML = null;
        }
        return;
      }
      if (document.getElementById("total_bots_count")) {
        document.getElementById("total_bots_count").innerHTML = Apps.length;
      }
      Apps.forEach((Process) => {
        AppName = `${Process.App.Name || "Unknown"}`;
        if (document.getElementById("delete_app_box")) {
          delete_app_box.innerHTML += `<option value="${AppName}">${AppName}</option>`;
        }
        if (document.getElementById("manage_apps_select")) {
          manage_apps_select.innerHTML += `<option class="py-3 " value="${AppName}">${AppName}</option>`;
        }
        if (document.getElementById("delete_logs_app_box")) {
          delete_logs_app_box.innerHTML += `<option value="${AppName}">${AppName}</option>`;
        }
        if (document.getElementById("apps_table")) {
          document.getElementById(
            "apps_table"
          ).innerHTML += `<tr class="rounded-lg dark:bg-charade-600">
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
                                            class="items-center rounded-md dark:bg-charade-500 w-10 h-10 bg-gray-50 shadow text-${StatusToButton(
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
                                            class="items-center rounded-md dark:bg-charade-500 w-10 h-10 bg-gray-50 shadow text-blue-500 hover:text-gray-50 hover:bg-blue-500">
                                            <i class="uil uil-history-alt"></i>
                                        </button>
                                        <button tip="Show Logs" onclick="show_log('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-500 w-10 h-10 bg-gray-50 shadow text-amber-500 hover:text-gray-50 hover:bg-amber-500">
                                            <i class="uil uil-file"></i>
                                        </button>
                                        <button tip="Show Error Logs" onclick="show_error_log('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-500 w-10 h-10 bg-gray-50 shadow text-red-500 hover:text-gray-50 hover:bg-red-500">
                                            <i class="uil uil-exclamation-octagon"></i>
                                        </button>
                                        <button tip="File Manager" onclick="file_manager('${
                                          Process.App.Name
                                        }')"
                                            class="items-center rounded-md dark:bg-charade-500 w-10 h-10 bg-gray-50 shadow text-purple-500 hover:text-gray-50 hover:bg-purple-500">
                                            <i class="uil uil-folder"></i>
                                        </button>
                                    </td>
                                </tr>`;
        }
      });
    });
}
renderDashboard();

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
  renderDashboard();
}, 20000);

function toggle_theme() {
  if (localStorage.theme == "dark") {
    localStorage.theme = "light";
    document.documentElement.classList.remove("dark");
  } else {
    localStorage.theme = "dark";
    document.documentElement.classList.add("dark");
  }
  window.location.reload();
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

function show_log(Name) {
  window.open(`../show_log?name=${Name}`);
}

function show_error_log(Name) {
  window.open(`../show_error_log?name=${Name}`);
}

function file_manager(name) {
  if (name) {
    window.open(`../file_manager?file=${name}`);
  } else {
    window.open(`../file_manager`);
  }
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
if (document.getElementById("content")) {
  fetch(`../file_content?path=${Query.get("file")}`)
    .then((response) => {
      return response.json();
    })
    .then((myJson) => {
      if (myJson.Success == true) {
        Parts = Query.get("file").toString().split("/");
        Extension = Parts[Parts.length - 1].toString().split(".")[1];
        console.log(Extension);
        const editorElem = document.getElementById("content");
        var editor = CodeMirror.fromTextArea(editorElem, {
          lineNumbers: true,
          language: Extension,
          lineWrapping: true,
          theme: "dracula",
        });
        editor.setSize("100%", "100%");
        editor.setValue(myJson.Data.Content);
        editor.on("change", (editor) => {
          saveFile(editor.getValue());
        });
      } else {
        Side_Err(myJson.Message);
      }
    });
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
      if (data.Success != true) {
        Side_Err(data.Message);
      }
    })
    .catch((err) => console.log(err));
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

if (document.getElementById("display_log")) {
  if (Query.get("name")) {
    fetch(`../log/${Query.get("name")}`)
      .then((response) => {
        return response.json();
      })
      .then((myJson) => {
        document.getElementById("display_log").innerHTML =
          myJson.Data ||
          `## Unable to find logs for this application\nMaybe this bot does not exist or the log file is missing/broken`;
      });
  }
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
function open_selected_logs() {
  window.open(
    `/show_log?name=${document.getElementById("delete_logs_app_box").value}`
  );
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
        fetch("/delete_app", {
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
