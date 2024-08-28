import { execSync } from 'child_process';

if(process.platform === 'win32') {
    child = execSync(`install\\windowsJRE.bat`)
}
// else if(process.platform === 'darwin') {
//     child = childProcess.execSync(`install/macOSJRE.sh`)
// }
else if(process.platform === 'linux') {
    child = execSync(`install/linuxJRE.sh`)
}
else {
    console.log("Unsupported operating system detected")
}
