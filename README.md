# Processing Language Server - VSCode Extension

![LSP for Processing](https://img.shields.io/badge/Language%20Server-LS4P-blue?style=flat-square)
<!-- ![Port](https://img.shields.io/badge/Port%20Number-6009-green?style=flat-square)<br /> -->
<!-- [![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/ls4p/build.yml?branch=main)](https://github.com/yourusername/ls4p/actions) -->

## Capabilitites:

### On-Hover description
![](./assets/fileicons/hover.gif)

### Go-To-Definition
![](./assets/fileicons/gotoDef.gif)

### Go-To-References
![](./assets/fileicons/gotoref.gif)

### Code-Completion
![](./assets//fileicons/2024-09-16%2018-06-18.gif)

### Linux distribution
![](./assets//fileicons/image.png)

### Installation

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/)


### Setup

```sh
git clone --branch Dynamic-sketchpath https://github.com/diyaayay/processing-language-server-extension.git
cd processing-language-server-extension/
Run the script dependency.bat through any terminal (e.g., in Windows Powershell, run .\dependency.bat)
npm install
npm run watch
```

Note: This project is under development. The default development branch is `Dynamic-sketchpath`. To test currently,open the `skechers.pde` under the `SKECHERS` directory inside the project's root and write your sketch within the file. Dynamic sketchfile paths functionality will be pushed soon.

Note: If you run into any errors while installing, make sure you have `python >=3` installed on your windows/linux machine.
[Download Python](https://www.python.org/ftp/python/3.13.0/python-3.13.0-amd64.exe).

Note: If you run into any errors while installing, make sure you have `openJdk 7` installed for the node modules dependency 
`npm i java`. Refer to the following link to download it: [Download openJDK](https://github.com/alexkasko/openjdk-unofficial-builds#openjdk-unofficial-installers-for-windows-linux-and-mac-os-x), and it should be added to your system's environment variables.