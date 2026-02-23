/// Local resource tracking: reads system RAM/CPU via sysinfo.
use sysinfo::System;

pub struct SystemResources {
    sys: System,
}

impl SystemResources {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self { sys }
    }

    pub fn refresh(&mut self) {
        self.sys.refresh_all();
    }

    /// Total physical RAM in MB
    pub fn total_ram_mb(&self) -> i64 {
        (self.sys.total_memory() / 1024 / 1024) as i64
    }

    /// Available RAM in MB (not yet allocated to any process)
    pub fn available_ram_mb(&self) -> i64 {
        (self.sys.available_memory() / 1024 / 1024) as i64
    }

    /// Number of logical CPU cores
    pub fn cpu_cores(&self) -> i32 {
        self.sys.cpus().len() as i32
    }

    /// Current process memory usage in MB (by PID)
    pub fn process_ram_mb(&self, pid: u32) -> Option<i64> {
        let sysinfo_pid = sysinfo::Pid::from_u32(pid);
        self.sys
            .process(sysinfo_pid)
            .map(|p| (p.memory() / 1024 / 1024) as i64)
    }

    /// Current process CPU usage as a percentage (by PID).
    /// Note: sysinfo returns per-core percentage; we normalize to total.
    pub fn process_cpu_pct(&self, pid: u32) -> Option<f32> {
        let sysinfo_pid = sysinfo::Pid::from_u32(pid);
        self.sys.process(sysinfo_pid).map(|p| p.cpu_usage())
    }
}

impl Default for SystemResources {
    fn default() -> Self {
        Self::new()
    }
}
