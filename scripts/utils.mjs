import { exec } from 'child_process';
import process from 'process';

const openFile = (filePath) => {
    let command;
    // 根据系统平台选择对应命令
    switch (process.platform) {
        case 'win32': // Windows 系统
            command = `start "" "${filePath}"`; // start 命令需空引号处理路径空格
            break;
        case 'darwin': // macOS 系统
            command = `open "${filePath}"`;
            break;
        default: // Linux 系统（如 Ubuntu）
            command = `xdg-open "${filePath}"`;
            break;
    }

    // 执行系统命令打开文件
    exec(command);
};

export default openFile;
