var options = {
  legend: {
    position: "bottom",
  },
  scales: {
    yAxes: [
      {
        ticks: {
          fontColor: "rgba(0,0,0,0.5)",
          fontStyle: "bold",
          beginAtZero: true,
          maxTicksLimit: 5,
          padding: 5,
        },
        gridLines: {
          drawTicks: false,
          display: false,
        },
      },
    ],
    xAxes: [
      {
        display: false,
        gridLines: {
          zeroLineColor: "transparent",
        },
        ticks: {
          padding: 5,
          fontColor: "rgba(0,0,0,0.5)",
          fontStyle: "bold",
        },
      },
    ],
  },
};

fetch(`/usage/all`)
  .then((response) => {
    return response.json();
  })
  .then((myJson) => {
    console.log(myJson);
    ctx = document.getElementById("ram_chart").getContext("2d");

    var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
    gradientStroke.addColorStop(0, "#3082CF");
    gradientStroke.addColorStop(1, "#4991D5");

    var gradientFill = ctx.createLinearGradient(500, 0, 100, 0);
    gradientFill.addColorStop(0, "rgba(48, 130, 207, .5)");
    gradientFill.addColorStop(1, "rgba(73, 145, 213, .5)");

    myJson.ram.data.timestamps = myJson.ram.data.timestamps.map((val) =>
      new Date(parseFloat(val)).toLocaleTimeString()
    );
    myJson.ram.data.ram = myJson.ram.data.ram.map((val) => val / 1000 / 1000);
    RamChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: myJson.ram.data.timestamps,
        datasets: [
          {
            data: myJson.ram.data.ram,
            label: "Ram Usage(MBs)",
            borderColor: gradientStroke,
            pointBorderColor: gradientStroke,
            pointBackgroundColor: gradientStroke,
            pointHoverBackgroundColor: gradientStroke,
            pointHoverBorderColor: gradientStroke,
            pointBorderWidth: 5,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 4,
            pointRadius: 1,
            fill: true,
            backgroundColor: gradientFill,
            borderWidth: 2,
          },
        ],
      },
      options: options,
    });

    ctx = document.getElementById("cpu_chart");
    myJson.cpu.data.timestamps = myJson.cpu.data.timestamps.map((val) =>
      new Date(parseFloat(val)).toLocaleTimeString()
    );
    myJson.cpu.data.cpu = myJson.cpu.data.cpu.map((val) => val);
    CPUChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: myJson.cpu.data.timestamps,
        datasets: [
          {
            data: myJson.cpu.data.cpu,
            label: "CPU Usage(%)",
            borderColor: gradientStroke,
            pointBorderColor: gradientStroke,
            pointBackgroundColor: gradientStroke,
            pointHoverBackgroundColor: gradientStroke,
            pointHoverBorderColor: gradientStroke,
            pointBorderWidth: 5,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 4,
            pointRadius: 1,
            fill: true,
            backgroundColor: gradientFill,
            borderWidth: 2,
          },
        ],
      },
      options: options,
    });
  });

function reset_chart() {
  fetch("/usage/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
